const fs = require("node:fs/promises");
const sharp = require("sharp");

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
  if (job.outputFormat === "jpeg") {
    return image.jpeg({ quality: job.quality ?? 80 });
  }

  if (job.outputFormat === "png") {
    return image.png();
  }

  return image.webp({ quality: job.quality ?? 80 });
}

async function createJobPipeline(job) {
  const metadata = await sharp(job.inputPath, { failOn: "none", sequentialRead: true }).metadata();
  const image = sharp(job.inputPath, { failOn: "none", sequentialRead: true });

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

  return applyJobOutput(image, job);
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
  const image = await createJobPipeline(job);
  await image.toFile(outputPath);
  const stats = await fs.stat(outputPath);
  return {
    outputPath,
    outputSizeBytes: stats.size
  };
}

async function estimateSingleJob(job) {
  const image = await createJobPipeline(job);
  const buffer = await image.toBuffer();
  return {
    outputSizeBytes: buffer.length
  };
}

async function previewSingleJob(job) {
  const image = await createJobPipeline(job);
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
    dataUrl: `data:${getMimeType(job.outputFormat)};base64,${buffer.toString("base64")}`
  };
}

async function handleTask(task) {
  if (!task || typeof task !== "object") {
    throw new Error("Image worker task is invalid.");
  }

  if (task.type === "preview") {
    return createPreview(task.inputPath);
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
