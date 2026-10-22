import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pillar } from "@frankie-fit/brand-core";
import {
  careStreak,
  computeFrankieDay,
  needFromReason,
  type FrankieDay,
  type FrankieNeed
} from "@frankie-fit/companion-core";
import { addDays, fromDateKey, getPacificDateKey, getPacificHour, toDateKey } from "@frankie-fit/dashboard-core";
import type { Database } from "@/types/database";

type FrankieSupabaseClient = SupabaseClient<Database>;

export type BiscuitAward = {
  earned: number;
  fullBowl: boolean;
  pillars: Pillar[];
};

export type FrankieDayPayload = FrankieDay & { earnedToday: number };

const STREAK_LOOKBACK_DAYS = 120;

/** Credits biscuits for anything logged on the given Pacific day. Safe to call repeatedly. */
export async function awardBiscuits(
  supabase: FrankieSupabaseClient,
  dateKey: string = getPacificDateKey()
): Promise<BiscuitAward> {
  const { data, error } = await supabase.rpc("award_biscuits", { p_date_key: dateKey });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return {
    earned: rows.reduce((total, row) => total + row.delta, 0),
    fullBowl: rows.some((row) => row.reason === "full_bowl_bonus"),
    pillars: rows.flatMap((row) => (row.pillar ? [row.pillar] : []))
  };
}

export function summarizeLedger(
  rows: { delta: number; reason: string; date_key: string }[],
  todayKey: string
): { balance: number; earnedToday: number; needsFilledToday: FrankieNeed[]; careDates: string[] } {
  let balance = 0;
  let earnedToday = 0;
  const needsFilledToday: FrankieNeed[] = [];
  const careDates: string[] = [];

  for (const row of rows) {
    balance += row.delta;
    const need = needFromReason(row.reason);

    if (need) {
      careDates.push(row.date_key);
      if (row.date_key === todayKey) needsFilledToday.push(need);
    } else if (row.date_key === todayKey && row.delta > 0) {
      earnedToday += row.delta;
    }
  }

  return { balance, earnedToday, needsFilledToday, careDates };
}

export async function loadFrankieDay(supabase: FrankieSupabaseClient, userId: string): Promise<FrankieDayPayload> {
  const todayKey = getPacificDateKey();
  await awardBiscuits(supabase, todayKey);

  // The whole ledger is needed for the balance; at one row per pillar/action per day it stays small.
  const { data, error } = await supabase
    .from("biscuit_ledger")
    .select("delta, reason, date_key")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const summary = summarizeLedger(data ?? [], todayKey);
  const streakSince = toDateKey(addDays(fromDateKey(todayKey), -STREAK_LOOKBACK_DAYS));
  const day = computeFrankieDay({
    balance: summary.balance,
    needsFilledToday: summary.needsFilledToday,
    hourPacific: getPacificHour(),
    careStreak: careStreak(
      summary.careDates.filter((date) => date >= streakSince),
      todayKey
    )
  });

  return { ...day, earnedToday: summary.earnedToday };
}

export type RedeemResult =
  | { ok: true; day: FrankieDayPayload }
  | { ok: false; error: "unknown_action" | "already_filled" | "not_enough_biscuits"; status: 400 | 409 };

export async function redeemFrankieAction(
  supabase: FrankieSupabaseClient,
  userId: string,
  need: FrankieNeed
): Promise<RedeemResult> {
  const { data, error } = await supabase.rpc("redeem_frankie_action", { p_kind: need });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as { ok: boolean; error?: string } | null;

  if (!result?.ok) {
    const reason = result?.error;
    if (reason === "already_filled" || reason === "not_enough_biscuits") {
      return { ok: false, error: reason, status: 409 };
    }
    return { ok: false, error: "unknown_action", status: 400 };
  }

  return { ok: true, day: await loadFrankieDay(supabase, userId) };
}

type ReplyMessage = { id: string; message_type?: string | null; structured_payload?: unknown };

function loggedDatesIn(payload: unknown): string[] {
  const logs = (payload ?? {}) as Record<string, unknown>;
  const entries = [
    ...((logs.activitiesLogged as unknown[]) ?? []),
    ...((logs.dietLogged as unknown[]) ?? []),
    ...((logs.lifestyleLogged as unknown[]) ?? []),
    ...(logs.wellnessLogged ? [logs.wellnessLogged] : [])
  ] as { loggedForDate?: string | null }[];

  return entries.flatMap((entry) => (entry?.loggedForDate ? [entry.loggedForDate] : []));
}

/**
 * Credits biscuits right after a reply that logged something, so the chat can show "+1 🦴" on it.
 * Never fails the chat turn: if the ledger isn't available the reply still goes out.
 */
export async function awardBiscuitsForReply(
  supabase: FrankieSupabaseClient,
  reply: ReplyMessage | undefined
): Promise<(BiscuitAward & { messageId: string }) | null> {
  if (!reply || reply.message_type !== "log_confirmation") {
    return null;
  }

  const dates = new Set([getPacificDateKey(), ...loggedDatesIn(reply.structured_payload)]);

  try {
    const awards = await Promise.all([...dates].map((date) => awardBiscuits(supabase, date)));
    const total: BiscuitAward = {
      earned: awards.reduce((sum, award) => sum + award.earned, 0),
      fullBowl: awards.some((award) => award.fullBowl),
      pillars: awards.flatMap((award) => award.pillars)
    };
    return total.earned > 0 ? { ...total, messageId: reply.id } : null;
  } catch {
    return null;
  }
}
