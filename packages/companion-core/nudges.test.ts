import { describe, expect, it } from "vitest";
import { computeFrankieDay } from "./frankie-day";
import { pickNudge } from "./nudges";
import { WHINE_LINES } from "./whines";

const hungryDay = (balance: number) => computeFrankieDay({ balance, needsFilledToday: [], hourPacific: 12 });

describe("pickNudge", () => {
  it("asks about food at lunch and points an empty jar at chat", () => {
    const nudge = pickNudge({ day: hungryDay(0), hourPacific: 12, nudgesSentToday: 0, level: "polite" });
    expect(nudge).toMatchObject({ need: "feed", actionUrl: "/app/chat" });
    expect(nudge?.body).toContain(WHINE_LINES.feed.polite);
  });

  it("opens Frankie's Day when biscuits are waiting", () => {
    const nudge = pickNudge({ day: hungryDay(2), hourPacific: 12, nudgesSentToday: 0, level: "polite" });
    expect(nudge?.actionUrl).toBe("/app/chat?frankie=open");
    expect(nudge?.body).toContain("2 🦴");
  });

  it("gets dramatic on the second whine in full whine mode", () => {
    const nudge = pickNudge({
      day: computeFrankieDay({ balance: 0, needsFilledToday: ["feed"], hourPacific: 15 }),
      hourPacific: 15,
      nudgesSentToday: 1,
      needsNudgedToday: ["feed"],
      level: "whiny"
    });
    expect(nudge?.need).toBe("walk");
    expect(nudge?.body).toContain(WHINE_LINES.walk.dramatic);
  });

  it.each([
    ["nudges are off", { level: "off" as const }],
    ["it's quiet hours in the morning", { hourPacific: 7 }],
    ["it's quiet hours at night", { hourPacific: 21 }],
    ["the daily cap is hit", { nudgesSentToday: 2 }],
    ["the need was already nudged", { needsNudgedToday: ["feed" as const] }],
    ["no need is in its window", { hourPacific: 9 }]
  ])("stays quiet when %s", (_label, overrides) => {
    expect(
      pickNudge({ day: hungryDay(0), hourPacific: 12, nudgesSentToday: 0, level: "polite", ...overrides })
    ).toBeNull();
  });

  it("stays quiet on a Good Boy Day", () => {
    const day = computeFrankieDay({ balance: 0, needsFilledToday: ["feed", "walk", "play", "snuggle"], hourPacific: 12 });
    expect(pickNudge({ day, hourPacific: 12, nudgesSentToday: 0, level: "whiny" })).toBeNull();
  });
});
