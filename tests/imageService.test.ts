import { describe, expect, it } from "vitest";
import { validateBatchRequest, validateCropRect, validateImageJob } from "../src/main/services/imageService";

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

  it("rejects invalid crop bounds", () => {
    const errors = validateCropRect({
      left: -1,
      top: 0,
      width: 120,
      height: 80
    });

    expect(errors).toContain("Crop bounds must be non-negative and dimensions must be > 0.");
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
