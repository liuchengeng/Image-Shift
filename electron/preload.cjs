const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("imageShift", {
  platform: process.platform,
  app: "Image-Shift",
  imageApi: {
    pickInputFiles: () => ipcRenderer.invoke("image:pick-input-files"),
    pickOutputDir: () => ipcRenderer.invoke("image:pick-output-dir"),
    loadPreview: (inputPath) => ipcRenderer.invoke("image:load-preview", inputPath),
    estimateJob: (job) => ipcRenderer.invoke("image:estimate-job", job),
    previewJob: (job) => ipcRenderer.invoke("image:preview-job", job),
    processBatch: (payload) => ipcRenderer.invoke("image:process-batch", payload)
  }
});
