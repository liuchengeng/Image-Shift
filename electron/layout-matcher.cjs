const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const sharp = require("sharp");

const MIN_ALPHA = 3;
const LOW_CONFIDENCE = 0.62;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function percentileFromHistogram(histogram, count, percentile) {
  if (count <= 0) return 0;
  const wanted = Math.max(1, Math.ceil(count * percentile));
  let seen = 0;
  for (let value = 0; value < histogram.length; value += 1) {
    seen += histogram[value];
    if (seen >= wanted) return value;
  }
  return histogram.length - 1;
}

function channelMedian(data, width, height, band, channel) {
  const histogram = new Uint32Array(256);
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    const isEdgeRow = y < band || y >= height - band;
    for (let x = 0; x < width; x += 1) {
      if (!isEdgeRow && x >= band && x < width - band) continue;
      histogram[data[(y * width + x) * 4 + channel]] += 1;
      count += 1;
    }
  }
  return percentileFromHistogram(histogram, count, 0.5);
}

function sampleBackground(data, width, height) {
  const band = Math.max(1, Math.min(24, Math.round(Math.min(width, height) * 0.02)));
  const color = {
    r: channelMedian(data, width, height, band, 0),
    g: channelMedian(data, width, height, band, 1),
    b: channelMedian(data, width, height, band, 2),
    alpha: 255
  };
  const distances = new Uint32Array(256);
  let count = 0;
  let minimum = 255;
  let maximum = 0;

  for (let y = 0; y < height; y += 1) {
    const isEdgeRow = y < band || y >= height - band;
    for (let x = 0; x < width; x += 1) {
      if (!isEdgeRow && x >= band && x < width - band) continue;
      const offset = (y * width + x) * 4;
      const distance = Math.max(
        Math.abs(data[offset] - color.r),
        Math.abs(data[offset + 1] - color.g),
        Math.abs(data[offset + 2] - color.b)
      );
      distances[distance] += 1;
      minimum = Math.min(minimum, distance);
      maximum = Math.max(maximum, distance);
      count += 1;
    }
  }

  return {
    color,
    noise: percentileFromHistogram(distances, count, 0.75),
    spread: maximum - minimum
  };
}

function boundsFillCanvas(bounds, width, height) {
  const touchesEverySide = bounds.left <= 0
    && bounds.top <= 0
    && bounds.left + bounds.width >= width
    && bounds.top + bounds.height >= height;
  return touchesEverySide || (bounds.width * bounds.height) / (width * height) > 0.995;
}

function refineNoisyComponentBounds(queue, length, component) {
  const componentWidth = component.right - component.left + 1;
  const componentHeight = component.bottom - component.top + 1;
  const columns = new Uint32Array(componentWidth);
  const rows = new Uint32Array(componentHeight);
  for (let index = 0; index < length; index += 1) {
    const pixel = queue[index];
    const x = pixel % component.canvasWidth;
    const y = Math.floor(pixel / component.canvasWidth);
    columns[x - component.left] += 1;
    rows[y - component.top] += 1;
  }
  const minimumColumnPixels = Math.max(2, Math.min(12, Math.round(componentHeight * 0.08)));
  const minimumRowPixels = Math.max(2, Math.min(12, Math.round(componentWidth * 0.08)));
  let leftOffset = 0;
  let rightOffset = componentWidth - 1;
  let topOffset = 0;
  let bottomOffset = componentHeight - 1;
  while (leftOffset < rightOffset && columns[leftOffset] < minimumColumnPixels) leftOffset += 1;
  while (rightOffset > leftOffset && columns[rightOffset] < minimumColumnPixels) rightOffset -= 1;
  while (topOffset < bottomOffset && rows[topOffset] < minimumRowPixels) topOffset += 1;
  while (bottomOffset > topOffset && rows[bottomOffset] < minimumRowPixels) bottomOffset -= 1;
  return {
    ...component,
    left: component.left + leftOffset,
    right: component.left + rightOffset,
    top: component.top + topOffset,
    bottom: component.top + bottomOffset
  };
}

