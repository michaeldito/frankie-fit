import { describe, expect, it } from "vitest";
import { buildPreview, stripMarkdown } from "./coaching-memory-grid";

describe("stripMarkdown", () => {
  it("removes heading markers", () => {
    expect(stripMarkdown("### The Week Pattern")).toBe("The Week Pattern");
  });

  it("removes bold and italic emphasis", () => {
    expect(stripMarkdown("**The Week Pattern:** it was *fine*.")).toBe(
      "The Week Pattern: it was fine."
    );
  });

  it("removes list markers", () => {
    expect(stripMarkdown("- one\n- two\n1. three")).toBe("one\ntwo\nthree");
  });

  it("unwraps links to their label text", () => {
    expect(stripMarkdown("See [the plan](https://example.com/plan) for details.")).toBe(
      "See the plan for details."
    );
  });

  it("unwraps inline code", () => {
    expect(stripMarkdown("Run `pnpm test` before committing.")).toBe(
      "Run pnpm test before committing."
    );
  });
});

describe("buildPreview", () => {
  it("returns the text unchanged when it fits within the preview length", () => {
    expect(buildPreview("Short summary.")).toBe("Short summary.");
  });

  it("collapses newlines and repeated whitespace into single spaces", () => {
    expect(buildPreview("Line one.\n\nLine   two.")).toBe("Line one. Line two.");
  });

  it("strips markdown syntax before truncating", () => {
    expect(buildPreview("### Weekly Summary\n1. **The Week Pattern:** Steady week overall.")).toBe(
      "Weekly Summary The Week Pattern: Steady week overall."
    );
  });

  it("truncates long text with a trailing ellipsis", () => {
    const longText = `What happened: ${"a".repeat(200)}`;
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
