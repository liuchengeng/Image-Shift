import { describe, expect, it } from "vitest";
import {
  validateBatchRequest,
  validateCropRect,
  validateImageJob,
  validateLayoutAdjustment,
  validateLayoutReferenceAnalysis
} from "../src/main/services/imageService";
import type { LayoutReferenceAnalysis } from "../src/shared/types/image";

const validReference: LayoutReferenceAnalysis = {
  width: 1000,
  height: 1000,
  bounds: { left: 200, top: 150, width: 600, height: 700 },
  background: { mode: "solid", color: { r: 250, g: 250, b: 250, alpha: 255 } },
  confidence: 0.96,
  method: "edge"
};

describe("imageService validation", () => {
  it("rejects invalid output format", () => {
    const errors = validateImageJob({
      id: "1",
      inputPath: "C:/tmp/demo.jpg",
      outputFormat: "gif" as never
    });

    expect(errors).toContain("Output format must be jpeg, png, or webp.");
  });

  it("rejects invalid quality", () => {
    const errors = validateImageJob({
      id: "1",
      inputPath: "C:/tmp/demo.jpg",
      outputFormat: "jpeg",
      quality: 120
    });

    expect(errors).toContain("Quality must be an integer from 1 to 100.");
  });

  it("rejects JPEG output for background removal", () => {
    const errors = validateImageJob({
      id: "1",
      inputPath: "C:/tmp/demo.jpg",
      outputFormat: "jpeg",
      removeBackground: true
    });

    expect(errors).toContain("Background removal output must be PNG or WEBP.");
  });

  it("rejects invalid crop bounds", () => {
    const errors = validateCropRect({
      left: -1,
      top: 0,
      width: 120,
      height: 80
    });

    expect(errors).toContain("Crop bounds must be non-negative and dimensions must be > 0.");
  });

  it("accepts a valid layout match job", () => {
    const errors = validateImageJob({
      id: "layout-1",
      inputPath: "C:/tmp/target.png",
      outputFormat: "png",
      layoutMatch: {
        reference: validReference,
        adjustment: { scaleMultiplier: 1, offsetX: -8.5, offsetY: 12 }
      }
    });

    expect(errors).toEqual([]);
  });

  it("rejects invalid reference dimensions, bounds, confidence, method, and background", () => {
    const errors = validateLayoutReferenceAnalysis({
      width: 100,
      height: 100,
      bounds: { left: 60, top: 20, width: 50, height: 40 },
      background: { mode: "solid", color: { r: 256, g: 0, b: 0, alpha: 255 } },
      confidence: 1.1,
      method: "unknown"
    } as never);

    expect(errors).toContain("Layout subject bounds must fit inside the reference canvas.");
    expect(errors).toContain("Layout reference confidence must be between 0 and 1.");
    expect(errors).toContain("Layout reference method must be alpha, edge, or ai.");
    expect(errors).toContain("Layout solid background RGBA channels must be integers from 0 to 255.");
  });

  it("rejects invalid layout adjustment values", () => {
    expect(
      validateLayoutAdjustment({ scaleMultiplier: 0, offsetX: Number.NaN, offsetY: Number.POSITIVE_INFINITY })
    ).toEqual([
      "Layout scale multiplier must be a finite number greater than 0.",
      "Layout X/Y offsets must be finite numbers."
    ]);
  });

  it("rejects combining layout matching with other geometry operations", () => {
    const errors = validateImageJob({
      id: "layout-2",
      inputPath: "C:/tmp/target.webp",
      outputFormat: "webp",
      crop: { left: 0, top: 0, width: 100, height: 100 },
      layoutMatch: {
        reference: validReference,
        adjustment: { scaleMultiplier: 1, offsetX: 0, offsetY: 0 }
      }
    });

    expect(errors).toContain("Layout matching cannot be combined with crop, resize, or background removal.");
  });

  it("rejects empty batch requests", () => {
    const errors = validateBatchRequest({
      jobs: [],
      outputDir: ""
    });

    expect(errors).toContain("At least one job is required.");
    expect(errors).toContain("Output directory is required.");
  });
});
