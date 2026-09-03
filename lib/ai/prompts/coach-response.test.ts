import { describe, expect, it } from "vitest";
import type { AppProfile } from "@/lib/profile";
import type { ParsedActivity, ParsedDietEntry, ParsedWellnessCheckin } from "@/lib/chat";
import { buildCoachResponseSystemPrompt, buildCoachResponseUserPrompt } from "./coach-response";

function activity(overrides: Partial<ParsedActivity> = {}): ParsedActivity {
  return {
    activityType: "running",
    activityCategory: "cardio",
    sessionCount: 1,
    description: "ran 3 miles",
    durationMinutes: null,
    intensity: null,
    timeReferenceText: null,
    detectedKeyword: "model_extraction",
    loggedForDate: "2026-01-15",
    timePrecision: "explicit_day",
    confidence: 0.9,
    missingFields: [],
    ambiguityFlags: [],
    ...overrides
  };
}

function dietEntry(overrides: Partial<ParsedDietEntry> = {}): ParsedDietEntry {
  return {
    description: "eggs and toast",
    mealType: null,
    confidence: 0.9,
    detectedKeyword: "model_extraction",
    timeReferenceText: null,
    loggedForDate: "2026-01-15",
    ...overrides
  };
}

function wellnessCheckin(overrides: Partial<ParsedWellnessCheckin> = {}): ParsedWellnessCheckin {
  return {
    energyScore: null,
    sorenessScore: null,
    moodScore: null,
    stressScore: null,
    motivationScore: null,
    notes: null,
    detectedSignals: [],
    loggedForDate: "2026-01-15",
    ...overrides
  };
}

function baseInput(overrides: Partial<Parameters<typeof buildCoachResponseUserPrompt>[0]> = {}) {
  return {
    profile: null as AppProfile | null,
    userMessage: "ran 3 miles",
    recentConversation: "",
    activities: [] as ParsedActivity[],
    dietEntries: [] as ParsedDietEntry[],
    wellnessCheckin: null as ParsedWellnessCheckin | null,
    ...overrides
  };
}

describe("buildCoachResponseSystemPrompt", () => {
  it("stays stable to avoid unnoticed prompt drift", () => {
    expect(buildCoachResponseSystemPrompt()).toMatchSnapshot();
  });
});

describe("buildCoachResponseUserPrompt", () => {
  it("defaults profile goal and coaching style when there's no profile", () => {
    const prompt = buildCoachResponseUserPrompt(baseInput());
    expect(prompt).toContain("User profile goal: Not set");
    expect(prompt).toContain("Coaching style preference: Balanced mix");
  });

  it("uses the profile's goal and coaching style when present", () => {
    const prompt = buildCoachResponseUserPrompt(
      baseInput({ profile: { primary_goal: "build muscle", coaching_style: "Tough love" } as AppProfile })
    );
    expect(prompt).toContain("User profile goal: build muscle");
    expect(prompt).toContain("Coaching style preference: Tough love");
  });

  it("falls back to a placeholder when there's no recent conversation", () => {
    const prompt = buildCoachResponseUserPrompt(baseInput({ recentConversation: "" }));
    expect(prompt).toContain("Recent conversation: No recent conversation context.");
  });

  it("reports 'None.' for each structured section when nothing was parsed", () => {
    const prompt = buildCoachResponseUserPrompt(baseInput());
    expect(prompt).toContain("Structured activity updates:\n\nNone.");
    expect(prompt).toContain("Structured diet updates:\n\nNone.");
    expect(prompt).toContain("Structured wellness update:\n\nNone.");
  });

  it("omits duration and intensity from an activity line when they're absent", () => {
    const prompt = buildCoachResponseUserPrompt(baseInput({ activities: [activity()] }));
    expect(prompt).toContain("- running\n");
  });

  it("includes duration and intensity in an activity line when present", () => {
    const prompt = buildCoachResponseUserPrompt(
      baseInput({ activities: [activity({ durationMinutes: 30, intensity: "Hard" })] })
    );
    expect(prompt).toContain("- running for 30 minutes at hard intensity");
  });

  it("labels a diet entry with 'meal' when mealType is unset", () => {
    const prompt = buildCoachResponseUserPrompt(baseInput({ dietEntries: [dietEntry()] }));
    expect(prompt).toContain("- meal: eggs and toast");
  });

  it("labels a diet entry with its meal type when set", () => {
    const prompt = buildCoachResponseUserPrompt(
      baseInput({ dietEntries: [dietEntry({ mealType: "breakfast" })] })
    );
    expect(prompt).toContain("- breakfast: eggs and toast");
  });

  it("renders 'unknown' for unset wellness scores and 'none' for unset notes", () => {
    const prompt = buildCoachResponseUserPrompt(baseInput({ wellnessCheckin: wellnessCheckin() }));
    expect(prompt).toContain("- energyScore: unknown");
    expect(prompt).toContain("- notes: none");
  });

  it("renders concrete wellness values when present", () => {
    const prompt = buildCoachResponseUserPrompt(
      baseInput({
        wellnessCheckin: wellnessCheckin({ energyScore: 4, notes: "feeling good" })
      })
    );
    expect(prompt).toContain("- energyScore: 4");
    expect(prompt).toContain("- notes: feeling good");
  });
});
