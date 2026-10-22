import { describe, expect, it } from "vitest";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_PREFERENCE_SCRIPT,
  SIDEBAR_STORAGE_KEY,
  clampSidebarWidth,
  parseSidebarPreference,
  preferenceForDrag
} from "./sidebar-preference";

describe("clampSidebarWidth", () => {
  it.each([
    [150, 200],
    [275.4, 275],
    [999, 360],
    [Number.NaN, SIDEBAR_DEFAULT_WIDTH]
  ])("%s → %s", (input, expected) => {
    expect(clampSidebarWidth(input)).toBe(expected);
  });
});

describe("parseSidebarPreference", () => {
  it("reads a stored width and collapsed flag", () => {
    expect(parseSidebarPreference(JSON.stringify({ width: 300, collapsed: true }))).toEqual({ width: 300, collapsed: true });
  });

  it("clamps out-of-range widths and ignores junk", () => {
    expect(parseSidebarPreference(JSON.stringify({ width: 5000 }))).toEqual({ width: 360, collapsed: false });
    expect(parseSidebarPreference("not json")).toEqual({ width: 240, collapsed: false });
    expect(parseSidebarPreference(null)).toEqual({ width: 240, collapsed: false });
    expect(parseSidebarPreference(JSON.stringify({ collapsed: "yes" }))).toEqual({ width: 240, collapsed: false });
  });
});

describe("preferenceForDrag", () => {
  const previous = { width: 280, collapsed: false };

  it("snaps to the rail when dragged very narrow, keeping the last width for expanding", () => {
    expect(preferenceForDrag(90, previous)).toEqual({ width: 280, collapsed: true });
  });

  it("clamps normal drags", () => {
    expect(preferenceForDrag(150, previous)).toEqual({ width: 200, collapsed: false });
    expect(preferenceForDrag(320, previous)).toEqual({ width: 320, collapsed: false });
  });
});

describe("SIDEBAR_PREFERENCE_SCRIPT", () => {
  function run(stored: string | null) {
    const style: Record<string, string> = {};
    const attrs: Record<string, string> = {};
    new Function("localStorage", "document", SIDEBAR_PREFERENCE_SCRIPT)(
      { getItem: (key: string) => (key === SIDEBAR_STORAGE_KEY ? stored : null) },
      {
        documentElement: {
          style: { setProperty: (name: string, value: string) => (style[name] = value) },
          setAttribute: (name: string, value: string) => (attrs[name] = value)
        }
      }
    );
    return { style, attrs };
  }

  it("restores width and collapsed state before paint", () => {
    expect(run(JSON.stringify({ width: 999, collapsed: true }))).toEqual({
      style: { "--sidebar-width": "360px" },
      attrs: { "data-sidebar": "collapsed" }
    });
  });

  it("does nothing without a stored preference or with bad JSON", () => {
    expect(run(null)).toEqual({ style: {}, attrs: {} });
    expect(run("{oops")).toEqual({ style: {}, attrs: {} });
  });
});
