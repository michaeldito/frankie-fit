import { describe, expect, it, vi } from "vitest";
import type { ParsedActivity } from "@/lib/chat";
import { logActivityEntries } from "./log-activity";

function fakeSupabase(selectResult: {
  data: Array<{ id: string }> | null;
  error: { message: string } | null;
}) {
  const select = vi.fn().mockResolvedValue(selectResult);
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as never, from, insert, select };
}

function buildActivity(overrides: Partial<ParsedActivity> = {}): ParsedActivity {
  return {
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
    ambiguityFlags: [],
    ...overrides
  };
}

describe("logActivityEntries", () => {
  it("returns an empty array without touching supabase when there are no entries", async () => {
    const { client, from } = fakeSupabase({ data: [], error: null });

    const result = await logActivityEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [],
      extractionSource: "model"
    });

    expect(result).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts one row per activity with resolved date and metadata", async () => {
    const { client, from, insert } = fakeSupabase({
      data: [{ id: "log-1" }, { id: "log-2" }],
      error: null
    });

    const result = await logActivityEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [buildActivity(), buildActivity({ activityType: "yoga", detectedKeyword: "yoga" })],
      extractionSource: "model"
    });

    expect(from).toHaveBeenCalledWith("activity_logs");
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "user-1",
        source_message_id: "msg-1",
        activity_type: "running",
        duration_minutes: 30,
        intensity: "Moderate",
        logged_for_date: "2026-05-04",
        metadata_json: expect.objectContaining({
          extractionSource: "model",
          detectedKeyword: "running",
          segmentIndex: 0,
          loggedForDate: "2026-05-04"
        })
      }),
      expect.objectContaining({
        activity_type: "yoga",
        metadata_json: expect.objectContaining({ segmentIndex: 1 })
      })
    ]);
    expect(result).toEqual(["log-1", "log-2"]);
  });

  it("falls back to today's Pacific date when loggedForDate is not a valid ISO date", async () => {
    const { insert, client } = fakeSupabase({ data: [{ id: "log-1" }], error: null });

    await logActivityEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [buildActivity({ loggedForDate: "unknown" })],
      extractionSource: "model"
    });

    const insertedRow = insert.mock.calls[0][0][0];
    expect(insertedRow.logged_for_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws when the insert fails", async () => {
    const { client } = fakeSupabase({ data: null, error: { message: "insert failed" } });

    await expect(
      logActivityEntries({
        supabase: client,
        userId: "user-1",
        sourceMessageId: "msg-1",
        entries: [buildActivity()],
        extractionSource: "model"
      })
    ).rejects.toThrow("insert failed");
  });
});
