import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";
import type { BatchProcessRequest, BatchProcessResult, ImageJob, OutputFormat } from "@/src/shared/types/image";

function isPositiveInteger(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value > 0);
}

function isValidQuality(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 1 && value <= 100);
}

function ensureFormat(format: OutputFormat | undefined, outputPath: string): OutputFormat | undefined {
  if (format) return format;
  const lower = outputPath.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return undefined;
}

export function validateImageJob(job: ImageJob): string[] {
  const errors: string[] = [];

  if (!job.id) errors.push("Job id is required.");
  if (!job.inputPath) errors.push("Input path is required.");
  if (!job.outputPath) errors.push("Output path is required.");

  if (!isValidQuality(job.quality)) {
    errors.push("Quality must be an integer from 1 to 100.");
  }

  if (job.resize && (!isPositiveInteger(job.resize.width) || !isPositiveInteger(job.resize.height))) {
    errors.push("Resize width/height must be positive integers when provided.");
  }

  if (job.crop) {
    const { left, top, width, height } = job.crop;
    if (![left, top, width, height].every(Number.isInteger)) {
      errors.push("Crop values must be integers.");
    }
    if (width <= 0 || height <= 0 || left < 0 || top < 0) {
      errors.push("Crop bounds must be non-negative and dimensions must be > 0.");
    }
  }

  const outputFormat = ensureFormat(job.format, job.outputPath);
  if (!outputFormat) {
    errors.push("Output format is required via job.format or file extension (.jpeg/.png/.webp).");
  }

  return errors;
}

async function processOne(job: ImageJob): Promise<{ id: string; success: boolean; outputPath?: string; error?: { code: string; message: string } }> {
  const validationErrors = validateImageJob(job);
  if (validationErrors.length > 0) {
    return {
      id: job.id,
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validationErrors.join(" ")
      }
    };
  }

  try {
    const outputFormat = ensureFormat(job.format, job.outputPath);
    const image = sharp(job.inputPath, { failOn: "none" });

    if (job.crop) {
      image.extract(job.crop);
    }

    if (job.resize && (job.resize.width || job.resize.height)) {
      image.resize({
        width: job.resize.width,
        height: job.resize.height,
        fit: job.resize.fit ?? "inside"
      });
    }

    if (outputFormat === "jpeg") {
      image.jpeg({ quality: job.quality ?? 80 });
    } else if (outputFormat === "png") {
      image.png();
    } else if (outputFormat === "webp") {
      image.webp({ quality: job.quality ?? 80 });
    }

    await mkdir(dirname(job.outputPath), { recursive: true });
    await image.toFile(job.outputPath);

    return {
      id: job.id,
      success: true,
      outputPath: job.outputPath
    };
  } catch (error) {
    return {
      id: job.id,
      success: false,
      error: {
        code: "PROCESSING_ERROR",
        message: error instanceof Error ? error.message : "Unknown processing error."
      }
    };
  }
}

export async function processBatchImages(request: BatchProcessRequest): Promise<BatchProcessResult> {
  const results = await Promise.all(request.jobs.map((job) => processOne(job)));
  return { results };
}
