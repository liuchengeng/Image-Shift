import { describe, expect, it } from "vitest";
import {
  createDefaultLayoutAdjustment,
  fitDimensions,
  getModeDescription,
  getOutputFormatFromPath,
  moveCropBox,
  resizeCropBox
} from "../components/home/dashboard-utils";

describe("dashboard utils", () => {
  it("maps input extensions to output formats", () => {
    expect(getOutputFormatFromPath("C:/tmp/demo.jpg")).toBe("jpeg");
    expect(getOutputFormatFromPath("C:/tmp/demo.jpeg")).toBe("jpeg");
    expect(getOutputFormatFromPath("C:/tmp/demo.webp")).toBe("webp");
    expect(getOutputFormatFromPath("C:/tmp/demo.png")).toBe("png");
  });

  it("fits large previews entirely inside the crop viewport", () => {
    expect(fitDimensions(960, 720, 880, 328)).toEqual({ width: 437, height: 328 });
    expect(fitDimensions(720, 960, 880, 328)).toEqual({ width: 246, height: 328 });
    expect(fitDimensions(200, 100, 880, 328)).toEqual({ width: 200, height: 100 });
  });

  it("moves crop boxes without leaving the preview bounds", () => {
    expect(moveCropBox({ left: 20, top: 20, width: 100, height: 80 }, 500, 500, 320, 240)).toEqual({
      left: 220,
      top: 160,
      width: 100,
      height: 80
    });
  });

  it("resizes crop boxes from the handle anchor", () => {
    expect(resizeCropBox({ left: 20, top: 30, width: 80, height: 70 }, "se", 150, 140, 320, 240, null)).toEqual({
      left: 20,
      top: 30,
      width: 130,
      height: 110
    });
  });

  it("creates independent default layout adjustments", () => {
    const first = createDefaultLayoutAdjustment();
    const second = createDefaultLayoutAdjustment();

    first.offsetX = 12;
    expect(second).toEqual({ scaleMultiplier: 1, offsetX: 0, offsetY: 0 });
  });

  it("describes layout matching as a relative projection onto the target canvas", () => {
    expect(getModeDescription("Match Layout")).toBe("按参考图匹配主体位置与大小。");
    expect(getModeDescription("Match Layout", "en-US")).toBe("Match subject position and size to a reference image.");
  });
});
