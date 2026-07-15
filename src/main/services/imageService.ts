import type {
  BatchProcessRequest,
  CropRect,
  ImageJob,
  LayoutAdjustment,
  LayoutMatchOptions,
  LayoutReferenceAnalysis,
  OutputFormat,
  SubjectBounds
} from "../../shared/types/image";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

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

function validateSubjectBounds(
  bounds: SubjectBounds | undefined,
  canvasWidth: number,
  canvasHeight: number
): string[] {
  if (!isRecord(bounds)) {
    return ["Layout subject bounds are required."];
  }

  const { left, top, width, height } = bounds;
  if (
    ![left, top, width, height].every(isFiniteNumber) ||
    (left as number) < 0 ||
    (top as number) < 0 ||
    (width as number) <= 0 ||
    (height as number) <= 0
  ) {
    return ["Layout subject bounds must use finite, non-negative coordinates and positive dimensions."];
  }

  if (
    (left as number) + (width as number) > canvasWidth ||
    (top as number) + (height as number) > canvasHeight
  ) {
    return ["Layout subject bounds must fit inside the reference canvas."];
  }

  return [];
}

export function validateLayoutReferenceAnalysis(
  reference: LayoutReferenceAnalysis | undefined
): string[] {
  if (!isRecord(reference)) {
    return ["Layout reference analysis is required."];
  }

  const errors: string[] = [];
  if (!Number.isInteger(reference.width) || reference.width <= 0 || !Number.isInteger(reference.height) || reference.height <= 0) {
    errors.push("Layout reference dimensions must be positive integers.");
  } else {
    errors.push(...validateSubjectBounds(reference.bounds, reference.width, reference.height));
  }

  if (!isFiniteNumber(reference.confidence) || reference.confidence < 0 || reference.confidence > 1) {
    errors.push("Layout reference confidence must be between 0 and 1.");
  }

  if (reference.method !== "alpha" && reference.method !== "edge" && reference.method !== "ai") {
    errors.push("Layout reference method must be alpha, edge, or ai.");
  }

  if (!isRecord(reference.background) || (reference.background.mode !== "transparent" && reference.background.mode !== "solid")) {
    errors.push("Layout background must be transparent or solid.");
  } else if (reference.background.mode === "solid") {
    const color = reference.background.color;
    if (
      !isRecord(color) ||
      ![color.r, color.g, color.b, color.alpha].every(
        (channel) => Number.isInteger(channel) && (channel as number) >= 0 && (channel as number) <= 255
      )
    ) {
      errors.push("Layout solid background RGBA channels must be integers from 0 to 255.");
    }
  }

  return errors;
}

export function validateLayoutAdjustment(adjustment: LayoutAdjustment | undefined): string[] {
  if (!isRecord(adjustment)) {
    return ["Layout adjustment is required."];
  }

  const errors: string[] = [];
  if (!isFiniteNumber(adjustment.scaleMultiplier) || adjustment.scaleMultiplier <= 0) {
    errors.push("Layout scale multiplier must be a finite number greater than 0.");
  }

  if (!isFiniteNumber(adjustment.offsetX) || !isFiniteNumber(adjustment.offsetY)) {
    errors.push("Layout X/Y offsets must be finite numbers.");
  }

  return errors;
}

export function validateLayoutMatchOptions(layoutMatch: LayoutMatchOptions | undefined): string[] {
  if (!isRecord(layoutMatch)) {
    return ["Layout match options are required."];
  }

  return [
    ...validateLayoutReferenceAnalysis(layoutMatch.reference),
    ...validateLayoutAdjustment(layoutMatch.adjustment)
  ];
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

  if (job.removeBackground && job.outputFormat === "jpeg") {
    errors.push("Background removal output must be PNG or WEBP.");
  }

  if (job.resize && (!isPositiveInteger(job.resize.width) || !isPositiveInteger(job.resize.height))) {
    errors.push("Resize width/height must be positive integers when provided.");
  }

  if (job.layoutMatch !== undefined) {
    errors.push(...validateLayoutMatchOptions(job.layoutMatch));

    if (job.crop || job.resize || job.removeBackground) {
      errors.push("Layout matching cannot be combined with crop, resize, or background removal.");
    }
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
