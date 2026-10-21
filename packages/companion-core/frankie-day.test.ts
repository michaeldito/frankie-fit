import { describe, expect, it } from "vitest";
import { GOOD_BOY_LINE, computeFrankieDay, needPriorityFor, whineTierFor } from "./frankie-day";
import { WHINE_LINES } from "./whines";

describe("computeFrankieDay", () => {
  it("wants food first at lunchtime and whines in tier for the hour when biscuits are waiting", () => {
    const day = computeFrankieDay({ balance: 2, needsFilledToday: [], hourPacific: 13 });
    expect(day.mostPressingNeed).toBe("feed");
    expect(day.mood).toBe("hungry");
    expect(day.line).toBe(WHINE_LINES.feed.hopeful);
    expect(day.canAfford).toEqual({ feed: true, walk: true, play: true, snuggle: true });
  });

  it("stays polite with an empty jar", () => {
    const day = computeFrankieDay({ balance: 0, needsFilledToday: [], hourPacific: 19 });
    expect(day.mostPressingNeed).toBe("snuggle");
    expect(day.line).toBe(WHINE_LINES.snuggle.polite);
    expect(day.canAfford.snuggle).toBe(false);
  });

  it("skips filled needs and can't re-buy them", () => {
    const day = computeFrankieDay({ balance: 3, needsFilledToday: ["walk"], hourPacific: 15 });
    expect(day.needs.walk).toBe("filled");
    expect(day.canAfford.walk).toBe(false);
    expect(day.mostPressingNeed).toBe("play");
    expect(day.mood).toBe("stretching");
  });

  it("celebrates a Good Boy Day", () => {
    const day = computeFrankieDay({
      balance: 0,
      needsFilledToday: ["feed", "walk", "play", "snuggle"],
      hourPacific: 10,
      careStreak: 4
    });
    expect(day.goodBoyDay).toBe(true);
    expect(day.mostPressingNeed).toBeNull();
    expect(day.mood).toBe("happy");
    expect(day.line).toBe(GOOD_BOY_LINE);
    expect(day.careStreak).toBe(4);
  });

  it("snuggles after a late Good Boy Day", () => {
    expect(computeFrankieDay({ balance: 0, needsFilledToday: ["feed", "walk", "play", "snuggle"], hourPacific: 23 }).mood).toBe(
      "snuggle"
    );
  });
});

describe("time-of-day helpers", () => {
  it.each([
    [7, "feed", "polite"],
    [15, "walk", "hopeful"],
    [20, "snuggle", "dramatic"],
    [2, "snuggle", "polite"]
  ])("hour %i prioritizes %s and whines %s", (hour, first, tier) => {
    expect(needPriorityFor(hour)[0]).toBe(first);
    expect(whineTierFor(hour)).toBe(tier);
  });
});
