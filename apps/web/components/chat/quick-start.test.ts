import { describe, expect, it } from "vitest";
import {
  QUICK_START_OPTIONS,
  composeQuickStart,
  findBracketBlanks,
  findNextBlank,
  findPreviousBlank,
  parseQuickStartTemplate
} from "./quick-start";

describe("findBracketBlanks", () => {
  it("returns no blanks for a string with no brackets", () => {
    expect(findBracketBlanks("no blanks here")).toEqual([]);
  });

  it("finds a single blank with the correct offsets", () => {
    const value = "For [breakfast/lunch/dinner/snack], I ate [fill in]";
    const blanks = findBracketBlanks(value);

    expect(blanks).toHaveLength(2);
    expect(value.slice(blanks[0].start, blanks[0].end)).toBe("[breakfast/lunch/dinner/snack]");
    expect(value.slice(blanks[1].start, blanks[1].end)).toBe("[fill in]");
  });

  it("finds every blank in a multi-blank template, in order", () => {
    const value =
      "Checking in — energy: [1-5], stress: [1-5], soreness: [1-5], mood: [1-5], motivation: [1-5]";
    const blanks = findBracketBlanks(value);

    expect(blanks).toHaveLength(5);
    blanks.forEach((blank) => {
      expect(value.slice(blank.start, blank.end)).toBe("[1-5]");
    });
  });

  it("stops each match at the first closing bracket", () => {
    const value = "[a] and [b]";
    const blanks = findBracketBlanks(value);

    expect(blanks.map((blank) => value.slice(blank.start, blank.end))).toEqual(["[a]", "[b]"]);
  });
});

describe("findNextBlank", () => {
  const blanks = findBracketBlanks("[one] middle [two] end [three]");

  it("returns the first blank at or after the given index", () => {
    expect(findNextBlank(blanks, 0)).toEqual(blanks[0]);
  });

  it("skips blanks that start before the given index", () => {
    expect(findNextBlank(blanks, blanks[0].end)).toEqual(blanks[1]);
  });

  it("returns undefined once past the last blank", () => {
    expect(findNextBlank(blanks, blanks[2].end)).toBeUndefined();
  });
});

describe("findPreviousBlank", () => {
  const blanks = findBracketBlanks("[one] middle [two] end [three]");

  it("returns the last blank ending at or before the given index", () => {
    expect(findPreviousBlank(blanks, blanks[2].start)).toEqual(blanks[1]);
  });

  it("returns undefined when no blank ends before the given index", () => {
    expect(findPreviousBlank(blanks, blanks[0].start)).toBeUndefined();
  });

  it("finds the last blank when searching from the end of the string", () => {
    const value = "[one] middle [two] end [three]";
    expect(findPreviousBlank(blanks, value.length)).toEqual(blanks[2]);
  });
});

describe("QUICK_START_OPTIONS", () => {
  it("gives every quick-start template at least one fillable blank", () => {
    QUICK_START_OPTIONS.forEach((option) => {
      expect(findBracketBlanks(option.template).length).toBeGreaterThan(0);
    });
  });
});

describe("parseQuickStartTemplate", () => {
  it("turns exercise blanks into a text field, a numeric field, and intensity choices", () => {
    expect(parseQuickStartTemplate(QUICK_START_OPTIONS[0].template)).toEqual([
      { kind: "text", text: "Today I did " },
      { kind: "input", id: 0, placeholder: "what you did", numeric: false },
      { kind: "text", text: " for " },
      { kind: "input", id: 1, placeholder: "30", numeric: true },
      { kind: "text", text: " minutes at " },
      { kind: "choice", id: 2, options: ["light", "moderate", "hard"] },
      { kind: "text", text: " intensity" }
    ]);
  });

  it("expands numeric ranges into score choices", () => {
    const wellness = parseQuickStartTemplate(QUICK_START_OPTIONS[2].template);
    expect(wellness.filter((segment) => segment.kind === "choice")).toHaveLength(5);
    expect(wellness[1]).toEqual({ kind: "choice", id: 0, options: ["1", "2", "3", "4", "5"] });
  });

  it("names free blanks from context and falls back to 'fill in'", () => {
    const [, ate] = parseQuickStartTemplate("For lunch, I ate [fill in]");
    expect(ate).toMatchObject({ kind: "input", placeholder: "what you ate" });
    const [, felt] = parseQuickStartTemplate("It made me feel [fill in]");
    expect(felt).toMatchObject({ placeholder: "how you felt" });
    expect(parseQuickStartTemplate("[something]")[0]).toMatchObject({ kind: "input", placeholder: "fill in" });
  });

  it("treats odd ranges as free text and keeps trailing-free templates intact", () => {
    expect(parseQuickStartTemplate("Score [5-1]")[1]).toMatchObject({ kind: "input" });
    expect(parseQuickStartTemplate("No blanks here")).toEqual([{ kind: "text", text: "No blanks here" }]);
  });
});

describe("composeQuickStart", () => {
  const segments = parseQuickStartTemplate("For [breakfast/lunch], I ate [fill in]");

  it("builds the sentence once every blank is filled", () => {
    expect(composeQuickStart(segments, { 0: "lunch", 1: " a burrito " })).toBe("For lunch, I ate a burrito");
  });

  it("returns null while any blank is empty", () => {
    expect(composeQuickStart(segments, { 0: "lunch" })).toBeNull();
    expect(composeQuickStart(segments, { 0: "lunch", 1: "   " })).toBeNull();
  });
});