function collectMaskBounds(mask, width, height, minimumComponentArea, refineNoisyEdges = false) {
  const pixelCount = width * height;
  const queue = new Int32Array(pixelCount);
  const components = [];

  for (let start = 0; start < pixelCount; start += 1) {
    if (mask[start] !== 1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    mask[start] = 2;
    let area = 0;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      area += 1;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);

      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy += 1) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx += 1) {
          const neighbor = yy * width + xx;
          if (mask[neighbor] === 1) {
            mask[neighbor] = 2;
            queue[tail++] = neighbor;
          }
        }
      }
    }

    if (area >= minimumComponentArea) {
      const component = { area, left, top, right, bottom, canvasWidth: width };
      components.push(refineNoisyEdges ? refineNoisyComponentBounds(queue, tail, component) : component);
    }
  }

  if (components.length === 0) return null;
  const totalArea = components.reduce((sum, component) => sum + component.area, 0);
  const largestArea = components.reduce((largest, component) => Math.max(largest, component.area), 0);
  const left = components.reduce((value, component) => Math.min(value, component.left), width);
  const top = components.reduce((value, component) => Math.min(value, component.top), height);
  const right = components.reduce((value, component) => Math.max(value, component.right), -1);
  const bottom = components.reduce((value, component) => Math.max(value, component.bottom), -1);

  return {
    bounds: { left, top, width: right - left + 1, height: bottom - top + 1 },
    totalArea,
    componentDominance: largestArea / totalArea
  };
}

function detectAlphaSubject(data, width, height) {
  const pixelCount = width * height;
  const weakMask = new Uint8Array(pixelCount);
  let transparentPixels = 0;
  let visiblePixels = 0;
  let maximumAlpha = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    const alpha = data[index * 4 + 3];
    maximumAlpha = Math.max(maximumAlpha, alpha);
    if (alpha < 250) transparentPixels += 1;
    if (alpha >= MIN_ALPHA) {
      weakMask[index] = 1;
      visiblePixels += 1;
    }
  }

  if (transparentPixels === 0) return null;
  const minimumComponentArea = Math.max(2, Math.round(pixelCount * 0.000002));
  const weakCollected = collectMaskBounds(weakMask.slice(), width, height, minimumComponentArea);
  if (!weakCollected || visiblePixels === 0) {
    return {
      reliable: false,
      empty: visiblePixels === 0,
      reason: "The transparent image does not have a distinct subject boundary."
    };
  }

  // Lanczos can create a one-pixel, very-low-alpha filter fringe. Anchor the
  // geometry to a soft strong-alpha core, then add back only weak-alpha areas
  // with real spatial thickness (for example a broad translucent shadow).
  const strongAlpha = Math.max(MIN_ALPHA, Math.round(maximumAlpha * 0.08));
  const strongMask = new Uint8Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    if (data[index * 4 + 3] >= strongAlpha) strongMask[index] = 1;
  }
  const strongCollected = collectMaskBounds(strongMask, width, height, minimumComponentArea);
  const anchor = strongCollected ?? weakCollected;
  const bounds = strongCollected
    ? extendBoundsWithStructuredWeakPixels(anchor.bounds, weakMask, width, height, 4, 0.2)
    : anchor.bounds;
  if (boundsFillCanvas(bounds, width, height)) {
    return {
      reliable: false,
      reason: "The transparent image does not have a distinct subject boundary."
    };
  }

  const areaRatio = anchor.totalArea / pixelCount;
  const confidence = clamp(
    0.82 + 0.12 * anchor.componentDominance + 0.06 * Math.min(1, transparentPixels / pixelCount),
    0,
    0.99
  );
  return {
    reliable: areaRatio >= 0.00002,
    bounds,
    confidence,
    method: "alpha",
    background: { mode: "transparent" }
  };
}

function enqueueBackground(mask, queue, width, height, x, y, tail) {
  const index = y * width + x;
  if (mask[index] !== 1) return tail;
  mask[index] = 2;
  queue[tail] = index;
  return tail + 1;
}

