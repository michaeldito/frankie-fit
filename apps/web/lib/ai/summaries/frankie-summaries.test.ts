import { describe, expect, it, vi } from "vitest";
import { getLatestCoachSummary } from "./frankie-summaries";

function fakeSupabase(maybeSingleResult: {
  data: { summary_text: string; summary_type: "daily" | "weekly"; period_end: string } | null;
  error: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(maybeSingleResult);
  const limit = vi.fn().mockReturnValue({ maybeSingle });
  const order = vi.fn().mockReturnValue({ limit });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as never, from, select, eq, order, limit, maybeSingle };
}

describe("getLatestCoachSummary", () => {
  it("returns the most recently created summary, mapped to camelCase", async () => {
    const { client, from, order } = fakeSupabase({
      data: {
        summary_text: "Consistent training this week.",
        summary_type: "weekly",
        period_end: "2026-05-10"
      },
      error: null
    });

    const result = await getLatestCoachSummary({ supabase: client, userId: "user-1" });

    expect(from).toHaveBeenCalledWith("coach_summaries");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual({
      summaryText: "Consistent training this week.",
      summaryType: "weekly",
      periodEnd: "2026-05-10"
    });
  });

  it("returns null when the user has no summary yet", async () => {
    const { client } = fakeSupabase({ data: null, error: null });

    expect(await getLatestCoachSummary({ supabase: client, userId: "user-1" })).toBeNull();
  });

  it("returns null (rather than throwing) when the query errors", async () => {
    const { client } = fakeSupabase({ data: null, error: { message: "connection reset" } });

    expect(await getLatestCoachSummary({ supabase: client, userId: "user-1" })).toBeNull();
  });
});
