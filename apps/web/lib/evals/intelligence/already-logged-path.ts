import { getPacificDateKey } from "@frankie-fit/dashboard-core";
import type { IntelligenceEvalCase } from "@/lib/evals/intelligence/types";

// Computed at run time so implicit_today cases never go stale (see messy-input-path.ts).
const TODAY = getPacificDateKey();

const MORNING_LIFT = [
  {
    pillar: "activity" as const,
    loggedForDate: TODAY,
    summary: "weight lifting (benched with some tri and bi work, Hard)"
  }
];

const MORNING_RUN = [{ pillar: "activity" as const, loggedForDate: TODAY, summary: "running (30 min)" }];

export const ALREADY_LOGGED_PATH_INTELLIGENCE_CASES: IntelligenceEvalCase[] = [
  {
    // The real bug: a reference back to an earlier lift, used as the reason for a meal, was
    // logged as a second strength session. Only the dinner is new.
    alreadyLogged: MORNING_LIFT,
    dayLabel: "Reference",
    expected: {
      activities: [],
      dietEntries: [{ mealType: "dinner", loggedForDate: TODAY }],
      persistPlan: { activities: false, dietEntries: true, wellnessCheckin: false },
      shouldPersistStructuredData: true,
      wellnessCheckin: null
    },
    id: "already-logged-lift-referenced-at-dinner",
    message: "For dinner, I ate some steak and potatoes cuz I lifted hella hard earlier remember",
    pillar: "diet"
  },
  {
    alreadyLogged: MORNING_RUN,
    dayLabel: "Reference",
    expected: {
      activities: [],
      dietEntries: [{ mealType: "lunch", loggedForDate: TODAY }],
      persistPlan: { activities: false, dietEntries: true, wellnessCheckin: false },
      shouldPersistStructuredData: true,
      wellnessCheckin: null
    },
    id: "already-logged-like-i-said-run",
    message: "like I said, I ran this morning, then had a turkey sandwich for lunch",
    pillar: "diet"
  },
  {
    // The guard rail: a genuinely new second session must still be logged.
    alreadyLogged: MORNING_LIFT,
    dayLabel: "New session",
    expected: {
      activities: [{ activityCategory: "strength", intensity: "Hard", loggedForDate: TODAY }],
      dietEntries: [],
      persistPlan: { activities: true, dietEntries: false, wellnessCheckin: false },
      shouldPersistStructuredData: true,
      wellnessCheckin: null
    },
    id: "already-logged-lifted-again-tonight",
    message: "lifted again tonight, legs this time, went hard",
    pillar: "activity"
  }
];
