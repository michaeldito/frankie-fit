"use client";

import { FRANKIE_NEEDS } from "@frankie-fit/companion-core";
import { HoverLabel } from "@/components/app-shell/hover-label";
import { FrankieAvatar } from "@/components/frankie/frankie-avatar";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";
import { BiscuitJar, NeedsStrip } from "@/components/frankie-day/needs";

// Slim, always-visible Frankie status pinned to the bottom of the sidebar. Collapsed to the icon
// rail it stacks to just Frankie and his jar.
export function SidebarFrankieDock({ fallbackLine }: { fallbackLine: string }) {
  const { day, reaction, openSheet } = useFrankieDay();
  const mood = reaction?.mood ?? day?.mood ?? "happy";
  const filledCount = day ? FRANKIE_NEEDS.filter((need) => day.needs[need] === "filled").length : 0;
  const status = !day
    ? fallbackLine
    : day.goodBoyDay
      ? "Good Boy Day 👑"
      : `${filledCount} of ${FRANKIE_NEEDS.length} today`;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-2 sidebar-collapsed:flex-col sidebar-collapsed:gap-1.5 sidebar-collapsed:border-0 sidebar-collapsed:bg-transparent sidebar-collapsed:p-0">
      <button
        aria-label="Open Frankie's Day"
        className="group relative flex-none cursor-pointer rounded-full transition hover:-translate-y-px disabled:cursor-default"
        disabled={!day}
        onClick={openSheet}
        type="button"
      >
        <FrankieAvatar mood={mood} size={38} />
        <HoverLabel className="hidden sidebar-collapsed:block" side="right" text={day ? `Frankie's Day · ${status} · ${day.balance} 🦴` : fallbackLine} />
      </button>

      <div className="min-w-0 flex-1 sidebar-collapsed:hidden">
        {day ? (
          <>
            <NeedsStrip size="xs" tooltipAlign="start" />
            <p className="mt-1 truncate text-[0.7rem] text-muted">{status}</p>
          </>
        ) : (
          <p className="truncate font-frankie text-base leading-tight text-frankie">{status}</p>
        )}
      </div>

      <BiscuitJar compact tooltipClassName="sidebar-collapsed:hidden" />
    </div>
  );
}
