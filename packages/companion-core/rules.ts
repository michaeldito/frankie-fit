import type { FrankieMood } from "@frankie-fit/brand-core";

// The numbers here are mirrored in supabase/migrations/20261021090000_frankie_biscuits.sql
// (award_biscuits / redeem_frankie_action); apps/web/lib/frankie-biscuits-sql.test.ts keeps them in sync.
export const BISCUIT_EARN_RULES = {
  perPillarPerDay: 1,
  fullBowlBonus: 1
} as const;

export const FRANKIE_NEEDS = ["feed", "walk", "play", "snuggle"] as const;

export type FrankieNeed = (typeof FRANKIE_NEEDS)[number];

export type FrankieAction = {
  cost: number;
  label: string;
  needLabel: string;
  moodBefore: FrankieMood;
  moodAfter: FrankieMood;
  reaction: string;
};

export const FRANKIE_ACTIONS: Record<FrankieNeed, FrankieAction> = {
  feed: {
    cost: 1,
    label: "Feed Frankie a biscuit",
    needLabel: "Fed",
    moodBefore: "hungry",
    moodAfter: "happy",
    reaction: "Best. Biscuit. Ever."
  },
  walk: {
    cost: 1,
    label: "Take Frankie for a walk",
    needLabel: "Walked",
    moodBefore: "waiting",
    moodAfter: "running",
    reaction: "ZOOMIES. Thank you."
  },
  play: {
    cost: 1,
    label: "Play fetch",
    needLabel: "Played",
    moodBefore: "stretching",
    moodAfter: "happy",
    reaction: "Again! Again! …okay, one more."
  },
  snuggle: {
    cost: 1,
    label: "Snuggle",
    needLabel: "Cozy",
    moodBefore: "snuggle",
    moodAfter: "snuggle",
    reaction: "This is the good stuff."
  }
};

export function isFrankieNeed(value: unknown): value is FrankieNeed {
  return typeof value === "string" && (FRANKIE_NEEDS as readonly string[]).includes(value);
}

export function careReason(need: FrankieNeed): `care_${FrankieNeed}` {
  return `care_${need}`;
}

export function needFromReason(reason: string): FrankieNeed | null {
  const need = reason.startsWith("care_") ? reason.slice("care_".length) : null;
  return isFrankieNeed(need) ? need : null;
}
