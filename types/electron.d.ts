import type { BatchProcessRequest, BatchProcessResult, ImageJob, ImageJobEstimate, ImageJobPreview, ImportedImageFile, PreviewImage } from "../src/shared/types/image";

declare global {
  interface Window {
    imageShift?: {
      platform: string;
      app: string;
      imageApi: {
        pickInputFiles: () => Promise<ImportedImageFile[]>;
        pickOutputDir: () => Promise<string | null>;
        loadPreview: (inputPath: string) => Promise<PreviewImage>;
        estimateJob: (job: ImageJob) => Promise<ImageJobEstimate>;
        previewJob: (job: ImageJob) => Promise<ImageJobPreview>;
        processBatch: (payload: BatchProcessRequest) => Promise<BatchProcessResult>;
      };
    };
  }
}

export {};
