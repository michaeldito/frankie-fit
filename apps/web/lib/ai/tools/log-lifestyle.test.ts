import { describe, expect, it, vi } from "vitest";
import type { ParsedLifestyleEntry } from "@/lib/chat";
import { logLifestyleEntries } from "./log-lifestyle";

function fakeSupabase(selectResult: {
  data: Array<{ id: string }> | null;
  error: { message: string } | null;
}) {
  const select = vi.fn().mockResolvedValue(selectResult);
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as never, from, insert, select };
}

function buildLifestyleEntry(overrides: Partial<ParsedLifestyleEntry> = {}): ParsedLifestyleEntry {
  return {
    description: "beer with dinner",
    category: "substance_alcohol",
    confidence: 0.85,
    detectedKeyword: "beer",
    timeReferenceText: "tonight",
    loggedForDate: "2026-05-04",
    ...overrides
  };
}

describe("logLifestyleEntries", () => {
  it("returns an empty array without touching supabase when there are no entries", async () => {
    const { client, from } = fakeSupabase({ data: [], error: null });

    const result = await logLifestyleEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [],
      extractionSource: "model"
    });

    expect(result).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts one row per lifestyle entry with resolved date and metadata", async () => {
    const { client, from, insert } = fakeSupabase({
      data: [{ id: "lifestyle-1" }],
      error: null
    });

    const result = await logLifestyleEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [buildLifestyleEntry()],
      extractionSource: "model"
    });

    expect(from).toHaveBeenCalledWith("lifestyle_logs");
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "user-1",
        source_message_id: "msg-1",
        description: "beer with dinner",
        category: "substance_alcohol",
        logged_for_date: "2026-05-04",
        metadata_json: expect.objectContaining({
          extractionSource: "model",
          detectedKeyword: "beer",
          segmentIndex: 0,
          confidence: 0.85
        })
      })
    ]);
    expect(result).toEqual(["lifestyle-1"]);
  });

  it("defaults category to other when the entry has no category", async () => {
    const { insert, client } = fakeSupabase({ data: [{ id: "lifestyle-1" }], error: null });

    await logLifestyleEntries({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entries: [buildLifestyleEntry({ category: null })],
      extractionSource: "model"
    });

    expect(insert.mock.calls[0][0][0].category).toBe("other");
  });

  it("throws when the insert fails", async () => {
    const { client } = fakeSupabase({ data: null, error: { message: "insert failed" } });

    await expect(
      logLifestyleEntries({
        supabase: client,
        userId: "user-1",
        sourceMessageId: "msg-1",
        entries: [buildLifestyleEntry()],
        extractionSource: "model"
      })
    ).rejects.toThrow("insert failed");
  });
});
