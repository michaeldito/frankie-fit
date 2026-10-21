"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  applyThemePreference,
  readThemePreference,
  subscribeThemePreference,
  type ThemePreference
} from "@/lib/theme-preference";

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon }
];

export function ThemeToggle({ className = "" }: { className?: string }) {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribeThemePreference,
    readThemePreference,
    () => "system"
  );

  return (
    <div aria-label="Theme" className={`grid grid-cols-3 gap-1 rounded-xl bg-surface-strong p-1 ${className}`} role="radiogroup">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = preference === value;
        return (
          <button
            aria-checked={selected}
            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
              selected ? "bg-surface text-foreground shadow-[var(--shadow-card)]" : "text-muted hover:text-foreground"
            }`}
            key={value}
            onClick={() => applyThemePreference(value)}
            role="radio"
            type="button"
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
