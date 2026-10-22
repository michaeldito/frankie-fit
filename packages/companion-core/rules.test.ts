import { describe, expect, it } from "vitest";
import { FRANKIE_NEEDS, careReason, isFrankieNeed, needFromReason } from "./rules";

describe("need helpers", () => {
  it("round-trips needs through ledger reasons", () => {
    for (const need of FRANKIE_NEEDS) {
      expect(needFromReason(careReason(need))).toBe(need);
    }
    expect(needFromReason("log_reward")).toBeNull();
    expect(needFromReason("care_nap")).toBeNull();
  });

  it("validates need names", () => {
    expect(isFrankieNeed("walk")).toBe(true);
    expect(isFrankieNeed("bark")).toBe(false);
    expect(isFrankieNeed(3)).toBe(false);
  });
});
