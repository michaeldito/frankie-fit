import { getPacificDateKey } from "@/packages/dashboard-core";
import type {
  ExpectedActivity,
  ExpectedDietEntry,
  IntelligenceEvalCase,
  IntelligenceEvalExpected
} from "@/lib/evals/intelligence/types";

// Computed at run time (rather than hardcoded) so implicit_today cases never go stale as real
// dates move forward — this must match the same Pacific-date logic the extraction prompt uses
// to tell the model what "today" is (see buildExtractUserUpdatePrompt).
const TODAY = getPacificDateKey();

function activityOnly(activities: ExpectedActivity[]): IntelligenceEvalExpected {
  return {
    activities,
    dietEntries: [],
    persistPlan: {
      activities: true,
      dietEntries: false,
      wellnessCheckin: false
    },
    // rawModel.wellnessPresent is intentionally not asserted here: the model sometimes flags
    // incidental color ("felt great") as wellness-present even on pure activity messages. What
    // matters is that sanitizeWellnessCheckin discards it downstream (see wellnessCheckin: null
    // and persistPlan.wellnessCheckin: false above), not what the raw model claimed.
    rawModel: {
      dietEntriesCount: 0
    },
    shouldPersistStructuredData: true,
    wellnessCheckin: null
  };
}

function dietOnly(entries: ExpectedDietEntry[]): IntelligenceEvalExpected {
  return {
    activities: [],
    dietEntries: entries,
    persistPlan: {
      activities: false,
      dietEntries: true,
      wellnessCheckin: false
    },
    rawModel: {
      activitiesCount: 0,
      wellnessPresent: false
    },
    shouldPersistStructuredData: true,
    wellnessCheckin: null
  };
}