function extendBoundsWithStructuredWeakPixels(
  bounds,
  mask,
  width,
  height,
  minimumRun = 4,
  projectionRatio = 0.08,
  supportMask = null,
  minimumSupportRatio = 0
) {
  const columns = new Uint32Array(width);
  const rows = new Uint32Array(height);
  const supportColumns = supportMask ? new Uint32Array(width) : null;
  const supportRows = supportMask ? new Uint32Array(height) : null;
  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] !== 1) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    columns[x] += 1;
    rows[y] += 1;
  }
  if (supportMask) {
    for (let index = 0; index < supportMask.length; index += 1) {
      if (supportMask[index] !== 1) continue;
      const x = index % width;
      const y = Math.floor(index / width);
      supportColumns[x] += 1;
      supportRows[y] += 1;
    }
  }

  const projectionCap = projectionRatio >= 0.2 ? 32 : 12;
  const minimumColumnPixels = Math.max(2, Math.min(projectionCap, Math.round(bounds.height * projectionRatio)));
  const minimumRowPixels = Math.max(2, Math.min(projectionCap, Math.round(bounds.width * projectionRatio)));
  function extensionLength(projection, supportProjection, start, step, limit, minimumPixels) {
    let cursor = start;
    let length = 0;
    let weakPixels = 0;
    let supportPixels = 0;
    while (cursor >= 0 && cursor < limit && projection[cursor] >= minimumPixels) {
      weakPixels += projection[cursor];
      supportPixels += supportProjection?.[cursor] ?? 0;
      length += 1;
      cursor += step;
    }
    if (length < minimumRun) return 0;
    if (supportProjection && supportPixels / Math.max(1, weakPixels) < minimumSupportRatio) return 0;
    return length;
  }

  const leftExtension = extensionLength(columns, supportColumns, bounds.left - 1, -1, width, minimumColumnPixels);
  const rightEdge = bounds.left + bounds.width;
  const rightExtension = extensionLength(columns, supportColumns, rightEdge, 1, width, minimumColumnPixels);
  const topExtension = extensionLength(rows, supportRows, bounds.top - 1, -1, height, minimumRowPixels);
  const bottomEdge = bounds.top + bounds.height;
  const bottomExtension = extensionLength(rows, supportRows, bottomEdge, 1, height, minimumRowPixels);

  const left = bounds.left - leftExtension;
  const top = bounds.top - topExtension;
  const right = rightEdge - 1 + rightExtension;
  const bottom = bottomEdge - 1 + bottomExtension;
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function unionBounds(first, second) {
  const left = Math.min(first.left, second.left);
  const top = Math.min(first.top, second.top);
  const right = Math.max(first.left + first.width, second.left + second.width);
  const bottom = Math.max(first.top + first.height, second.top + second.height);
  return { left, top, width: right - left, height: bottom - top };
}

function isShadowLikePixel(data, offset, background, noise, weakThreshold) {
  const pixels = [data[offset], data[offset + 1], data[offset + 2]];
  const backgrounds = [background.r, background.g, background.b];
  const deltas = backgrounds.map((channel, index) => channel - pixels[index]);
  const negativeTolerance = Math.max(2, noise + 2);
  if (deltas.some((delta) => delta < -negativeTolerance)) return false;

  const maximumDelta = Math.max(...deltas);
  const minimumDelta = Math.min(...deltas);
  const averageDelta = (deltas[0] + deltas[1] + deltas[2]) / 3;
  if (averageDelta < weakThreshold + 2) return false;

  // Neutral canvases produce nearly equal per-channel darkening. For coloured
  // canvases, a real shadow generally preserves the background hue and thus
  // has a similar multiplicative darkening ratio in every usable channel.
  if (maximumDelta - minimumDelta <= Math.max(3 + noise, maximumDelta * 0.18)) {
    return true;
  }
  const ratios = [];
  for (let channel = 0; channel < 3; channel += 1) {
    if (backgrounds[channel] >= 32) {
      ratios.push(pixels[channel] / backgrounds[channel]);
    }
  }
  if (ratios.length < 2) return false;
  return Math.max(...ratios) - Math.min(...ratios) <= 0.025 + noise / 255;
}

