import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database";

const { hasOpenAiApiKey, createStructuredOpenAiResponse, createTextOpenAiResponse } = vi.hoisted(() => ({
  hasOpenAiApiKey: vi.fn(),
  createStructuredOpenAiResponse: vi.fn(),
  createTextOpenAiResponse: vi.fn()
}));

vi.mock("@/lib/ai/openai-responses", () => ({
  hasOpenAiApiKey,
  createStructuredOpenAiResponse,
  createTextOpenAiResponse
}));

async function importOrchestrator() {
  return import("./frankie-orchestrator");
}

type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

function baseExtraction(overrides: Record<string, unknown> = {}) {
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
    clarificationQuestion: "",
    ...overrides
  };
}

function activity(overrides: Record<string, unknown> = {}) {
  return {
    activityType: "run",
    activityCategory: "cardio",
    description: "ran 3 miles",
    sessionCount: 1,
    durationMinutes: 30,
    intensity: "Moderate",
    timeReferenceText: "",
    loggedForDate: "2026-01-15",
    timePrecision: "explicit_day",
    confidence: 0.9,
    missingFields: [],
    ambiguityFlags: [],
    ...overrides
  };
}

function dietEntry(overrides: Record<string, unknown> = {}) {
  return {
    mealType: "dinner",
    description: "steak and potatoes",
    loggedForDate: "2026-01-15",
    timeReferenceText: "",
    confidence: 0.9,
    ...overrides
  };
}

const recentMessages: ChatMessage[] = [];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("orchestrateFrankieReply", () => {
  it("shows an unavailable message when no API key is configured", async () => {
    hasOpenAiApiKey.mockReturnValue(false);
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles this morning",
      recentMessages
    });

    expect(result.orchestrationMode).toBe("unavailable");
    expect(result.metadata.extractionSource).toBe("unavailable");
    expect(result.metadata.usedOpenAi).toBe(false);
    expect(result.metadata.fallbackReason).toBe("OPENAI_API_KEY is not configured.");
    expect(result.reply).toBe("Frankie is not reachable right now.");
    expect(result.shouldPersistStructuredData).toBe(false);
    expect(createStructuredOpenAiResponse).not.toHaveBeenCalled();
  });

  it("shows an unavailable message when the model call throws", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockRejectedValue(new Error("network down"));
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles",
      recentMessages
    });

    expect(result.orchestrationMode).toBe("unavailable");
    expect(result.metadata.fallbackReason).toBe("network down");
    expect(result.reply).toBe("Frankie is not reachable right now.");
    expect(result.shouldPersistStructuredData).toBe(false);
  });

  it("shows the unavailable message as filler text when the coach reply is empty and nothing was extracted", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(baseExtraction());
    createTextOpenAiResponse.mockResolvedValue("");
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "hello there",
      recentMessages
    });

    expect(result.orchestrationMode).toBe("model");
    expect(result.reply).toBe("Frankie is not reachable right now.");
  });

  it("returns a log_confirmation reply for a clean single-activity extraction", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({ activities: [activity()] })
    );
    createTextOpenAiResponse.mockResolvedValue("Nice work on the run!");
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles this morning, felt moderate",
      recentMessages
    });

    expect(result.orchestrationMode).toBe("model");
    expect(result.assistantMessageType).toBe("log_confirmation");
    expect(result.shouldPersistStructuredData).toBe(true);
    expect(result.persistPlan.activities).toBe(true);
    expect(result.parsedActivities).toHaveLength(1);
    expect(result.parsedActivities[0].activityType).toBe("running");
    expect(result.reply).toBe("Nice work on the run!");
  });

  it("asks a blocking clarification question when the activity type has no evidence", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [activity({ activityType: "mystery", description: "something happened" })]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "yesterday",
      recentMessages
    });

    expect(result.assistantMessageType).toBe("clarification_request");
    expect(result.persistPlan.activities).toBe(false);
    expect(result.metadata.pendingClarification?.originalMessage).toBe("yesterday");
    expect(createTextOpenAiResponse).not.toHaveBeenCalled();
  });

  it("returns the model's clarification question when there's no usable data", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        needsClarification: true,
        clarificationQuestion: "What did you eat for lunch?"
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "I had lunch",
      recentMessages
    });

    expect(result.assistantMessageType).toBe("clarification_request");
    expect(result.reply).toBe("What did you eat for lunch?");
    expect(result.shouldPersistStructuredData).toBe(false);
  });

  it("skips the coach response call when skipCoachResponse is set", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({ activities: [activity()] })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles this morning",
      recentMessages,
      skipCoachResponse: true
    });

    expect(createTextOpenAiResponse).not.toHaveBeenCalled();
    expect(result.reply).toContain("logged");
  });

});

