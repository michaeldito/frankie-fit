export type SidebarPreference = { width: number; collapsed: boolean };

export const SIDEBAR_STORAGE_KEY = "ff-sidebar";
export const SIDEBAR_DEFAULT_WIDTH = 240;
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 360;
// Dragging the edge narrower than this snaps the sidebar to its icon rail.
export const SIDEBAR_COLLAPSE_SNAP = 120;

const DEFAULT_PREFERENCE: SidebarPreference = { width: SIDEBAR_DEFAULT_WIDTH, collapsed: false };

export function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH;
  return Math.round(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width)));
}

export function parseSidebarPreference(raw: unknown): SidebarPreference {
  if (typeof raw !== "string") return DEFAULT_PREFERENCE;
  try {
    const value = JSON.parse(raw) as Partial<SidebarPreference> | null;
    return {
      width: clampSidebarWidth(Number(value?.width)),
      collapsed: value?.collapsed === true
    };
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

/** Where a drag of the sidebar's edge should land: snap to the rail when dragged very narrow. */
export function preferenceForDrag(width: number, previous: SidebarPreference): SidebarPreference {
  return width < SIDEBAR_COLLAPSE_SNAP
    ? { width: previous.width, collapsed: true }
    : { width: clampSidebarWidth(width), collapsed: false };
}

// Runs inline in <head> before first paint so a resized or collapsed sidebar never flashes.
export const SIDEBAR_PREFERENCE_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")||"null");if(!p)return;var w=Number(p.width);if(isFinite(w)){w=Math.min(${SIDEBAR_MAX_WIDTH},Math.max(${SIDEBAR_MIN_WIDTH},Math.round(w)));document.documentElement.style.setProperty("--sidebar-width",w+"px");}if(p.collapsed===true){document.documentElement.setAttribute("data-sidebar","collapsed");}}catch(e){}})();`;

export function readSidebarPreference(): SidebarPreference {
  try {
    return parseSidebarPreference(window.localStorage.getItem(SIDEBAR_STORAGE_KEY));
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

/** Applies the width/collapsed state to <html> immediately; persists it unless `persist` is false (mid-drag). */
export function applySidebarPreference(preference: SidebarPreference, persist = true) {
  const root = document.documentElement;
  root.style.setProperty("--sidebar-width", `${clampSidebarWidth(preference.width)}px`);

  if (preference.collapsed) {
    root.setAttribute("data-sidebar", "collapsed");
  } else {
    root.removeAttribute("data-sidebar");
  }

  if (!persist) return;

  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // The change still applies for this page view.
  }
}
