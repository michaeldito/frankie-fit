"use client";

import { FRANKIE_ACTIONS } from "@frankie-fit/companion-core";
import { FrankieSticker } from "@/components/frankie/frankie-sticker";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";
import type { BiscuitAward } from "@/lib/frankie-day";

export function BiscuitAwardChip({ award, isLatest }: { award: BiscuitAward; isLatest: boolean }) {
  const { day, redeem, redeeming } = useFrankieDay();
  const need = day?.mostPressingNeed;
  const canSpendNow = isLatest && need && day.canAfford[need];

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <span className="ff-pop inline-flex items-center gap-1.5 rounded-full border border-frankie/30 bg-frankie-soft px-2.5 py-1 text-xs font-semibold text-foreground">
        <FrankieSticker name="biscuit" size={16} />+{award.earned} {award.earned === 1 ? "biscuit" : "biscuits"}
        {award.fullBowl ? " · Full bowl bonus!" : ""}
      </span>
      {canSpendNow ? (
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground transition hover:-translate-y-px disabled:opacity-60"
          disabled={redeeming !== null}
          onClick={() => void redeem(need)}
          type="button"
        >
          Frankie&apos;s staring at the jar 👀 → {FRANKIE_ACTIONS[need].label}
        </button>
      ) : null}
    </div>
  );
}
