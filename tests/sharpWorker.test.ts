import { fork } from "node:child_process";
import { createRequire } from "node:module";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];
const require = createRequire(import.meta.url);
const { analyzeImageSubject } = require("../electron/layout-matcher.cjs") as {
  analyzeImageSubject: (
    inputPath: string,
    runBackgroundWorker: (inputPath: string, outputPath: string) => Promise<unknown>
  ) => Promise<Record<string, unknown>>;
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function runWorker(task: object) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const worker = fork(path.resolve("electron/sharp-worker.cjs"), [], {
      stdio: ["ignore", "ignore", "ignore", "ipc"]
    });
    let response: { type?: string; result?: Record<string, unknown>; error?: { message?: string } } | undefined;
    let workerError: Error | undefined;

    worker.once("message", (message) => {
      response = message as { type?: string; result?: Record<string, unknown>; error?: { message?: string } };
    });
    worker.once("error", (error) => {
      workerError = error;
    });
    worker.once("exit", () => {
      if (workerError) {
        reject(workerError);
        return;
      }
      if (response?.type === "success" && response.result) {
        resolve(response.result);
      } else {
        reject(new Error(response?.error?.message ?? "Image worker failed."));
      }
    });
    worker.send(task);
  });
}

async function writeTransparentRect(
  outputPath: string,
  canvas: { width: number; height: number },
  rect: { left: number; top: number; width: number; height: number }
) {
  const data = Buffer.alloc(canvas.width * canvas.height * 4);
  for (let y = rect.top; y < rect.top + rect.height; y += 1) {
    for (let x = rect.left; x < rect.left + rect.width; x += 1) {
      const offset = (y * canvas.width + x) * 4;
      data[offset] = 225;
      data[offset + 1] = 29;
      data[offset + 2] = 72;
      data[offset + 3] = 255;
    }
  }
  const image = sharp(data, { raw: { width: canvas.width, height: canvas.height, channels: 4 } });
  if (path.extname(outputPath).toLowerCase() === ".webp") {
    await image.webp({ lossless: true }).toFile(outputPath);
  } else {
    await image.png().toFile(outputPath);
  }
}

async function writeJpegRect(
  outputPath: string,
  rect: { left: number; top: number; width: number; height: number },
  quality = 82,
  canvas = { width: 240, height: 180 }
) {
  const source = Buffer.from(
    `<svg width="${canvas.width}" height="${canvas.height}">`
    + `<rect width="${canvas.width}" height="${canvas.height}" fill="#f4f1ea"/>`
    + `<rect x="${rect.left}" y="${rect.top}" width="${rect.width}" height="${rect.height}" fill="#2b5db7"/>`
    + '</svg>'
  );
  await sharp(source).jpeg({ quality, chromaSubsampling: "4:2:0" }).toFile(outputPath);
}

async function getBlueSubjectBounds(inputPath: string) {
  const { data, info } = await sharp(inputPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * 3;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      if (blue - red <= 40 || blue - green <= 10) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function getAlphaBounds(input: string | Buffer) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] < 3) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

