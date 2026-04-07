const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("imageShift", {
  platform: process.platform,
  app: "Image-Shift",
  imageApi: {
    pickInputFiles: () => ipcRenderer.invoke("image:pick-input-files"),
    pickOutputDir: () => ipcRenderer.invoke("image:pick-output-dir"),
    loadPreview: (inputPath) => ipcRenderer.invoke("image:load-preview", inputPath),
    processBatch: (payload) => ipcRenderer.invoke("image:process-batch", payload)
  }
});
