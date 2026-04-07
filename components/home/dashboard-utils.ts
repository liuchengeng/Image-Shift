import type { DragEvent } from "react";
import type { CropRect, ImportedImageFile, OutputFormat } from "@/src/shared/types/image";

export type ToolMode = "Convert" | "Compress" | "Crop" | "Resize" | "Export";
export type CropPreset = "free" | "1:1" | "4:5" | "16:9";
export type CropHandle = "nw" | "ne" | "sw" | "se";

export type QueueFile = ImportedImageFile & {
  id: string;
  crop?: CropRect;
};

export type DragState = {
  pointerId: number;
  mode: "create" | "move" | "resize";
  originX: number;
  originY: number;
  startCrop?: CropBox;
  handle?: CropHandle;
};

export type CropBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HistoryItem = {
  id: string;
  title: string;
  detail: string;
  mode: ToolMode;
  success: boolean;
  timestamp: string;
};

export const TOOL_MODES: ToolMode[] = ["Convert", "Compress", "Crop", "Resize", "Export"];

export const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WEBP" }
];

export const COMPRESS_FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WEBP" }
];

export const RESIZE_PRESETS = [
  { label: "1080 x 1080", width: 1080, height: 1080 },
  { label: "1280 x 720", width: 1280, height: 720 },
  { label: "1920 x 1080", width: 1920, height: 1080 },
  { label: "2048 x 2048", width: 2048, height: 2048 }
];

export function getDesktopApi() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.imageShift?.imageApi ?? null;
}

export function buildId(seed: number) {
  return `${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getOutputFormatFromPath(inputPath: string): OutputFormat {
  const ext = inputPath.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") {
    return "jpeg";
  }

  if (ext === "webp") {
    return "webp";
  }

  return "png";
}

export function formatBytes(bytes: number | undefined) {
  if (!bytes || Number.isNaN(bytes)) return "--";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getAspectRatioValue(preset: CropPreset) {
  if (preset === "1:1") return 1;
  if (preset === "4:5") return 4 / 5;
  if (preset === "16:9") return 16 / 9;
  return null;
}

export function getDroppedFiles(event: DragEvent<HTMLElement>): ImportedImageFile[] {
  return Array.from(event.dataTransfer.files)
    .map((file) => ({
      inputPath: (file as File & { path?: string }).path ?? "",
      name: file.name,
      sizeBytes: file.size
    }))
    .filter((file) => Boolean(file.inputPath));
}

export function toCropBox(
  originX: number,
  originY: number,
  currentX: number,
  currentY: number,
  maxWidth: number,
  maxHeight: number,
  aspectRatio: number | null
): CropBox {
  const dx = currentX - originX;
  const dy = currentY - originY;
  const dirX = dx >= 0 ? 1 : -1;
  const dirY = dy >= 0 ? 1 : -1;
  let width = Math.abs(dx);
  let height = Math.abs(dy);

  if (aspectRatio) {
    width = Math.max(width, 1);
    height = width / aspectRatio;

    if (height > Math.abs(dy)) {
      height = Math.max(Math.abs(dy), 1);
      width = height * aspectRatio;
    }
  }

  const unclampedLeft = dirX >= 0 ? originX : originX - width;
  const unclampedTop = dirY >= 0 ? originY : originY - height;
  const left = clamp(unclampedLeft, 0, maxWidth);
  const top = clamp(unclampedTop, 0, maxHeight);

  return {
    left,
    top,
    width: clamp(width, 0, maxWidth - left),
    height: clamp(height, 0, maxHeight - top)
  };
}

export function moveCropBox(startCrop: CropBox, deltaX: number, deltaY: number, maxWidth: number, maxHeight: number): CropBox {
  const left = clamp(startCrop.left + deltaX, 0, Math.max(0, maxWidth - startCrop.width));
  const top = clamp(startCrop.top + deltaY, 0, Math.max(0, maxHeight - startCrop.height));

  return {
    left,
    top,
    width: startCrop.width,
    height: startCrop.height
  };
}

export function resizeCropBox(
  startCrop: CropBox,
  handle: CropHandle,
  currentX: number,
  currentY: number,
  maxWidth: number,
  maxHeight: number,
  aspectRatio: number | null
): CropBox {
  if (handle === "nw") {
    return toCropBox(
      startCrop.left + startCrop.width,
      startCrop.top + startCrop.height,
      currentX,
      currentY,
      maxWidth,
      maxHeight,
      aspectRatio
    );
  }

  if (handle === "ne") {
    return toCropBox(
      startCrop.left,
      startCrop.top + startCrop.height,
      currentX,
      currentY,
      maxWidth,
      maxHeight,
      aspectRatio
    );
  }

  if (handle === "sw") {
    return toCropBox(
      startCrop.left + startCrop.width,
      startCrop.top,
      currentX,
      currentY,
      maxWidth,
      maxHeight,
      aspectRatio
    );
  }

  return toCropBox(
    startCrop.left,
    startCrop.top,
    currentX,
    currentY,
    maxWidth,
    maxHeight,
    aspectRatio
  );
}

export function getModeDescription(mode: ToolMode) {
  if (mode === "Convert") return "Convert formats directly without generating a preview comparison.";
  if (mode === "Compress") return "Compress with JPG or WEBP quality control and compare the final output.";
  if (mode === "Crop") return "Move and resize the crop box. Only the area inside the box will be kept.";
  if (mode === "Resize") return "Export images at the exact width and height you choose.";
  return "Review the latest batch and session export history.";
}