describe("orchestrateFrankieReply sanitization and dedup", () => {
  it("collapses two identically-described activities the model returned twice into one", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [activity({ durationMinutes: 30 }), activity({ durationMinutes: 30 })]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran for 30 minutes this morning",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.parsedActivities).toHaveLength(1);
    expect(result.parsedActivities[0].durationMinutes).toBe(30);
  });

  it("recognizes a duration mentioned with a typo", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [activity({ activityType: "yoga", description: "did yoga", durationMinutes: 20 })]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "did yoga for 20 minuets",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.parsedActivities[0].durationMinutes).toBe(20);
    expect(result.parsedActivities[0].missingFields).not.toContain("durationMinutes");
  });

  it("strips a duration and intensity the model hallucinated with no textual support", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [
          activity({ activityType: "yoga", description: "did yoga", durationMinutes: 45, intensity: "Hard" })
        ]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "did yoga",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.parsedActivities[0].durationMinutes).toBeNull();
    expect(result.parsedActivities[0].intensity).toBeNull();
    expect(result.parsedActivities[0].missingFields).toEqual(
      expect.arrayContaining(["durationMinutes", "intensity"])
    );
  });

  it("detects a skipped meal from the raw message even when the model returns no diet entries", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(baseExtraction({ dietEntries: [] }));
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "skipped breakfast today",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.parsedDietEntries).toHaveLength(1);
    expect(result.parsedDietEntries[0]).toMatchObject({
      description: "skipped breakfast",
      mealType: "breakfast",
      detectedKeyword: "skipped_meal"
    });
  });

  it("does not turn an unrelated exercise sentence into a diet entry", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [
          activity({ activityType: "Bench Press", description: "Bench Press" }),
          activity({ activityType: "core exercises", description: "core exercises" })
        ],
        dietEntries: [dietEntry({ mealType: "dinner", description: "steak and potatoes" })]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message:
        "Today I exercised, what I did was Bench Press and core exercises. Later I ate steak and potatoes for dinner. Before bed I had a protein shake",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.parsedDietEntries).toHaveLength(1);
    expect(result.parsedDietEntries[0].mealType).toBe("dinner");
    expect(result.parsedDietEntries[0].description.toLowerCase()).not.toContain("bench press");
    expect(result.parsedDietEntries[0].description.toLowerCase()).not.toContain("exercise");
  });

  it("supplements a second activity clause the model missed", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [activity({ activityType: "run", description: "ran 3 miles" })]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles this morning, and then lifted weights for 40 minutes",
      recentMessages,
      skipCoachResponse: true
    });

    // The supplemental clause is picked up by the legacy rule-based parser (not the model's
    // richer canonicalization), so it lands under that parser's own activity-type label.
    expect(result.parsedActivities).toHaveLength(2);
    expect(result.parsedActivities.map((entry) => entry.activityType)).toContain("running");
  });

  it("attributes a numeric wellness score only to its nearest cue", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        wellness: {
          present: true,
          energyScore: 2,
          sorenessScore: 4,
          moodScore: 4,
          stressScore: 0,
          motivationScore: 0,
          notes: "",
          loggedForDate: "2026-01-15"
        }
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "energy 2, sore 4",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.parsedWellnessCheckin?.energyScore).toBe(2);
    expect(result.parsedWellnessCheckin?.sorenessScore).toBe(4);
    // moodScore of 4 was returned by the model but nothing in the message ties a number to mood,
    // so it should be dropped rather than trusted at face value.
    expect(result.parsedWellnessCheckin?.moodScore).toBeNull();
  });

  it("asks how sessions were split across days when sessionSplit is ambiguous", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [
          activity({
            missingFields: ["sessionSplit"],
            ambiguityFlags: ["grouped_session_count_without_distribution"]
          })
        ]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles twice this week",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.assistantMessageType).toBe("clarification_request");
    expect(result.reply).toContain("split across the days");
  });

  it("asks when it happened when loggedForDate is missing", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(
      baseExtraction({
        activities: [activity({ missingFields: ["loggedForDate"] })]
      })
    );
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles this morning",
      recentMessages,
      skipCoachResponse: true
    });

    expect(result.assistantMessageType).toBe("clarification_request");
    expect(result.reply).toContain("when did it happen");
  });
});
