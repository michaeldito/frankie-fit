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

const recentMessages: ChatMessage[] = [];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("orchestrateFrankieReply", () => {
  it("falls back to rule-based parsing when no API key is configured", async () => {
    hasOpenAiApiKey.mockReturnValue(false);
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles this morning",
      recentMessages
    });

    expect(result.orchestrationMode).toBe("rule_based_fallback");
    expect(result.metadata.extractionSource).toBe("rule_based");
    expect(result.metadata.usedOpenAi).toBe(false);
    expect(createStructuredOpenAiResponse).not.toHaveBeenCalled();
  });

  it("falls back to rule-based parsing when the model call throws", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockRejectedValue(new Error("network down"));
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "ran 3 miles",
      recentMessages
    });

    expect(result.orchestrationMode).toBe("rule_based_fallback");
    expect(result.metadata.fallbackReason).toBe("network down");
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

  it("falls back to the rule-based reply text when the model returns an empty reply", async () => {
    hasOpenAiApiKey.mockReturnValue(true);
    createStructuredOpenAiResponse.mockResolvedValue(baseExtraction());
    createTextOpenAiResponse.mockResolvedValue("");
    const { orchestrateFrankieReply } = await importOrchestrator();

    const result = await orchestrateFrankieReply({
      profile: null,
      message: "hello there",
      recentMessages
    });

    expect(result.assistantMessageType).toBe("chat");
    expect(result.reply).toContain("ready to help");
  });
});
