import type { FrankieOrchestrationResult } from "@/lib/ai/orchestrator/frankie-orchestrator";
import type {
  ExpectedActivity,
  ExpectedDietEntry,
  ExpectedRawModelShape,
  ExpectedWellnessCheckin,
  IntelligenceEvalCase,
  IntelligenceEvalExpected
} from "@/lib/evals/intelligence/types";

export type IntelligenceEvalDiff = {
  actual: unknown;
  expected: unknown;
  fixArea: "prompt_schema" | "mapper_sanitizer" | "persistence_plan";
  path: string;
};

export type IntelligenceActualSnapshot = {
  activities: Array<Record<string, unknown>>;
  dietEntries: Array<Record<string, unknown>>;
  metadata: {
    extractionSource: FrankieOrchestrationResult["metadata"]["extractionSource"];
    fallbackReason: string | null;
    orchestrationMode: FrankieOrchestrationResult["orchestrationMode"];
  };
  persistPlan: FrankieOrchestrationResult["persistPlan"];
  rawModel: {
    activitiesCount: number;
    dietEntriesCount: number;
    wellnessPresent: boolean;
  };
  rawModelExtraction: unknown;
  reply: string;
  shouldPersistStructuredData: boolean;
  wellnessCheckin: Record<string, unknown> | null;
};

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? [...value].sort() : value;
}

function valuesMatch(expected: unknown, actual: unknown) {
  return JSON.stringify(normalizeArray(expected)) === JSON.stringify(normalizeArray(actual));
}

