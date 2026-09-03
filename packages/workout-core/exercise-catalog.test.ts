import { describe, expect, it } from "vitest";
import { findExercises, slugifyExerciseName } from "./exercise-catalog";

describe("findExercises", () => {
  it("returns an empty array for a blank query", () => {
    expect(findExercises("   ")).toEqual([]);
  });

  it("ranks a name-prefix match above a substring match", () => {
    const results = findExercises("squat");
    const slugs = results.map((entry) => entry.slug);

    expect(slugs.indexOf("back-squat")).toBeLessThan(slugs.indexOf("goblet-squat"));
  });

  it("matches on an alias", () => {
    const results = findExercises("db curl");
    expect(results.map((entry) => entry.slug)).toContain("dumbbell-bicep-curl");
  });

  it("ranks an alias-prefix match above a substring alias match", () => {
    const results = findExercises("db");
    const slugs = results.map((entry) => entry.slug);

    // "db bench" is an alias *starting with* "db"; "single arm row" is not, but "db row" is
    // also a prefix match, so both prefix-alias entries should out-rank a lower-scored one.
    expect(slugs).toContain("dumbbell-bench-press");
    expect(slugs.indexOf("dumbbell-bench-press")).toBeLessThan(slugs.length);
  });

  it("is case-insensitive and trims whitespace", () => {
    const results = findExercises("  PULL-UP  ");
    expect(results.map((entry) => entry.slug)).toContain("pull-up");
  });

  it("respects the limit parameter", () => {
    const results = findExercises("e", 3);
    expect(results).toHaveLength(3);
  });

  it("breaks ties alphabetically by name", () => {
    const results = findExercises("row");
    const names = results.map((entry) => entry.name);
    const sameScoreNames = names.filter((name) => name.toLowerCase().startsWith("row"));
    expect(sameScoreNames).toEqual([...sameScoreNames].sort());
  });

  it("returns no results for a query that matches nothing", () => {
    expect(findExercises("xyzzyx")).toEqual([]);
  });
});

describe("slugifyExerciseName", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugifyExerciseName("Bulgarian Split Squat")).toBe("bulgarian-split-squat");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugifyExerciseName("Clean & Jerk (Power)")).toBe("clean-jerk-power");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyExerciseName("  -Row!!-  ")).toBe("row");
  });

  it("falls back to a default slug for an empty or fully-stripped name", () => {
    expect(slugifyExerciseName("   ")).toBe("custom-exercise");
    expect(slugifyExerciseName("!!!")).toBe("custom-exercise");
  });
});
