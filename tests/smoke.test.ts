import { describe, expect, it } from "vitest";
import { APP_NAME } from "../lib/constants";

describe("scaffold smoke test", () => {
  it("exposes app constants", () => {
    expect(APP_NAME).toBe("Image-Shift");
  });
});
