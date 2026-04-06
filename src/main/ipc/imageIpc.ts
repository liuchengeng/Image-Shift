import type { IpcMain } from "electron";
import { processBatchImages } from "@/src/main/services/imageService";
import type { BatchProcessRequest } from "@/src/shared/types/image";

export const IMAGE_IPC_CHANNELS = {
  health: "image:health",
  processBatch: "image:process-batch"
} as const;

export function registerImageIpcHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IMAGE_IPC_CHANNELS.health, async () => ({ ok: true }));

  ipcMain.handle(IMAGE_IPC_CHANNELS.processBatch, async (_event, payload: BatchProcessRequest) => {
    if (!payload || !Array.isArray(payload.jobs)) {
      return {
        results: [
          {
            id: "unknown",
            success: false,
            error: {
              code: "INVALID_PAYLOAD",
              message: "Payload must contain a jobs array."
            }
          }
        ]
      };
    }

    return processBatchImages(payload);
  });
}
