import { z } from "zod";
import type {
  ActivityTimePrecision,
  ParsedActivity,
  ParsedDietEntry,
  LoggedForDateValue,
  ParsedWellnessCheckin
} from "@/lib/chat";
import {
  extractTimeReferenceText,
  resolveLoggedForDateFromTimeReference
} from "@/lib/chat";

const intensityOptions = ["unknown", "Light", "Moderate", "Hard"] as const;
const mealTypeOptions = ["unknown", "breakfast", "lunch", "dinner", "snack"] as const;
const activityTimePrecisionOptions = [
  "implicit_today",
  "relative_day",
  "explicit_day",
  "multi_day_window",
  "week_summary",
  "unknown"
] as const;
const acceptedActivityTimePrecisionOptions = [
  ...activityTimePrecisionOptions,
  "exact",
  "explicit_date"
] as const;
const intentOptions = [
  "log_update",
  "general_question",
  "mixed_update",
  "unclear"
] as const;

const extractedActivitySchema = z.object({
  activityType: z.string().min(1),
  activityCategory: z.string().min(1),
  description: z.string().min(1),
  sessionCount: z.number().int().min(1),
  durationMinutes: z.number().int().min(0),
  intensity: z.enum(intensityOptions),
  timeReferenceText: z.string(),
  loggedForDate: z.string(),
  timePrecision: z.enum(acceptedActivityTimePrecisionOptions),
  confidence: z.number().min(0).max(1),
  missingFields: z.array(z.string()),
  ambiguityFlags: z.array(z.string())
});

const extractedDietEntrySchema = z.object({
  description: z.string().min(1),
  mealType: z.enum(mealTypeOptions),
  confidence: z.number().min(0).max(1),
  timeReferenceText: z.string(),
  loggedForDate: z.string()
});

const extractedWellnessSchema = z.object({
  present: z.boolean(),
  energyScore: z.number().int().min(0).max(5),
  sorenessScore: z.number().int().min(0).max(5),
  moodScore: z.number().int().min(0).max(5),
  stressScore: z.number().int().min(0).max(5),
  motivationScore: z.number().int().min(0).max(5),
  notes: z.string(),
  loggedForDate: z.string()
});

export const extractedUserUpdateSchema = z.object({
  intent: z.enum(intentOptions),
  notes: z.string(),
  activities: z.array(extractedActivitySchema),
  dietEntries: z.array(extractedDietEntrySchema),
  wellness: extractedWellnessSchema,
  needsClarification: z.boolean(),
  clarificationQuestion: z.string()
});

export type ExtractedUserUpdate = z.infer<typeof extractedUserUpdateSchema>;

export const extractedUserUpdateJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: intentOptions
    },
    notes: {
      type: "string"
    },
    activities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          activityType: { type: "string", minLength: 1 },
          activityCategory: { type: "string", minLength: 1 },
          description: { type: "string", minLength: 1 },
          sessionCount: { type: "integer", minimum: 1 },
          durationMinutes: { type: "integer", minimum: 0 },
          intensity: { type: "string", enum: intensityOptions },
          timeReferenceText: { type: "string" },
          loggedForDate: { type: "string" },
          timePrecision: { type: "string", enum: activityTimePrecisionOptions },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          missingFields: {
            type: "array",
            items: { type: "string" }
          },
          ambiguityFlags: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "activityType",
          "activityCategory",
          "description",
          "sessionCount",
          "durationMinutes",
          "intensity",
          "timeReferenceText",
          "loggedForDate",
          "timePrecision",
          "confidence",
          "missingFields",
          "ambiguityFlags"
        ]
      }
    },
    dietEntries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          description: { type: "string", minLength: 1 },
          mealType: { type: "string", enum: mealTypeOptions },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          timeReferenceText: { type: "string" },
          loggedForDate: { type: "string" }
        },
        required: ["description", "mealType", "confidence", "timeReferenceText", "loggedForDate"]
      }
    },
    wellness: {
      type: "object",
      additionalProperties: false,
      properties: {
        present: { type: "boolean" },
        energyScore: { type: "integer", minimum: 0, maximum: 5 },
        sorenessScore: { type: "integer", minimum: 0, maximum: 5 },
        moodScore: { type: "integer", minimum: 0, maximum: 5 },
        stressScore: { type: "integer", minimum: 0, maximum: 5 },
        motivationScore: { type: "integer", minimum: 0, maximum: 5 },
        notes: { type: "string" },
        loggedForDate: { type: "string" }
      },
      required: [
        "present",
        "energyScore",
        "sorenessScore",
        "moodScore",
        "stressScore",
        "motivationScore",
        "notes",
        "loggedForDate"
      ]
    },
    needsClarification: {
      type: "boolean"
    },
    clarificationQuestion: {
      type: "string"
    }
  },
  required: [
    "intent",
    "notes",
    "activities",
    "dietEntries",
    "wellness",
    "needsClarification",
    "clarificationQuestion"
  ]
} as const;

function getPacificTodayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function mapLoggedForDate(value: string): LoggedForDateValue {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return getPacificTodayKey();
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : getPacificTodayKey();
}

function mapIntensity(value: (typeof intensityOptions)[number]) {
  return value === "unknown" ? null : value;
}

function mapMealType(value: (typeof mealTypeOptions)[number]) {
  return value === "unknown" ? null : value;
}

function mapZeroToNull(value: number) {
  return value > 0 ? value : null;
}

function mapActivityTimePrecision(value: string): ActivityTimePrecision {
  const normalizedValue = value.trim().toLowerCase();

  switch (normalizedValue) {
    case "implicit_today":
    case "relative_day":
    case "explicit_day":
    case "multi_day_window":
    case "week_summary":
    case "unknown":
      return normalizedValue;
    case "exact":
    case "explicit_date":
      return "explicit_day";
    default:
      return "unknown";
  }
}

function mapActivityTimePrecisionWithDateFallback(input: {
  loggedForDate: string;
  timePrecision: string;
}) {
  const mappedPrecision = mapActivityTimePrecision(input.timePrecision);

  if (
    mappedPrecision === "implicit_today" &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.loggedForDate.trim())
  ) {
    return "explicit_day";
  }

  return mappedPrecision;
}

function hasMeaningfulWellnessNotes(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return false;
  }

  const genericEmptyNotes = new Set([
    "n/a",
    "na",
    "none",
    "no note",
    "no notes",
    "no wellness update",
    "no wellness updates",
    "no check-in",
    "no check in",
    "not mentioned",
    "not provided"
  ]);

  return !genericEmptyNotes.has(normalizedValue.toLowerCase());
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function removeInvalidArrayItems(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const candidate = value as {
    activities?: unknown;
    dietEntries?: unknown;
  };

  return {
    ...candidate,
    activities: Array.isArray(candidate.activities)
      ? candidate.activities.filter(
          (activity) =>
            activity &&
            typeof activity === "object" &&
            isNonEmptyString((activity as { activityType?: unknown }).activityType) &&
            isNonEmptyString((activity as { activityCategory?: unknown }).activityCategory) &&
            isNonEmptyString((activity as { description?: unknown }).description) &&
            (activity as { activityType?: unknown }).activityType !== "unknown" &&
            (activity as { description?: unknown }).description !== "unknown"
        )
      : candidate.activities,
    dietEntries: Array.isArray(candidate.dietEntries)
      ? candidate.dietEntries.filter(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            isNonEmptyString((entry as { description?: unknown }).description)
        )
      : candidate.dietEntries
  };
}

export function parseExtractedUserUpdate(value: unknown): ExtractedUserUpdate {
  const firstPass = extractedUserUpdateSchema.safeParse(value);

  if (firstPass.success) {
    return firstPass.data;
  }

  const cleaned = removeInvalidArrayItems(value);
  const secondPass = extractedUserUpdateSchema.safeParse(cleaned);

  if (secondPass.success) {
    return secondPass.data;
  }

  throw firstPass.error;
}

function canonicalizeActivityType(value: string) {
  const normalizedValue = value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const canonicalTypes: Array<{ values: string[]; label: string }> = [
    { values: ["run", "ran", "running"], label: "running" },
    { values: ["jog", "jogged", "jogging"], label: "jogging" },
    { values: ["walk", "walked", "walking"], label: "walking" },
    { values: ["bike", "biked", "biking", "cycle", "cycled", "cycling"], label: "biking" },
    { values: ["hike", "hiked", "hiking"], label: "hiking" },
    { values: ["row", "rowed", "rowing"], label: "rowing" },
    {
      values: ["lift", "lifted", "lifting", "weight lifting", "weightlifting", "weights"],
      label: "weight lifting"
    },
    { values: ["yoga"], label: "yoga" }
  ];
  const containsCanonicalType = [
    { pattern: /\brunn?ing\b|\brun\b|\bran\b/, label: "running" },
    { pattern: /\bjog(?:ged|ging)?\b/, label: "jogging" },
    { pattern: /\bwalk(?:ed|ing)?\b/, label: "walking" },
    { pattern: /\bbik(?:e|ed|ing)\b|\bcycl(?:e|ed|ing)\b/, label: "biking" },
    { pattern: /\bhik(?:e|ed|ing)\b/, label: "hiking" },
    { pattern: /\byoga\b/, label: "yoga" },
    { pattern: /\bbox(?:ed|ing)?\b/, label: "boxing" },
    { pattern: /\bsoccer\b/, label: "soccer" },
    { pattern: /\bpilates\b/, label: "pilates" },
    {
      pattern:
        /\b(?:lift(?:ed|ing)?|strength|weights?|bench(?:\s+press)?|squats?|deadlifts?|lunges?|rows?|overhead\s+press|planks?|arms?|shoulders?)\b/,
      label: "weight lifting"
    },
    { pattern: /\b(?:mobility|stretch(?:ed|ing)?)\b/, label: "mobility" }
  ];

  return (
    canonicalTypes.find((entry) => entry.values.includes(normalizedValue))?.label ??
    containsCanonicalType.find((entry) => entry.pattern.test(normalizedValue))?.label ??
    normalizedValue
  );
}

