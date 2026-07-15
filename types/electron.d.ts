import type {
  BatchProcessRequest,
  BatchProcessResult,
  ImageJob,
  ImageJobEstimate,
  ImageJobPreview,
  ImportedImageFile,
  LayoutReferenceAnalysis,
  PreviewImage
} from "../src/shared/types/image";

declare global {
  interface Window {
    imageShift?: {
      platform: string;
      app: string;
      imageApi: {
        pickInputFiles: () => Promise<ImportedImageFile[]>;
        pickReferenceFile: () => Promise<ImportedImageFile | null>;
        pickOutputDir: () => Promise<string | null>;
        loadPreview: (inputPath: string) => Promise<PreviewImage>;
        analyzeLayoutReference: (inputPath: string) => Promise<LayoutReferenceAnalysis>;
        estimateJob: (job: ImageJob) => Promise<ImageJobEstimate>;
        previewJob: (job: ImageJob) => Promise<ImageJobPreview>;
        processBatch: (payload: BatchProcessRequest) => Promise<BatchProcessResult>;
      };
    };
  }
}

export {};
