import { describe, expect, it } from "vitest";
import { getPacificDateKey } from "@frankie-fit/dashboard-core";
import { resolveLoggedForDate } from "./shared";

describe("resolveLoggedForDate", () => {
  it("returns a valid ISO date unchanged", () => {
    expect(resolveLoggedForDate("2026-01-15")).toBe("2026-01-15");
  });

  it("falls back to today's Pacific date for an invalid or missing value", () => {
    const todayPacific = getPacificDateKey();

    expect(resolveLoggedForDate("not-a-date")).toBe(todayPacific);
    expect(resolveLoggedForDate(undefined)).toBe(todayPacific);
  });
});
