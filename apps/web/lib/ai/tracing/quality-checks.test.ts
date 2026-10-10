import { describe, expect, it } from "vitest";
import { runQualityChecks, buildQualitySummary, type QualityCheckResult } from "./quality-checks";
import type { FrankieOrchestrationResult } from "@/lib/ai/orchestrator/frankie-orchestrator";

function makeReply(overrides: Partial<FrankieOrchestrationResult> = {}): FrankieOrchestrationResult {
  return {
    assistantMessageType: "log_confirmation",
    parsedActivities: [],
    parsedDietEntries: [],
    parsedLifestyleEntries: [],
    parsedWellnessCheckin: null,
    reply: "Logged!",
    orchestrationMode: "model",
    shouldPersistStructuredData: true,
    persistPlan: { activities: false, dietEntries: false, lifestyleEntries: false, wellnessCheckin: false },
    metadata: {
      extractionSource: "model",
      usedOpenAi: true,
      promptVersion: "test-v1",
      intent: "log_activity"
    },
    ...overrides
  };
}

function findCheck(results: QualityCheckResult[], name: string) {
  return results.find(r => r.name === name);
}

describe("runQualityChecks", () => {
  it("passes or skips every check for a clean activity extraction", () => {
    const reply = makeReply({
      parsedActivities: [{
        activityType: "running",
        activityCategory: "cardio",
        sessionCount: null,
        durationMinutes: 30,
        intensity: "moderate",
        timeReferenceText: "today",
        description: "went for a run",
        detectedKeyword: "run",
        loggedForDate: "2026-09-20",
        timePrecision: "implicit_today",
        confidence: 0.9,
        missingFields: [],
        ambiguityFlags: []
      }],
      persistPlan: { activities: true, dietEntries: false, lifestyleEntries: false, wellnessCheckin: false }
    });
    const results = runQualityChecks({ reply, userMessage: "went for a 30 min run", runStatus: "completed" });
    expect(results.every(r => r.result === "pass" || r.result === "skip")).toBe(true);
    expect(findCheck(results, "missed_exercise_extraction")?.result).toBe("pass");
    expect(findCheck(results, "score_out_of_range")?.result).toBe("skip");
  });

  it("fails missed_exercise_extraction when exercise keywords present but no activities", () => {
    const reply = makeReply({ metadata: { extractionSource: "model", usedOpenAi: true, promptVersion: "v1", intent: "log_activity" } });
    const results = runQualityChecks({ reply, userMessage: "ran 5k this morning", runStatus: "completed" });
    expect(findCheck(results, "missed_exercise_extraction")?.result).toBe("fail");
  });

  it("skips missed_exercise_extraction for general_question intent", () => {
    const reply = makeReply({ metadata: { extractionSource: "model", usedOpenAi: true, promptVersion: "v1", intent: "general_question" } });
    const results = runQualityChecks({ reply, userMessage: "how far did I run this week?", runStatus: "completed" });
    expect(findCheck(results, "missed_exercise_extraction")?.result).toBe("skip");
  });

  it("fails food_in_activities when activity description has food terms", () => {
    const reply = makeReply({
      parsedActivities: [{
        activityType: "eggs",
        activityCategory: "other",
        sessionCount: null,
        durationMinutes: 0,
        intensity: "unknown",
        timeReferenceText: null,
        description: "ate eggs for breakfast",
        detectedKeyword: "eggs",
        loggedForDate: "2026-09-20",
        timePrecision: "implicit_today",
        confidence: 0.5,
        missingFields: [],
        ambiguityFlags: []
      }]
    });
    const results = runQualityChecks({ reply, userMessage: "had eggs", runStatus: "completed" });
    expect(findCheck(results, "food_in_activities")?.result).toBe("fail");
  });

  it("fails substance_in_activities when activity has substance terms", () => {
    const reply = makeReply({
      parsedActivities: [{
        activityType: "smoking",
        activityCategory: "other",
        sessionCount: null,
        durationMinutes: 0,
        intensity: "unknown",
        timeReferenceText: null,
        description: "smoked a joint",
        detectedKeyword: "smoked",
        loggedForDate: "2026-09-20",
        timePrecision: "implicit_today",
        confidence: 0.5,
        missingFields: [],
        ambiguityFlags: []
      }]
    });
    const results = runQualityChecks({ reply, userMessage: "smoked a joint", runStatus: "completed" });
    expect(findCheck(results, "substance_in_activities")?.result).toBe("fail");
  });

  it("warns on duplicate activities", () => {
    const activity = {
      activityType: "running",
      activityCategory: "cardio",
      sessionCount: null,
      durationMinutes: 30,
      intensity: "moderate",
      timeReferenceText: "today",
      description: "went running",
      detectedKeyword: "running",
      loggedForDate: "2026-09-20",
      timePrecision: "implicit_today" as const,
      confidence: 0.9,
      missingFields: [] as string[],
      ambiguityFlags: [] as string[]
    };
    const reply = makeReply({ parsedActivities: [activity, activity] });
    const results = runQualityChecks({ reply, userMessage: "ran twice", runStatus: "completed" });
    expect(findCheck(results, "duplicate_activities")?.result).toBe("warn");
  });

  it("fails on invalid date format", () => {
    const reply = makeReply({
      parsedActivities: [{
        activityType: "running",
        activityCategory: "cardio",
        sessionCount: null,
        durationMinutes: 30,
        intensity: "moderate",
        timeReferenceText: "today",
        description: "ran",
        detectedKeyword: "ran",
        loggedForDate: "September 20",
        timePrecision: "implicit_today",
        confidence: 0.9,
        missingFields: [],
        ambiguityFlags: []
      }]
    });
    const results = runQualityChecks({ reply, userMessage: "ran today", runStatus: "completed" });
    expect(findCheck(results, "invalid_date_format")?.result).toBe("fail");
  });

  it("fails on wellness score out of range", () => {
    const reply = makeReply({
      parsedWellnessCheckin: {
        energyScore: 15,
        sorenessScore: null,
        moodScore: null,
        stressScore: null,
        motivationScore: null,
        notes: null,
        detectedSignals: ["energy"],
        loggedForDate: "2026-09-20"
      }
    });
    const results = runQualityChecks({ reply, userMessage: "energy is great", runStatus: "completed" });
    expect(findCheck(results, "score_out_of_range")?.result).toBe("fail");
  });

  it("warns on unnecessary clarification", () => {
    const reply = makeReply({
      parsedActivities: [{
        activityType: "running",
        activityCategory: "cardio",
        sessionCount: null,
        durationMinutes: 30,
        intensity: "moderate",
        timeReferenceText: "today",
        description: "ran",
        detectedKeyword: "ran",
        loggedForDate: "2026-09-20",
        timePrecision: "implicit_today",
        confidence: 0.9,
        missingFields: ["durationMinutes"],
        ambiguityFlags: []
      }],
      metadata: { extractionSource: "model", usedOpenAi: true, promptVersion: "v1", needsClarification: true }
    });
    const results = runQualityChecks({ reply, userMessage: "went running", runStatus: "clarification" });
    expect(findCheck(results, "unnecessary_clarification")?.result).toBe("warn");
  });
});

describe("buildQualitySummary", () => {
  it("computes correct summary", () => {
    const results: QualityCheckResult[] = [
      { name: "a", result: "pass", detail: null },
      { name: "b", result: "warn", detail: "warning" },
      { name: "c", result: "pass", detail: null },
      { name: "d", result: "fail", detail: "failure" },
      { name: "e", result: "skip", detail: "n/a" }
    ];
    const summary = buildQualitySummary(results);
    expect(summary).toEqual({ pass: 2, warn: 1, fail: 1, skip: 1, worst: "fail" });
  });

  it("returns worst as pass when all pass", () => {
    const results: QualityCheckResult[] = [
      { name: "a", result: "pass", detail: null },
      { name: "b", result: "pass", detail: null }
    ];
    expect(buildQualitySummary(results).worst).toBe("pass");
  });
});
