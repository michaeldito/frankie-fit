import type { Theme } from "./themes";

function toKebab(key: string): string {
  return key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function declarations(theme: Theme, indent: string): string {
  const entries = [
    ["color-scheme", theme.name],
    ...Object.entries(theme.colors).map(([key, value]) => [`--${toKebab(key)}`, value]),
    ...Object.entries(theme.shadows).map(([key, value]) => [`--${toKebab(key)}`, value])
  ];
  return entries.map(([prop, value]) => `${indent}${prop}: ${value};`).join("\n");
}

// Light is the default; dark applies when the OS prefers it (unless the page opts into light),
// or anywhere an element sets data-theme="dark" (e.g. the always-Midnight sidebar).
export function toCssVariables(themes: { light: Theme; dark: Theme }): string {
  return [
    "/* Generated from packages/brand-core/themes.ts by css.test.ts — do not edit by hand.",
    "   Regenerate with: pnpm vitest run -u packages/brand-core */",
    "",
    ':root,\n[data-theme="light"] {',
    declarations(themes.light, "  "),
    "}",
    "",
    "@media (prefers-color-scheme: dark) {",
    '  :root:not([data-theme="light"]) {',
    declarations(themes.dark, "    "),
    "  }",
    "}",
    "",
    '[data-theme="dark"] {',
    declarations(themes.dark, "  "),
    "}",
    ""
  ].join("\n");
}
