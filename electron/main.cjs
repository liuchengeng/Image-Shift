const path = require("node:path");
const fs = require("node:fs/promises");
const { fork } = require("node:child_process");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const isDev = process.env.NODE_ENV === "development";
const VALID_INPUT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VALID_FORMATS = new Set(["jpeg", "png", "webp"]);
const SHARP_WORKER_PATH = path.join(__dirname, "sharp-worker.cjs");

function ensurePositiveInteger(value) {
  return value === undefined || (Number.isInteger(value) && value > 0);
}

function ensureQuality(value) {
  return value === undefined || (Number.isInteger(value) && value >= 1 && value <= 100);
}

function validateCrop(crop) {
  if (!crop) {
    return [];
  }

  const values = [crop.left, crop.top, crop.width, crop.height];
  const errors = [];

  if (!values.every(Number.isInteger)) {
    errors.push("Crop values must be integers.");
  }

  if (crop.left < 0 || crop.top < 0 || crop.width <= 0 || crop.height <= 0) {
    errors.push("Crop bounds must be non-negative and dimensions must be > 0.");
  }

  return errors;
}

function validateJob(job) {
  const errors = [];

  if (!job || typeof job !== "object") {
    return ["Job payload is invalid."];
  }

  if (!job.id) errors.push("Job id is required.");
  if (!job.inputPath) errors.push("Input path is required.");
  if (!VALID_FORMATS.has(job.outputFormat)) {
    errors.push("Output format must be jpeg, png, or webp.");
  }

  if (!ensureQuality(job.quality)) {
    errors.push("Quality must be between 1 and 100.");
  }

  if (job.resize && (!ensurePositiveInteger(job.resize.width) || !ensurePositiveInteger(job.resize.height))) {
    errors.push("Resize width and height must be positive integers.");
  }

  return errors.concat(validateCrop(job.crop));
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getUniqueOutputPath(outputDir, inputPath, outputFormat) {
  function getOutputExtension(nextFormat) {
    if (nextFormat === "jpeg") return ".jpg";
    if (nextFormat === "png") return ".png";
    return ".webp";
  }

  const extension = getOutputExtension(outputFormat);
  const originalName = path.basename(inputPath, path.extname(inputPath));
  let candidate = path.join(outputDir, `${originalName}${extension}`);
  let index = 1;

  while (await fileExists(candidate)) {
    candidate = path.join(outputDir, `${originalName}-${index}${extension}`);
    index += 1;
  }

  return candidate;
}

async function getImportedFiles(filePaths) {
  const files = await Promise.all(
    filePaths.map(async (inputPath) => {
      const stats = await fs.stat(inputPath);
      return {
        inputPath,
        name: path.basename(inputPath),
        sizeBytes: stats.size
      };
    })
  );

  return files;
}

async function createPreview(inputPath) {
  return runSharpWorker({
    type: "preview",
    inputPath
  });
}

async function processSingleJob(job, outputDir) {
  const outputPath = await getUniqueOutputPath(outputDir, job.inputPath, job.outputFormat);

  try {
    return await runSharpWorker({
      type: "process-single",
      job,
      outputPath
    });
  } catch (error) {
    if (await fileExists(outputPath)) {
      const stats = await fs.stat(outputPath);
      if (stats.size > 0) {
        return {
          outputPath,
          outputSizeBytes: stats.size
        };
      }
    }

    throw error;
  }
}

function runSharpWorker(payload, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const worker = fork(SHARP_WORKER_PATH, {
      stdio: ["ignore", "ignore", "ignore", "ipc"]
    });

    let settled = false;
    const finish = (handler) => (value) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      handler(value);
    };

    const resolveOnce = finish(resolve);
    const rejectOnce = finish(reject);
    const timer = setTimeout(() => {
      worker.kill();
      rejectOnce(new Error("Image processing timed out."));
    }, timeoutMs);

    worker.once("message", (message) => {
      if (message?.type === "success") {
        resolveOnce(message.result);
        return;
      }

      if (message?.type === "error") {
        rejectOnce(new Error(message.error?.message ?? "Image processing failed."));
        return;
      }

      rejectOnce(new Error("Image worker returned an invalid response."));
    });

    worker.once("error", () => {
      rejectOnce(new Error("Image worker failed to start."));
    });

    worker.once("exit", (code, signal) => {
      if (settled) {
        return;
      }

      const reason = signal
        ? `Image worker exited with signal ${signal}.`
        : `Image worker exited with code ${code ?? "unknown"}.`;
      rejectOnce(new Error(reason));
    });

    worker.send(payload);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: "Image-Shift",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }
}

function registerIpcHandlers() {
  ipcMain.handle("image:pick-input-files", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }]
    });

    return result.canceled ? [] : getImportedFiles(result.filePaths);
  });

  ipcMain.handle("image:pick-output-dir", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("image:load-preview", async (_event, inputPath) => {
    const extension = path.extname(inputPath || "").toLowerCase();

    if (!VALID_INPUT_EXTENSIONS.has(extension)) {
      throw new Error("This file format is not supported for preview.");
    }

    return createPreview(inputPath);
  });

  ipcMain.handle("image:process-batch", async (_event, payload) => {
    if (!payload || !Array.isArray(payload.jobs) || payload.jobs.length === 0) {
      return {
        results: [
          {
            id: "unknown",
            success: false,
            error: {
              code: "INVALID_PAYLOAD",
              message: "No jobs to process."
            }
          }
        ]
      };
    }

    if (!payload.outputDir) {
      return {
        results: payload.jobs.map((job) => ({
          id: job.id || "unknown",
          success: false,
          error: {
            code: "OUTPUT_DIR_REQUIRED",
            message: "Output folder is required."
          }
        }))
      };
    }

    await ensureDirectory(payload.outputDir);

    const results = [];
    for (const job of payload.jobs) {
      const validationErrors = validateJob(job);
      if (validationErrors.length > 0) {
        results.push({
          id: job?.id || "unknown",
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationErrors.join(" ")
          }
        });
        continue;
      }

      try {
        const processed = await processSingleJob(job, payload.outputDir);
        results.push({
          id: job.id,
          success: true,
          outputPath: processed.outputPath,
          outputSizeBytes: processed.outputSizeBytes
        });
      } catch (error) {
        results.push({
          id: job.id || "unknown",
          success: false,
          error: {
            code: "PROCESSING_ERROR",
            message: error instanceof Error ? error.message : "Processing failed."
          }
        });
      }
    }

    return { results };
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
