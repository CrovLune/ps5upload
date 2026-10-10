import { describe, expect, it } from "vitest";

import { markPlatform } from "./platformMark";

const root = () => ({ dataset: {} as Record<string, string | undefined> }) as unknown as HTMLElement;

describe("markPlatform", () => {
  it("marks the page on Android", () => {
    const el = root();
    markPlatform(el, true);
    expect(el.dataset.platform).toBe("android");
  });
  it("leaves every other platform unmarked", () => {
    const el = root();
    el.dataset.platform = "android";
    markPlatform(el, false);
    expect(el.dataset.platform).toBeUndefined();
  });
});
