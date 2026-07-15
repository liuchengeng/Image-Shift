export type OutputFormat = "jpeg" | "png" | "webp";

export type ImportedImageFile = {
  inputPath: string;
  name: string;
  sizeBytes: number;
};

export type ResizeOptions = {
  width?: number;
  height?: number;
  fit: "inside" | "fill";
};

export type CropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SubjectBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LayoutAnalysisMethod = "alpha" | "edge" | "ai";

export type LayoutReferenceAnalysis = {
  width: number;
  height: number;
  bounds: SubjectBounds;
  background:
    | { mode: "transparent" }
    | {
        mode: "solid";
        color: { r: number; g: number; b: number; alpha: number };
      };
  confidence: number;
  method: LayoutAnalysisMethod;
};

export type LayoutAdjustment = {
  scaleMultiplier: number;
  offsetX: number;
  offsetY: number;
};

export type LayoutMatchOptions = {
  reference: LayoutReferenceAnalysis;
  adjustment: LayoutAdjustment;
};

export type LayoutMatchResult = {
  targetBounds: SubjectBounds;
  autoScale: number;
  finalScale: number;
  offsetX: number;
  offsetY: number;
  confidence: number;
  method: LayoutAnalysisMethod;
};

export type PreviewImage = {
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  dataUrl: string;
};

export type ImageJob = {
  id: string;
  inputPath: string;
  outputFormat: OutputFormat;
  quality?: number;
  crop?: CropRect;
  resize?: ResizeOptions;
  removeBackground?: boolean;
  layoutMatch?: LayoutMatchOptions;
};

export type BatchProcessRequest = {
  jobs: ImageJob[];
  outputDir: string;
};

export type ImageJobResult = {
  id: string;
  success: boolean;
  outputPath?: string;
  outputSizeBytes?: number;
  error?: {
    code: string;
    message: string;
  };
};

export type ImageJobEstimate = {
  outputSizeBytes: number;
};

export type ImageJobPreview = PreviewImage &
  ImageJobEstimate & {
    layoutMatch?: LayoutMatchResult;
  };

export type BatchProcessResult = {
  results: ImageJobResult[];
};
