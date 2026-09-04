import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeDashboardData, type ActivityLogRow, type DietLogRow, type WellnessCheckinRow } from "./dashboard";

// Pinned "today" so week-relative fixtures (logged_for_date) are deterministic.
// 2026-01-08 is a Thursday in the week starting Monday 2026-01-05.
const TODAY = "2026-01-08T18:00:00.000Z";

function activityLog(overrides: Partial<ActivityLogRow> = {}): ActivityLogRow {
  return {
    id: "activity-1",
    user_id: "user-1",
    source_message_id: null,
    activity_type: "run",
    description: null,
    duration_minutes: 30,
    intensity: null,
    logged_for_date: "2026-01-08",
    metadata_json: null,
    created_at: TODAY,
    updated_at: TODAY,
    ...overrides
  };
}

function dietLog(overrides: Partial<DietLogRow> = {}): DietLogRow {
  return {
    id: "diet-1",
    user_id: "user-1",
    source_message_id: null,
    description: "Chicken and rice",
    meal_type: "lunch",
    logged_for_date: "2026-01-08",
    confidence: null,
    metadata_json: null,
    created_at: TODAY,
    updated_at: TODAY,
    ...overrides
  };
}

function wellnessCheckin(overrides: Partial<WellnessCheckinRow> = {}): WellnessCheckinRow {
  return {
    id: "wellness-1",
    user_id: "user-1",
    source_message_id: null,
    energy_score: 3,
    soreness_score: 2,
    mood_score: 3,
    stress_score: 2,
    motivation_score: 3,
    notes: null,
    logged_for_date: "2026-01-08",
    created_at: TODAY,
    updated_at: TODAY,
    ...overrides
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(TODAY));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("computeDashboardData: exercise", () => {
  it("returns the empty dashboard when there are no logs", () => {
    const result = computeDashboardData(null, [], [], []);
    expect(result.exercise.empty).toBe(true);
    expect(result.exercise.metrics.find((m) => m.label === "Workouts")?.value).toBe("0");
  });

  it("counts only this week's logs toward the weekly metrics", () => {
    const result = computeDashboardData(
      null,
      [
        activityLog({ logged_for_date: "2026-01-08", duration_minutes: 30 }),
        activityLog({ id: "activity-2", logged_for_date: "2025-12-20", duration_minutes: 999 })
      ],
      [],
      []
    );

    expect(result.exercise.metrics.find((m) => m.label === "Workouts")?.value).toBe("1");
    expect(result.exercise.metrics.find((m) => m.label === "Minutes")?.value).toBe("30");
  });
});

describe("computeDashboardData: diet", () => {
  it("returns the empty dashboard when there are no logs", () => {
    const result = computeDashboardData(null, [], [], []);
    expect(result.diet.empty).toBe(true);
  });

  it("surfaces the most-logged meal type in the metrics", () => {
    const result = computeDashboardData(
      null,
      [],
      [
        dietLog({ id: "d1", meal_type: "snack" }),
        dietLog({ id: "d2", meal_type: "snack" }),
        dietLog({ id: "d3", meal_type: "lunch" })
      ],
      []
    );

    expect(result.diet.metrics.find((m) => m.label === "Most logged")?.value).toBe("Snack");
  });
});

describe("computeDashboardData: wellness", () => {
  it("returns the empty dashboard when there are no checkins", () => {
    const result = computeDashboardData(null, [], [], []);
    expect(result.wellness.empty).toBe(true);
  });

  it("labels low energy scores correctly", () => {
    const result = computeDashboardData(null, [], [], [wellnessCheckin({ energy_score: 1 })]);
    expect(result.wellness.metrics.find((m) => m.label === "Energy")?.value).toBe("Very low");
  });

  it("includes mood in the 7-day trend", () => {
    const result = computeDashboardData(
      null,
      [],
      [],
      [wellnessCheckin({ logged_for_date: "2026-01-08", mood_score: 4 })]
    );
    const todayPoint = result.wellness.trend.find((point) => point.label === "Thu");
    expect(todayPoint?.mood).toBe(4);
  });

  it("breaks down how often each signal is mentioned, sorted by frequency", () => {
    const allSignalsNull = {
      energy_score: null,
      soreness_score: null,
      mood_score: null,
      stress_score: null,
      motivation_score: null
    };
    const result = computeDashboardData(
      null,
      [],
      [],
      [
        wellnessCheckin({ id: "w1", ...allSignalsNull, energy_score: 4, stress_score: 2 }),
        wellnessCheckin({ id: "w2", ...allSignalsNull, energy_score: 3 }),
        wellnessCheckin({ id: "w3", ...allSignalsNull })
      ]
    );

    expect(result.wellness.breakdown).toEqual([
      { label: "Energy", value: 2 },
      { label: "Stress", value: 1 }
    ]);
  });

  it("omits signals that were never mentioned from the breakdown", () => {
    const result = computeDashboardData(
      null,
      [],
      [],
      [wellnessCheckin({ energy_score: 4, stress_score: null, soreness_score: null, mood_score: null, motivation_score: null })]
    );

    expect(result.wellness.breakdown).toEqual([{ label: "Energy", value: 1 }]);
  });
});

describe("computeDashboardData: nextStep priority", () => {
  const completeProfile = {
    target_training_days: 3,
    onboarding_completed: true,
    wellness_checkin_opt_in: true
  };

  it("asks to finish onboarding first, above every other signal", () => {
    const result = computeDashboardData(
      { ...completeProfile, onboarding_completed: false },
      [activityLog()],
      [dietLog()],
      [wellnessCheckin()]
    );
    expect(result.nextStep.title).toBe("Complete your onboarding");
  });

  it("asks for a wellness check-in when opted in and none logged since yesterday", () => {
    const result = computeDashboardData(completeProfile, [activityLog()], [dietLog()], []);
    expect(result.nextStep.title).toBe("Quick recovery check-in");
  });

  it("asks to log a meal when today has no meal logged, after wellness is satisfied", () => {
    const result = computeDashboardData(
      completeProfile,
      [activityLog()],
      [],
      [wellnessCheckin({ logged_for_date: "2026-01-08" })]
    );
    expect(result.nextStep.title).toBe("Log today's meal");
  });

  it("falls through to the generic next step once every signal is satisfied", () => {
    const result = computeDashboardData(
      completeProfile,
      [activityLog(), activityLog({ id: "a2", logged_for_date: "2026-01-07" }), activityLog({ id: "a3", logged_for_date: "2026-01-06" })],
      [dietLog()],
      [wellnessCheckin({ logged_for_date: "2026-01-08" })]
    );
    expect(result.nextStep.title).toBe("Ask Frankie for the next move");
  });
});