function detectOpaqueSubject(data, width, height) {
  const pixelCount = width * height;
  const sampled = sampleBackground(data, width, height);
  // The weak threshold keeps pale shadows. A second, data-driven strong
  // threshold anchors the actual subject so fixed-width JPEG ringing does not
  // become a larger percentage of small subjects than of large subjects.
  const threshold = clamp(sampled.noise + 4, 5, 18);
  const evidenceThreshold = Math.max(2, sampled.noise + 2);
  const mask = new Uint8Array(pixelCount);
  const evidenceMask = new Uint8Array(pixelCount);
  const distances = new Uint8Array(pixelCount);
  const foregroundDistances = new Uint32Array(256);
  let foregroundDistanceCount = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const distance = Math.max(
      Math.abs(data[offset] - sampled.color.r),
      Math.abs(data[offset + 1] - sampled.color.g),
      Math.abs(data[offset + 2] - sampled.color.b)
    );
    distances[index] = distance;
    if (distance > evidenceThreshold) evidenceMask[index] = 1;
    if (distance > threshold) {
      foregroundDistances[distance] += 1;
      foregroundDistanceCount += 1;
    }
    // 1 means a background-coloured pixel that has not yet been proven to be
    // connected to the canvas edge. 0 is a possible foreground pixel.
    if (distance <= threshold) mask[index] = 1;
  }

  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;
  for (let x = 0; x < width; x += 1) {
    tail = enqueueBackground(mask, queue, width, height, x, 0, tail);
    if (height > 1) tail = enqueueBackground(mask, queue, width, height, x, height - 1, tail);
  }
  for (let y = 1; y < height - 1; y += 1) {
    tail = enqueueBackground(mask, queue, width, height, 0, y, tail);
    if (width > 1) tail = enqueueBackground(mask, queue, width, height, width - 1, y, tail);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) tail = enqueueBackground(mask, queue, width, height, x - 1, y, tail);
    if (x + 1 < width) tail = enqueueBackground(mask, queue, width, height, x + 1, y, tail);
    if (y > 0) tail = enqueueBackground(mask, queue, width, height, x, y - 1, tail);
    if (y + 1 < height) tail = enqueueBackground(mask, queue, width, height, x, y + 1, tail);
  }

  // Everything that was not reached by the edge flood is visible content.
  // Isolated JPEG speckles are filtered as tiny connected components.
  const weakForeground = new Uint8Array(pixelCount);
  const shadowForeground = new Uint8Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    weakForeground[index] = mask[index] === 2 ? 0 : 1;
    if (
      weakForeground[index] === 1
      && isShadowLikePixel(data, index * 4, sampled.color, sampled.noise, threshold)
    ) {
      shadowForeground[index] = 1;
    }
  }
  const minimumComponentArea = Math.max(8, Math.round(pixelCount * 0.000005));
  const weakCollected = collectMaskBounds(weakForeground.slice(), width, height, minimumComponentArea, true);
  if (!weakCollected) {
    const evidenceCollected = collectMaskBounds(evidenceMask, width, height, minimumComponentArea, true);
    return {
      reliable: false,
      empty: !evidenceCollected,
      reason: "No subject could be distinguished from the background.",
      background: { mode: "solid", color: sampled.color }
    };
  }

  const foregroundP60 = percentileFromHistogram(foregroundDistances, foregroundDistanceCount, 0.6);
  const strongThreshold = clamp(
    Math.round(Math.max(threshold + 8, foregroundP60 * 0.35)),
    threshold + 8,
    96
  );
  const strongMask = new Uint8Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    if (weakForeground[index] === 1 && distances[index] > strongThreshold) {
      strongMask[index] = 1;
    }
  }
  const strongCollected = collectMaskBounds(strongMask, width, height, minimumComponentArea, true);

  // If weak contrast never produces a stable strong core, the edge result is
  // deliberately marked unreliable so the existing local AI fallback gets a
  // chance instead of silently applying a noise-inflated scale.
  if (!strongCollected) {
    return {
      reliable: false,
      bounds: weakCollected.bounds,
      confidence: 0.5,
      method: "edge",
      background: { mode: "solid", color: sampled.color },
      reason: "The subject does not have a stable edge against the sampled background."
    };
  }

  const structuredWeakBounds = extendBoundsWithStructuredWeakPixels(
    strongCollected.bounds,
    weakForeground,
    width,
    height,
    4,
    0.2,
    shadowForeground,
    0.1
  );
  const structuredShadowBounds = extendBoundsWithStructuredWeakPixels(
    strongCollected.bounds,
    shadowForeground,
    width,
    height,
    2,
    0.08
  );
  const bounds = unionBounds(structuredWeakBounds, structuredShadowBounds);

  const areaRatio = strongCollected.totalArea / pixelCount;
  const borderHomogeneity = 1 - clamp(sampled.noise / 24, 0, 1);
  const confidence = clamp(
    0.52 + 0.3 * borderHomogeneity + 0.14 * strongCollected.componentDominance + 0.04 * Math.min(1, areaRatio * 20),
    0,
    0.98
  );
  const fillsCanvas = boundsFillCanvas(bounds, width, height);

  return {
    reliable: !fillsCanvas && areaRatio >= 0.00002 && confidence >= LOW_CONFIDENCE,
    bounds,
    confidence,
    method: "edge",
    background: { mode: "solid", color: sampled.color },
    reason: fillsCanvas
      ? "The detected subject fills the canvas and cannot be aligned reliably."
      : "The subject boundary confidence is too low."
  };
}

