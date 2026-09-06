import { describe, expect, it } from "vitest";
import { QUICK_START_OPTIONS, findBracketBlanks, findNextBlank, findPreviousBlank } from "./quick-start";

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
