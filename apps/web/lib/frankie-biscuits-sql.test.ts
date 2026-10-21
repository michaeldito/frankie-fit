import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BISCUIT_EARN_RULES, FRANKIE_ACTIONS, FRANKIE_NEEDS } from "@frankie-fit/companion-core";

// companion-core's rules are enforced by SQL in the biscuits migration; keep the two in sync.
const migration = readFileSync(
  new URL("../../../supabase/migrations/20261021090000_frankie_biscuits.sql", import.meta.url),
  "utf8"
);

describe("rules mirror the SQL that enforces them", () => {
  it("charges the same cost for every action as redeem_frankie_action", () => {
    const sqlCost = Number(/v_cost constant integer := (\d+);/.exec(migration)?.[1]);
    for (const need of FRANKIE_NEEDS) {
      expect(FRANKIE_ACTIONS[need].cost).toBe(sqlCost);
    }
  });

  it("accepts exactly the same action kinds", () => {
    const kinds = /p_kind not in \(([^)]*)\)/.exec(migration)?.[1].match(/'(\w+)'/g)?.map((k) => k.slice(1, -1));
    expect(kinds).toEqual([...FRANKIE_NEEDS]);
  });

  it("awards the same log reward and full-bowl bonus as award_biscuits", () => {
    expect(migration).toContain(`select v_user, ${BISCUIT_EARN_RULES.perPillarPerDay}, 'log_reward'`);
    expect(migration).toContain(`values (v_user, ${BISCUIT_EARN_RULES.fullBowlBonus}, 'full_bowl_bonus'`);
  });
});

