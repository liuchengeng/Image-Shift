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

async function createPreview(inputPath) {
  const metadata = await sharp(inputPath, { failOn: "none", sequentialRead: true }).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Failed to read image size.");
  }

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
    dataUrl: `data:image/png;base64,${previewBuffer.toString("base64")}`
  };
}

async function processSingleJob(job, outputPath) {
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

  if (job.outputFormat === "jpeg") {
    image.jpeg({ quality: job.quality ?? 80 });
  } else if (job.outputFormat === "png") {
    image.png();
  } else {
    image.webp({ quality: job.quality ?? 80 });
  }

  await image.toFile(outputPath);
  const stats = await fs.stat(outputPath);
  return {
    outputPath,
    outputSizeBytes: stats.size
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

  throw new Error("Unknown image worker task.");
}

process.once("message", async (task) => {
  try {
    const result = await handleTask(task);
    if (process.send) {
      process.send({ type: "success", result });
    }
    setImmediate(() => process.exit(0));
  } catch (error) {
    if (process.send) {
      process.send({
        type: "error",
        error: {
          message: error instanceof Error ? error.message : "Image worker failed."
        }
      });
    }
    setImmediate(() => process.exit(1));
  }
});

process.on("disconnect", () => {
  process.exit(0);
});
