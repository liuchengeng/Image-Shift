const path = require('node:path');
const fs = require('node:fs/promises');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const sharp = require('sharp');
const archiver = require('archiver');

const isDev = process.env.NODE_ENV === 'development';

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function extForFormat(format) {
  if (format === 'jpeg') return '.jpg';
  if (format === 'png') return '.png';
  return '.webp';
}

function baseNameWithoutExt(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

async function processJob(job) {
  const image = sharp(job.inputPath, { failOn: 'none' });

  if (job.crop) {
    image.extract(job.crop);
  }

  if (job.resize && (job.resize.width || job.resize.height)) {
    image.resize({
      width: job.resize.width,
      height: job.resize.height,
      fit: job.resize.fit || 'inside'
    });
  }

  if (job.format === 'jpeg') {
    image.jpeg({ quality: job.quality || 80 });
  } else if (job.format === 'png') {
    image.png();
  } else {
    image.webp({ quality: job.quality || 80 });
  }

  const outputPath = path.join(job.outputDir, `${baseNameWithoutExt(job.inputPath)}${extForFormat(job.format)}`);
  await ensureDir(path.dirname(outputPath));
  await image.toFile(outputPath);
  return outputPath;
}

async function exportZip(files, zipPath) {
  await ensureDir(path.dirname(zipPath));

  return new Promise((resolve, reject) => {
    const output = require('node:fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve({ size: archive.pointer() }));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    files.forEach((file) => {
      archive.file(file, { name: path.basename(file) });
    });
    archive.finalize();
  });
}

function registerIpcHandlers() {
  ipcMain.handle('image:health', async () => ({ ok: true }));

  ipcMain.handle('image:pick-input-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
      ]
    });

    if (result.canceled) return [];
    return result.filePaths;
  });

  ipcMain.handle('image:pick-output-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('image:process-batch', async (_event, payload) => {
    if (!payload || !Array.isArray(payload.jobs) || payload.jobs.length === 0) {
      return {
        results: [
          {
            id: 'unknown',
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'jobs is required.' }
          }
        ]
      };
    }

    const results = [];
    for (const job of payload.jobs) {
      try {
        const outputPath = await processJob(job);
        results.push({ id: job.id, success: true, outputPath });
      } catch (error) {
        results.push({
          id: job.id || 'unknown',
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: error instanceof Error ? error.message : 'Unknown processing error.'
          }
        });
      }
    }

    return { results };
  });

  ipcMain.handle('image:export-zip', async (_event, payload) => {
    if (!payload || !Array.isArray(payload.files) || payload.files.length === 0 || !payload.zipPath) {
      return { success: false, error: 'Invalid zip payload.' };
    }

    try {
      await exportZip(payload.files, payload.zipPath);
      return { success: true, zipPath: payload.zipPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ZIP export failed.'
      };
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'Image-Shift',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
