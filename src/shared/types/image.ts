export type OutputFormat = "jpeg" | "png" | "webp";

export type ResizeOptions = {
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
};

export type CropOptions = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ImageJob = {
  id: string;
  inputPath: string;
  outputPath: string;
  outputDir?: string;
  format?: OutputFormat;
  quality?: number;
  resize?: ResizeOptions;
  crop?: CropOptions;
};

export type BatchProcessRequest = {
  jobs: ImageJob[];
};

export type ImageJobResult = {
  id: string;
  success: boolean;
  outputPath?: string;
  error?: {
    code: string;
    message: string;
  };
};

export type BatchProcessResult = {
  results: ImageJobResult[];
};
