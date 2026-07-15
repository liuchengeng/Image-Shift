const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { fork } = require("node:child_process");
const sharp = require("sharp");
const { analyzeImageSubject, createLayoutMatchedImage } = require("./layout-matcher.cjs");

const BACKGROUND_WORKER_PATH = path.join(__dirname, "background-worker.cjs");

sharp.cache(false);
sharp.concurrency(1);

function sanitizeCrop(crop, metadata) {
  if (!crop) {
    return null;
  }

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions for cropping.");
  }

  const left = Math.max(0, Math.min(crop.left, metadata.width - 1));
  const top = Math.max(0, Math.min(crop.top, metadata.height - 1));
  const maxWidth = metadata.width - left;
  const maxHeight = metadata.height - top;
  const width = Math.min(crop.width, maxWidth);
  const height = Math.min(crop.height, maxHeight);

  if (width <= 0 || height <= 0) {
    throw new Error("Crop region is outside the image bounds.");
  }

  return { left, top, width, height };
}

function getMimeType(outputFormat) {
  if (outputFormat === "jpeg") return "image/jpeg";
  if (outputFormat === "webp") return "image/webp";
  return "image/png";
}

function applyJobOutput(image, job) {
  const defaultQuality = job.layoutMatch ? 95 : 80;
  if (job.outputFormat === "jpeg") {
    // JPEG cannot store transparency. Composite transparent pixels onto white
    // instead of letting the encoder discard alpha and expose black pixels.
    return image
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: job.quality ?? defaultQuality });
  }

  if (job.outputFormat === "png") {
    return image.png();
  }

  return image.webp({
    quality: job.removeBackground ? 100 : job.quality ?? defaultQuality,
    alphaQuality: 100,
    lossless: Boolean(job.removeBackground)
  });
}

function runBackgroundWorker(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const worker = fork(BACKGROUND_WORKER_PATH, { stdio: ["ignore", "ignore", "ignore", "ipc"] });
    const timer = setTimeout(() => {
      worker.kill();
      reject(new Error("AI background removal timed out."));
    }, 180000);

    worker.once("message", (message) => {
      clearTimeout(timer);
      if (message?.type === "success") {
        resolve(message.result);
      } else {
        reject(new Error(message?.error?.message ?? "AI background removal failed."));
      }
    });
    worker.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    worker.send({ inputPath, outputPath });
  });
}

async function createJobPipeline(job) {
  let inputPath = job.inputPath;
  let temporaryPath = null;

  if (job.removeBackground) {
    temporaryPath = path.join(os.tmpdir(), `image-shift-bg-${randomUUID()}.png`);
    await runBackgroundWorker(job.inputPath, temporaryPath);
    inputPath = temporaryPath;
  }

  try {
    const metadata = await sharp(inputPath, { failOn: "none", sequentialRead: true }).metadata();
    let image;
    let layoutResult;

    if (job.layoutMatch) {
      const matched = await createLayoutMatchedImage(inputPath, job.layoutMatch, runBackgroundWorker);
      image = matched.image;
      layoutResult = matched.result;
    } else {
      image = sharp(inputPath, { failOn: "none", sequentialRead: true });
    }

    if (job.crop) {
      image.extract(sanitizeCrop(job.crop, metadata));
    }

    if (job.resize && (job.resize.width || job.resize.height)) {
      image.resize({
        width: job.resize.width,
        height: job.resize.height,
        fit: job.resize.fit ?? "inside",
        withoutEnlargement: job.resize.fit === "inside"
      });
    }

    return {
      image: applyJobOutput(image, job),
      layoutResult,
      cleanup: async () => {
        if (temporaryPath) {
          await fs.rm(temporaryPath, { force: true });
        }
      }
    };
  } catch (error) {
    if (temporaryPath) {
      await fs.rm(temporaryPath, { force: true });
    }
    throw error;
  }
}

async function createPreview(inputPath) {
  const metadata = await sharp(inputPath, { failOn: "none", sequentialRead: true }).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Failed to read image size.");
  }

  const previewScale = Math.min(1, 960 / metadata.width, 720 / metadata.height);
  const displayWidth = Math.round(metadata.width * previewScale);
  const displayHeight = Math.round(metadata.height * previewScale);
  const previewBuffer = await sharp(inputPath, { failOn: "none", sequentialRead: true })
    .resize({
      width: 960,
      height: 720,
      fit: "inside",
      withoutEnlargement: true
    })
    .png()
    .toBuffer();

  return {
    width: metadata.width,
    height: metadata.height,
    displayWidth,
    displayHeight,
    dataUrl: `data:image/png;base64,${previewBuffer.toString("base64")}`
  };
}

async function processSingleJob(job, outputPath) {
  const { image, cleanup } = await createJobPipeline(job);
  try {
    await image.toFile(outputPath);
    const stats = await fs.stat(outputPath);
    return {
      outputPath,
      outputSizeBytes: stats.size
    };
  } finally {
    await cleanup();
  }
}

async function estimateSingleJob(job) {
  const { image, cleanup } = await createJobPipeline(job);
  try {
    const buffer = await image.toBuffer();
    return {
      outputSizeBytes: buffer.length
    };
  } finally {
    await cleanup();
  }
}

async function previewSingleJob(job) {
  const { image, cleanup, layoutResult } = await createJobPipeline(job);
  try {
    const buffer = await image.toBuffer();
    const metadata = await sharp(buffer, { failOn: "none", sequentialRead: true }).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Failed to read preview image size.");
    }

    const previewScale = Math.min(1, 960 / metadata.width, 720 / metadata.height);
    return {
      width: metadata.width,
      height: metadata.height,
      displayWidth: Math.round(metadata.width * previewScale),
      displayHeight: Math.round(metadata.height * previewScale),
      outputSizeBytes: buffer.length,
      dataUrl: `data:${getMimeType(job.outputFormat)};base64,${buffer.toString("base64")}`,
      ...(layoutResult ? { layoutMatch: layoutResult } : {})
    };
  } finally {
    await cleanup();
  }
}

async function handleTask(task) {
  if (!task || typeof task !== "object") {
    throw new Error("Image worker task is invalid.");
  }

  if (task.type === "preview") {
    return createPreview(task.inputPath);
  }

  if (task.type === "analyze-layout-reference") {
    if (!task.inputPath) {
      throw new Error("A reference image path is required.");
    }
    return analyzeImageSubject(task.inputPath, runBackgroundWorker);
  }

  if (task.type === "process-single") {
    return processSingleJob(task.job, task.outputPath);
  }

  if (task.type === "estimate-single") {
    return estimateSingleJob(task.job);
  }

  if (task.type === "preview-single") {
    return previewSingleJob(task.job);
  }

  throw new Error("Unknown image worker task.");
}

function sendResult(message, exitCode) {
  if (!process.send) {
    process.exit(exitCode);
    return;
  }

  process.send(message, () => {
    process.exit(exitCode);
  });
}

process.once("message", async (task) => {
  try {
    const result = await handleTask(task);
    sendResult({ type: "success", result }, 0);
  } catch (error) {
    sendResult({
      type: "error",
      error: {
        message: error instanceof Error ? error.message : "Image worker failed."
      }
    }, 1);
  }
});

process.on("disconnect", () => {
  process.exit(0);
});
