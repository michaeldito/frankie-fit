import { describe, expect, it } from "vitest";
import { careStreak } from "./streak";

describe("careStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(careStreak(["2026-10-18", "2026-10-19", "2026-10-20"], "2026-10-20")).toBe(3);
  });

  it("doesn't break before today's care happens", () => {
    expect(careStreak(["2026-10-18", "2026-10-19"], "2026-10-20")).toBe(2);
  });

  it("forgives one missed day per week", () => {
    expect(careStreak(["2026-10-16", "2026-10-17", "2026-10-19", "2026-10-20"], "2026-10-20")).toBe(4);
  });

  it("doesn't forgive twice in the same week", () => {
    expect(careStreak(["2026-10-14", "2026-10-16", "2026-10-18", "2026-10-19", "2026-10-20"], "2026-10-20")).toBe(4);
  });

  it("ignores duplicate dates and returns 0 with no care", () => {
    expect(careStreak(["2026-10-20", "2026-10-20"], "2026-10-20")).toBe(1);
    expect(careStreak([], "2026-10-20")).toBe(0);
  });

  it("breaks on two missed days in a row", () => {
    expect(careStreak(["2026-10-15", "2026-10-16", "2026-10-19", "2026-10-20"], "2026-10-20")).toBe(2);
  });
});
