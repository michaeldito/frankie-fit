"use client";

import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";
import { BiscuitJar, NeedsStrip } from "@/components/frankie-day/needs";

// Frankie's needs and biscuit jar, for tucking inside an existing Frankie card.
export function FrankieDayInline() {
  const { day } = useFrankieDay();

  if (!day) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <NeedsStrip />
      <BiscuitJar />
      <span className="text-xs text-muted">{day.line}</span>
    </div>
  );
}
