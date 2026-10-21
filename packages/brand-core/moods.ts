import type { Pillar } from "./themes";

export const FRANKIE_MOODS = [
  "happy",
  "focused",
  "stretching",
  "waiting",
  "hungry",
  "running",
  "bikeRide",
  "snuggle"
] as const;

export type FrankieMood = (typeof FRANKIE_MOODS)[number];

export const FRANKIE_MOOD_LABELS: Record<FrankieMood, string> = {
  happy: "Happy",
  focused: "Focused",
  stretching: "Stretching",
  waiting: "Waiting (so polite)",
  hungry: "Hungry",
  running: "Running (zoomies)",
  bikeRide: "Bike ride",
  snuggle: "Snuggle"
};

export type FrankieMoodInput = {
  isThinking?: boolean;
  messageType?: string | null;
  loggedPillars?: readonly Pillar[];
  activityTypes?: readonly string[];
  hourPacific?: number;
};

const BIKE_PATTERN = /\b(bike|biking|cycl|spin|peloton)/i;
const STRETCH_PATTERN = /\b(stretch|yoga|mobility|pilates|foam roll)/i;

export function isLateNight(hourPacific: number): boolean {
  return hourPacific >= 21 || hourPacific < 5;
}

// Frankie's expression is derived from what the user just did, not chosen by the LLM.
export function frankieMoodFor(input: FrankieMoodInput): FrankieMood {
  if (input.isThinking) {
    return "focused";
  }

  if (input.messageType === "clarification_request") {
    return "waiting";
  }

  if (input.messageType === "workout_draft") {
    return "focused";
  }

  const pillars = input.loggedPillars ?? [];

  if (input.messageType === "log_confirmation" && pillars.length > 0) {
    if (pillars.includes("exercise")) {
      const activities = input.activityTypes ?? [];
      if (activities.some((type) => BIKE_PATTERN.test(type))) {
        return "bikeRide";
      }
      if (activities.some((type) => STRETCH_PATTERN.test(type))) {
        return "stretching";
      }
      return "running";
    }
    if (pillars.includes("diet")) {
      return "hungry";
    }
    if (pillars.includes("wellness")) {
      return "snuggle";
    }
    return "happy";
  }

  if (input.hourPacific !== undefined && isLateNight(input.hourPacific)) {
    return "snuggle";
  }

  return "happy";
}
