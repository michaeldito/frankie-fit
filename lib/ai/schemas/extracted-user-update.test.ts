import { describe, expect, it } from "vitest";
import {
  mapExtractedActivities,
  mapExtractedDietEntries,
  mapExtractedWellnessCheckin,
  parseExtractedUserUpdate,
  type ExtractedUserUpdate
} from "./extracted-user-update";

function baseUpdate(): ExtractedUserUpdate {
  return {
    intent: "log_update",
    notes: "",
    activities: [],
    dietEntries: [],
    wellness: {
      present: false,
      energyScore: 0,
      sorenessScore: 0,
      moodScore: 0,
      stressScore: 0,
      motivationScore: 0,
      notes: "",
      loggedForDate: "2026-01-15"
    },
    needsClarification: false,
    clarificationQuestion: ""
  };
}

function baseActivity(overrides: Partial<ExtractedUserUpdate["activities"][number]> = {}) {
  return {
    activityType: "run",
    activityCategory: "cardio",
    description: "ran 3 miles",
    sessionCount: 1,
    durationMinutes: 30,
    intensity: "Moderate" as const,
    timeReferenceText: "",
    loggedForDate: "2026-01-15",
    timePrecision: "explicit_day" as const,
    confidence: 0.9,
    missingFields: [],
    ambiguityFlags: [],
    ...overrides
  };
}

describe("parseExtractedUserUpdate", () => {
  it("parses a well-formed payload", () => {
    const result = parseExtractedUserUpdate(baseUpdate());
    expect(result.intent).toBe("log_update");
  });

  it("strips placeholder activities missing required fields on retry", () => {
    const payload = {
      ...baseUpdate(),
      activities: [
        { ...baseActivity(), activityType: "" },
        baseActivity({ activityType: "walk", description: "walked the dog" })
      ]
    };

    const result = parseExtractedUserUpdate(payload);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].activityType).toBe("walk");
  });

  it("strips diet entries with empty descriptions on retry", () => {
    const payload = {
      ...baseUpdate(),
      dietEntries: [
        { description: "", mealType: "unknown", confidence: 0.5, timeReferenceText: "", loggedForDate: "2026-01-15" },
        { description: "eggs", mealType: "breakfast", confidence: 0.9, timeReferenceText: "", loggedForDate: "2026-01-15" }
      ]
    };

    const result = parseExtractedUserUpdate(payload);
    expect(result.dietEntries).toHaveLength(1);
    expect(result.dietEntries[0].description).toBe("eggs");
  });

  it("throws the original error when cleanup can't fix the payload", () => {
    expect(() => parseExtractedUserUpdate({ intent: "not-a-real-intent" })).toThrow();
  });
});

describe("mapExtractedActivities", () => {
  it("canonicalizes activity type and category", () => {
    const [mapped] = mapExtractedActivities([baseActivity({ activityType: "running", activityCategory: "other" })]);
    expect(mapped.activityType).toBe("running");
    expect(mapped.activityCategory).toBe("cardio");
  });

  it("derives activity type from description when type is generic weight-lifting language", () => {
    const [mapped] = mapExtractedActivities([
      baseActivity({ activityType: "lifted", description: "lifted weights at the gym" })
    ]);
    expect(mapped.activityType).toBe("weight lifting");
  });

  it("drops a redundant placeholder activity alongside a genuine one", () => {
    const mapped = mapExtractedActivities([
      baseActivity({ activityType: "unknown", description: "felt great" }),
      baseActivity({ activityType: "run", description: "ran 3 miles" })
    ]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].description).toBe("ran 3 miles");
  });

  it("keeps a lone placeholder activity so clarification can still trigger", () => {
    const mapped = mapExtractedActivities([baseActivity({ activityType: "unknown", description: "" })]);
    expect(mapped).toHaveLength(1);
  });

  it("falls back to defaults for zero-valued fields", () => {
    const [mapped] = mapExtractedActivities([
      baseActivity({ sessionCount: 0, durationMinutes: 0, confidence: 0 })
    ]);
    expect(mapped.sessionCount).toBe(1);
    expect(mapped.durationMinutes).toBeNull();
    expect(mapped.confidence).toBe(0.7);
  });

  it("maps 'unknown' intensity to null", () => {
    const [mapped] = mapExtractedActivities([baseActivity({ intensity: "unknown" })]);
    expect(mapped.intensity).toBeNull();
  });

  it("downgrades implicit_today precision when the resolved date isn't actually today", () => {
    const [mapped] = mapExtractedActivities([
      baseActivity({ timePrecision: "implicit_today", loggedForDate: "2026-01-01" })
    ]);
    expect(mapped.timePrecision).toBe("explicit_day");
  });

  it("maps legacy 'exact'/'explicit_date' precision values to explicit_day", () => {
    const [mapped] = mapExtractedActivities([baseActivity({ timePrecision: "exact" as never })]);
    expect(mapped.timePrecision).toBe("explicit_day");
  });
});

describe("mapExtractedDietEntries", () => {
  it("maps 'unknown' meal type to null", () => {
    const [mapped] = mapExtractedDietEntries([
      { description: "eggs", mealType: "unknown", confidence: 0.5, timeReferenceText: "", loggedForDate: "2026-01-15" }
    ]);
    expect(mapped.mealType).toBeNull();
  });

  it("falls back to a default description when blank", () => {
    const [mapped] = mapExtractedDietEntries([
      { description: "   ", mealType: "unknown", confidence: 0.5, timeReferenceText: "", loggedForDate: "2026-01-15" }
    ]);
    expect(mapped.description).toBe("food update 1");
  });
});

describe("mapExtractedWellnessCheckin", () => {
  it("returns null when wellness isn't present", () => {
    expect(mapExtractedWellnessCheckin(baseUpdate().wellness)).toBeNull();
  });

  it("maps zero scores to null and lists only positive signals", () => {
    const result = mapExtractedWellnessCheckin({
      present: true,
      energyScore: 4,
      sorenessScore: 0,
      moodScore: 3,
      stressScore: 0,
      motivationScore: 0,
      notes: "",
      loggedForDate: "2026-01-15"
    });

    expect(result).toEqual({
      energyScore: 4,
      sorenessScore: null,
      moodScore: 3,
      stressScore: null,
      motivationScore: null,
      notes: null,
      detectedSignals: ["energy", "mood"],
      loggedForDate: "2026-01-15"
    });
  });

  it("returns null when present but no signals and notes are generic", () => {
    const result = mapExtractedWellnessCheckin({
      present: true,
      energyScore: 0,
      sorenessScore: 0,
      moodScore: 0,
      stressScore: 0,
      motivationScore: 0,
      notes: "n/a",
      loggedForDate: "2026-01-15"
    });
    expect(result).toBeNull();
  });

  it("keeps a check-in with no scored signals but meaningful notes", () => {
    const result = mapExtractedWellnessCheckin({
      present: true,
      energyScore: 0,
      sorenessScore: 0,
      moodScore: 0,
      stressScore: 0,
      motivationScore: 0,
      notes: "feeling a bit run down today",
      loggedForDate: "2026-01-15"
    });
    expect(result).not.toBeNull();
    expect(result?.notes).toBe("feeling a bit run down today");
    expect(result?.detectedSignals).toEqual([]);
  });
});
