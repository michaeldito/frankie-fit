import { describe, expect, it } from "vitest";
import { buildPreview } from "./coaching-memory-grid";

describe("buildPreview", () => {
  it("returns the text unchanged when it fits within the preview length", () => {
    expect(buildPreview("Short summary.")).toBe("Short summary.");
  });

  it("collapses newlines and repeated whitespace into single spaces", () => {
    expect(buildPreview("Line one.\n\nLine   two.")).toBe("Line one. Line two.");
  });

  it("truncates long text with a trailing ellipsis", () => {
    const longText = `1. What happened: ${"a".repeat(200)}`;
    const preview = buildPreview(longText);

    expect(preview.length).toBe(141);
    expect(preview.endsWith("…")).toBe(true);
    expect(longText.startsWith(preview.slice(0, -1))).toBe(true);
  });

  it("does not cut off mid-word by leaving trailing whitespace before the ellipsis", () => {
    const longText = `${"word ".repeat(30)}`;
    const preview = buildPreview(longText);

    expect(preview.endsWith(" …")).toBe(false);
  });
});
