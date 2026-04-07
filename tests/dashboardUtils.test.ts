import { describe, expect, it } from "vitest";
import { getOutputFormatFromPath, moveCropBox, resizeCropBox } from "../components/home/dashboard-utils";

describe("dashboard utils", () => {
  it("maps input extensions to output formats", () => {
    expect(getOutputFormatFromPath("C:/tmp/demo.jpg")).toBe("jpeg");
    expect(getOutputFormatFromPath("C:/tmp/demo.jpeg")).toBe("jpeg");
    expect(getOutputFormatFromPath("C:/tmp/demo.webp")).toBe("webp");
    expect(getOutputFormatFromPath("C:/tmp/demo.png")).toBe("png");
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
});
