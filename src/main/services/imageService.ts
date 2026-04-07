import type { BatchProcessRequest, CropRect, ImageJob, OutputFormat } from "../../shared/types/image";

function isPositiveInteger(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value > 0);
}

function isValidQuality(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 1 && value <= 100);
}

function isValidFormat(format: OutputFormat | undefined): boolean {
  return format === "jpeg" || format === "png" || format === "webp";
}

export function validateCropRect(crop: CropRect | undefined): string[] {
  if (!crop) {
    return [];
  }

  const values = [crop.left, crop.top, crop.width, crop.height];
  const errors: string[] = [];

  if (!values.every(Number.isInteger)) {
    errors.push("Crop values must be integers.");
  }

  if (crop.left < 0 || crop.top < 0 || crop.width <= 0 || crop.height <= 0) {
    errors.push("Crop bounds must be non-negative and dimensions must be > 0.");
  }

  return errors;
}

export function validateImageJob(job: ImageJob): string[] {
  const errors: string[] = [];

  if (!job.id) errors.push("Job id is required.");
  if (!job.inputPath) errors.push("Input path is required.");

  if (!isValidFormat(job.outputFormat)) {
    errors.push("Output format must be jpeg, png, or webp.");
  }

  if (!isValidQuality(job.quality)) {
    errors.push("Quality must be an integer from 1 to 100.");
  }

  if (job.resize && (!isPositiveInteger(job.resize.width) || !isPositiveInteger(job.resize.height))) {
    errors.push("Resize width/height must be positive integers when provided.");
  }

  return errors.concat(validateCropRect(job.crop));
}

export function validateBatchRequest(request: BatchProcessRequest): string[] {
  const errors: string[] = [];

  if (!request.outputDir) {
    errors.push("Output directory is required.");
  }

  if (!Array.isArray(request.jobs) || request.jobs.length === 0) {
    errors.push("At least one job is required.");
  }

  return errors;
}
