"use client";

import { Flame, X } from "lucide-react";
import { useState } from "react";
import { FRANKIE_ACTIONS, FRANKIE_NEEDS, type FrankieNeed } from "@frankie-fit/companion-core";
import { FrankieAvatar } from "@/components/frankie/frankie-avatar";
import { FrankieSticker } from "@/components/frankie/frankie-sticker";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";
import { BiscuitJar, NEED_STICKERS } from "@/components/frankie-day/needs";

const REDEEM_ERRORS = {
  already_filled: "Already done today. He's very content.",
  not_enough_biscuits: "The jar's empty. Tell Frankie what you did today to earn a biscuit.",
  unknown_action: "Frankie didn't understand that one.",
  network: "Couldn't reach Frankie. Try again?"
} as const;

function StickerBurst({ need }: { need: FrankieNeed | null }) {
  const sticker = need ? NEED_STICKERS[need] : "heart";
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          className="ff-burst absolute left-1/2 top-1/2"
          key={index}
          style={{ ["--ff-burst-x" as string]: `${(index - 2) * 34}px`, animationDelay: `${index * 60}ms` }}
        >
          <FrankieSticker name={index % 2 === 0 ? sticker : "heart"} size={22} />
        </span>
      ))}
    </span>
  );
}

export function FrankieDaySheet() {
  const { day, sheetOpen, closeSheet, reaction, redeem, redeeming, bellyRub } = useFrankieDay();
  const [error, setError] = useState<string | null>(null);

  if (!sheetOpen || !day) return null;

  const mood = reaction?.mood ?? day.mood;
  const line = reaction?.line ?? day.line;

  async function handleRedeem(need: FrankieNeed) {
    setError(null);
    const failure = await redeem(need);
    if (failure) setError(REDEEM_ERRORS[failure]);
  }

  return (
    <div
      aria-labelledby="frankie-day-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={closeSheet}
      role="dialog"
    >
      <div
        className="ff-panel-strong ff-scroll max-h-[92vh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-b-[0.9rem] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-frankie text-3xl leading-none" id="frankie-day-title">
            Frankie&apos;s Day
          </h2>
          <div className="flex items-center gap-2">
            <BiscuitJar />
            <button
              aria-label="Close"
              className="ff-button-secondary h-9 w-9 cursor-pointer p-0"
              onClick={closeSheet}
              type="button"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center text-center">
          <button
            aria-label="Give Frankie a belly rub"
            className={`relative cursor-pointer rounded-full ${reaction && !reaction.need ? "ff-wiggle" : ""}`}
            key={reaction?.at ?? "idle"}
            onClick={bellyRub}
            type="button"
          >
            <FrankieAvatar mood={mood} size={132} />
            {reaction ? <StickerBurst need={reaction.need} /> : null}
          </button>
          <p aria-live="polite" className="mt-3 min-h-[2.5rem] max-w-xs font-frankie text-2xl leading-tight text-frankie">
            {line}
          </p>
          {day.goodBoyDay ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-celebrate px-3 py-1 text-sm font-semibold text-celebrate-foreground">
              <FrankieSticker name="crown" size={16} /> Good Boy Day!
            </p>
          ) : null}
          {day.careStreak > 1 ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted">
              <Flame aria-hidden className="h-3.5 w-3.5 text-frankie" /> {day.careStreak}-day care streak
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {FRANKIE_NEEDS.map((need) => {
            const action = FRANKIE_ACTIONS[need];
            const filled = day.needs[need] === "filled";
            const affordable = day.canAfford[need];

            return (
              <button
                className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${
                  filled
                    ? "border-success/40 bg-success/10"
                    : affordable
                      ? "border-frankie/50 bg-frankie-soft hover:-translate-y-px"
                      : "border-border bg-surface-strong opacity-70"
                }`}
                disabled={filled || redeeming !== null}
                key={need}
                onClick={() => void handleRedeem(need)}
                type="button"
              >
                <FrankieSticker name={NEED_STICKERS[need]} size={24} />
                <span className="text-sm font-semibold leading-5">{action.label}</span>
                <span className="text-xs text-muted">
                  {filled ? `${action.needLabel} today ✓` : `${action.cost} 🦴`}
                </span>
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-5 rounded-xl bg-surface-strong p-3 text-xs leading-5 text-muted">
          <p className="font-frankie text-base text-frankie">
            &ldquo;Every time you tell me what you did, I earn a biscuit. You spend them on me. Obviously.&rdquo;
          </p>
          <p className="mt-1.5">
            +1 🦴 for the first log in each area today (exercise, food, wellness, lifestyle), +1 bonus when
            you log all four. Tap Frankie for a free belly rub.
          </p>
        </div>
      </div>
    </div>
  );
}
