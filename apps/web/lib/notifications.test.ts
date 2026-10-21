import { describe, expect, it } from "vitest";
import {
  planFrankieNudge,
  getWeeklySummaryPeriod,
  shouldSendCheckinReminder,
  shouldSendDailySummaryNotification,
  shouldSendWeeklySummaryToday
} from "./notifications";

describe("shouldSendCheckinReminder", () => {
  it("sends a reminder when opted in, unlogged, and not already nudged today", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: false,
        hasLoggedToday: false,
        wellnessCheckinOptIn: true
      })
    ).toBe(true);
  });

  it("does not send when the user opted out of check-ins", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: false,
        hasLoggedToday: false,
        wellnessCheckinOptIn: false
      })
    ).toBe(false);
  });

  it("does not send when the user already logged something today", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: false,
        hasLoggedToday: true,
        wellnessCheckinOptIn: true
      })
    ).toBe(false);
  });

  it("does not send a second reminder on the same day", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: true,
        hasLoggedToday: false,
        wellnessCheckinOptIn: true
      })
    ).toBe(false);
  });
});

describe("shouldSendDailySummaryNotification", () => {
  it("sends a daily summary when the user chatted yesterday and hasn't been sent one today", () => {
    expect(
      shouldSendDailySummaryNotification({ alreadySentToday: false, chattedYesterday: true })
    ).toBe(true);
  });

  it("does not send when the user did not chat yesterday", () => {
    expect(
      shouldSendDailySummaryNotification({ alreadySentToday: false, chattedYesterday: false })
    ).toBe(false);
  });

  it("does not send a second daily summary notification on the same day", () => {
    expect(
      shouldSendDailySummaryNotification({ alreadySentToday: true, chattedYesterday: true })
    ).toBe(false);
  });
});

describe("shouldSendWeeklySummaryToday", () => {
  it("sends on Sunday", () => {
    expect(shouldSendWeeklySummaryToday(0)).toBe(true);
  });

  it("does not send on any other day", () => {
    for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) {
      expect(shouldSendWeeklySummaryToday(dayOfWeek)).toBe(false);
    }
  });
});

describe("getWeeklySummaryPeriod", () => {
  it("covers the Sunday-through-Saturday week ending the day before a Sunday send", () => {
    // 2026-09-06 is a Sunday.
    const sunday = new Date(Date.UTC(2026, 8, 6, 12));

    expect(getWeeklySummaryPeriod(sunday)).toEqual({
      periodStart: "2026-08-30",
      periodEnd: "2026-09-05"
    });
  });
});

describe("planFrankieNudge", () => {
  const base = {
    ledgerRows: [],
    pillarsLoggedToday: [],
    sentToday: [],
    level: "polite" as const,
    todayKey: "2026-10-20",
    hourPacific: 12
  };

  it("asks about food at lunch with an empty jar", () => {
    expect(planFrankieNudge(base)).toMatchObject({ need: "feed", actionUrl: "/app/chat" });
  });

  it("counts logs that haven't been credited yet toward the jar", () => {
    const nudge = planFrankieNudge({ ...base, pillarsLoggedToday: ["diet"] });
    expect(nudge?.actionUrl).toBe("/app/chat?frankie=open");
    expect(nudge?.body).toContain("1 🦴");
  });

  it("doesn't double count a pillar that was already credited", () => {
    const nudge = planFrankieNudge({
      ...base,
      ledgerRows: [{ delta: 1, reason: "log_reward", pillar: "diet", date_key: "2026-10-20" }],
      pillarsLoggedToday: ["diet"]
    });
    expect(nudge?.body).toContain("1 🦴");
  });

  it("skips needs already filled or already nudged today", () => {
    expect(
      planFrankieNudge({
        ...base,
        ledgerRows: [{ delta: -1, reason: "care_feed", pillar: null, date_key: "2026-10-20" }]
      })
    ).toBeNull();
    expect(planFrankieNudge({ ...base, sentToday: [{ need: "feed" }] })).toBeNull();
  });

  it("respects the off switch and the daily cap", () => {
    expect(planFrankieNudge({ ...base, level: "off" })).toBeNull();
    expect(planFrankieNudge({ ...base, sentToday: [{ need: null }, { need: null }] })).toBeNull();
  });
});
