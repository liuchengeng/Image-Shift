import type { BatchProcessRequest, BatchProcessResult, ImportedImageFile, PreviewImage } from "../src/shared/types/image";

declare global {
  interface Window {
    imageShift?: {
      platform: string;
      app: string;
      imageApi: {
        pickInputFiles: () => Promise<ImportedImageFile[]>;
        pickOutputDir: () => Promise<string | null>;
        loadPreview: (inputPath: string) => Promise<PreviewImage>;
        processBatch: (payload: BatchProcessRequest) => Promise<BatchProcessResult>;
      };
    };
  }
}

export {};
