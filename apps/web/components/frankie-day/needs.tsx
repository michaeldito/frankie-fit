"use client";

import { Check } from "lucide-react";
import { FRANKIE_ACTIONS, FRANKIE_NEEDS, type FrankieNeed } from "@frankie-fit/companion-core";
import { FrankieSticker } from "@/components/frankie/frankie-sticker";
import type { FrankieSticker as StickerName } from "@/components/frankie/frankie-art";
import { HoverLabel, type HoverLabelAlign } from "@/components/app-shell/hover-label";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";

export const NEED_STICKERS: Record<FrankieNeed, StickerName> = {
  feed: "bowl",
  walk: "paw",
  play: "ball",
  snuggle: "zzz"
};

export type TooltipAlign = HoverLabelAlign;

export function BiscuitJar({
  className = "",
  compact = false,
  tooltipAlign = "center",
  tooltipClassName = ""
}: {
  className?: string;
  compact?: boolean;
  tooltipAlign?: TooltipAlign;
  tooltipClassName?: string;
}) {
  const { day, openSheet } = useFrankieDay();

  if (!day) return null;

  // The outer span takes the caller's positioning (absolute etc.); the button stays `relative` to
  // anchor its hover label, so the two never fight over `position`.
  return (
    <span className={`inline-flex ${className}`}>
      <button
        aria-label={`${day.balance} biscuits in the jar. Open Frankie's Day.`}
        className={`group relative inline-flex cursor-pointer items-center rounded-full border border-frankie/30 bg-frankie-soft font-semibold text-foreground transition hover:-translate-y-px ${
          compact ? "gap-1 px-2 py-0.5 text-xs" : "gap-1.5 px-2.5 py-1 text-sm"
        }`}
        onClick={openSheet}
        type="button"
      >
        <FrankieSticker name="biscuit" size={compact ? 14 : 18} />
        <span className="ff-pop tabular-nums" key={day.balance}>
          {day.balance}
        </span>
        <HoverLabel
          align={tooltipAlign}
          className={tooltipClassName}
          text={`${day.balance} ${day.balance === 1 ? "biscuit" : "biscuits"} in the jar · open Frankie's Day`}
        />
      </button>
    </span>
  );
}

// Tapping a need Frankie wants (and the user can afford) redeems it on the spot; anything else
// opens the sheet so the user can see why.
export function NeedsStrip({
  size = "md",
  tooltipAlign = "center"
}: {
  size?: "xs" | "sm" | "md";
  tooltipAlign?: TooltipAlign;
}) {
  const { day, redeem, redeeming, openSheet } = useFrankieDay();

  if (!day) return null;

  const box = size === "xs" ? "h-6 w-6 rounded-md" : size === "sm" ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-xl";
  const icon = size === "xs" ? 12 : size === "sm" ? 16 : 20;

  return (
    <div className={`flex items-center ${size === "xs" ? "gap-1" : "gap-1.5"}`}>
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
            className={`group relative flex ${box} cursor-pointer items-center justify-center border transition ${
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
              <FrankieSticker name={NEED_STICKERS[need]} size={icon} />
            </span>
            {filled ? (
              <span
                className={`absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-success text-background ${
                  size === "xs" ? "h-3 w-3" : "h-4 w-4"
                }`}
              >
                <Check aria-hidden className={size === "xs" ? "h-2 w-2" : "h-3 w-3"} strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