function normalizeFoodDescription(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(?:a|an)\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeActivityDescription(value: string) {
  return value
    .toLowerCase()
    .replace(/^(?:a|an)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pushDiff(
  diffs: IntelligenceEvalDiff[],
  input: Omit<IntelligenceEvalDiff, "fixArea"> & {
    fixArea?: IntelligenceEvalDiff["fixArea"];
  }
) {
  diffs.push({
    fixArea: input.fixArea ?? "mapper_sanitizer",
    path: input.path,
    expected: input.expected,
    actual: input.actual
  });
}

function compareField(
  diffs: IntelligenceEvalDiff[],
  path: string,
  expected: unknown,
  actual: unknown,
  fixArea?: IntelligenceEvalDiff["fixArea"]
) {
  if (expected === undefined) {
    return;
  }

  if (!valuesMatch(expected, actual)) {
    pushDiff(diffs, {
      actual,
      expected,
      fixArea,
      path
    });
  }
}

function compareObjectFields(
  diffs: IntelligenceEvalDiff[],
  path: string,
  expected: Record<string, unknown>,
  actual: Record<string, unknown> | null,
  fixArea?: IntelligenceEvalDiff["fixArea"]
) {
  if (!actual) {
    pushDiff(diffs, {
      actual,
      expected,
      fixArea,
      path
    });
    return;
  }

  for (const [key, expectedValue] of Object.entries(expected)) {
    compareField(diffs, `${path}.${key}`, expectedValue, actual[key], fixArea);
  }
}

function pickActivity(activity: FrankieOrchestrationResult["parsedActivities"][number]) {
  return {
    activityCategory: activity.activityCategory,
    activityType: activity.activityType,
    ambiguityFlags: activity.ambiguityFlags,
    description: activity.description,
    durationMinutes: activity.durationMinutes,
    intensity: activity.intensity,
    loggedForDate: activity.loggedForDate,
    missingFields: activity.missingFields,
    timePrecision: activity.timePrecision
  };
}

function pickDietEntry(entry: FrankieOrchestrationResult["parsedDietEntries"][number]) {
  return {
    description: entry.description,
    loggedForDate: entry.loggedForDate,
    mealType: entry.mealType
  };
}

function pickWellnessCheckin(checkin: FrankieOrchestrationResult["parsedWellnessCheckin"]) {
  if (!checkin) {
    return null;
  }

  return {
    energyScore: checkin.energyScore,
    loggedForDate: checkin.loggedForDate,
    moodScore: checkin.moodScore,
    motivationScore: checkin.motivationScore,
    sorenessScore: checkin.sorenessScore,
    stressScore: checkin.stressScore
  };
}

function getRawActivitiesCount(rawModelExtraction: unknown) {
  if (!rawModelExtraction || typeof rawModelExtraction !== "object") {
    return 0;
  }

  const activities = (rawModelExtraction as { activities?: unknown }).activities;
  return Array.isArray(activities) ? activities.length : 0;
}

function getRawDietEntriesCount(rawModelExtraction: unknown) {
  if (!rawModelExtraction || typeof rawModelExtraction !== "object") {
    return 0;
  }

  const dietEntries = (rawModelExtraction as { dietEntries?: unknown }).dietEntries;
  return Array.isArray(dietEntries) ? dietEntries.length : 0;
}

function getRawWellnessPresent(rawModelExtraction: unknown) {
  if (!rawModelExtraction || typeof rawModelExtraction !== "object") {
    return false;
  }

  const wellness = (rawModelExtraction as { wellness?: unknown }).wellness;

  return Boolean(
    wellness &&
      typeof wellness === "object" &&
      (wellness as { present?: unknown }).present === true
  );
}

function compareRawModel(
  diffs: IntelligenceEvalDiff[],
  expected: ExpectedRawModelShape | undefined,
  actual: IntelligenceActualSnapshot["rawModel"]
) {
  if (!expected) {
    return;
  }

  compareField(
    diffs,
    "rawModel.activitiesCount",
    expected.activitiesCount,
    actual.activitiesCount,
    "prompt_schema"
  );
  compareField(
    diffs,
    "rawModel.dietEntriesCount",
    expected.dietEntriesCount,
    actual.dietEntriesCount,
    "prompt_schema"
  );
  compareField(
    diffs,
    "rawModel.wellnessPresent",
    expected.wellnessPresent,
    actual.wellnessPresent,
    "prompt_schema"
  );
}

function compareActivities(
  diffs: IntelligenceEvalDiff[],
  expected: ExpectedActivity[],
  actual: IntelligenceActualSnapshot["activities"]
) {
  compareField(diffs, "activities.length", expected.length, actual.length);

  expected.forEach((expectedActivity, index) => {
    const actualActivity = actual[index] ?? null;

    if (!actualActivity) {
      compareObjectFields(
        diffs,
        `activities[${index}]`,
        expectedActivity as Record<string, unknown>,
        actualActivity
      );
      return;
    }

    for (const [key, expectedValue] of Object.entries(expectedActivity)) {
      if (
        key === "description" &&
        typeof expectedValue === "string" &&
        typeof actualActivity[key] === "string" &&
        normalizeActivityDescription(expectedValue) ===
          normalizeActivityDescription(actualActivity[key])
      ) {
        continue;
      }

      compareField(diffs, `activities[${index}].${key}`, expectedValue, actualActivity[key]);
    }
  });
}

function compareDietEntries(
  diffs: IntelligenceEvalDiff[],
  expected: ExpectedDietEntry[],
  actual: IntelligenceActualSnapshot["dietEntries"]
) {
  compareField(diffs, "dietEntries.length", expected.length, actual.length);

  expected.forEach((expectedEntry, index) => {
    const actualEntry = actual[index] ?? null;

    if (!actualEntry) {
      compareObjectFields(
        diffs,
        `dietEntries[${index}]`,
        expectedEntry as Record<string, unknown>,
        actualEntry
      );
      return;
    }

    for (const [key, expectedValue] of Object.entries(expectedEntry)) {
      if (
        key === "description" &&
        typeof expectedValue === "string" &&
        typeof actualEntry[key] === "string" &&
        normalizeFoodDescription(expectedValue) === normalizeFoodDescription(actualEntry[key])
      ) {
        continue;
      }

      compareField(diffs, `dietEntries[${index}].${key}`, expectedValue, actualEntry[key]);
    }
  });
}

function compareWellnessCheckin(
  diffs: IntelligenceEvalDiff[],
  expected: ExpectedWellnessCheckin | null,
  actual: IntelligenceActualSnapshot["wellnessCheckin"]
) {
  if (expected === null) {
    compareField(diffs, "wellnessCheckin", null, actual);
    return;
  }

  compareObjectFields(
    diffs,
    "wellnessCheckin",
    expected as Record<string, unknown>,
    actual
  );
}

export function buildActualSnapshot(
  result: FrankieOrchestrationResult
): IntelligenceActualSnapshot {
  const rawModelExtraction = result.metadata.rawModelExtraction ?? null;

  return {
    activities: result.parsedActivities.map(pickActivity),
    dietEntries: result.parsedDietEntries.map(pickDietEntry),
    metadata: {
      extractionSource: result.metadata.extractionSource,
      fallbackReason: result.metadata.fallbackReason ?? null,
      orchestrationMode: result.orchestrationMode
    },
    persistPlan: result.persistPlan,
    rawModel: {
      activitiesCount: getRawActivitiesCount(rawModelExtraction),
      dietEntriesCount: getRawDietEntriesCount(rawModelExtraction),
      wellnessPresent: getRawWellnessPresent(rawModelExtraction)
    },
    rawModelExtraction,
    reply: result.reply,
    shouldPersistStructuredData: result.shouldPersistStructuredData,
    wellnessCheckin: pickWellnessCheckin(result.parsedWellnessCheckin)
  };
}

export function compareIntelligenceCase(input: {
  actual: IntelligenceActualSnapshot;
  testCase: IntelligenceEvalCase;
}) {
  const diffs: IntelligenceEvalDiff[] = [];
  const expected: IntelligenceEvalExpected = input.testCase.expected;

  compareRawModel(diffs, expected.rawModel, input.actual.rawModel);
  compareField(
    diffs,
    "shouldPersistStructuredData",
    expected.shouldPersistStructuredData,
    input.actual.shouldPersistStructuredData,
    "persistence_plan"
  );
  compareObjectFields(
    diffs,
    "persistPlan",
    expected.persistPlan,
    input.actual.persistPlan as unknown as Record<string, unknown>,
    "persistence_plan"
  );
  compareActivities(diffs, expected.activities, input.actual.activities);
  compareDietEntries(diffs, expected.dietEntries, input.actual.dietEntries);
  compareWellnessCheckin(diffs, expected.wellnessCheckin, input.actual.wellnessCheckin);

  return diffs;
}

export function summarizeFixAreas(diffs: IntelligenceEvalDiff[]) {
  return Array.from(new Set(diffs.map((diff) => diff.fixArea)));
}
