import { getPacificDateKey } from "@/packages/dashboard-core";
import type { IntelligenceEvalCase, IntelligenceEvalExpected } from "@/lib/evals/intelligence/types";

// Computed at run time so this never goes stale — see messy-input-path.ts for the same fix.
const TODAY = getPacificDateKey();

function activityExpected(activities: IntelligenceEvalExpected["activities"]): IntelligenceEvalExpected {
  return {
    activities,
    dietEntries: [],
    persistPlan: {
      activities: true,
      dietEntries: false,
      wellnessCheckin: false
    },
    shouldPersistStructuredData: true,
    wellnessCheckin: null
  };
}

export const CLARIFICATION_FOLLOWTHROUGH_PATH_INTELLIGENCE_CASES: IntelligenceEvalCase[] = [
  {
    // "worked out" alone should ask what the activity was (verified separately). The real bug
    // this scenario targets: answering that question with just "running" should complete the
    // log, not trigger a second, different clarification question.
    dayLabel: "Follow-through",
    expected: activityExpected([
      {
        activityType: "running",
        loggedForDate: TODAY
      }
    ]),
    id: "clarification-worked-out-then-running",
    message: "running",
    pillar: "activity",
    precedingMessages: ["worked out"]
  }
  // A second case testing "still needs one more clarification round" (e.g. duration/intensity
  // given but activity name still never stated) was tried and dropped: when neither turn ever
  // names an activity at all, the model represents "still unresolved" inconsistently across
  // runs (empty activities array + question, vs. a lone activityType:"unknown" stub + question
  // — both correct, since a lone placeholder is deliberately left unfiltered, see
  // isPlaceholderActivity in extracted-user-update.ts). Not worth a flaky assertion; the case
  // above already covers the actual bug (a full-resolution follow-up not being understood).
];