function cleanActivityDescription(value: string) {
  return value
    .trim()
    .replace(/^i\s+/i, "")
    .replace(/^(?:a|an)\s+/i, "")
    .replace(/\b\d+\s*(?:minutes?|mins?|min|hours?|hrs?|hr)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeActivityCategory(activityType: string, category: string) {
  const normalizedType = activityType.toLowerCase().trim();

  if (["running", "jogging", "walking", "biking", "rowing"].includes(normalizedType)) {
    return "cardio";
  }

  if (normalizedType === "hiking") {
    return "outdoor_recreation";
  }

  if (normalizedType === "weight lifting") {
    return "strength";
  }

  if (normalizedType === "yoga" || normalizedType === "pilates") {
    return "mind_body";
  }

  if (normalizedType === "boxing" || normalizedType === "soccer") {
    return "sport";
  }

  if (normalizedType === "mobility") {
    return "mobility";
  }

  return category;
}

export function mapExtractedActivities(
  extracted: ExtractedUserUpdate["activities"]
): ParsedActivity[] {
  return extracted.map((activity, index) => {
    const description =
      cleanActivityDescription(activity.description) ||
      activity.activityType.trim() ||
      "activity update";
    const timeReferenceText =
      activity.timeReferenceText.trim() || extractTimeReferenceText(description) || null;
    const activityType =
      canonicalizeActivityType(`${activity.activityType.trim()} ${description}`) ||
      `Activity ${index + 1}`;

    return {
      activityType,
      activityCategory: canonicalizeActivityCategory(
        activityType,
        activity.activityCategory.trim() || "other"
      ),
      sessionCount: activity.sessionCount > 0 ? activity.sessionCount : 1,
      description,
      durationMinutes: activity.durationMinutes > 0 ? activity.durationMinutes : null,
      intensity: mapIntensity(activity.intensity),
      timeReferenceText,
      detectedKeyword: "model_extraction",
      loggedForDate: resolveLoggedForDateFromTimeReference(
        timeReferenceText,
        mapLoggedForDate(activity.loggedForDate)
      ),
      timePrecision: mapActivityTimePrecisionWithDateFallback({
        loggedForDate: activity.loggedForDate,
        timePrecision: activity.timePrecision
      }),
      confidence: activity.confidence > 0 ? activity.confidence : 0.7,
      missingFields: activity.missingFields.map((field) => field.trim()).filter(Boolean),
      ambiguityFlags: activity.ambiguityFlags.map((flag) => flag.trim()).filter(Boolean)
    };
  });
}

export function mapExtractedDietEntries(
  extracted: ExtractedUserUpdate["dietEntries"]
): ParsedDietEntry[] {
  return extracted.map((entry, index) => {
    const description = entry.description.trim() || `food update ${index + 1}`;
    const timeReferenceText =
      entry.timeReferenceText.trim() || extractTimeReferenceText(description) || null;

    return {
      description,
      mealType: mapMealType(entry.mealType),
      confidence: entry.confidence > 0 ? entry.confidence : 0.7,
      detectedKeyword: "model_extraction",
      timeReferenceText,
      loggedForDate: resolveLoggedForDateFromTimeReference(
        timeReferenceText,
        mapLoggedForDate(entry.loggedForDate)
      )
    };
  });
}

export function mapExtractedWellnessCheckin(
  extracted: ExtractedUserUpdate["wellness"]
): ParsedWellnessCheckin | null {
  if (!extracted.present) {
    return null;
  }

  const energyScore = mapZeroToNull(extracted.energyScore);
  const sorenessScore = mapZeroToNull(extracted.sorenessScore);
  const moodScore = mapZeroToNull(extracted.moodScore);
  const stressScore = mapZeroToNull(extracted.stressScore);
  const motivationScore = mapZeroToNull(extracted.motivationScore);
  const notes = extracted.notes.trim() || null;
  const detectedSignals = [
    extracted.energyScore > 0 ? "energy" : null,
    extracted.sorenessScore > 0 ? "soreness" : null,
    extracted.moodScore > 0 ? "mood" : null,
    extracted.stressScore > 0 ? "stress" : null,
    extracted.motivationScore > 0 ? "motivation" : null
  ].filter((value): value is string => Boolean(value));

  if (
    detectedSignals.length === 0 &&
    !hasMeaningfulWellnessNotes(extracted.notes)
  ) {
    return null;
  }

  return {
    energyScore,
    sorenessScore,
    moodScore,
    stressScore,
    motivationScore,
    notes,
    detectedSignals,
    loggedForDate: mapLoggedForDate(extracted.loggedForDate)
  };
}
