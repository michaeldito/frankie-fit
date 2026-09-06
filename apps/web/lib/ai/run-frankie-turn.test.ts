import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FrankieOrchestrationResult } from "@/lib/ai/orchestrator/frankie-orchestrator";

const orchestrateFrankieReply = vi.fn();
const recordAiTraceRun = vi.fn();
const logActivityEntries = vi.fn();
const logDietEntries = vi.fn();
const logLifestyleEntries = vi.fn();
const logWellnessCheckin = vi.fn();
const getLatestCoachSummary = vi.fn();

vi.mock("@/lib/ai/orchestrator/frankie-orchestrator", () => ({
  orchestrateFrankieReply: (...args: unknown[]) => orchestrateFrankieReply(...args)
}));
vi.mock("@/lib/ai/tracing/ai-trace-runs", () => ({
  recordAiTraceRun: (...args: unknown[]) => recordAiTraceRun(...args)
}));
vi.mock("@/lib/ai/tools/log-activity", () => ({
  logActivityEntries: (...args: unknown[]) => logActivityEntries(...args)
}));
vi.mock("@/lib/ai/tools/log-diet", () => ({
  logDietEntries: (...args: unknown[]) => logDietEntries(...args)
}));
vi.mock("@/lib/ai/tools/log-lifestyle", () => ({
  logLifestyleEntries: (...args: unknown[]) => logLifestyleEntries(...args)
}));
vi.mock("@/lib/ai/tools/log-wellness", () => ({
  logWellnessCheckin: (...args: unknown[]) => logWellnessCheckin(...args)
}));
vi.mock("@/lib/ai/summaries/frankie-summaries", () => ({
  getLatestCoachSummary: (...args: unknown[]) => getLatestCoachSummary(...args)
}));

import { buildAssistantStructuredPayload, derivePendingClarification, runFrankieTurn } from "./run-frankie-turn";

function buildReply(overrides: Partial<FrankieOrchestrationResult> = {}): FrankieOrchestrationResult {
  return {
    assistantMessageType: "chat",
    parsedActivities: [],
    parsedDietEntries: [],
    parsedLifestyleEntries: [],
    parsedWellnessCheckin: null,
    reply: "Nice work!",
    orchestrationMode: "model",
    shouldPersistStructuredData: false,
    persistPlan: {
      activities: false,
      dietEntries: false,
      lifestyleEntries: false,
      wellnessCheckin: false
    },
    metadata: {
      extractionSource: "model",
      usedOpenAi: true,
      promptVersion: "v1"
    },
    ...overrides
  };
}

function fakeSupabase(input: {
  existingMessage?: { id: string; [key: string]: unknown } | null;
  existingMessageError?: { message: string } | null;
  insertedUserMessage?: { id: string; [key: string]: unknown };
  insertedAssistantMessage?: { id: string; [key: string]: unknown } | null;
  insertedAssistantMessageError?: { message: string } | null;
}) {
  const from = vi.fn((table: string) => {
    if (table !== "conversation_messages") {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: input.existingMessage ?? null,
            error: input.existingMessageError ?? null
          })
        })
      }),
      insert: (row: { role: string }) => ({
        select: () => ({
          single: async () => {
            if (row.role === "user") {
              return {
                data: input.insertedUserMessage ?? { id: "user-msg-1" },
                error: null
              };
            }

            return {
              data:
                input.insertedAssistantMessage === undefined
                  ? { id: "assistant-msg-1" }
                  : input.insertedAssistantMessage,
              error: input.insertedAssistantMessageError ?? null
            };
          }
        })
      })
    };
  });

  return { from } as never;
}

const baseInput = {
  displayName: "Jamie",
  message: "ran 3 miles",
  profile: null,
  recentMessages: [],
  threadId: "thread-1",
  threadTitle: "Jamie's Frankie chat",
  userEmail: "jamie@example.com",
  userId: "user-1"
};

