import { FRANKIE_ACTIONS, type FrankieNeed } from "./rules";
import { WHINE_LINES } from "./whines";
import { whineTierFor, type FrankieDay } from "./frankie-day";

export type NudgeLevel = "off" | "polite" | "whiny";

export const NUDGE_RULES = {
  maxPerDay: 2,
  quietBeforeHour: 8,
  quietFromHour: 21
} as const;

export type FrankieNudge = {
  need: FrankieNeed;
  title: string;
  body: string;
  actionUrl: string;
};

// Each need only nudges inside its own window, so Frankie asks about lunch at lunch.
const NUDGE_WINDOWS: Record<FrankieNeed, [startHour: number, endHour: number]> = {
  feed: [11, 20],
  walk: [14, 19],
  play: [15, 20],
  snuggle: [18, 21]
};

export function pickNudge(input: {
  day: FrankieDay;
  hourPacific: number;
  nudgesSentToday: number;
  needsNudgedToday?: readonly FrankieNeed[];
  level: NudgeLevel;
}): FrankieNudge | null {
  const { day, hourPacific, level } = input;

  if (level === "off" || day.goodBoyDay) return null;
  if (hourPacific < NUDGE_RULES.quietBeforeHour || hourPacific >= NUDGE_RULES.quietFromHour) return null;
  if (input.nudgesSentToday >= NUDGE_RULES.maxPerDay) return null;

  const alreadyNudged = new Set(input.needsNudgedToday ?? []);
  const need = (Object.keys(NUDGE_WINDOWS) as FrankieNeed[]).find((candidate) => {
    const [start, end] = NUDGE_WINDOWS[candidate];
    return day.needs[candidate] === "wanting" && !alreadyNudged.has(candidate) && hourPacific >= start && hourPacific < end;
  });

  if (!need) return null;

  const tier = level === "whiny" ? (input.nudgesSentToday > 0 ? "dramatic" : whineTierFor(hourPacific)) : "polite";
  const hasBiscuits = day.balance >= FRANKIE_ACTIONS[need].cost;

  return {
    need,
    title: hasBiscuits ? `Frankie's eyeing the biscuit jar 🦴` : "Frankie has a request 🐾",
    body: hasBiscuits
      ? `${WHINE_LINES[need][tier]} (You've got ${day.balance} 🦴 in the jar… just saying.)`
      : `${WHINE_LINES[need][tier]} Tell him what you've been up to and earn him a biscuit.`,
    actionUrl: hasBiscuits ? "/app/chat?frankie=open" : "/app/chat"
  };
}
