import { describe, expect, it } from "vitest";
import {
  capitalize,
  formatActivityDetail,
  formatActivityTitle,
  formatDietDetail,
  formatDietTitle,
  formatLifestyleDetail,
  formatLifestyleTitle,
  formatLoggedDate,
  formatWellnessDetail,
  formatWellnessTitle,
  type LoggedActivity,
  type LoggedDietEntry,
  type LoggedLifestyleEntry,
  type LoggedWellnessCheckin
} from "./logged-entry-format";

function activity(overrides: Partial<LoggedActivity> = {}): LoggedActivity {
  return {
    id: "activity-1",
    activityType: "running",
    durationMinutes: 30,
    intensity: "Hard",
    loggedForDate: "2026-09-03",
    ...overrides
  };
}

function dietEntry(overrides: Partial<LoggedDietEntry> = {}): LoggedDietEntry {
  return {
    id: "diet-1",
    description: "Eggs and toast",
    mealType: "breakfast",
    loggedForDate: "2026-09-03",
    ...overrides
  };
}

function lifestyleEntry(overrides: Partial<LoggedLifestyleEntry> = {}): LoggedLifestyleEntry {
  return {
    id: "lifestyle-1",
    description: "Went to an arcade on a date",
    category: "social",
    loggedForDate: "2026-09-03",
    ...overrides
  };
}

function wellnessCheckin(overrides: Partial<LoggedWellnessCheckin> = {}): LoggedWellnessCheckin {
  return {
    id: "wellness-1",
    energyScore: 4,
    moodScore: 4,
    motivationScore: 4,
    sorenessScore: 2,
    stressScore: 2,
    loggedForDate: "2026-09-03",
    ...overrides
  };
}

describe("capitalize", () => {
  it("capitalizes only the first letter", () => {
    expect(capitalize("running")).toBe("Running");
  });

  it("handles an empty string without throwing", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("formatLoggedDate", () => {
  it("converts YYYY-MM-DD to MM-DD-YYYY", () => {
    expect(formatLoggedDate("2026-09-03")).toBe("09-03-2026");
  });

  it("returns the input unchanged when it doesn't match the expected shape", () => {
    expect(formatLoggedDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatActivityTitle", () => {
  it("capitalizes the activity type", () => {
    expect(formatActivityTitle(activity({ activityType: "weight lifting" }))).toBe("Weight lifting");
  });
});

describe("formatActivityDetail", () => {
  it("joins duration and intensity with a bullet", () => {
    expect(formatActivityDetail(activity({ durationMinutes: 30, intensity: "Hard" }))).toBe(
      "30 min • Hard"
    );
  });

  it("shows only duration when intensity is missing", () => {
    expect(formatActivityDetail(activity({ durationMinutes: 30, intensity: null }))).toBe("30 min");
  });

  it("shows only intensity when duration is missing", () => {
    expect(formatActivityDetail(activity({ durationMinutes: null, intensity: "Light" }))).toBe(
      "Light"
    );
  });

  it("returns null when neither duration nor intensity is known", () => {
    expect(formatActivityDetail(activity({ durationMinutes: null, intensity: null }))).toBeNull();
  });
});

describe("formatDietTitle", () => {
  it("capitalizes the meal type", () => {
    expect(formatDietTitle(dietEntry({ mealType: "snack" }))).toBe("Snack");
  });

  it("falls back to Meal when meal type is unknown", () => {
    expect(formatDietTitle(dietEntry({ mealType: null }))).toBe("Meal");
  });
});

describe("formatDietDetail", () => {
  it("returns the description", () => {
    expect(formatDietDetail(dietEntry({ description: "Turkey wrap" }))).toBe("Turkey wrap");
  });

  it("returns null for an empty description", () => {
    expect(formatDietDetail(dietEntry({ description: "" }))).toBeNull();
  });
});

describe("formatLifestyleTitle", () => {
  it("capitalizes the category and replaces underscores with spaces", () => {
    expect(formatLifestyleTitle(lifestyleEntry({ category: "substance_alcohol" }))).toBe(
      "Substance alcohol"
    );
  });

  it("falls back to Lifestyle when category is unknown", () => {
    expect(formatLifestyleTitle(lifestyleEntry({ category: null }))).toBe("Lifestyle");
  });
});

describe("formatLifestyleDetail", () => {
  it("returns the description", () => {
    expect(formatLifestyleDetail(lifestyleEntry({ description: "Visited family" }))).toBe(
      "Visited family"
    );
  });

  it("returns null for an empty description", () => {
    expect(formatLifestyleDetail(lifestyleEntry({ description: "" }))).toBeNull();
  });
});

describe("formatWellnessTitle", () => {
  it("is always Check-in", () => {
    expect(formatWellnessTitle()).toBe("Check-in");
  });
});

describe("formatWellnessDetail", () => {
  it("lists every present score in a fixed order, with a /5 suffix", () => {
    expect(
      formatWellnessDetail(
        wellnessCheckin({
          energyScore: 4,
          stressScore: 2,
          sorenessScore: 3,
          moodScore: 5,
          motivationScore: 4
        })
      )
    ).toBe("Energy 4/5 • Stress 2/5 • Soreness 3/5 • Mood 5/5 • Motivation 4/5");
  });

  it("omits scores that are null", () => {
    expect(
      formatWellnessDetail(
        wellnessCheckin({
          energyScore: 4,
          stressScore: null,
          sorenessScore: null,
          moodScore: null,
          motivationScore: 3
        })
      )
    ).toBe("Energy 4/5 • Motivation 3/5");
  });

  it("returns null when no scores are present", () => {
    expect(
      formatWellnessDetail(
        wellnessCheckin({
          energyScore: null,
          stressScore: null,
          sorenessScore: null,
          moodScore: null,
          motivationScore: null
        })
      )
    ).toBeNull();
  });
});
