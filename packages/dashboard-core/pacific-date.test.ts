import { describe, expect, it } from "vitest";
import { addDays, formatShortDate, formatShortDay, fromDateKey, getPacificDateKey, getWeekStart, toDateKey } from "./pacific-date";

describe("getPacificDateKey", () => {
  it("stays on the prior Pacific day for a UTC timestamp just after UTC midnight", () => {
    // 2026-03-05T06:59:00Z is 2026-03-04T22:59:00-08:00 in Los Angeles (before DST).
    expect(getPacificDateKey(new Date("2026-03-05T06:59:00.000Z"))).toBe("2026-03-04");
  });

  it("rolls to the next Pacific day once UTC crosses the Pacific offset", () => {
    // 2026-03-05T08:01:00Z is 2026-03-05T00:01:00-08:00 in Los Angeles.
    expect(getPacificDateKey(new Date("2026-03-05T08:01:00.000Z"))).toBe("2026-03-05");
  });
});

describe("date key round-trip", () => {
  it("fromDateKey/toDateKey round-trips without drifting a day", () => {
    expect(toDateKey(fromDateKey("2026-01-01"))).toBe("2026-01-01");
    expect(toDateKey(fromDateKey("2026-12-31"))).toBe("2026-12-31");
  });
});

describe("addDays", () => {
  it("crosses a month boundary correctly", () => {
    expect(toDateKey(addDays(fromDateKey("2026-01-31"), 1))).toBe("2026-02-01");
  });

  it("crosses a year boundary correctly", () => {
    expect(toDateKey(addDays(fromDateKey("2026-12-31"), 1))).toBe("2027-01-01");
  });

  it("supports negative offsets", () => {
    expect(toDateKey(addDays(fromDateKey("2026-03-01"), -1))).toBe("2026-02-28");
  });
});

describe("getWeekStart", () => {
  it("returns the same Monday for every day in that week", () => {
    // 2026-01-05 is a Monday.
    const monday = "2026-01-05";
    for (const dateKey of ["2026-01-05", "2026-01-06", "2026-01-09", "2026-01-11"]) {
      expect(toDateKey(getWeekStart(fromDateKey(dateKey)))).toBe(monday);
    }
  });

  it("treats Sunday as the last day of the prior week, not the start of a new one", () => {
    // 2026-01-11 is a Sunday; its week started on 2026-01-05.
    expect(toDateKey(getWeekStart(fromDateKey("2026-01-11")))).toBe("2026-01-05");
  });
});

describe("formatting", () => {
  it("formats a short weekday label", () => {
    expect(formatShortDay("2026-01-05")).toBe("Mon");
  });

  it("formats a short date label", () => {
    expect(formatShortDate("2026-01-05")).toBe("Jan 5");
  });
});
