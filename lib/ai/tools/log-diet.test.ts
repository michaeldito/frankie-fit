import { describe, expect, it, vi } from "vitest";
import type { ParsedDietEntry } from "@/lib/chat";
import { logDietEntries } from "./log-diet";

function fakeSupabase(selectResult: {
  data: Array<{ id: string }> | null;
  error: { message: string } | null;
}) {
  const select = vi.fn().mockResolvedValue(selectResult);
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as never, from, insert, select };
}

function buildDietEntry(overrides: Partial<ParsedDietEntry> = {}): ParsedDietEntry {
  return {
    description: "chicken and rice",
    mealType: "dinner",
    confidence: 0.9,
    detectedKeyword: "dinner",
    timeReferenceText: "tonight",
    loggedForDate: "2026-05-04",
    ...overrides
  };
}

describe("logDietEntries", () => {
  it("returns an empty array without touching supabase when there are no entries", async () => {
    const { client, from } = fakeSupabase({ data: [], error: null });

    const result = await logDietEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [],
      extractionSource: "model"
    });

    expect(result).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts one row per diet entry with resolved date and metadata", async () => {
    const { client, from, insert } = fakeSupabase({
      data: [{ id: "diet-1" }],
      error: null
    });

    const result = await logDietEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [buildDietEntry()],
      extractionSource: "model"
    });

    expect(from).toHaveBeenCalledWith("diet_logs");
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "user-1",
        source_message_id: "msg-1",
        description: "chicken and rice",
        meal_type: "dinner",
        confidence: 0.9,
        logged_for_date: "2026-05-04",
        metadata_json: expect.objectContaining({
          extractionSource: "model",
          detectedKeyword: "dinner",
          segmentIndex: 0
        })
      })
    ]);
    expect(result).toEqual(["diet-1"]);
  });

  it("falls back to today's Pacific date when loggedForDate is not a valid ISO date", async () => {
    const { insert, client } = fakeSupabase({ data: [{ id: "diet-1" }], error: null });

    await logDietEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [buildDietEntry({ loggedForDate: "unknown" })],
      extractionSource: "model"
    });

    const insertedRow = insert.mock.calls[0][0][0];
    expect(insertedRow.logged_for_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws when the insert fails", async () => {
    const { client } = fakeSupabase({ data: null, error: { message: "insert failed" } });

    await expect(
      logDietEntries({
        supabase: client,
        userId: "user-1",
        sourceMessageId: "msg-1",
        entries: [buildDietEntry()],
        extractionSource: "model"
      })
    ).rejects.toThrow("insert failed");
  });
});
