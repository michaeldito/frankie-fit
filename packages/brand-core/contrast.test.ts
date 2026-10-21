import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "./contrast";
import { PILLARS, pillarColor, themes, type ThemeColors } from "./themes";

const AA_TEXT = 4.5;
const AA_LARGE_OR_UI = 3;

type Pair = [label: string, fg: keyof ThemeColors, bg: keyof ThemeColors, min: number];

const textPairs: Pair[] = [
  ["body text on background", "foreground", "background", AA_TEXT],
  ["body text on surface", "foreground", "surface", AA_TEXT],
  ["body text on inset surface", "foreground", "surfaceStrong", AA_TEXT],
  ["muted text on background", "muted", "background", AA_TEXT],
  ["muted text on surface", "muted", "surface", AA_TEXT],
  ["muted text on inset surface", "muted", "surfaceStrong", AA_TEXT],
  ["muted text on elevated surface", "muted", "surfaceElevated", AA_TEXT],
  ["primary button label", "brandForeground", "brand", AA_TEXT],
  ["user bubble text", "accentForeground", "accentStrong", AA_TEXT],
  ["links on background", "accent", "background", AA_TEXT],
  ["links on surface", "accent", "surface", AA_TEXT],
  ["text on Frankie's quote card", "foreground", "frankieSoft", AA_TEXT],
  ["celebration label", "celebrateForeground", "celebrate", AA_TEXT],
  ["errors on surface", "danger", "surface", AA_TEXT],
  ["Frankie's handwriting on background", "frankie", "background", AA_LARGE_OR_UI],
  ["Frankie's handwriting on quote card", "frankie", "frankieSoft", AA_LARGE_OR_UI],
  ["success marks on surface", "success", "surface", AA_LARGE_OR_UI],
  ["primary marks on surface", "brand", "surface", AA_LARGE_OR_UI]
];

describe("contrastRatio", () => {
  it("matches the WCAG reference extremes", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("rejects non-hex input", () => {
    expect(() => relativeLuminance("rgb(0,0,0)")).toThrow();
  });
});

describe.each(Object.values(themes))("$name theme", (theme) => {
  it.each(textPairs)("%s meets contrast", (_label, fg, bg, min) => {
    expect(contrastRatio(theme.colors[fg], theme.colors[bg])).toBeGreaterThanOrEqual(min);
  });

  it.each(PILLARS)("%s pillar color is visible on surfaces", (pillar) => {
    expect(contrastRatio(pillarColor(theme.colors, pillar), theme.colors.surface)).toBeGreaterThanOrEqual(
      AA_LARGE_OR_UI
    );
  });
});