describe("sharp worker", () => {
  it("composites transparent input onto white when exporting JPEG", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "transparent.webp");
    const outputPath = path.join(directory, "output.jpg");

    await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    }).webp({ lossless: true }).toFile(inputPath);

    await runWorker({
      type: "process-single",
      outputPath,
      job: { id: "transparent", inputPath, outputFormat: "jpeg", quality: 100 }
    });

    const { data } = await sharp(outputPath).raw().toBuffer({ resolveWithObject: true });
    expect([...data.slice(0, 3)]).toEqual([255, 255, 255]);
  });

  it("uses local AI to create transparent PNG output", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-bg-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "subject.png");
    const outputPath = path.join(directory, "transparent.png");
    const subject = Buffer.from('<svg width="400" height="400"><rect width="400" height="400" fill="white"/><circle cx="200" cy="200" r="120" fill="#e11d48"/></svg>');

    await sharp(subject).png().toFile(inputPath);
    await runWorker({
      type: "process-single",
      outputPath,
      job: { id: "remove-bg", inputPath, outputFormat: "png", removeBackground: true }
    });

    const { data, info } = await sharp(outputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparentPixels = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] < 10) transparentPixels += 1;
    }

    expect(info.channels).toBe(4);
    expect(transparentPixels).toBeGreaterThan(1000);
  }, 30_000);

  it("cleans the remove-background temporary file when pipeline construction fails", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-bg-cleanup-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "subject.png");
    const outputPath = path.join(directory, "unused.png");
    const source = Buffer.from(
      '<svg width="180" height="180"><rect width="180" height="180" fill="white"/>'
      + '<circle cx="90" cy="90" r="55" fill="#e11d48"/></svg>'
    );
    await sharp(source).png().toFile(inputPath);
    const before = new Set((await readdir(tmpdir())).filter((name) => name.startsWith("image-shift-bg-")));

    await expect(runWorker({
      type: "process-single",
      outputPath,
      job: {
        id: "cleanup-after-error",
        inputPath,
        outputFormat: "png",
        removeBackground: true,
        crop: { left: 0, top: 0, width: 0, height: 20 }
      }
    })).rejects.toThrow("Crop region");

    const leaked = (await readdir(tmpdir()))
      .filter((name) => name.startsWith("image-shift-bg-") && !before.has(name));
    expect(leaked).toEqual([]);
  }, 30_000);

  it("matches transparent subject bounds to the reference within one pixel", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-alpha-"));
    temporaryDirectories.push(directory);
    const referencePath = path.join(directory, "reference.png");
    const targetPath = path.join(directory, "target.png");
    const outputPath = path.join(directory, "matched.png");
    const canvas = { width: 160, height: 120 };

    await writeTransparentRect(referencePath, canvas, { left: 50, top: 25, width: 60, height: 70 });
    await writeTransparentRect(targetPath, canvas, { left: 20, top: 45, width: 30, height: 35 });
    const reference = await runWorker({ type: "analyze-layout-reference", inputPath: referencePath });

    expect(reference.bounds).toEqual({ left: 50, top: 25, width: 60, height: 70 });
    await runWorker({
      type: "process-single",
      outputPath,
      job: {
        id: "layout-alpha",
        inputPath: targetPath,
        outputFormat: "png",
        layoutMatch: {
          reference,
          adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 }
        }
      }
    });

    const metadata = await sharp(outputPath).metadata();
    const bounds = await getAlphaBounds(outputPath);
    expect({ width: metadata.width, height: metadata.height, format: metadata.format }).toEqual({
      width: canvas.width,
      height: canvas.height,
      format: "png"
    });
    expect(Math.abs(bounds.left - 50)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.top - 25)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.width - 60)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.height - 70)).toBeLessThanOrEqual(1);

    const preview = await runWorker({
      type: "preview-single",
      job: {
        id: "layout-alpha-preview",
        inputPath: targetPath,
        outputFormat: "png",
        layoutMatch: { reference, adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 } }
      }
    });
    expect(preview.layoutMatch).toMatchObject({ autoScale: 2, finalScale: 2, confidence: expect.any(Number) });
  });

  it("keeps a transparent WebP canvas and matches a non-integer scale within one pixel", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-webp-"));
    temporaryDirectories.push(directory);
    const referencePath = path.join(directory, "reference.png");
    const targetPath = path.join(directory, "target.webp");
    const outputPath = path.join(directory, "matched.webp");
    const canvas = { width: 160, height: 120 };
    await writeTransparentRect(referencePath, { width: 320, height: 240 }, {
      left: 120,
      top: 30,
      width: 130,
      height: 182
    });
    await writeTransparentRect(targetPath, canvas, { left: 15, top: 35, width: 50, height: 70 });
    const reference = await runWorker({ type: "analyze-layout-reference", inputPath: referencePath });

    await runWorker({
      type: "process-single",
      outputPath,
      job: {
        id: "layout-webp",
        inputPath: targetPath,
        outputFormat: "webp",
        layoutMatch: { reference, adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 } }
      }
    });

    const outputBuffer = await readFile(outputPath);
    const bounds = await getAlphaBounds(outputBuffer);
    const metadata = await sharp(outputBuffer).metadata();
    expect({ format: metadata.format, width: metadata.width, height: metadata.height }).toEqual({
      format: "webp",
      width: canvas.width,
      height: canvas.height
    });
    expect(Math.abs(bounds.left - 60)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.top - 15)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.width - 65)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.height - 91)).toBeLessThanOrEqual(1);
  });

  it("detects a pale shadow on a JPEG-noisy solid background", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-jpeg-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "shadow.jpg");
    const source = Buffer.from(
      '<svg width="200" height="150">'
      + '<rect width="200" height="150" fill="#ffffff"/>'
      + '<rect x="55" y="40" width="90" height="75" rx="4" fill="#ebebeb"/>'
      + '<rect x="60" y="35" width="80" height="70" rx="3" fill="#d91f47"/>'
      + '</svg>'
    );
    await sharp(source).jpeg({ quality: 68, chromaSubsampling: "4:2:0" }).toFile(inputPath);

    const analysis = await runWorker({ type: "analyze-layout-reference", inputPath });
    const bounds = analysis.bounds as { left: number; top: number; width: number; height: number };
    expect(analysis.method).toBe("edge");
    expect(analysis.confidence).toEqual(expect.any(Number));
    expect(Math.abs(bounds.left - 55)).toBeLessThanOrEqual(3);
    expect(Math.abs(bounds.top - 35)).toBeLessThanOrEqual(3);
    expect(Math.abs(bounds.width - 90)).toBeLessThanOrEqual(6);
    expect(Math.abs(bounds.height - 80)).toBeLessThanOrEqual(6);
  });

  it("keeps a structured eight-level shadow without treating it as background", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-faint-shadow-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "faint-shadow.png");
    const source = Buffer.from(
      '<svg width="200" height="150">'
      + '<rect width="200" height="150" fill="#ffffff"/>'
      + '<rect x="55" y="40" width="90" height="75" fill="#f7f7f7"/>'
      + '<rect x="60" y="35" width="80" height="70" fill="#d91f47"/>'
      + '</svg>'
    );
    await sharp(source).png().toFile(inputPath);

    const analysis = await runWorker({ type: "analyze-layout-reference", inputPath });
    expect(analysis.method).toBe("edge");
    expect(analysis.bounds).toEqual({ left: 55, top: 35, width: 90, height: 80 });
  });

  it("matches differently sized subjects from real JPEG inputs without ringing scale drift", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-jpeg-match-"));
    temporaryDirectories.push(directory);
    const referencePath = path.join(directory, "reference.jpg");
    const targetPath = path.join(directory, "target.jpg");
    const outputPath = path.join(directory, "matched.jpg");
    await writeJpegRect(
      referencePath,
      { left: 160, top: 80, width: 160, height: 200 },
      82,
      { width: 480, height: 360 }
    );
    await writeJpegRect(targetPath, { left: 25, top: 70, width: 40, height: 50 });

    const reference = await runWorker({ type: "analyze-layout-reference", inputPath: referencePath });
    const target = await runWorker({ type: "analyze-layout-reference", inputPath: targetPath });
    expect(reference.bounds).toEqual({ left: 160, top: 80, width: 160, height: 200 });
    expect(target.bounds).toEqual({ left: 25, top: 70, width: 40, height: 50 });
    for (const quality of [95, 100]) {
      const highQualityTargetPath = path.join(directory, `target-${quality}.jpg`);
      await writeJpegRect(highQualityTargetPath, { left: 25, top: 70, width: 40, height: 50 }, quality);
      const highQualityTarget = await runWorker({
        type: "analyze-layout-reference",
        inputPath: highQualityTargetPath
      });
      expect(highQualityTarget.bounds).toEqual({ left: 25, top: 70, width: 40, height: 50 });
    }

    const preview = await runWorker({
      type: "preview-single",
      job: {
        id: "layout-jpeg-preview",
        inputPath: targetPath,
        outputFormat: "jpeg",
        layoutMatch: { reference, adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 } }
      }
    });
    expect(preview.layoutMatch).toMatchObject({ autoScale: 2, finalScale: 2 });

    await runWorker({
      type: "process-single",
      outputPath,
      job: {
        id: "layout-jpeg",
        inputPath: targetPath,
        outputFormat: "jpeg",
        layoutMatch: { reference, adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 } }
      }
    });
    // Measure the actual blue subject pixels instead of reusing the layout
    // detector as the oracle, which could hide a self-consistent scale error.
    const referenceSourceBounds = await getBlueSubjectBounds(referencePath);
    const referenceBounds = {
      left: referenceSourceBounds.left / 2,
      top: referenceSourceBounds.top / 2,
      width: referenceSourceBounds.width / 2,
      height: referenceSourceBounds.height / 2
    };
    const matchedBounds = await getBlueSubjectBounds(outputPath);
    expect(Math.abs(matchedBounds.left - referenceBounds.left)).toBeLessThanOrEqual(2);
    expect(Math.abs(matchedBounds.top - referenceBounds.top)).toBeLessThanOrEqual(2);
    expect(Math.abs(matchedBounds.width - referenceBounds.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(matchedBounds.height - referenceBounds.height)).toBeLessThanOrEqual(2);
    const metadata = await sharp(outputPath).metadata();
    expect({ format: metadata.format, width: metadata.width, height: metadata.height }).toEqual({
      format: "jpeg",
      width: 240,
      height: 180
    });
  });

  it("projects a different reference aspect ratio and preserves target subject proportions", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-aspect-"));
    temporaryDirectories.push(directory);
    const referencePath = path.join(directory, "reference.png");
    const targetPath = path.join(directory, "target.png");
    const outputPath = path.join(directory, "output.png");
    await writeTransparentRect(referencePath, { width: 200, height: 200 }, {
      left: 50,
      top: 40,
      width: 100,
      height: 120
    });
    await writeTransparentRect(targetPath, { width: 300, height: 150 }, {
      left: 30,
      top: 50,
      width: 60,
      height: 60
    });
    const reference = await runWorker({ type: "analyze-layout-reference", inputPath: referencePath });

    const preview = await runWorker({
      type: "preview-single",
      job: {
        id: "layout-aspect-preview",
        inputPath: targetPath,
        outputFormat: "png",
        layoutMatch: { reference, adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 } }
      }
    });
    const previewLayout = preview.layoutMatch as { autoScale: number };
    expect(previewLayout.autoScale).toBeCloseTo(Math.sqrt(3.75), 6);

    await runWorker({
      type: "process-single",
      outputPath,
      job: {
        id: "layout-aspect",
        inputPath: targetPath,
        outputFormat: "png",
        layoutMatch: { reference, adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 } }
      }
    });
    const outputBuffer = await readFile(outputPath);
    const bounds = await getAlphaBounds(outputBuffer);
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    expect(Math.abs(centerX - 150)).toBeLessThanOrEqual(1);
    expect(Math.abs(centerY - 75)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.width * bounds.height - 150 * 90)).toBeLessThanOrEqual(250);
    const metadata = await sharp(outputBuffer).metadata();
    expect({ format: metadata.format, width: metadata.width, height: metadata.height }).toEqual({
      format: "png",
      width: 300,
      height: 150
    });
  });

  it("reports an empty uniform reference instead of generating a false match", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-empty-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "empty.png");
    await sharp({
      create: { width: 80, height: 60, channels: 3, background: "#f8f8f8" }
    }).png().toFile(inputPath);

    await expect(runWorker({ type: "analyze-layout-reference", inputPath }))
      .rejects.toThrow("No subject could be distinguished");
  });

  it("uses the AI fallback for structured low contrast instead of marking it empty", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "image-shift-layout-low-contrast-"));
    temporaryDirectories.push(directory);
    const inputPath = path.join(directory, "low-contrast.png");
    const source = Buffer.from(
      '<svg width="100" height="80">'
      + '<rect width="100" height="80" fill="#ffffff"/>'
      + '<rect x="25" y="20" width="40" height="30" fill="#fcfcfc"/>'
      + '</svg>'
    );
    await sharp(source).png().toFile(inputPath);
    let temporaryMaskPath = "";

    const analysis = await analyzeImageSubject(inputPath, async (_sourcePath, outputPath) => {
      temporaryMaskPath = outputPath;
      await writeTransparentRect(outputPath, { width: 100, height: 80 }, {
        left: 25,
        top: 20,
        width: 40,
        height: 30
      });
      return { outputPath };
    });

    expect(analysis).toMatchObject({
      method: "ai",
      bounds: { left: 25, top: 20, width: 40, height: 30 }
    });
    await expect(access(temporaryMaskPath)).rejects.toThrow();
  });
});
