import { describe, expect, it } from "vitest";
import { DAILY_LINES, THINKING_LINES, dailyLine, greetingFor, thinkingLine } from "./lines";

describe("dailyLine", () => {
  it("is stable for a given day", () => {
    expect(dailyLine("2026-10-20")).toBe(dailyLine("2026-10-20"));
  });

  it("always returns one of Frankie's lines and varies across days", () => {
    const seen = new Set<string>();
    for (let day = 1; day <= 28; day += 1) {
      const line = dailyLine(`2026-02-${String(day).padStart(2, "0")}`);
      expect(DAILY_LINES).toContain(line);
      seen.add(line);
    }
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe("thinkingLine", () => {
  it("cycles through the thinking lines, including for negative or fractional steps", () => {
    expect(thinkingLine(0)).toBe(THINKING_LINES[0]);
    expect(thinkingLine(THINKING_LINES.length + 1)).toBe(THINKING_LINES[1]);
    expect(thinkingLine(-1.7)).toBe(THINKING_LINES[1]);
  });
});

describe("greetingFor", () => {
  it.each([
    [7, "Mike", "Good morning, Mike"],
    [13, "Mike", "Good afternoon, Mike"],
    [19, "Mike", "Good evening, Mike"],
    [2, "Mike", "Good evening, Mike"],
    [9, "  ", "Good morning, Frankie's human"],
    [9, null, "Good morning, Frankie's human"]
  ])("hour %i, name %s", (hour, name, expected) => {
    expect(greetingFor(hour, name)).toBe(expected);
  });
});
