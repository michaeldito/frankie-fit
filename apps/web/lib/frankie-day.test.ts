import { afterEach, describe, expect, it, vi } from "vitest";
import { awardBiscuits, awardBiscuitsForReply, loadFrankieDay, redeemFrankieAction, summarizeLedger } from "./frankie-day";

type RpcResult = { data: unknown; error: { message: string } | null };

function fakeSupabase(options: {
  rpc?: (name: string, args: Record<string, unknown>) => RpcResult;
  ledger?: { delta: number; reason: string; date_key: string }[];
}) {
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) =>
    options.rpc ? options.rpc(name, args) : { data: [], error: null }
  );
  const from = vi.fn(() => ({
    select: () => ({ eq: async () => ({ data: options.ledger ?? [], error: null }) })
  }));
  return { client: { rpc, from } as never, rpc };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("summarizeLedger", () => {
  it("totals the jar, today's earnings, and today's filled needs", () => {
    const summary = summarizeLedger(
      [
        { delta: 1, reason: "log_reward", date_key: "2026-10-19" },
        { delta: -1, reason: "care_walk", date_key: "2026-10-19" },
        { delta: 1, reason: "log_reward", date_key: "2026-10-20" },
        { delta: 1, reason: "full_bowl_bonus", date_key: "2026-10-20" },
        { delta: -1, reason: "care_feed", date_key: "2026-10-20" }
      ],
      "2026-10-20"
    );

    expect(summary).toEqual({
      balance: 1,
      earnedToday: 2,
      needsFilledToday: ["feed"],
      careDates: ["2026-10-19", "2026-10-20"]
    });
  });
});

describe("awardBiscuits", () => {
  it("summarizes newly credited rows", async () => {
    const { client, rpc } = fakeSupabase({
      rpc: () => ({
        data: [
          { delta: 1, reason: "log_reward", pillar: "diet" },
          { delta: 1, reason: "full_bowl_bonus", pillar: null }
        ],
        error: null
      })
    });

    await expect(awardBiscuits(client, "2026-10-20")).resolves.toEqual({ earned: 2, fullBowl: true, pillars: ["diet"] });
    expect(rpc).toHaveBeenCalledWith("award_biscuits", { p_date_key: "2026-10-20" });
  });

  it("throws on RPC errors", async () => {
    const { client } = fakeSupabase({ rpc: () => ({ data: null, error: { message: "boom" } }) });
    await expect(awardBiscuits(client, "2026-10-20")).rejects.toThrow("boom");
  });
});

describe("awardBiscuitsForReply", () => {
  it("ignores replies that didn't log anything", async () => {
    const { client, rpc } = fakeSupabase({});
    await expect(awardBiscuitsForReply(client, { id: "m1", message_type: "chat" })).resolves.toBeNull();
    await expect(awardBiscuitsForReply(client, undefined)).resolves.toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("awards today plus any back-dated log days and tags the message", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T19:00:00Z"));
    const { client, rpc } = fakeSupabase({
      rpc: (_name, args) => ({
        data: args.p_date_key === "2026-10-19" ? [{ delta: 1, reason: "log_reward", pillar: "exercise" }] : [],
        error: null
      })
    });

    const award = await awardBiscuitsForReply(client, {
      id: "m2",
      message_type: "log_confirmation",
      structured_payload: { activitiesLogged: [{ loggedForDate: "2026-10-19" }], wellnessLogged: { loggedForDate: null } }
    });

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(award).toEqual({ earned: 1, fullBowl: false, pillars: ["exercise"], messageId: "m2" });
  });

  it("returns null instead of failing the chat turn", async () => {
    const { client } = fakeSupabase({ rpc: () => ({ data: null, error: { message: "missing function" } }) });
    await expect(awardBiscuitsForReply(client, { id: "m3", message_type: "log_confirmation" })).resolves.toBeNull();
  });
});

describe("loadFrankieDay / redeemFrankieAction", () => {
  it("builds the day from the ledger", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T19:00:00Z"));
    const { client } = fakeSupabase({
      ledger: [
        { delta: 1, reason: "log_reward", date_key: "2026-10-20" },
        { delta: 1, reason: "log_reward", date_key: "2026-10-20" },
        { delta: -1, reason: "care_feed", date_key: "2026-10-20" }
      ]
    });

    const day = await loadFrankieDay(client, "user-1");
    expect(day.balance).toBe(1);
    expect(day.earnedToday).toBe(2);
    expect(day.needs.feed).toBe("filled");
    expect(day.careStreak).toBe(1);
  });

  it.each([
    ["already_filled", 409],
    ["not_enough_biscuits", 409],
    ["unknown_action", 400]
  ])("maps a %s refusal to %i", async (reason, status) => {
    const { client } = fakeSupabase({ rpc: () => ({ data: { ok: false, error: reason }, error: null }) });
    await expect(redeemFrankieAction(client, "user-1", "feed")).resolves.toEqual({ ok: false, error: reason, status });
  });

  it("returns the refreshed day after a spend", async () => {
    const { client } = fakeSupabase({
      rpc: (name) => (name === "redeem_frankie_action" ? { data: { ok: true, balance: 0 }, error: null } : { data: [], error: null }),
      ledger: [{ delta: -1, reason: "care_walk", date_key: "2026-10-20" }]
    });

    const result = await redeemFrankieAction(client, "user-1", "walk");
    expect(result.ok).toBe(true);
  });
});