describe("runFrankieTurn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLatestCoachSummary.mockResolvedValue(null);
    recordAiTraceRun.mockResolvedValue("trace-1");
  });

  it("completes a happy-path turn and includes persisted ids in the structured payload", async () => {
    orchestrateFrankieReply.mockResolvedValue(
      buildReply({
        shouldPersistStructuredData: true,
        persistPlan: {
          activities: true,
          dietEntries: false,
          lifestyleEntries: false,
          wellnessCheckin: false
        },
        parsedActivities: [
          {
            activityType: "running",
            description: "ran 3 miles",
            activityCategory: "cardio",
            sessionCount: 1,
            durationMinutes: 30,
            intensity: "Moderate",
            timeReferenceText: "today",
            loggedForDate: "2026-05-04",
            timePrecision: "explicit_day",
            confidence: 0.9,
            missingFields: [],
            ambiguityFlags: [],
            detectedKeyword: "ran"
          }
        ]
      })
    );
    logActivityEntries.mockResolvedValue(["activity-log-1"]);

    const supabase = fakeSupabase({});
    const result = await runFrankieTurn({ ...baseInput, supabase });

    expect(result.runStatus).toBe("completed");
    expect(result.assistantMessage?.id).toBe("assistant-msg-1");
    const payload = result.structuredPayload as { activitiesLogged: Array<{ id: string }> };
    expect(payload.activitiesLogged[0].id).toBe("activity-log-1");
  });

  it("classifies an unavailable orchestration mode as runStatus 'unavailable'", async () => {
    orchestrateFrankieReply.mockResolvedValue(
      buildReply({ orchestrationMode: "unavailable", metadata: { extractionSource: "unavailable", usedOpenAi: false, promptVersion: "v1" } })
    );

    const supabase = fakeSupabase({});
    const result = await runFrankieTurn({ ...baseInput, supabase });

    expect(result.runStatus).toBe("unavailable");
  });

  it("returns a pendingClarification structured payload when the reply asks a clarifying question", async () => {
    orchestrateFrankieReply.mockResolvedValue(
      buildReply({
        assistantMessageType: "clarification_request",
        metadata: {
          extractionSource: "model",
          usedOpenAi: true,
          promptVersion: "v1",
          needsClarification: true,
          pendingClarification: {
            originalMessage: "ran 3 miles",
            clarificationQuestion: "When did you run?"
          }
        }
      })
    );

    const supabase = fakeSupabase({});
    const result = await runFrankieTurn({ ...baseInput, supabase });

    expect(result.runStatus).toBe("clarification");
    expect(result.structuredPayload).toEqual({
      pendingClarification: {
        originalMessage: "ran 3 miles",
        clarificationQuestion: "When did you run?"
      }
    });
  });

  it("reuses an existing message instead of inserting a new one when sourceMessageId is provided", async () => {
    orchestrateFrankieReply.mockResolvedValue(buildReply());
    const supabase = fakeSupabase({
      existingMessage: { id: "existing-msg-1", content: "ran 3 miles" }
    });

    const result = await runFrankieTurn({
      ...baseInput,
      sourceMessageId: "existing-msg-1",
      supabase
    });

    expect(result.userMessage.id).toBe("existing-msg-1");
  });

  it("returns runStatus 'log_write_failed' when a structured log write throws", async () => {
    orchestrateFrankieReply.mockResolvedValue(
      buildReply({
        shouldPersistStructuredData: true,
        persistPlan: {
          activities: true,
          dietEntries: false,
          lifestyleEntries: false,
          wellnessCheckin: false
        },
        parsedActivities: [
          {
            activityType: "running",
            description: "ran 3 miles",
            activityCategory: "cardio",
            sessionCount: 1,
            durationMinutes: 30,
            intensity: "Moderate",
            timeReferenceText: "today",
            loggedForDate: "2026-05-04",
            timePrecision: "explicit_day",
            confidence: 0.9,
            missingFields: [],
            ambiguityFlags: [],
            detectedKeyword: "ran"
          }
        ]
      })
    );
    logActivityEntries.mockRejectedValue(new Error("insert failed"));

    const supabase = fakeSupabase({});
    const result = await runFrankieTurn({ ...baseInput, supabase });

    expect(result.runStatus).toBe("log_write_failed");
    expect(result.assistantMessage).toBeNull();
    expect(result.errorMessage).toBe("insert failed");
  });

  it("returns runStatus 'assistant_message_failed' when the assistant message insert fails", async () => {
    orchestrateFrankieReply.mockResolvedValue(buildReply());

    const supabase = fakeSupabase({
      insertedAssistantMessage: null,
      insertedAssistantMessageError: { message: "insert failed" }
    });

    const result = await runFrankieTurn({ ...baseInput, supabase });

    expect(result.runStatus).toBe("assistant_message_failed");
    expect(result.assistantMessage).toBeNull();
    expect(result.errorMessage).toBe("insert failed");
  });
});

describe("derivePendingClarification", () => {
  it("returns undefined when there is no previous message", () => {
    expect(derivePendingClarification(undefined)).toBeUndefined();
  });

  it("returns undefined when the previous message is not a clarification request", () => {
    expect(
      derivePendingClarification({
        role: "assistant",
        message_type: "chat",
        structured_payload: { pendingClarification: { originalMessage: "x", clarificationQuestion: "y" } }
      } as never)
    ).toBeUndefined();
  });

  it("extracts pendingClarification from a clarification_request message", () => {
    const pendingClarification = { originalMessage: "ran", clarificationQuestion: "when?" };

    expect(
      derivePendingClarification({
        role: "assistant",
        message_type: "clarification_request",
        structured_payload: { pendingClarification }
      } as never)
    ).toEqual(pendingClarification);
  });
});

describe("buildAssistantStructuredPayload", () => {
  it("returns an empty object when there is nothing to log and no clarification pending", () => {
    const payload = buildAssistantStructuredPayload({
      persistedLogIds: { activityLogIds: [], dietLogIds: [], lifestyleLogIds: [], wellnessCheckinIds: [] },
      reply: buildReply()
    });

    expect(payload).toEqual({});
  });
});
