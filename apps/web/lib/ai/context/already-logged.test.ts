import { describe, expect, it } from "vitest";
import { formatAlreadyLoggedEntries, loadAlreadyLoggedEntries } from "./already-logged";

function fakeSupabase(tables: Record<string, unknown[] | null>) {
  const calls: { table: string; since?: string }[] = [];
  const from = (table: string) => {
    const call: { table: string; since?: string } = { table };
    calls.push(call);
    const chain = {
      select: () => chain,
      eq: () => chain,
      gte: (_column: string, value: string) => {
        call.since = value;
        return chain;
      },
      order: () => chain,
      limit: async () => ({ data: tables[table] ?? null, error: tables[table] ? null : { message: "nope" } })
    };
    return chain;
  };
  return { client: { from } as never, calls };
}

describe("loadAlreadyLoggedEntries", () => {
  it("summarizes today's and yesterday's activity, meals, and lifestyle logs", async () => {
    const { client, calls } = fakeSupabase({
      activity_logs: [
        {
          activity_type: "weight lifting",
          description: "benched with some tri and bi work",
          intensity: "Hard",
          duration_minutes: null,
          logged_for_date: "2026-10-21"
        },
        { activity_type: "running", description: "running", intensity: null, duration_minutes: 30, logged_for_date: "2026-10-20" }
      ],
      diet_logs: [
        { description: "hot dogs", meal_type: "lunch", logged_for_date: "2026-10-21" },
        { description: "an apple", meal_type: "unknown", logged_for_date: "2026-10-21" }
      ],
      lifestyle_logs: [{ description: "movie night", category: "entertainment", logged_for_date: "2026-10-21" }]
    });

    const entries = await loadAlreadyLoggedEntries({ supabase: client, userId: "user-1", todayKey: "2026-10-21" });

    expect(calls.every((call) => call.since === "2026-10-20")).toBe(true);
    expect(entries.map((entry) => entry.summary)).toEqual([
      "weight lifting (benched with some tri and bi work, Hard)",
      "running (30 min)",
      "lunch: hot dogs",
      "an apple",
      "entertainment: movie night"
    ]);
  });

  it("returns what it can when a table fails to load", async () => {
    const { client } = fakeSupabase({ activity_logs: null, diet_logs: [], lifestyle_logs: null });
    await expect(loadAlreadyLoggedEntries({ supabase: client, userId: "user-1", todayKey: "2026-10-21" })).resolves.toEqual([]);
  });
});

describe("formatAlreadyLoggedEntries", () => {
  it("labels today's entries as today and older ones by date", () => {
    expect(
      formatAlreadyLoggedEntries(
        [
          { pillar: "activity", loggedForDate: "2026-10-21", summary: "weight lifting (Hard)" },
          { pillar: "diet", loggedForDate: "2026-10-20", summary: "dinner: tacos" }
        ],
        "2026-10-21"
      )
    ).toBe("- today · activity: weight lifting (Hard)\n- 2026-10-20 · diet: dinner: tacos");
  });
});
