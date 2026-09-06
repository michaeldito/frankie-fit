import type { EvalPillar } from "@/lib/admin-evals";
import type {
  ActivityTimePrecision,
  ParsedActivity,
  ParsedDietEntry,
  ParsedWellnessCheckin
} from "@/lib/chat";

export type ExpectedActivity = Partial<
  Pick<
    ParsedActivity,
    | "activityType"
    | "activityCategory"
    | "durationMinutes"
    | "intensity"
    | "loggedForDate"
    | "timePrecision"
    | "description"
    | "missingFields"
    | "ambiguityFlags"
  >
> & {
  timePrecision?: ActivityTimePrecision;
};

export type ExpectedDietEntry = Partial<
  Pick<ParsedDietEntry, "description" | "mealType" | "loggedForDate">
>;

export type ExpectedWellnessCheckin = Partial<
  Pick<
    ParsedWellnessCheckin,
    | "energyScore"
    | "sorenessScore"
    | "moodScore"
    | "stressScore"
    | "motivationScore"
    | "loggedForDate"
  >
>;

export type ExpectedRawModelShape = {
  activitiesCount?: number;
  dietEntriesCount?: number;
  wellnessPresent?: boolean;
};

export type IntelligenceEvalExpected = {
  activities: ExpectedActivity[];
  dietEntries: ExpectedDietEntry[];
  persistPlan: {
    activities: boolean;
    dietEntries: boolean;
    wellnessCheckin: boolean;
  };
  rawModel?: ExpectedRawModelShape;
  shouldPersistStructuredData: boolean;
  wellnessCheckin: ExpectedWellnessCheckin | null;
};

export type IntelligenceEvalCase = {
  dayLabel: string;
  expected: IntelligenceEvalExpected;
  id: string;
  message: string;
  pillar: EvalPillar;
  // Optional prior turns to send first, in order, before `message`. Each turn's
  // pendingClarification (if any) carries forward into the next, the same way the real chat
  // API routes thread it — for testing that answering a clarification actually completes a log
  // instead of re-asking. `expected` is only asserted against the final `message`'s result.
  precedingMessages?: string[];
};
