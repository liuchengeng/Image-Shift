import type { DragEvent } from "react";
import type { CropRect, ImportedImageFile, LayoutAdjustment, OutputFormat } from "@/src/shared/types/image";

export type ToolMode = "Convert" | "Compress" | "Remove BG" | "Match Layout" | "Crop" | "Resize" | "Export";
export type CropPreset = "free" | "1:1" | "4:5" | "16:9";
export type CropHandle = "nw" | "ne" | "sw" | "se";

export type QueueFile = ImportedImageFile & {
  id: string;
  crop?: CropRect;
  layoutAdjustment: LayoutAdjustment;
  layoutError?: string;
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

export const TOOL_MODES: ToolMode[] = ["Convert", "Compress", "Remove BG", "Match Layout", "Crop", "Resize", "Export"];

export const TOOL_MODE_LABELS: Record<ToolMode, string> = {
  Convert: "格式转换",
  Compress: "图片压缩",
  "Remove BG": "智能抠图",
  "Match Layout": "版式匹配",
  Crop: "图片裁剪",
  Resize: "调整尺寸",
  Export: "导出记录"
};

const TOOL_MODE_DESCRIPTIONS: Record<ToolMode, string> = {
  Convert: "转换图片格式。",
  Compress: "压缩体积并对比效果。",
  "Remove BG": "使用本地 AI 移除背景。",
  "Match Layout": "按参考图匹配主体位置与大小。",
  Crop: "裁剪并保留选中区域。",
  Resize: "按最大宽高等比缩放。",
  Export: "查看本次会话的导出记录。"
};

export function getModeLabel(mode: ToolMode) {
  return TOOL_MODE_LABELS[mode];
}

export const DEFAULT_LAYOUT_ADJUSTMENT: LayoutAdjustment = {
  scaleMultiplier: 1,
  offsetX: 0,
  offsetY: 0
};

export function createDefaultLayoutAdjustment(): LayoutAdjustment {
  return { ...DEFAULT_LAYOUT_ADJUSTMENT };
}

export const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WEBP" }
];

export const COMPRESS_FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WEBP" }
];

export const TRANSPARENT_FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "webp", label: "WEBP" }
];

export const RESIZE_PRESETS = [
  { label: "1080 × 1080", width: 1080, height: 1080 },
  { label: "1280 × 720", width: 1280, height: 720 },
  { label: "1920 × 1080", width: 1920, height: 1080 },
  { label: "2048 × 2048", width: 2048, height: 2048 }
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

export function fitDimensions(sourceWidth: number, sourceHeight: number, maxWidth: number, maxHeight: number) {
  if (sourceWidth <= 0 || sourceHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale))
  };
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
  if (!bytes || Number.isNaN(bytes)) return "—";
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
  return TOOL_MODE_DESCRIPTIONS[mode];
}
