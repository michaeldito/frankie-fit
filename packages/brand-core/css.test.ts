import { describe, expect, it } from "vitest";
import { toCssVariables } from "./css";
import { themes } from "./themes";

describe("toCssVariables", () => {
  const css = toCssVariables(themes);

  it("emits kebab-case variables for every color and shadow token", () => {
    expect(css).toContain("--surface-strong: #F3EEE3;");
    expect(css).toContain("--pillar-diet: #B7791F;");
    expect(css).toContain("--shadow-card:");
  });

  it("scopes dark tokens to the OS preference and to explicit data-theme opt-ins", () => {
    expect(css).toContain('@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {');
    expect(css.indexOf('[data-theme="dark"] {')).toBeGreaterThan(css.indexOf("@media"));
  });

  it("matches the web app's committed brand-tokens.css", async () => {
    await expect(css).toMatchFileSnapshot("../../apps/web/app/brand-tokens.css");
  });
});
