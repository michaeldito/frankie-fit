import { describe, expect, it, vi } from "vitest";
import type { ParsedWellnessCheckin } from "@/lib/chat";
import { logWellnessCheckin } from "./log-wellness";

function fakeSupabase(selectResult: {
  data: Array<{ id: string }> | null;
  error: { message: string } | null;
}) {
  const select = vi.fn().mockResolvedValue(selectResult);
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as never, from, insert, select };
}

function buildCheckin(overrides: Partial<ParsedWellnessCheckin> = {}): ParsedWellnessCheckin {
  return {
    energyScore: 4,
    sorenessScore: 2,
    moodScore: null,
    stressScore: 3,
    motivationScore: null,
    notes: "energy 4, stress 3",
    detectedSignals: ["energy", "stress"],
    loggedForDate: "2026-05-04",
    ...overrides
  };
}

describe("logWellnessCheckin", () => {
  it("returns an empty array without touching supabase when there is no entry", async () => {
    const { client, from } = fakeSupabase({ data: [], error: null });

    const result = await logWellnessCheckin({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entry: null,
      extractionSource: "model"
    });

    expect(result).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts a single row with the resolved date and scores", async () => {
    const { client, from, insert } = fakeSupabase({
      data: [{ id: "wellness-1" }],
      error: null
    });

    const result = await logWellnessCheckin({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entry: buildCheckin(),
      extractionSource: "model"
    });

    expect(from).toHaveBeenCalledWith("wellness_checkins");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        source_message_id: "msg-1",
        energy_score: 4,
        soreness_score: 2,
        mood_score: null,
        stress_score: 3,
        motivation_score: null,
        notes: "energy 4, stress 3",
        logged_for_date: "2026-05-04"
      })
    );
    expect(result).toEqual(["wellness-1"]);
  });

  it("falls back to today's Pacific date when loggedForDate is not a valid ISO date", async () => {
    const { insert, client } = fakeSupabase({ data: [{ id: "wellness-1" }], error: null });

    await logWellnessCheckin({
      supabase: client,
      userId: "user-1",
      sourceMessageId: "msg-1",
      entry: buildCheckin({ loggedForDate: "unknown" }),
      extractionSource: "model"
    });

    expect(insert.mock.calls[0][0].logged_for_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws when the insert fails", async () => {
    const { client } = fakeSupabase({ data: null, error: { message: "insert failed" } });

    await expect(
      logWellnessCheckin({
        supabase: client,
        userId: "user-1",
        sourceMessageId: "msg-1",
        entry: buildCheckin(),
        extractionSource: "model"
      })
    ).rejects.toThrow("insert failed");
  });
});