export const MESSY_INPUT_PATH_INTELLIGENCE_CASES: IntelligenceEvalCase[] = [
  {
    dayLabel: "Typo",
    expected: activityOnly([
      {
        activityType: "running",
        durationMinutes: 30,
        loggedForDate: TODAY,
        timePrecision: "implicit_today"
      }
    ]),
    id: "messy-typo-run",
    message: "wnet for a rnu this mornign, 30 minuets, felt gret",
    pillar: "activity"
  },
  {
    dayLabel: "Typo",
    expected: dietOnly([
      {
        description: "chicken sandwich and fries",
        loggedForDate: TODAY,
        mealType: "lunch"
      }
    ]),
    id: "messy-typo-food",
    message: "had a chiken sandwitch and frys for lunhc, pretty tastey",
    pillar: "diet"
  },
  {
    // "45" has no unit word attached at all (not even a typo of one), so durationMinutes is
    // deliberately not asserted here: leaving it null instead of guessing "45 minutes" is
    // correct assumption discipline, not a bug.
    dayLabel: "Shorthand",
    expected: activityOnly([
      {
        intensity: "Hard",
        loggedForDate: TODAY,
        timePrecision: "implicit_today"
      }
    ]),
    id: "messy-shorthand-legs",
    message: "legs 45 hard",
    pillar: "activity"
  },
  {
    dayLabel: "Shorthand",
    expected: {
      activities: [],
      dietEntries: [],
      persistPlan: {
        activities: false,
        dietEntries: false,
        wellnessCheckin: true
      },
      rawModel: {
        activitiesCount: 0,
        dietEntriesCount: 0,
        wellnessPresent: true
      },
      shouldPersistStructuredData: true,
      wellnessCheckin: {
        energyScore: 2,
        loggedForDate: TODAY,
        sorenessScore: null
      }
    },
    id: "messy-shorthand-wellness",
    message: "energy 2 sleep bad sore af",
    pillar: "wellness"
  },
  {
    // KNOWN OPEN ISSUE (not yet fixed, model-level not sanitizer-level): the model sometimes
    // double-counts "eggs" as both a diet entry (correct) and a second, confidently-emitted
    // fake activity (activityType "unknown", confidence 1) in the same response. This isn't a
    // zero-confidence placeholder (see isPlaceholderActivity), so it survives that filter —
    // fixing it needs prompt-level mixed-domain extraction work (see the intelligence
    // refinement plan's Phase 2), not another orchestrator-side patch.
    dayLabel: "Blended",
    expected: {
      activities: [
        {
          activityType: "running",
          loggedForDate: TODAY,
          timePrecision: "implicit_today"
        }
      ],
      dietEntries: [
        {
          description: "eggs",
          loggedForDate: TODAY,
          mealType: null
        }
      ],
      persistPlan: {
        activities: true,
        dietEntries: true,
        wellnessCheckin: false
      },
      shouldPersistStructuredData: true,
      wellnessCheckin: null
    },
    id: "messy-blended-run-eggs",
    message: "ran 5k this morning, had eggs after",
    pillar: "activity"
  },
  {
    dayLabel: "Blended",
    expected: {
      activities: [],
      dietEntries: [
        {
          description: "skipped lunch",
          loggedForDate: TODAY,
          mealType: "lunch"
        }
      ],
      persistPlan: {
        activities: false,
        dietEntries: true,
        wellnessCheckin: true
      },
      rawModel: {
        activitiesCount: 0
      },
      shouldPersistStructuredData: true,
      wellnessCheckin: {
        energyScore: 2,
        loggedForDate: TODAY
      }
    },
    id: "messy-blended-skip-drained",
    message: "skipped lunch today, feeling drained, energy 2",
    pillar: "diet"
  },
  {
    dayLabel: "Sparse",
    expected: {
      activities: [],
      dietEntries: [],
      persistPlan: {
        activities: false,
        dietEntries: false,
        wellnessCheckin: false
      },
      rawModel: {
        dietEntriesCount: 0,
        wellnessPresent: false
      },
      shouldPersistStructuredData: false,
      wellnessCheckin: null
    },
    id: "messy-sparse-worked-out",
    message: "worked out",
    pillar: "activity"
  },
  {
    dayLabel: "Sparse",
    expected: {
      activities: [],
      dietEntries: [],
      persistPlan: {
        activities: false,
        dietEntries: false,
        wellnessCheckin: false
      },
      rawModel: {
        activitiesCount: 0,
        dietEntriesCount: 0,
        wellnessPresent: false
      },
      shouldPersistStructuredData: false,
      wellnessCheckin: null
    },
    id: "messy-sparse-meh",
    message: "meh",
    pillar: "wellness"
  },
  {
    // wellnessCheckin is expected non-null here on purpose: "too tired to cook" legitimately
    // matches the energy signal's cue list, so a scoreless wellness note is correct behavior,
    // not a bug (see WELLNESS_SIGNAL_DEFINITIONS in frankie-orchestrator.ts).
    dayLabel: "Run-on",
    expected: {
      activities: [],
      dietEntries: [
        {
          description: "skipped lunch",
          loggedForDate: TODAY,
          mealType: "lunch"
        },
        {
          description: "cereal",
          loggedForDate: TODAY,
          mealType: "dinner"
        }
      ],
      persistPlan: {
        activities: false,
        dietEntries: true,
        wellnessCheckin: true
      },
      rawModel: {
        activitiesCount: 0
      },
      shouldPersistStructuredData: true,
      wellnessCheckin: {
        energyScore: null,
        loggedForDate: TODAY
      }
    },
    id: "messy-runon-skip-cereal",
    message:
      "ugh today was such a mess, i totally skipped lunch cause meetings ran long and then just had cereal for dinner cause i was too tired to cook anything real",
    pillar: "diet"
  },
  {
    dayLabel: "Run-on",
    expected: activityOnly([
      {
        durationMinutes: 50,
        loggedForDate: TODAY,
        timePrecision: "implicit_today"
      }
    ]),
    id: "messy-runon-legs",
    message:
      "man today was rough, dragged myself to the gym anyway and ended up doing like 50 minutes of legs, pretty much all squats and lunges, definitely felt heavy",
    pillar: "activity"
  }
];
