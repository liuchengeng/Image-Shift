import { describe, expect, it } from "vitest";
import { validateImageJob } from "@/src/main/services/imageService";

describe("imageService validation", () => {
  it("returns errors for invalid quality", () => {
    const errors = validateImageJob({
      id: "1",
      inputPath: "/tmp/in.png",
      outputPath: "/tmp/out.png",
      quality: 120
    });

    expect(errors).toContain("Quality must be an integer from 1 to 100.");
  });

  it("returns errors for invalid crop", () => {
    const errors = validateImageJob({
      id: "1",
      inputPath: "/tmp/in.png",
      outputPath: "/tmp/out.png",
      crop: { left: -1, top: 0, width: 100, height: 100 }
    });

    expect(errors).toContain("Crop bounds must be non-negative and dimensions must be > 0.");
  });

  it("requires output format hint", () => {
    const errors = validateImageJob({
      id: "1",
      inputPath: "/tmp/in.png",
      outputPath: "/tmp/out.unknown"
    });

    expect(errors).toContain("Output format is required via job.format or file extension (.jpeg/.png/.webp).");
  });
});
