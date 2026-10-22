"use client";

import { FrankieAvatar } from "@/components/frankie/frankie-avatar";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";
import { BiscuitJar, NeedsStrip } from "@/components/frankie-day/needs";

export function FrankieDayBar() {
  const { day, reaction, openSheet } = useFrankieDay();

  if (!day) return null;

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 sm:px-5">
      <button
        aria-label="Open Frankie's Day"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
        onClick={openSheet}
        type="button"
      >
        <FrankieAvatar mood={reaction?.mood ?? day.mood} size={34} />
        <span className="truncate font-frankie text-lg leading-tight text-frankie">{reaction?.line ?? day.line}</span>
      </button>
      <div className="hidden sm:block">
        <NeedsStrip size="sm" tooltipAlign="end" />
      </div>
      <BiscuitJar tooltipAlign="end" />
    </div>
  );
}
