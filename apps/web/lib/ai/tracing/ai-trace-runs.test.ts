import { describe, expect, it, vi } from "vitest";
import type { FrankieOrchestrationResult } from "@/lib/ai/orchestrator/frankie-orchestrator";
import { recordAiTraceRun } from "./ai-trace-runs";

function fakeSupabase(singleResult: {
  data: { id: string } | null;
  error: { message: string; details?: string; hint?: string; code?: string } | null;
}) {
  const single = vi.fn().mockResolvedValue(singleResult);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as never, from, insert, select, single };
}

function buildReply(overrides: Partial<FrankieOrchestrationResult> = {}): FrankieOrchestrationResult {
  return {
    assistantMessageType: "log_confirmation",
    parsedActivities: [
      {
        activityType: "running",
        activityCategory: "cardio",
        sessionCount: 1,
        durationMinutes: 30,
        intensity: "Moderate",
        timeReferenceText: "today",
        description: "ran 30 minutes",
        detectedKeyword: "running",
        loggedForDate: "2026-05-04",
        timePrecision: "explicit_day",
        confidence: 0.9,
        missingFields: [],
        ambiguityFlags: []
      }
    ],
    parsedDietEntries: [],
    parsedLifestyleEntries: [],
    parsedWellnessCheckin: null,
    reply: "Nice, logged your run.",
    orchestrationMode: "model",
    shouldPersistStructuredData: true,
    persistPlan: {
      activities: true,
      dietEntries: false,
      lifestyleEntries: false,
      wellnessCheckin: false
    },
    metadata: {
      extractionSource: "model",
      usedOpenAi: true,
      promptVersion: "frankie-orchestrator-v10"
    },
    ...overrides
  };
}

function emptyPersistedLogIds() {
  return {
    activityLogIds: ["log-1"],
    dietLogIds: [],
    lifestyleLogIds: [],
    wellnessCheckinIds: []
  };
}

function buildInput(overrides: Partial<Parameters<typeof recordAiTraceRun>[0]> = {}) {
  const { client } = fakeSupabase({ data: { id: "trace-1" }, error: null });

  return {
    displayName: "Alex",
    persistedLogIds: emptyPersistedLogIds(),
    profile: null,
    reply: buildReply(),
    runStatus: "completed" as const,
    sourceMessageId: "msg-1",
    supabase: client,
    threadId: "thread-1",
    threadTitle: "Alex's Frankie chat",
    userEmail: "alex@example.com",
    userId: "user-1",
    userMessage: "ran 30 minutes",
    ...overrides
  };
}

describe("recordAiTraceRun", () => {
  it("inserts a trace row and returns its id on success", async () => {
    const { client, from, insert } = fakeSupabase({ data: { id: "trace-1" }, error: null });

    const result = await recordAiTraceRun(buildInput({ supabase: client }));

    expect(from).toHaveBeenCalledWith("ai_trace_runs");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        thread_id: "thread-1",
        source_message_id: "msg-1",
        orchestration_mode: "model",
        prompt_version: "frankie-orchestrator-v10",
        run_status: "completed",
        persisted_log_ids: expect.objectContaining({ activityLogIds: ["log-1"] }),
        tool_calls: [expect.objectContaining({ name: "log_activity", entryCount: 1 })]
      })
    );
    expect(result).toBe("trace-1");
  });

  it("builds an empty profile snapshot when there is no profile", async () => {
    const { client, insert } = fakeSupabase({ data: { id: "trace-1" }, error: null });

    await recordAiTraceRun(buildInput({ supabase: client, profile: null }));

    expect(insert.mock.calls[0][0].profile_snapshot).toEqual({});
  });

  it("omits tool calls for pillars that weren't persisted", async () => {
    const { client, insert } = fakeSupabase({ data: { id: "trace-1" }, error: null });

    await recordAiTraceRun(
      buildInput({
        supabase: client,
        reply: buildReply({
          persistPlan: {
            activities: false,
            dietEntries: false,
            lifestyleEntries: false,
            wellnessCheckin: false
          }
        })
      })
    );

    expect(insert.mock.calls[0][0].tool_calls).toEqual([]);
  });

  it("includes a tool call for every pillar that was persisted", async () => {
    const { client, insert } = fakeSupabase({ data: { id: "trace-1" }, error: null });

    await recordAiTraceRun(
      buildInput({
        supabase: client,
        reply: buildReply({
          parsedDietEntries: [
            {
              description: "eggs",
              mealType: "breakfast",
              confidence: 0.9,
              detectedKeyword: "breakfast",
              timeReferenceText: "today",
              loggedForDate: "2026-05-04"
            }
          ],
          parsedLifestyleEntries: [
            {
              description: "beer with dinner",
              category: "substance_alcohol",
              confidence: 0.85,
              detectedKeyword: "beer",
              timeReferenceText: "tonight",
              loggedForDate: "2026-05-04"
            }
          ],
          parsedWellnessCheckin: {
            energyScore: 4,
            sorenessScore: null,
            moodScore: null,
            stressScore: null,
            motivationScore: null,
            notes: "energy 4",
            detectedSignals: ["energy"],
            loggedForDate: "2026-05-04"
          },
          persistPlan: {
            activities: true,
            dietEntries: true,
            lifestyleEntries: true,
            wellnessCheckin: true
          }
        })
      })
    );

    const insertedRow = insert.mock.calls[0][0];
    expect(insertedRow.tool_calls).toEqual([
      { name: "log_activity", entryCount: 1 },
      { name: "log_diet", entryCount: 1 },
      { name: "log_lifestyle", entryCount: 1 },
      { name: "log_wellness", entryCount: 1 }
    ]);
    expect(insertedRow.extracted_payload.dietEntries).toHaveLength(1);
    expect(insertedRow.extracted_payload.lifestyleEntries).toHaveLength(1);
    expect(insertedRow.extracted_payload.wellnessCheckin).toEqual(
      expect.objectContaining({ energyScore: 4 })
    );
  });

  it("logs the error and returns null when the insert fails, without throwing", async () => {
    const { client } = fakeSupabase({
      data: null,
      error: { message: "insert failed", code: "23505" }
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await recordAiTraceRun(buildInput({ supabase: client }));

    expect(result).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to record ai_trace_run",
      expect.objectContaining({ message: "insert failed", userId: "user-1" })
    );

    consoleError.mockRestore();
  });
});
