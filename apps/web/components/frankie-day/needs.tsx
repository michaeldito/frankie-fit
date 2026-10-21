"use client";

import { Check } from "lucide-react";
import { FRANKIE_ACTIONS, FRANKIE_NEEDS, type FrankieNeed } from "@frankie-fit/companion-core";
import { FrankieSticker } from "@/components/frankie/frankie-sticker";
import type { FrankieSticker as StickerName } from "@/components/frankie/frankie-art";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";

export const NEED_STICKERS: Record<FrankieNeed, StickerName> = {
  feed: "bowl",
  walk: "paw",
  play: "ball",
  snuggle: "zzz"
};

export function BiscuitJar({ className = "" }: { className?: string }) {
  const { day, openSheet } = useFrankieDay();

  if (!day) return null;

  return (
    <button
      aria-label={`${day.balance} biscuits in the jar. Open Frankie's Day.`}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-frankie/30 bg-frankie-soft px-2.5 py-1 text-sm font-semibold text-foreground transition hover:-translate-y-px ${className}`}
      onClick={openSheet}
      type="button"
    >
      <FrankieSticker name="biscuit" size={18} />
      <span className="ff-pop tabular-nums" key={day.balance}>
        {day.balance}
      </span>
    </button>
  );
}

// Tapping a need Frankie wants (and the user can afford) redeems it on the spot; anything else
// opens the sheet so the user can see why.
export function NeedsStrip({ size = "md" }: { size?: "sm" | "md" }) {
  const { day, redeem, redeeming, openSheet } = useFrankieDay();

  if (!day) return null;

  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className="flex items-center gap-1.5">
      {FRANKIE_NEEDS.map((need) => {
        const filled = day.needs[need] === "filled";
        const ready = day.canAfford[need];
        const label = filled
          ? `${FRANKIE_ACTIONS[need].needLabel} today`
          : ready
            ? `${FRANKIE_ACTIONS[need].label} (1 biscuit)`
            : `${FRANKIE_ACTIONS[need].label}: earn a biscuit first`;

        return (
          <button
            aria-label={label}
            className={`relative flex ${box} cursor-pointer items-center justify-center rounded-xl border transition ${
              filled
                ? "border-success/40 bg-success/10"
                : ready
                  ? "animate-pulse border-frankie bg-frankie-soft hover:animate-none hover:-translate-y-px"
                  : "border-border bg-surface-strong opacity-60 grayscale"
            } ${redeeming === need ? "opacity-50" : ""}`}
            disabled={redeeming !== null}
            key={need}
            onClick={() => (ready ? void redeem(need) : openSheet())}
            title={label}
            type="button"
          >
            <FrankieSticker name={NEED_STICKERS[need]} size={size === "sm" ? 16 : 20} />
            {filled ? (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-background">
                <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
