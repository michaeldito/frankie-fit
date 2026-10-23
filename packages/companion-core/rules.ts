import type { FrankieMood } from "@frankie-fit/brand-core";

// The numbers here are mirrored by the biscuit migrations in supabase/migrations
// (award_biscuits / redeem_frankie_action); apps/web/lib/frankie-biscuits-sql.test.ts keeps them in sync.
export const BISCUIT_EARN_RULES = {
  perLog: 1,
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
    label: "Take Frankie for a run",
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

// The in-app "How biscuits work" breakdown, shared by web and mobile so both explain the same rules.
export const HOW_BISCUITS_WORK: { heading: string; points: string[] }[] = [
  {
    heading: "Earn",
    points: [
      `+${BISCUIT_EARN_RULES.perLog} 🦴 for every workout, meal, check-in, or lifestyle update you log`,
      `+${BISCUIT_EARN_RULES.fullBowlBonus} 🦴 bonus when you log all four areas in one day`,
      "Logs dated more than a week back don't earn, and deleting a log never takes a biscuit back"
    ]
  },
  {
    heading: "Spend",
    points: [
      `Feed, walk, play, and snuggle cost ${FRANKIE_ACTIONS.feed.cost} 🦴 each`,
      "Each costs a biscuit once a day, then replays free on the Frankie Boy; do all four for a Good Boy Day 👑",
      "Belly rubs are always free. Tap Frankie"
    ]
  },
  {
    heading: "Every day",
    points: [
      "Frankie's needs reset at midnight Pacific",
      "Biscuits you don't spend stay in the jar"
    ]
  }
];
