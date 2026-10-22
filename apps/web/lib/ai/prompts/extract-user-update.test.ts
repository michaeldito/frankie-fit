import { describe, expect, it } from "vitest";
import { buildExtractUserUpdatePrompt } from "./extract-user-update";

describe("buildExtractUserUpdatePrompt", () => {
  it("includes today's Pacific date in YYYY-MM-DD form", () => {
    const prompt = buildExtractUserUpdatePrompt();
    expect(prompt).toMatch(/Assume today's local date is \d{4}-\d{2}-\d{2} in America\/Los_Angeles\./);
  });

  it("omits the clarification-combining instructions by default", () => {
    const prompt = buildExtractUserUpdatePrompt();
    expect(prompt).not.toContain("Frankie's clarification question");
  });

  it("adds clarification-combining instructions when answering a clarification", () => {
    const prompt = buildExtractUserUpdatePrompt({ isAnsweringClarification: true });
    expect(prompt).toContain("Frankie's clarification question");
    expect(prompt).toContain("Do not use any other prior conversation history.");
  });

  it("ends with the schema instruction", () => {
    const prompt = buildExtractUserUpdatePrompt();
    expect(prompt.trim().endsWith("Return JSON that exactly matches the provided schema.")).toBe(true);
  });
});

describe("buildExtractUserUpdatePrompt already-logged rules", () => {
  it("only adds the reference rules when there is already-logged context", () => {
    expect(buildExtractUserUpdatePrompt()).not.toContain("Already logged:");
    const prompt = buildExtractUserUpdatePrompt({ hasAlreadyLoggedContext: true });
    expect(prompt).toContain("Already logged:");
    expect(prompt).toContain("do not extract it again");
    expect(prompt).toContain("Never extract anything from that list itself.");
  });
});
