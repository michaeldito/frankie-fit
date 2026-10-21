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

// Styled hover/focus label; the native title tooltip is slow and unstyled.
export type TooltipAlign = "start" | "center" | "end";

const ALIGN_CLASSES: Record<TooltipAlign, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0"
};

function HoverLabel({ text, align }: { text: string; align: TooltipAlign }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-full ${ALIGN_CLASSES[align]} z-30 mb-2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100`}
      role="tooltip"
    >
      {text}
    </span>
  );
}

export function BiscuitJar({ className = "", tooltipAlign = "center" }: { className?: string; tooltipAlign?: TooltipAlign }) {
  const { day, openSheet } = useFrankieDay();

  if (!day) return null;

  return (
    <button
      aria-label={`${day.balance} biscuits in the jar. Open Frankie's Day.`}
      className={`group relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-frankie/30 bg-frankie-soft px-2.5 py-1 text-sm font-semibold text-foreground transition hover:-translate-y-px ${className}`}
      onClick={openSheet}
      type="button"
    >
      <FrankieSticker name="biscuit" size={18} />
      <span className="ff-pop tabular-nums" key={day.balance}>
        {day.balance}
      </span>
      <HoverLabel align={tooltipAlign} text={`${day.balance} ${day.balance === 1 ? "biscuit" : "biscuits"} in the jar · open Frankie's Day`} />
    </button>
  );
}

// Tapping a need Frankie wants (and the user can afford) redeems it on the spot; anything else
// opens the sheet so the user can see why.
export function NeedsStrip({ size = "md", tooltipAlign = "center" }: { size?: "sm" | "md"; tooltipAlign?: TooltipAlign }) {
  const { day, redeem, redeeming, openSheet } = useFrankieDay();

  if (!day) return null;

  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className="flex items-center gap-1.5">
      {FRANKIE_NEEDS.map((need) => {
        const filled = day.needs[need] === "filled";
        const ready = day.canAfford[need];
        const label = filled
          ? `${FRANKIE_ACTIONS[need].needLabel} today ✓`
          : ready
            ? `${FRANKIE_ACTIONS[need].label} · ${FRANKIE_ACTIONS[need].cost} 🦴`
            : `${FRANKIE_ACTIONS[need].label} · log something to earn a biscuit`;

        return (
          <button
            aria-label={label}
            className={`group relative flex ${box} cursor-pointer items-center justify-center rounded-xl border transition ${
              filled
                ? "border-success/40 bg-success/10"
                : ready
                  ? "border-frankie bg-frankie-soft hover:-translate-y-px"
                  : "border-border bg-surface-strong"
            } ${redeeming === need ? "opacity-50" : ""}`}
            disabled={redeeming !== null}
            key={need}
            onClick={() => (ready ? void redeem(need) : openSheet())}
            type="button"
          >
            <HoverLabel align={tooltipAlign} text={label} />
            <span className={!filled && !ready ? "opacity-50 grayscale" : ready ? "animate-pulse group-hover:animate-none" : ""}>
              <FrankieSticker name={NEED_STICKERS[need]} size={size === "sm" ? 16 : 20} />
            </span>
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
