import { isLateNight, type FrankieMood } from "@frankie-fit/brand-core";
import { FRANKIE_ACTIONS, FRANKIE_NEEDS, type FrankieNeed } from "./rules";
import { WHINE_LINES, type WhineTier } from "./whines";

export type NeedState = "wanting" | "filled";

export type FrankieDay = {
  balance: number;
  needs: Record<FrankieNeed, NeedState>;
  canAfford: Record<FrankieNeed, boolean>;
  goodBoyDay: boolean;
  mostPressingNeed: FrankieNeed | null;
  mood: FrankieMood;
  line: string;
  careStreak: number;
};

export type FrankieDayInput = {
  balance: number;
  needsFilledToday: readonly FrankieNeed[];
  hourPacific: number;
  careStreak?: number;
};

// Which need Frankie cares about most at this hour; unmet needs are checked in this order.
export function needPriorityFor(hourPacific: number): FrankieNeed[] {
  if (hourPacific >= 5 && hourPacific < 14) return ["feed", "walk", "play", "snuggle"];
  if (hourPacific >= 14 && hourPacific < 18) return ["walk", "play", "feed", "snuggle"];
  return ["snuggle", "feed", "play", "walk"];
}

export function whineTierFor(hourPacific: number): WhineTier {
  if (hourPacific < 12) return "polite";
  if (hourPacific < 17) return "hopeful";
  return "dramatic";
}

export const GOOD_BOY_LINE = "Best day ever. I'm a very good boy and so are you.";

export function computeFrankieDay(input: FrankieDayInput): FrankieDay {
  const filled = new Set(input.needsFilledToday);
  const needs = Object.fromEntries(
    FRANKIE_NEEDS.map((need) => [need, filled.has(need) ? "filled" : "wanting"])
  ) as Record<FrankieNeed, NeedState>;
  const canAfford = Object.fromEntries(
    FRANKIE_NEEDS.map((need) => [need, !filled.has(need) && input.balance >= FRANKIE_ACTIONS[need].cost])
  ) as Record<FrankieNeed, boolean>;
  const goodBoyDay = FRANKIE_NEEDS.every((need) => filled.has(need));
  const mostPressingNeed = goodBoyDay
    ? null
    : (needPriorityFor(input.hourPacific).find((need) => !filled.has(need)) ?? null);

  let mood: FrankieMood;
  let line: string;

  if (mostPressingNeed) {
    mood = FRANKIE_ACTIONS[mostPressingNeed].moodBefore;
    line =
      input.balance > 0
        ? WHINE_LINES[mostPressingNeed][whineTierFor(input.hourPacific)]
        : WHINE_LINES[mostPressingNeed].polite;
  } else {
    mood = isLateNight(input.hourPacific) ? "snuggle" : "happy";
    line = GOOD_BOY_LINE;
  }

  return {
    balance: input.balance,
    needs,
    canAfford,
    goodBoyDay,
    mostPressingNeed,
    mood,
    line,
    careStreak: input.careStreak ?? 0
  };
}
