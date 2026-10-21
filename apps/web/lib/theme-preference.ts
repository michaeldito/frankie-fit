export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "ff-theme";

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

// Runs inline in <head> before first paint so an explicit light/dark choice never flashes.
// "system" leaves data-theme unset and lets prefers-color-scheme drive brand-tokens.css.
export const THEME_PREFERENCE_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

const listeners = new Set<() => void>();

// useSyncExternalStore subscription: fires for changes in this tab and in other tabs (via "storage").
export function subscribeThemePreference(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readThemePreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;

  if (preference === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", preference);
  }

  try {
    if (preference === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Private mode / blocked storage: the choice still applies for this page view.
  }

  listeners.forEach((listener) => listener());
}
