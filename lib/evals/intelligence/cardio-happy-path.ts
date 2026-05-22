import type { IntelligenceEvalCase, IntelligenceEvalExpected } from "@/lib/evals/intelligence/types";

function activityExpected(input: {
  activityType: string;
  category?: string;
  date: string;
  description?: string;
  duration: number;
  intensity: "Light" | "Moderate" | "Hard";
}): IntelligenceEvalExpected {
  return {
    activities: [
      {
        activityCategory: input.category ?? "cardio",
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
      activitiesCount: 1,
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

export const CARDIO_HAPPY_PATH_INTELLIGENCE_CASES: IntelligenceEvalCase[] = [
  {
    dayLabel: "Monday",
    expected: activityExpected({
      activityType: "running",
      date: "2026-05-04",
      description: "ran",
      duration: 25,
      intensity: "Light"
    }),
    id: "cardio-mon-run",
    message: "Monday 2026-05-04 I ran for 25 minutes at easy intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Monday",
    expected: dietExpected({
      date: "2026-05-04",
      entries: [
        {
          description: "oatmeal with berries and coffee",
          mealType: "breakfast"
        }
      ]
    }),
    id: "cardio-mon-breakfast",
    message: "Monday 2026-05-04 breakfast was oatmeal with berries and coffee.",
    pillar: "diet"
  },
  {
    dayLabel: "Monday",
    expected: wellnessExpected("2026-05-04", {
      energyScore: 4,
      moodScore: null,
      motivationScore: null,
      stressScore: null
    }),
    id: "cardio-mon-wellness",
    message: "Monday 2026-05-04 energy 4, mood good, stress low, motivation steady.",
    pillar: "wellness"
  },
  {
    dayLabel: "Tuesday",
    expected: activityExpected({
      activityType: "walking",
      date: "2026-05-05",
      description: "walked briskly",
      duration: 40,
      intensity: "Light"
    }),
    id: "cardio-tue-walk",
    message: "Tuesday 2026-05-05 I walked briskly for 40 minutes, light intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Tuesday",
    expected: dietExpected({
      date: "2026-05-05",
      entries: [
        {
          description: "grilled chicken, rice, and vegetables",
          mealType: "lunch"
        }
      ]
    }),
    id: "cardio-tue-lunch",
    message: "Tuesday 2026-05-05 lunch was grilled chicken, rice, and vegetables.",
    pillar: "diet"
  },
  {
    dayLabel: "Tuesday",
    expected: wellnessExpected("2026-05-05", {
      energyScore: 4,
      motivationScore: 5,
      stressScore: 2
    }),
    id: "cardio-tue-wellness",
    message: "Tuesday 2026-05-05 I felt recovered, energy 4, stress 2, motivation 5.",
    pillar: "wellness"
  },
  {
    dayLabel: "Wednesday",
    expected: activityExpected({
      activityType: "running",
      date: "2026-05-06",
      description: "steady run",
      duration: 30,
      intensity: "Moderate"
    }),
    id: "cardio-wed-run",
    message: "Wednesday 2026-05-06 I did a steady 30 minute run.",
    pillar: "activity"
  },
  {
    dayLabel: "Wednesday",
    expected: dietExpected({
      date: "2026-05-06",
      entries: [
        {
          description: "salmon, potatoes, and a side salad",
          mealType: "dinner"
        }
      ]
    }),
    id: "cardio-wed-dinner",
    message: "Wednesday 2026-05-06 dinner was salmon, potatoes, and a side salad.",
    pillar: "diet"
  },
  {
    dayLabel: "Wednesday",
    expected: wellnessExpected("2026-05-06", {
      energyScore: 5,
      moodScore: null,
      sorenessScore: 1
    }),
    id: "cardio-wed-wellness",
    message: "Wednesday 2026-05-06 mood was positive, energy 5, soreness 1.",
    pillar: "wellness"
  },
  {
    dayLabel: "Thursday",
    expected: activityExpected({
      activityType: "biking",
      date: "2026-05-07",
      description: "biked",
      duration: 35,
      intensity: "Moderate"
    }),
    id: "cardio-thu-bike",
    message: "Thursday 2026-05-07 I biked for 35 minutes at moderate intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Thursday",
    expected: dietExpected({
      date: "2026-05-07",
      entries: [
        {
          description: "turkey wrap and an apple",
          mealType: "lunch"
        }
      ]
    }),
    id: "cardio-thu-lunch",
    message: "Thursday 2026-05-07 I had a turkey wrap and an apple for lunch.",
    pillar: "diet"
  },
  {
    dayLabel: "Thursday",
    expected: wellnessExpected("2026-05-07", {
      energyScore: 4,
      motivationScore: null,
      stressScore: null
    }),
    id: "cardio-thu-wellness",
    message: "Thursday 2026-05-07 energy 4, stress low, motivation strong.",
    pillar: "wellness"
  },
  {
    dayLabel: "Friday",
    expected: activityExpected({
      activityType: "jogging",
      date: "2026-05-08",
      description: "recovery jog",
      duration: 20,
      intensity: "Light"
    }),
    id: "cardio-fri-jog",
    message: "Friday 2026-05-08 I did a 20 minute recovery jog, light intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Friday",
    expected: dietExpected({
      date: "2026-05-08",
      entries: [
        {
          description: "chicken tacos with avocado",
          mealType: "dinner"
        }
      ]
    }),
    id: "cardio-fri-dinner",
    message: "Friday 2026-05-08 dinner was chicken tacos with avocado.",
    pillar: "diet"
  },
  {
    dayLabel: "Friday",
    expected: wellnessExpected("2026-05-08", {
      energyScore: 4
    }),
    id: "cardio-fri-wellness",
    message: "Friday 2026-05-08 I slept well and felt calm, energy 4.",
    pillar: "wellness"
  },
  {
    dayLabel: "Saturday",
    expected: activityExpected({
      activityType: "hiking",
      category: "outdoor_recreation",
      date: "2026-05-09",
      description: "hiked",
      duration: 50,
      intensity: "Moderate"
    }),
    id: "cardio-sat-hike",
    message: "Saturday 2026-05-09 I hiked for 50 minutes at moderate intensity.",
    pillar: "activity"
  },
  {
    dayLabel: "Saturday",
    expected: dietExpected({
      assertRawDietEntriesCount: false,
      date: "2026-05-09",
      entries: [
        {
          description: "eggs and toast",
          mealType: "breakfast"
        },
        {
          description: "smoothie",
          mealType: null
        }
      ]
    }),
    id: "cardio-sat-breakfast-smoothie",
    message: "Saturday 2026-05-09 I had eggs and toast for breakfast, then a smoothie.",
    pillar: "diet"
  },
  {
    dayLabel: "Saturday",
    expected: wellnessExpected("2026-05-09", {
      energyScore: 5,
      moodScore: null,
      sorenessScore: null
    }),
    id: "cardio-sat-wellness",
    message: "Saturday 2026-05-09 mood good, energy 5, soreness low.",
    pillar: "wellness"
  },
  {
    dayLabel: "Sunday",
    expected: activityExpected({
      activityType: "walking",
      date: "2026-05-10",
      description: "walked easy",
      duration: 30,
      intensity: "Light"
    }),
    id: "cardio-sun-walk",
    message: "Sunday 2026-05-10 I walked easy for 30 minutes.",
    pillar: "activity"
  },
  {
    dayLabel: "Sunday",
    expected: dietExpected({
      date: "2026-05-10",
      entries: [
        {
          description: "veggie pasta and sparkling water",
          mealType: "dinner"
        }
      ]
    }),
    id: "cardio-sun-dinner",
    message: "Sunday 2026-05-10 dinner was veggie pasta and sparkling water.",
    pillar: "diet"
  },
  {
    dayLabel: "Sunday",
    expected: wellnessExpected("2026-05-10", {
      energyScore: 4,
      motivationScore: null,
      stressScore: 1
    }),
    id: "cardio-sun-wellness",
    message: "Sunday 2026-05-10 energy 4, motivation steady, stress 1.",
    pillar: "wellness"
  }
];
