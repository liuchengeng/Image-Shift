import type { BatchProcessRequest, BatchProcessResult } from "@/src/shared/types/image";

type ZipRequest = {
  files: string[];
  zipPath: string;
};

type ZipResponse = {
  success: boolean;
  zipPath?: string;
  error?: string;
};

declare global {
  interface Window {
    imageShift: {
      platform: string;
      app: string;
      imageApi: {
        health: () => Promise<{ ok: boolean }>;
        pickInputFiles: () => Promise<string[]>;
        pickOutputDir: () => Promise<string | null>;
        processBatch: (payload: BatchProcessRequest) => Promise<BatchProcessResult>;
        exportZip: (payload: ZipRequest) => Promise<ZipResponse>;
      };
    };
  }
}

export {};
