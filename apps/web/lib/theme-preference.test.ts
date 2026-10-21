import { describe, expect, it } from "vitest";
import { THEME_PREFERENCE_SCRIPT, THEME_STORAGE_KEY, parseThemePreference } from "./theme-preference";

describe("parseThemePreference", () => {
  it.each([
    ["light", "light"],
    ["dark", "dark"],
    ["system", "system"],
    [null, "system"],
    ["sepia", "system"]
  ])("%s → %s", (input, expected) => {
    expect(parseThemePreference(input)).toBe(expected);
  });
});

describe("THEME_PREFERENCE_SCRIPT", () => {
  it("only applies explicit light/dark choices from storage", () => {
    const root = { attrs: {} as Record<string, string>, setAttribute(k: string, v: string) { this.attrs[k] = v; } };
    const run = (stored: string | null) => {
      root.attrs = {};
      new Function("localStorage", "document", THEME_PREFERENCE_SCRIPT)(
        { getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null) },
        { documentElement: root }
      );
      return root.attrs["data-theme"];
    };

    expect(run("dark")).toBe("dark");
    expect(run("light")).toBe("light");
    expect(run(null)).toBeUndefined();
    expect(run("<script>")).toBeUndefined();
  });
});
