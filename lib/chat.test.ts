import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveLoggedForDateFromTimeReference } from "./chat";

// Pinned well inside a Pacific day (not near the UTC midnight boundary) so "real today" is
// deterministic: 2026-06-15T18:00:00Z is 2026-06-15T11:00:00-07:00 in Los Angeles.
const TODAY = "2026-06-15T18:00:00.000Z";
const TODAY_PACIFIC_KEY = "2026-06-15";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(TODAY));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("resolveLoggedForDateFromTimeReference", () => {
  it("prefers an explicit YYYY-MM-DD found in the timing phrase over any fallback", () => {
    expect(resolveLoggedForDateFromTimeReference("2026-05-04", "2026-01-01")).toBe("2026-05-04");
  });

  it("prefers a valid fallback date over a vague relative word like 'tonight'", () => {
    expect(resolveLoggedForDateFromTimeReference("tonight", "2026-05-04")).toBe("2026-05-04");
  });

  it("prefers a valid fallback date over 'today', 'this morning', and 'last night' too", () => {
    expect(resolveLoggedForDateFromTimeReference("today", "2026-05-04")).toBe("2026-05-04");
    expect(resolveLoggedForDateFromTimeReference("this morning", "2026-05-04")).toBe("2026-05-04");
    expect(resolveLoggedForDateFromTimeReference("last night", "2026-05-04")).toBe("2026-05-04");
  });

  it("prefers a valid fallback date over an explicit weekday", () => {
    expect(resolveLoggedForDateFromTimeReference("monday", "2026-05-04")).toBe("2026-05-04");
  });

  it("falls back to real today when there is no fallback date and the phrase is a vague relative word", () => {
    expect(resolveLoggedForDateFromTimeReference("tonight", null)).toBe(TODAY_PACIFIC_KEY);
  });

  it("falls back to real today when there is no timing phrase and no fallback date", () => {
    expect(resolveLoggedForDateFromTimeReference(null, null)).toBe(TODAY_PACIFIC_KEY);
  });

  it("ignores an invalid (non YYYY-MM-DD) fallback and falls back to real today", () => {
    expect(resolveLoggedForDateFromTimeReference("tonight", "not-a-date")).toBe(TODAY_PACIFIC_KEY);
  });
});
