import type { IntelligenceEvalCase, IntelligenceEvalExpected } from "@/lib/evals/intelligence/types";

function activityExpected(input: {
  activityType: string;
  assertRawActivitiesCount?: boolean;
  category?: string;
  date: string;
  description?: string;
  duration: number;
  intensity: "Light" | "Moderate" | "Hard";
}): IntelligenceEvalExpected {
  return {
    activities: [
      {
        activityCategory: input.category ?? "strength",
        activityType: input.activityType,
        ambiguityFlags: [],
        description: input.description,
        durationMinutes: input.duration,
        intensity: input.intensity,
        loggedForDate: input.date,
        missingFields: [],
        timePrecision: "explicit_day"
      }
    ],
    dietEntries: [],
    persistPlan: {
      activities: true,
      dietEntries: false,
      wellnessCheckin: false
    },
    rawModel: {
      ...(input.assertRawActivitiesCount === false ? {} : { activitiesCount: 1 }),
      dietEntriesCount: 0,
      wellnessPresent: false
    },
    shouldPersistStructuredData: true,
    wellnessCheckin: null
  };
}

function dietExpected(input: {
  assertRawDietEntriesCount?: boolean;
  date: string;
  entries: Array<{
    description: string;
    mealType: "breakfast" | "lunch" | "dinner" | null;
  }>;
}): IntelligenceEvalExpected {
  return {
    activities: [],
    dietEntries: input.entries.map((entry) => ({
      description: entry.description,
      loggedForDate: input.date,
      mealType: entry.mealType
    })),
    persistPlan: {
      activities: false,
      dietEntries: true,
      wellnessCheckin: false
    },
    rawModel: {
      activitiesCount: 0,
      ...(input.assertRawDietEntriesCount === false
        ? {}
        : { dietEntriesCount: input.entries.length }),
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

export const LIFTING_MIXED_PATH_INTELLIGENCE_CASES: IntelligenceEvalCase[] = [
  {
    dayLabel: "Monday",
    expected: activityExpected({
      activityType: "weight lifting",
      assertRawActivitiesCount: false,
      date: "2026-05-04",
      duration: 45,
      intensity: "Hard"
    }),
    id: "lifting-mon-upper",
    message:
      "Monday 2026-05-04 I lifted upper body: bench press and rows for 45 minutes, hard intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Monday",
    expected: dietExpected({
      date: "2026-05-04",
      entries: [
        {
          description: "protein bowl with chicken, quinoa, and greens",
          mealType: "lunch"
        }
      ]
    }),
    id: "lifting-mon-lunch",
    message:
      "Monday 2026-05-04 lunch was a protein bowl with chicken, quinoa, and greens.",
    pillar: "diet"
  },
  {
    dayLabel: "Monday",
    expected: wellnessExpected("2026-05-04", {
      energyScore: 4,
      moodScore: null,
      motivationScore: 5
    }),
    id: "lifting-mon-wellness",
    message: "Monday 2026-05-04 motivation 5, mood good, energy 4.",
    pillar: "wellness"
  },
  {
    dayLabel: "Tuesday",
    expected: activityExpected({
      activityType: "weight lifting",
      assertRawActivitiesCount: false,
      date: "2026-05-05",
      duration: 40,
      intensity: "Moderate"
    }),
    id: "lifting-tue-lower",
    message:
      "Tuesday 2026-05-05 I did lower body lifting: squats and lunges for 40 minutes, moderate intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Tuesday",
    expected: dietExpected({
      date: "2026-05-05",
      entries: [
        {
          description: "pizza and two beers",
          mealType: "dinner"
        }
      ]
    }),
    id: "lifting-tue-dinner",
    message: "Tuesday 2026-05-05 dinner was pizza and two beers.",
    pillar: "diet"
  },
  {
    dayLabel: "Tuesday",
    expected: wellnessExpected("2026-05-05", {
      energyScore: 3,
      sorenessScore: 4,
      stressScore: 3
    }),
    id: "lifting-tue-wellness",
    message: "Tuesday 2026-05-05 soreness 4, energy 3, stress 3.",
    pillar: "wellness"
  },
  {
    dayLabel: "Wednesday",
    expected: activityExpected({
      activityType: "walking",
      category: "cardio",
      date: "2026-05-06",
      description: "walked",
      duration: 25,
      intensity: "Light"
    }),
    id: "lifting-wed-walk",
    message: "Wednesday 2026-05-06 I walked for 25 minutes, easy intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Wednesday",
    expected: dietExpected({
      date: "2026-05-06",
      entries: [
        {
          description: "Greek yogurt, granola, and blueberries",
          mealType: "breakfast"
        }
      ]
    }),
    id: "lifting-wed-breakfast",
    message: "Wednesday 2026-05-06 breakfast was Greek yogurt, granola, and blueberries.",
    pillar: "diet"
  },
  {
    dayLabel: "Wednesday",
    expected: wellnessExpected("2026-05-06", {
      energyScore: 3,
      moodScore: null,
      motivationScore: null
    }),
    id: "lifting-wed-wellness",
    message: "Wednesday 2026-05-06 energy 3, mood okay, motivation low from being tired.",
    pillar: "wellness"
  },
  {
    dayLabel: "Thursday",
    expected: activityExpected({
      activityType: "weight lifting",
      assertRawActivitiesCount: false,
      date: "2026-05-07",
      duration: 50,
      intensity: "Hard"
    }),
    id: "lifting-thu-full",
    message:
      "Thursday 2026-05-07 I lifted full body: deadlifts, overhead press, and planks for 50 minutes, hard intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Thursday",
    expected: dietExpected({
      date: "2026-05-07",
      entries: [
        {
          description: "turkey sandwich and chips",
          mealType: "lunch"
        }
      ]
    }),
    id: "lifting-thu-lunch",
    message: "Thursday 2026-05-07 lunch was a turkey sandwich and chips.",
    pillar: "diet"
  },
  {
    dayLabel: "Thursday",
    expected: wellnessExpected("2026-05-07", {
      moodScore: null,
      motivationScore: 4,
      stressScore: 2
    }),
    id: "lifting-thu-wellness",
    message: "Thursday 2026-05-07 mood good, stress 2, motivation 4.",
    pillar: "wellness"
  },
  {
    dayLabel: "Friday",
    expected: activityExpected({
      activityType: "mobility",
      category: "mobility",
      date: "2026-05-08",
      duration: 20,
      intensity: "Light"
    }),
    id: "lifting-fri-mobility",
    message: "Friday 2026-05-08 I did mobility and stretching for 20 minutes, light intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Friday",
    expected: dietExpected({
      date: "2026-05-08",
      entries: [
        {
          description: "salmon, rice, and asparagus",
          mealType: "dinner"
        }
      ]
    }),
    id: "lifting-fri-dinner",
    message: "Friday 2026-05-08 dinner was salmon, rice, and asparagus.",
    pillar: "diet"
  },
  {
    dayLabel: "Friday",
    expected: wellnessExpected("2026-05-08", {
      energyScore: 4,
      sorenessScore: 3,
      stressScore: null
    }),
    id: "lifting-fri-wellness",
    message: "Friday 2026-05-08 soreness 3, energy 4, stress low.",
    pillar: "wellness"
  },
  {
    dayLabel: "Saturday",
    expected: activityExpected({
      activityType: "weight lifting",
      assertRawActivitiesCount: false,
      date: "2026-05-09",
      duration: 35,
      intensity: "Moderate"
    }),
    id: "lifting-sat-arms",
    message: "Saturday 2026-05-09 I lifted arms and shoulders for 35 minutes, moderate intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Saturday",
    expected: dietExpected({
      date: "2026-05-09",
      entries: [
        {
          description: "cheeseburger and fries",
          mealType: null
        }
      ]
    }),
    id: "lifting-sat-food",
    message: "Saturday 2026-05-09 I ate a cheeseburger and fries.",
    pillar: "diet"
  },
  {
    dayLabel: "Saturday",
    expected: wellnessExpected("2026-05-09", {
      energyScore: 3,
      moodScore: null,
      motivationScore: 3
    }),
    id: "lifting-sat-wellness",
    message: "Saturday 2026-05-09 energy 3, mood a little flat, motivation 3.",
    pillar: "wellness"
  },
  {
    dayLabel: "Sunday",
    expected: activityExpected({
      activityType: "walking",
      category: "cardio",
      date: "2026-05-10",
      duration: 20,
      intensity: "Light"
    }),
    id: "lifting-sun-walk",
    message: "Sunday 2026-05-10 I rested and took a 20 minute easy walk.",
    pillar: "activity"
  },
  {
    dayLabel: "Sunday",
    expected: dietExpected({
      date: "2026-05-10",
      entries: [
        {
          description: "eggs, toast, and coffee",
          mealType: "breakfast"
        }
      ]
    }),
    id: "lifting-sun-breakfast",
    message: "Sunday 2026-05-10 breakfast was eggs, toast, and coffee.",
    pillar: "diet"
  },
  {
    dayLabel: "Sunday",
    expected: wellnessExpected("2026-05-10", {
      energyScore: 4,
      motivationScore: 4,
      sorenessScore: 2
    }),
    id: "lifting-sun-wellness",
    message: "Sunday 2026-05-10 I felt recovered, energy 4, soreness 2, motivation 4.",
    pillar: "wellness"
  }
];
