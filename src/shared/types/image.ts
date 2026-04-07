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

export type PreviewImage = {
  width: number;
  height: number;
  dataUrl: string;
};

export type ImageJob = {
  id: string;
  inputPath: string;
  outputFormat: OutputFormat;
  quality?: number;
  crop?: CropRect;
  resize?: ResizeOptions;
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

export type BatchProcessResult = {
  results: ImageJobResult[];
};
