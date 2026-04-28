import { z } from "zod";
import type {
  ParsedActivity,
  ParsedDietEntry,
  ParsedWellnessCheckin,
  RelativeLoggedFor
} from "@/lib/chat";

const relativeLoggedForOptions = ["today", "yesterday", "unknown"] as const;
const intensityOptions = ["unknown", "Light", "Moderate", "Hard"] as const;
const mealTypeOptions = ["unknown", "breakfast", "lunch", "dinner", "snack"] as const;
const intentOptions = [
  "log_update",
  "general_question",
  "mixed_update",
  "unclear"
] as const;

const extractedActivitySchema = z.object({
  activityType: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().min(0),
  intensity: z.enum(intensityOptions),
  loggedFor: z.enum(relativeLoggedForOptions)
});

const extractedDietEntrySchema = z.object({
  description: z.string().min(1),
  mealType: z.enum(mealTypeOptions),
  confidence: z.number().min(0).max(1),
  loggedFor: z.enum(relativeLoggedForOptions)
});

const extractedWellnessSchema = z.object({
  present: z.boolean(),
  energyScore: z.number().int().min(0).max(5),
  sorenessScore: z.number().int().min(0).max(5),
  moodScore: z.number().int().min(0).max(5),
  stressScore: z.number().int().min(0).max(5),
  motivationScore: z.number().int().min(0).max(5),
  notes: z.string(),
  loggedFor: z.enum(relativeLoggedForOptions)
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
          activityType: { type: "string" },
          description: { type: "string" },
          durationMinutes: { type: "integer", minimum: 0 },
          intensity: { type: "string", enum: intensityOptions },
          loggedFor: { type: "string", enum: relativeLoggedForOptions }
        },
        required: [
          "activityType",
          "description",
          "durationMinutes",
          "intensity",
          "loggedFor"
        ]
      }
    },
    dietEntries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          description: { type: "string" },
          mealType: { type: "string", enum: mealTypeOptions },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          loggedFor: { type: "string", enum: relativeLoggedForOptions }
        },
        required: ["description", "mealType", "confidence", "loggedFor"]
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
        loggedFor: { type: "string", enum: relativeLoggedForOptions }
      },
      required: [
        "present",
        "energyScore",
        "sorenessScore",
        "moodScore",
        "stressScore",
        "motivationScore",
        "notes",
        "loggedFor"
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

function mapRelativeLoggedFor(value: RelativeLoggedFor) {
  return value;
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

export function mapExtractedActivities(
  extracted: ExtractedUserUpdate["activities"]
): ParsedActivity[] {
  return extracted.map((activity, index) => ({
    activityType: activity.activityType.trim() || `Activity ${index + 1}`,
    description: activity.description.trim() || activity.activityType.trim() || "activity update",
    durationMinutes: activity.durationMinutes > 0 ? activity.durationMinutes : null,
    intensity: mapIntensity(activity.intensity),
    detectedKeyword: "model_extraction",
    loggedFor: mapRelativeLoggedFor(activity.loggedFor)
  }));
}

export function mapExtractedDietEntries(
  extracted: ExtractedUserUpdate["dietEntries"]
): ParsedDietEntry[] {
  return extracted.map((entry, index) => ({
    description: entry.description.trim() || `food update ${index + 1}`,
    mealType: mapMealType(entry.mealType),
    confidence: entry.confidence > 0 ? entry.confidence : 0.7,
    detectedKeyword: "model_extraction",
    loggedFor: mapRelativeLoggedFor(entry.loggedFor)
  }));
}

export function mapExtractedWellnessCheckin(
  extracted: ExtractedUserUpdate["wellness"]
): ParsedWellnessCheckin | null {
  if (!extracted.present) {
    return null;
  }

  return {
    energyScore: mapZeroToNull(extracted.energyScore),
    sorenessScore: mapZeroToNull(extracted.sorenessScore),
    moodScore: mapZeroToNull(extracted.moodScore),
    stressScore: mapZeroToNull(extracted.stressScore),
    motivationScore: mapZeroToNull(extracted.motivationScore),
    notes: extracted.notes.trim() || null,
    detectedSignals: [
      extracted.energyScore > 0 ? "energy" : null,
      extracted.sorenessScore > 0 ? "soreness" : null,
      extracted.moodScore > 0 ? "mood" : null,
      extracted.stressScore > 0 ? "stress" : null,
      extracted.motivationScore > 0 ? "motivation" : null
    ].filter((value): value is string => Boolean(value)),
    loggedFor: mapRelativeLoggedFor(extracted.loggedFor)
  };
}