async function readRgba(inputPath) {
  const image = sharp(inputPath, { failOn: "none", sequentialRead: true });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Failed to read image size for layout matching.");
  }
  const { data, info } = await sharp(inputPath, { failOn: "none", sequentialRead: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function toPublicAnalysis(width, height, detected) {
  return {
    width,
    height,
    bounds: detected.bounds,
    background: detected.background,
    confidence: detected.confidence,
    method: detected.method
  };
}

async function analyzeAiMask(maskPath, fallbackBackground) {
  const { data, width, height } = await readRgba(maskPath);
  const detected = detectAlphaSubject(data, width, height);
  if (!detected?.reliable || !detected.bounds) return null;
  return {
    ...detected,
    method: "ai",
    background: fallbackBackground,
    confidence: Math.min(0.9, detected.confidence)
  };
}

async function analyzeImageSubject(inputPath, runBackgroundWorker) {
  const { data, width, height } = await readRgba(inputPath);
  const alphaDetected = detectAlphaSubject(data, width, height);
  if (alphaDetected?.reliable && alphaDetected.bounds) {
    return toPublicAnalysis(width, height, alphaDetected);
  }

  const edgeDetected = alphaDetected ?? detectOpaqueSubject(data, width, height);
  if (edgeDetected?.reliable && edgeDetected.bounds) {
    return toPublicAnalysis(width, height, edgeDetected);
  }

  // A truly uniform canvas has no evidence for an AI pass and is reported
  // immediately. This also avoids turning an empty image into a hallucinated mask.
  if (edgeDetected?.empty || typeof runBackgroundWorker !== "function") {
    throw new Error(edgeDetected?.reason ?? "No recognizable subject was found.");
  }

  const maskPath = path.join(os.tmpdir(), `image-shift-layout-mask-${randomUUID()}.png`);
  try {
    await runBackgroundWorker(inputPath, maskPath);
    const aiDetected = await analyzeAiMask(maskPath, edgeDetected?.background ?? { mode: "transparent" });
    if (!aiDetected) {
      throw new Error("The local AI model could not identify a reliable subject boundary.");
    }
    return toPublicAnalysis(width, height, aiDetected);
  } finally {
    await fs.rm(maskPath, { force: true });
  }
}

function validateReference(reference) {
  if (!reference || !reference.bounds) {
    throw new Error("Layout reference analysis is missing.");
  }
  const values = [
    reference.width,
    reference.height,
    reference.bounds.left,
    reference.bounds.top,
    reference.bounds.width,
    reference.bounds.height
  ];
  if (values.some((value) => !Number.isFinite(value)) || reference.bounds.width <= 0 || reference.bounds.height <= 0) {
    throw new Error("Layout reference analysis is invalid.");
  }
  if (
    reference.width <= 0
    || reference.height <= 0
    || reference.bounds.left < 0
    || reference.bounds.top < 0
    || reference.bounds.left + reference.bounds.width > reference.width
    || reference.bounds.top + reference.bounds.height > reference.height
  ) {
    throw new Error("Layout reference subject bounds are outside the canvas.");
  }
}

function sanitizeAdjustment(adjustment) {
  const scaleMultiplier = adjustment?.scaleMultiplier ?? 1;
  const offsetX = adjustment?.offsetX ?? 0;
  const offsetY = adjustment?.offsetY ?? 0;
  if (!Number.isFinite(scaleMultiplier) || scaleMultiplier <= 0 || !Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
    throw new Error("Layout adjustment is invalid.");
  }
  return { scaleMultiplier, offsetX, offsetY };
}

async function createLayoutMatchedImage(inputPath, options, runBackgroundWorker) {
  validateReference(options?.reference);
  const adjustment = sanitizeAdjustment(options?.adjustment);
  const reference = options.reference;
  const metadata = await sharp(inputPath, { failOn: "none", sequentialRead: true }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Failed to read target image size for layout matching.");
  }
  const target = await analyzeImageSubject(inputPath, runBackgroundWorker);

  // Reference geometry is normalized by its own canvas, then projected into
  // the target canvas. This keeps output dimensions owned by each target while
  // allowing references with a different resolution or aspect ratio.
  const referenceScaleX = target.width / reference.width;
  const referenceScaleY = target.height / reference.height;
  const desiredBounds = {
    left: reference.bounds.left * referenceScaleX,
    top: reference.bounds.top * referenceScaleY,
    width: reference.bounds.width * referenceScaleX,
    height: reference.bounds.height * referenceScaleY
  };
  const widthRatio = desiredBounds.width / target.bounds.width;
  const heightRatio = desiredBounds.height / target.bounds.height;
  const autoScale = Math.sqrt(widthRatio * heightRatio);
  const finalScale = autoScale * adjustment.scaleMultiplier;
  if (!Number.isFinite(finalScale) || finalScale <= 0 || finalScale > 100) {
    throw new Error("The calculated layout scale is outside the supported range.");
  }

  const scaledWidth = Math.max(1, Math.round(target.width * finalScale));
  const scaledHeight = Math.max(1, Math.round(target.height * finalScale));
  // Use the effective per-axis scale after integer raster sizing so that the
  // detected subject centre still lands exactly on the requested reference.
  const effectiveScaleX = scaledWidth / target.width;
  const effectiveScaleY = scaledHeight / target.height;
  const targetCenterX = target.bounds.left + target.bounds.width / 2;
  const targetCenterY = target.bounds.top + target.bounds.height / 2;
  const referenceCenterX = desiredBounds.left + desiredBounds.width / 2;
  const referenceCenterY = desiredBounds.top + desiredBounds.height / 2;
  // Floor aligns rasterised pixel support when the ideal placement lands on a
  // half pixel (Math.round would shift positive and negative halves in
  // different directions in JavaScript).
  const placementX = Math.floor(referenceCenterX - targetCenterX * effectiveScaleX + adjustment.offsetX);
  const placementY = Math.floor(referenceCenterY - targetCenterY * effectiveScaleY + adjustment.offsetY);

  const cropLeft = Math.max(0, -placementX);
  const cropTop = Math.max(0, -placementY);
  const outputLeft = Math.max(0, placementX);
  const outputTop = Math.max(0, placementY);
  const visibleWidth = Math.min(scaledWidth - cropLeft, target.width - outputLeft);
  const visibleHeight = Math.min(scaledHeight - cropTop, target.height - outputTop);
  if (visibleWidth <= 0 || visibleHeight <= 0) {
    throw new Error("The adjusted subject is outside the output canvas.");
  }

  const resized = await sharp(inputPath, { failOn: "none", sequentialRead: true })
    .resize({
      width: scaledWidth,
      height: scaledHeight,
      fit: "fill",
      kernel: sharp.kernel.lanczos3
    })
    .extract({ left: cropLeft, top: cropTop, width: visibleWidth, height: visibleHeight })
    .png()
    .toBuffer();

  const transparent = target.background?.mode === "transparent";
  const fill = transparent
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : { ...target.background.color, alpha: 1 };
  const composites = [{ input: resized, left: outputLeft, top: outputTop }];
  if (transparent) {
    // Lanczos legitimately samples beyond the original support and can create
    // a one-pixel low-alpha fringe. Limit that filter support to the scaled
    // union bounds; this is only a rectangular guard, so the original alpha,
    // soft shadow and contour inside the detected subject remain untouched.
    const projectedLeft = placementX + target.bounds.left * effectiveScaleX;
    const projectedTop = placementY + target.bounds.top * effectiveScaleY;
    const projectedRight = placementX + (target.bounds.left + target.bounds.width) * effectiveScaleX;
    const projectedBottom = placementY + (target.bounds.top + target.bounds.height) * effectiveScaleY;
    const clipLeft = clamp(Math.ceil(projectedLeft - 0.000001), 0, target.width);
    const clipTop = clamp(Math.ceil(projectedTop - 0.000001), 0, target.height);
    const clipRight = clamp(Math.ceil(projectedRight - 0.000001), 0, target.width);
    const clipBottom = clamp(Math.ceil(projectedBottom - 0.000001), 0, target.height);
    if (clipRight <= clipLeft || clipBottom <= clipTop) {
      throw new Error("The adjusted subject is outside the output canvas.");
    }
    const clipMask = Buffer.from(
      `<svg width="${target.width}" height="${target.height}">`
      + `<rect x="${clipLeft}" y="${clipTop}" width="${clipRight - clipLeft}" height="${clipBottom - clipTop}" fill="white"/>`
      + "</svg>"
    );
    composites.push({ input: clipMask, left: 0, top: 0, blend: "dest-in" });
  }
  const image = sharp({
    create: { width: target.width, height: target.height, channels: 4, background: fill }
  }).composite(composites);

  return {
    image,
    hasTransparency: transparent,
    result: {
      targetBounds: target.bounds,
      autoScale,
      finalScale,
      offsetX: placementX,
      offsetY: placementY,
      confidence: target.confidence,
      method: target.method
    }
  };
}

module.exports = {
  analyzeImageSubject,
  createLayoutMatchedImage
};
