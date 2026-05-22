import type {
  ExpectedActivity,
  ExpectedDietEntry,
  IntelligenceEvalCase,
  IntelligenceEvalExpected
} from "@/lib/evals/intelligence/types";

function activityExpected(activities: ExpectedActivity[]): IntelligenceEvalExpected {
  return {
    activities,
    dietEntries: [],
    persistPlan: {
      activities: true,
      dietEntries: false,
      wellnessCheckin: false
    },
    rawModel: {
      dietEntriesCount: 0,
      wellnessPresent: false
    },
    shouldPersistStructuredData: true,
    wellnessCheckin: null
  };
}

function dietExpected(entries: ExpectedDietEntry[]): IntelligenceEvalExpected {
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

function wellnessExpected(
  date: string,
  scores: NonNullable<IntelligenceEvalExpected["wellnessCheckin"]>
): IntelligenceEvalExpected {
  return {
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
      loggedForDate: date,
      ...scores
    }
  };
}

export const DIFFICULT_MIXED_PATH_INTELLIGENCE_CASES: IntelligenceEvalCase[] = [
  {
    dayLabel: "Monday",
    expected: activityExpected([
      {
        activityCategory: "cardio",
        activityType: "running",
        durationMinutes: 20,
        intensity: "Light",
        loggedForDate: "2026-05-04",
        timePrecision: "explicit_day"
      },
      {
        activityCategory: "mind_body",
        activityType: "yoga",
        durationMinutes: 15,
        intensity: null,
        loggedForDate: "2026-05-04",
        timePrecision: "explicit_day"
      }
    ]),
    id: "difficult-mon-run-yoga",
    message: "Monday 2026-05-04 I ran 20 minutes light, then did yoga for 15 minutes.",
    pillar: "activity"
  },
  {
    dayLabel: "Monday",
    expected: dietExpected([
      {
        description: "coffee, protein bar, and pasta",
        loggedForDate: "2026-05-04",
        mealType: "dinner"
      }
    ]),
    id: "difficult-mon-food",
    message: "Monday 2026-05-04 I had coffee, a protein bar, and pasta for dinner.",
    pillar: "diet"
  },
  {
    dayLabel: "Monday",
    expected: wellnessExpected("2026-05-04", {
      energyScore: 3,
      motivationScore: null,
      stressScore: 4
    }),
    id: "difficult-mon-wellness",
    message: "Monday 2026-05-04 energy 3, stress 4, motivation okay.",
    pillar: "wellness"
  },
  {
    dayLabel: "Tuesday",
    expected: activityExpected([
      {
        activityType: "boxing",
        durationMinutes: 30,
        intensity: "Hard",
        loggedForDate: "2026-05-05",
        timePrecision: "explicit_day"
      }
    ]),
    id: "difficult-tue-boxing",
    message: "Tuesday 2026-05-05 I boxed for 30 minutes, hard intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Tuesday",
    expected: dietExpected([
      {
        description: "salad",
        loggedForDate: "2026-05-05",
        mealType: "lunch"
      },
      {
        description: "chips and soda",
        loggedForDate: "2026-05-05",
        mealType: null
      }
    ]),
    id: "difficult-tue-food",
    message: "Tuesday 2026-05-05 lunch was a salad, later I had chips and soda.",
    pillar: "diet"
  },
  {
    dayLabel: "Tuesday",
    expected: wellnessExpected("2026-05-05", {
      energyScore: 4,
      moodScore: null,
      stressScore: 3
    }),
    id: "difficult-tue-wellness",
    message: "Tuesday 2026-05-05 mood good, energy 4, stress 3.",
    pillar: "wellness"
  },
  {
    dayLabel: "Wednesday",
    expected: activityExpected([
      {
        activityCategory: "strength",
        activityType: "weight lifting",
        durationMinutes: 45,
        intensity: null,
        loggedForDate: "2026-05-06",
        timePrecision: "explicit_day"
      }
    ]),
    id: "difficult-wed-lifting",
    message: "Wednesday 2026-05-06 I lifted: squats and bench press for 45 minutes.",
    pillar: "activity"
  },
  {
    dayLabel: "Wednesday",
    expected: dietExpected([
      {
        description: "skipped breakfast",
        loggedForDate: "2026-05-06",
        mealType: "breakfast"
      },
      {
        description: "tacos and beer",
        loggedForDate: "2026-05-06",
        mealType: "dinner"
      }
    ]),
    id: "difficult-wed-food",
    message: "Wednesday 2026-05-06 breakfast was skipped, dinner was tacos and beer.",
    pillar: "diet"
  },
  {
    dayLabel: "Wednesday",
    expected: wellnessExpected("2026-05-06", {
      energyScore: 2,
      motivationScore: null,
      stressScore: 4
    }),
    id: "difficult-wed-wellness",
    message: "Wednesday 2026-05-06 energy 2, motivation low, stress 4, tired today.",
    pillar: "wellness"
  },
  {
    dayLabel: "Thursday",
    expected: activityExpected([
      {
        activityType: "soccer",
        durationMinutes: 60,
        intensity: "Moderate",
        loggedForDate: "2026-05-07",
        timePrecision: "explicit_day"
      }
    ]),
    id: "difficult-thu-soccer",
    message: "Thursday 2026-05-07 I played soccer for about an hour, moderate intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Thursday",
    expected: dietExpected([
      {
        description: "smoothie, turkey sandwich, and ice cream",
        loggedForDate: "2026-05-07",
        mealType: null
      }
    ]),
    id: "difficult-thu-food",
    message: "Thursday 2026-05-07 I had a smoothie, a turkey sandwich, and ice cream.",
    pillar: "diet"
  },
  {
    dayLabel: "Thursday",
    expected: wellnessExpected("2026-05-07", {
      energyScore: 3,
      moodScore: null,
      sorenessScore: 3
    }),
    id: "difficult-thu-wellness",
    message: "Thursday 2026-05-07 mood better, energy 3, soreness 3.",
    pillar: "wellness"
  },
  {
    dayLabel: "Friday",
    expected: activityExpected([
      {
        activityCategory: "mind_body",
        activityType: "pilates",
        durationMinutes: 35,
        intensity: "Light",
        loggedForDate: "2026-05-08",
        timePrecision: "explicit_day"
      }
    ]),
    id: "difficult-fri-pilates",
    message: "Friday 2026-05-08 I did pilates for 35 minutes, light intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Friday",
    expected: dietExpected([
      {
        description: "grilled chicken and vegetables",
        loggedForDate: "2026-05-08",
        mealType: "dinner"
      },
      {
        description: "two cookies",
        loggedForDate: "2026-05-08",
        mealType: null
      }
    ]),
    id: "difficult-fri-food",
    message:
      "Friday 2026-05-08 dinner was grilled chicken and vegetables, but I also had two cookies.",
    pillar: "diet"
  },
  {
    dayLabel: "Friday",
    expected: wellnessExpected("2026-05-08", {
      energyScore: 4,
      motivationScore: null,
      stressScore: 2
    }),
    id: "difficult-fri-wellness",
    message: "Friday 2026-05-08 energy 4, stress 2, motivation coming back.",
    pillar: "wellness"
  },
  {
    dayLabel: "Saturday",
    expected: activityExpected([
      {
        activityCategory: "outdoor_recreation",
        activityType: "hiking",
        durationMinutes: 70,
        intensity: null,
        loggedForDate: "2026-05-09",
        timePrecision: "explicit_day"
      },
      {
        activityCategory: "cardio",
        activityType: "walking",
        durationMinutes: 20,
        intensity: "Light",
        loggedForDate: "2026-05-09",
        timePrecision: "explicit_day"
      }
    ]),
    id: "difficult-sat-hike-walk",
    message: "Saturday 2026-05-09 I hiked for 70 minutes and later walked 20 minutes easy.",
    pillar: "activity"
  },
  {
    dayLabel: "Saturday",
    expected: dietExpected([
      {
        description: "pancakes, coffee, burger, fries, and water",
        loggedForDate: "2026-05-09",
        mealType: null
      }
    ]),
    id: "difficult-sat-food",
    message: "Saturday 2026-05-09 I ate pancakes, coffee, a burger, fries, and water.",
    pillar: "diet"
  },
  {
    dayLabel: "Saturday",
    expected: wellnessExpected("2026-05-09", {
      energyScore: 4,
      moodScore: null,
      sorenessScore: 2,
      stressScore: 2
    }),
    id: "difficult-sat-wellness",
    message: "Saturday 2026-05-09 mood good, energy 4, soreness 2, stress 2.",
    pillar: "wellness"
  },
  {
    dayLabel: "Sunday",
    expected: activityExpected([
      {
        activityCategory: "mobility",
        activityType: "mobility",
        durationMinutes: 10,
        intensity: null,
        loggedForDate: "2026-05-10",
        timePrecision: "explicit_day"
      }
    ]),
    id: "difficult-sun-stretch",
    message: "Sunday 2026-05-10 I rested but stretched for 10 minutes.",
    pillar: "activity"
  },
  {
    dayLabel: "Sunday",
    expected: dietExpected([
      {
        description: "eggs",
        loggedForDate: "2026-05-10",
        mealType: "breakfast"
      },
      {
        description: "soup",
        loggedForDate: "2026-05-10",
        mealType: "lunch"
      },
      {
        description: "tea",
        loggedForDate: "2026-05-10",
        mealType: null
      }
    ]),
    id: "difficult-sun-food",
    message: "Sunday 2026-05-10 I had eggs for breakfast, soup for lunch, and tea.",
    pillar: "diet"
  },
  {
    dayLabel: "Sunday",
    expected: wellnessExpected("2026-05-10", {
      energyScore: 3,
      moodScore: null,
      motivationScore: 3,
      stressScore: 2
    }),
    id: "difficult-sun-wellness",
    message: "Sunday 2026-05-10 energy 3, mood calm, motivation 3, stress 2.",
    pillar: "wellness"
  }
];
