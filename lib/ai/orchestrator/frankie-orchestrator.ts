import type { Database } from "@/types/database";
import type { AppProfile } from "@/lib/profile";
import {
  buildAssistantReply,
  buildStructuredLogConfirmation,
  extractTimeReferenceText,
  isLikelyDietClause,
  parseActivityMessage,
  resolveLoggedForDateFromTimeReference,
  type ParsedActivity,
  type ParsedDietEntry,
  type ParsedWellnessCheckin
} from "@/lib/chat";
import { buildChatContext } from "@/lib/ai/context/load-chat-context";
import {
  buildCoachResponseSystemPrompt,
  buildCoachResponseUserPrompt
} from "@/lib/ai/prompts/coach-response";
import { buildExtractUserUpdatePrompt } from "@/lib/ai/prompts/extract-user-update";
import {
  createStructuredOpenAiResponse,
  createTextOpenAiResponse,
  hasOpenAiApiKey
} from "@/lib/ai/openai-responses";
import {
  extractedUserUpdateJsonSchema,
  type ExtractedUserUpdate,
  mapExtractedActivities,
  mapExtractedDietEntries,
  mapExtractedWellnessCheckin,
  parseExtractedUserUpdate
} from "@/lib/ai/schemas/extracted-user-update";

type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];
type ChatContextSnapshot = {
  profileSummary: string;
  recentConversation: string;
};

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
export const FRANKIE_PROMPT_VERSION = "frankie-orchestrator-v8";
const BLOCKING_ACTIVITY_MISSING_FIELDS = new Set([
  "activityType",
  "loggedForDate",
  "sessionSplit"
]);
const ALLOWED_ACTIVITY_MISSING_FIELDS = new Set([
  "activityType",
  "loggedForDate",
  "sessionSplit",
  "durationMinutes",
  "intensity",
  "movementFocus"
]);

export type FrankieOrchestrationResult = {
  assistantMessageType: "chat" | "log_confirmation";
  parsedActivities: ParsedActivity[];
  parsedDietEntries: ParsedDietEntry[];
  parsedWellnessCheckin: ParsedWellnessCheckin | null;
  reply: string;
  orchestrationMode: "model" | "rule_based_fallback";
  shouldPersistStructuredData: boolean;
  persistPlan: {
    activities: boolean;
    dietEntries: boolean;
    wellnessCheckin: boolean;
  };
  metadata: {
    extractionSource: "model" | "rule_based";
    usedOpenAi: boolean;
    fallbackReason?: string;
    intent?: string;
    needsClarification?: boolean;
    modelName?: string;
    promptVersion: string;
    contextSnapshot?: ChatContextSnapshot;
    rawModelExtraction?: ExtractedUserUpdate;
  };
};

function buildRuleBasedFallback(
  profile: AppProfile | null,
  message: string,
  fallbackReason: string
): FrankieOrchestrationResult {
  const fallbackReply = buildAssistantReply(profile, message);
  const persistPlan = {
    activities: fallbackReply.parsedActivities.length > 0,
    dietEntries: fallbackReply.parsedDietEntries.length > 0,
    wellnessCheckin: Boolean(fallbackReply.parsedWellnessCheckin)
  };
  const shouldPersist =
    fallbackReply.assistantMessageType === "log_confirmation" &&
    (persistPlan.activities || persistPlan.dietEntries || persistPlan.wellnessCheckin);

  return {
    assistantMessageType: fallbackReply.assistantMessageType,
    parsedActivities: fallbackReply.parsedActivities,
    parsedDietEntries: fallbackReply.parsedDietEntries,
    parsedWellnessCheckin: fallbackReply.parsedWellnessCheckin,
    reply: fallbackReply.reply,
    orchestrationMode: "rule_based_fallback",
    shouldPersistStructuredData: shouldPersist,
    persistPlan,
    metadata: {
      extractionSource: "rule_based",
      usedOpenAi: false,
      fallbackReason,
      promptVersion: FRANKIE_PROMPT_VERSION
    }
  };
}

function hasDurationMention(value: string) {
  return (
    /\b\d+\s*(?:minutes?|mins?|min|hours?|hrs?|hr)\b/i.test(value) ||
    /\b(?:about|around|roughly)?\s*(?:an|one)\s+hour\b/i.test(value)
  );
}

function hasIntensityMention(value: string) {
  return /\b(?:light|easy|recovery|moderate|steady|hard|intense|heavy)\b/i.test(value);
}

function hasExplicitMealTypeEvidence(value: string) {
  return /\b(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b/i.test(value);
}

function hasNumericScoreEvidence(value: string, cues: readonly string[]) {
  return splitEvidenceClauses(value).some((clause) =>
    cues.some((cue) => {
      const escapedCue = cue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const afterCue = new RegExp(
        `\\b${escapedCue}\\b[^\\d]{0,16}[1-5](?:\\s*(?:\\/|out of)\\s*5)?`,
        "i"
      );
      const beforeCue = new RegExp(
        `[1-5](?:\\s*(?:\\/|out of)\\s*5)?[^\\d]{0,16}\\b${escapedCue}\\b`,
        "i"
      );

      return afterCue.test(clause) || beforeCue.test(clause);
    })
  );
}

function hasWellnessSignalEvidence(value: string, cues: readonly string[]) {
  const normalizedValue = value.toLowerCase();

  return cues.some((cue) => {
    const escapedCue = cue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escapedCue}\\b`, "i").test(normalizedValue);
  });
}

function isStrengthActivity(activity: ParsedActivity) {
  return (
    activity.activityCategory === "strength" ||
    /\b(?:strength|lift|lifting|weight|weights|bench|squat|deadlift|clean)\b/i.test(
      activity.activityType
    )
  );
}

function hasStrengthFocusEvidence(value: string) {
  return /\b(?:bench|bench press|squat|squats|deadlift|deadlifts|clean|cleans|press|rows?|pullups?|pushups?|chest|back|shoulders|arms|biceps|triceps|legs|quads|hamstrings|glutes|core|upper body|lower body|full body)\b/i.test(
    value
  );
}

function splitEvidenceClauses(message: string) {
  return message
    .split(/\s*(?:[;,]|\band then\b|\bthen\b|\blater\b|\n)\s*/i)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function stripActivityScaffolding(value: string) {
  return value
    .toLowerCase()
    .replace(
      /\b(?:i|did|do|went|for|a|an|the|on|at|session|sessions|workout|workouts|activity|activities|today|yesterday|tomorrow|last night|this morning|this afternoon|tonight|\d+\s+days?\s+ago|sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday|s)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|weekend)\b/g,
      " "
    )
    .replace(/\b\d+\s*(?:minutes?|mins?|min|hours?|hrs?|hr)\b/g, " ")
    .replace(/\b(?:light|easy|recovery|moderate|steady|hard|intense|heavy)\b/g, " ")
    .replace(/[()[\]/:-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasActivityEvidence(value: string) {
  const stripped = stripActivityScaffolding(value);

  if (!stripped) {
    return false;
  }

  return !/^(?:and|plus|again|each|every|most|\d+|\s)+$/i.test(stripped);
}

function findActivityEvidence(message: string, activity: ParsedActivity) {
  const clauses = splitEvidenceClauses(message);
  const timeReferenceText = activity.timeReferenceText?.trim().toLowerCase();

  if (clauses.length === 1) {
    return clauses[0];
  }

  const description = activity.description.trim().toLowerCase();

  if (description) {
    const byDescription = clauses.find((clause) => clause.toLowerCase().includes(description));

    if (byDescription) {
      return byDescription;
    }
  }

  const activityType = normalizeActivityType(activity.activityType);

  if (activityType) {
    const byActivityType = clauses.find((clause) =>
      normalizeActivityType(clause).includes(activityType)
    );

    if (byActivityType) {
      return byActivityType;
    }
  }

  const descriptionTokens = stripActivityScaffolding(activity.description)
    .split(" ")
    .filter((token) => token.length >= 4);

  if (descriptionTokens.length > 0) {
    const byDescriptionTokens = clauses.find((clause) => {
      const normalizedClause = stripActivityScaffolding(clause);
      return descriptionTokens.some((token) => normalizedClause.includes(token));
    });

    if (byDescriptionTokens) {
      return byDescriptionTokens;
    }
  }

  if (timeReferenceText) {
    const byTime = clauses.find((clause) => clause.toLowerCase().includes(timeReferenceText));

    if (byTime) {
      return byTime;
    }
  }

  return activity.description;
}

function findDietEvidence(message: string, entry: ParsedDietEntry) {
  const clauses = splitEvidenceClauses(message);
  const timeReferenceText = entry.timeReferenceText?.trim().toLowerCase();

  if (timeReferenceText) {
    const byTime = clauses.find((clause) => clause.toLowerCase().includes(timeReferenceText));

    if (byTime) {
      return byTime;
    }
  }

  const description = entry.description.trim().toLowerCase();

  if (description) {
    const byDescription = clauses.find((clause) => clause.toLowerCase().includes(description));

    if (byDescription) {
      return byDescription;
    }
  }

  return entry.description;
}

function cleanDietGroupDescription(value: string) {
  return value
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(
      /\b(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday|s)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)\b/gi,
      " "
    )
    .replace(/\bi\s+(?:had|ate|drank|snacked(?:\s+on)?)\s+/i, " ")
    .replace(
      /^(?:\s*(?:for\s+)?(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b\s*(?:was|were|is|=|:)?\s*)/i,
      " "
    )
    .replace(
      /\s+for\s+(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b/i,
      " "
    )
    .replace(
      /\s+(?:as\s+a\s+)?(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b/i,
      " "
    )
    .replace(/^[\s,.;:-]*(?:a\s+|an\s+)?/i, "")
    .replace(/[.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDietEvidence(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function joinDietDescriptions(entries: ParsedDietEntry[]) {
  const descriptions = entries
    .map((entry) => entry.description.trim())
    .filter(Boolean);

  if (descriptions.length <= 1) {
    return descriptions[0] ?? "";
  }

  return `${descriptions.slice(0, -1).join(", ")} and ${descriptions[descriptions.length - 1]}`;
}

function getSkippedMealEntries(message: string): ParsedDietEntry[] {
  const mealTypes = ["breakfast", "lunch", "dinner"] as const;
  const timeReferenceText = extractTimeReferenceText(message);
  const loggedForDate = resolveLoggedForDateFromTimeReference(timeReferenceText, null);

  return mealTypes.flatMap((mealType) => {
    const skippedMealPattern = new RegExp(
      `\\b(?:${mealType}\\s+(?:was|got)?\\s*skipped|skipped\\s+${mealType}|missed\\s+${mealType})\\b`,
      "i"
    );

    if (!skippedMealPattern.test(message)) {
      return [];
    }

    return [
      {
        description: `skipped ${mealType}`,
        mealType,
        confidence: 0.9,
        detectedKeyword: "skipped_meal",
        timeReferenceText,
        loggedForDate
      }
    ];
  });
}

function splitDietEntryOnTimingTransition(input: {
  entry: ParsedDietEntry;
  evidence: string;
}) {
  const parts = input.evidence
    .split(/\s*(?:,\s*)?(?:and then|then|later|but\s+i\s+also\s+had|but\s+also\s+had)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const splitEntries = parts
    .map((part) => {
      const description = cleanDietGroupDescription(part);

      if (!description) {
        return null;
      }

      const timeReferenceText = extractTimeReferenceText(part) ?? input.entry.timeReferenceText;

      return {
        entry: {
          ...input.entry,
          description,
          mealType: hasExplicitMealTypeEvidence(part) ? input.entry.mealType : null,
          timeReferenceText,
          loggedForDate: resolveLoggedForDateFromTimeReference(
            timeReferenceText,
            input.entry.loggedForDate
          )
        },
        evidence: part
      };
    })
    .filter(
      (entryWithEvidence): entryWithEvidence is { entry: ParsedDietEntry; evidence: string } =>
        Boolean(entryWithEvidence)
    );

  return splitEntries.length > 1 ? splitEntries : null;
}

function normalizeActivityType(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b(?:session|sessions|workout|workouts)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeActivityDescription(value: string) {
  return stripActivityScaffolding(value);
}

function canonicalizeSupplementalActivity(activity: ParsedActivity): ParsedActivity {
  const normalizedDescription = normalizeActivityDescription(activity.description);
  const normalizedType = normalizeActivityType(activity.activityType);
  const isWalk = /\bwalk/.test(normalizedDescription) || normalizedType.includes("walking");
  const isHike = /\bhik/.test(normalizedDescription);
  const isRun = /\brun|\bran/.test(normalizedDescription) || normalizedType.includes("running");

  if (isHike) {
    return {
      ...activity,
      activityCategory: "outdoor_recreation",
      activityType: "hiking",
      description: "hiked"
    };
  }

  if (isWalk) {
    return {
      ...activity,
      activityCategory: "cardio",
      activityType: "walking",
      description: "walked"
    };
  }

  if (isRun) {
    return {
      ...activity,
      activityCategory: "cardio",
      activityType: "running",
      description: "ran"
    };
  }

  return {
    ...activity,
    activityType: normalizedType || activity.activityType
  };
}

function getActivityEvidenceKey(message: string, activity: ParsedActivity) {
  return normalizeActivityDescription(findActivityEvidence(message, activity));
}

function supplementMissingActivityClauses(
  activities: ParsedActivity[],
  message: string
) {
  if (!/\b(?:and then|then|later)\b/i.test(message)) {
    return activities;
  }

  const existingEvidenceKeys = new Set(
    activities.map((activity) => getActivityEvidenceKey(message, activity)).filter(Boolean)
  );
  const supplementalActivities = parseActivityMessage(message)
    .map(canonicalizeSupplementalActivity)
    .filter((activity) => {
      const evidenceKey = getActivityEvidenceKey(message, activity);

      if (!evidenceKey || existingEvidenceKeys.has(evidenceKey)) {
        return false;
      }

      existingEvidenceKeys.add(evidenceKey);
      return true;
    });

  return [...activities, ...supplementalActivities];
}

function getActivityQualityScore(activity: ParsedActivity) {
  return [
    activity.confidence ?? 0,
    activity.durationMinutes ? 0.25 : 0,
    activity.intensity ? 0.25 : 0,
    activity.timePrecision === "implicit_today" ? -0.25 : 0,
    activity.missingFields.length * -0.1
  ].reduce((total, score) => total + score, 0);
}

function shouldMergeLikelyDuplicateActivity(
  existing: ParsedActivity,
  incoming: ParsedActivity
) {
  if (normalizeActivityType(existing.activityType) !== normalizeActivityType(incoming.activityType)) {
    return false;
  }

  if (
    normalizeActivityDescription(existing.description) !==
    normalizeActivityDescription(incoming.description)
  ) {
    return false;
  }

  return (
    (incoming.confidence ?? 0) <= 0 ||
    (existing.confidence ?? 0) <= 0 ||
    incoming.timePrecision === "implicit_today" ||
    existing.timePrecision === "implicit_today"
  );
}

function mergeLikelyDuplicateActivity(
  existing: ParsedActivity,
  incoming: ParsedActivity
) {
  const existingScore = getActivityQualityScore(existing);
  const incomingScore = getActivityQualityScore(incoming);

  return existingScore >= incomingScore
    ? mergeActivity(existing, incoming)
    : mergeActivity(incoming, existing);
}

function mergeActivity(existing: ParsedActivity, incoming: ParsedActivity): ParsedActivity {
  return {
    ...existing,
    activityCategory:
      existing.activityCategory === "other" && incoming.activityCategory !== "other"
        ? incoming.activityCategory
        : existing.activityCategory,
    sessionCount: Math.max(existing.sessionCount ?? 1, incoming.sessionCount ?? 1),
    description:
      incoming.description.length > existing.description.length
        ? incoming.description
        : existing.description,
    durationMinutes: existing.durationMinutes ?? incoming.durationMinutes,
    intensity: existing.intensity ?? incoming.intensity,
    timeReferenceText: existing.timeReferenceText ?? incoming.timeReferenceText,
    loggedForDate: existing.loggedForDate || incoming.loggedForDate,
    confidence: Math.max(existing.confidence ?? 0.7, incoming.confidence ?? 0.7),
    missingFields: Array.from(new Set([...existing.missingFields, ...incoming.missingFields])),
    ambiguityFlags: Array.from(new Set([...existing.ambiguityFlags, ...incoming.ambiguityFlags]))
  };
}

function dedupeActivities(activities: ParsedActivity[]) {
  const likelyDuplicates = new Map<string, ParsedActivity>();

  for (const activity of activities) {
    const duplicateKey = [
      normalizeActivityType(activity.activityType),
      normalizeActivityDescription(activity.description)
    ].join("::");
    const existing = likelyDuplicates.get(duplicateKey);

    if (existing && shouldMergeLikelyDuplicateActivity(existing, activity)) {
      likelyDuplicates.set(duplicateKey, mergeLikelyDuplicateActivity(existing, activity));
      continue;
    }

    likelyDuplicates.set(duplicateKey, activity);
  }

  const deduped = new Map<string, ParsedActivity>();

  for (const activity of likelyDuplicates.values()) {
    const key = [
      normalizeActivityType(activity.activityType),
      activity.loggedForDate,
      activity.timeReferenceText?.toLowerCase().trim() ?? "",
      activity.durationMinutes ?? "",
      activity.intensity ?? ""
    ].join("::");
    const existing = deduped.get(key);

    deduped.set(key, existing ? mergeActivity(existing, activity) : activity);
  }

  return Array.from(deduped.values());
}

function ensureField(fields: string[], field: string) {
  return fields.includes(field) ? fields : [...fields, field];
}

function removeField(fields: string[], field: string) {
  return fields.filter((existingField) => existingField !== field);
}

function normalizeMissingFields(fields: string[]) {
  return fields
    .map((field) => field.trim())
    .filter((field) => ALLOWED_ACTIVITY_MISSING_FIELDS.has(field));
}

function sanitizeActivities(activities: ParsedActivity[], message: string) {
  const dedupedActivities = dedupeActivities(activities);

  return dedupedActivities
    .filter((activity) => {
      const evidence =
        dedupedActivities.length === 1 ? message : findActivityEvidence(message, activity);
      return hasActivityEvidence(evidence) || !isLikelyDietClause(evidence);
    })
    .map((activity) => {
      const evidence =
        dedupedActivities.length === 1 ? message : findActivityEvidence(message, activity);
      const hasActivity = hasActivityEvidence(evidence);
      const hasDuration = hasDurationMention(evidence);
      const hasIntensity = hasIntensityMention(evidence);
      const hasStrengthFocus = isStrengthActivity(activity) && hasStrengthFocusEvidence(evidence);
      let missingFields = normalizeMissingFields(activity.missingFields);
      let ambiguityFlags = [...activity.ambiguityFlags];

      missingFields = hasActivity
        ? removeField(missingFields, "activityType")
        : ensureField(missingFields, "activityType");
      missingFields = hasDuration
        ? removeField(missingFields, "durationMinutes")
        : ensureField(missingFields, "durationMinutes");
      missingFields = hasIntensity
        ? removeField(missingFields, "intensity")
        : ensureField(missingFields, "intensity");
      missingFields = hasStrengthFocus
        ? removeField(missingFields, "movementFocus")
        : isStrengthActivity(activity)
          ? ensureField(missingFields, "movementFocus")
          : removeField(missingFields, "movementFocus");

      if (!hasActivity) {
        ambiguityFlags = Array.from(
          new Set([...ambiguityFlags, "activity_type_inferred_without_evidence"])
        );
      }

      return {
        ...activity,
        durationMinutes: hasDuration ? activity.durationMinutes : null,
        intensity: hasIntensity ? activity.intensity : null,
        missingFields,
        ambiguityFlags
      };
    });
}

function sanitizeDietEntries(entries: ParsedDietEntry[], message: string) {
  const entriesWithSkippedMeals = [...getSkippedMealEntries(message), ...entries];
  const entriesWithEvidence = entriesWithSkippedMeals.map((entry) => {
    const evidence =
      entriesWithSkippedMeals.length === 1 &&
      /\b(?:and then|then|later|but\s+i\s+also\s+had|but\s+also\s+had)\b/i.test(message)
        ? message
        : findDietEvidence(message, entry);
    const timeReferenceText = extractTimeReferenceText(evidence) ?? entry.timeReferenceText;

    return {
      entry: {
        ...entry,
        description:
          entry.detectedKeyword === "skipped_meal"
            ? entry.description
            : cleanDietGroupDescription(entry.description) || entry.description,
        mealType:
          hasExplicitMealTypeEvidence(evidence) ||
          (entriesWithSkippedMeals.length === 1 && hasExplicitMealTypeEvidence(message))
            ? entry.mealType
            : null,
        timeReferenceText,
        loggedForDate: resolveLoggedForDateFromTimeReference(timeReferenceText, entry.loggedForDate)
      },
      evidence
    };
  });
  const expandedEntriesWithEvidence = entriesWithEvidence.flatMap((entryWithEvidence) => {
    return splitDietEntryOnTimingTransition(entryWithEvidence) ?? [entryWithEvidence];
  });

  const groupedEntries = new Map<
    string,
    { entries: ParsedDietEntry[]; evidence: string }
  >();

  for (const { entry, evidence } of expandedEntriesWithEvidence) {
    const key = [
      entry.loggedForDate,
      entry.mealType ?? "",
      normalizeDietEvidence(evidence)
    ].join("::");
    const existing = groupedEntries.get(key);

    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    groupedEntries.set(key, {
      entries: [entry],
      evidence
    });
  }

  return Array.from(groupedEntries.values()).map(({ entries: grouped, evidence }) => {
    const [firstEntry] = grouped;

    if (!firstEntry || grouped.length === 1) {
      return firstEntry;
    }

    return {
      ...firstEntry,
      description: cleanDietGroupDescription(evidence) || joinDietDescriptions(grouped),
      confidence: Math.max(...grouped.map((entry) => entry.confidence))
    };
  }).filter((entry): entry is ParsedDietEntry => Boolean(entry));
}

function sanitizeWellnessCheckin(
  checkin: ParsedWellnessCheckin | null,
  message: string
) {
  if (!checkin) {
    return null;
  }

  const wellnessSignals = [
    { key: "energy", cues: ["energy", "energized", "energised", "tired", "fatigued"] },
    { key: "soreness", cues: ["soreness", "sore", "aches", "achy"] },
    { key: "mood", cues: ["mood", "positive", "calm", "good", "down", "off"] },
    { key: "stress", cues: ["stress", "stressed"] },
    { key: "motivation", cues: ["motivation", "motivated", "drive"] }
  ] as const;
  const detectedSignals = new Set(checkin.detectedSignals);

  for (const signal of wellnessSignals) {
    if (hasWellnessSignalEvidence(message, signal.cues)) {
      detectedSignals.add(signal.key);
    }
  }

  const energyScore = hasNumericScoreEvidence(message, wellnessSignals[0].cues)
    ? checkin.energyScore
    : null;
  const sorenessScore = hasNumericScoreEvidence(message, wellnessSignals[1].cues)
    ? checkin.sorenessScore
    : null;
  const moodScore = hasNumericScoreEvidence(message, wellnessSignals[2].cues)
    ? checkin.moodScore
    : null;
  const stressScore = hasNumericScoreEvidence(message, wellnessSignals[3].cues)
    ? checkin.stressScore
    : null;
  const motivationScore = hasNumericScoreEvidence(message, wellnessSignals[4].cues)
    ? checkin.motivationScore
    : null;
  const normalizedSignals = Array.from(detectedSignals);
  const notes = checkin.notes ?? (normalizedSignals.length > 0 ? message.trim() : null);

  if (
    normalizedSignals.length === 0 &&
    !energyScore &&
    !sorenessScore &&
    !moodScore &&
    !stressScore &&
    !motivationScore &&
    !notes
  ) {
    return null;
  }

  return {
    ...checkin,
    energyScore,
    sorenessScore,
    moodScore,
    stressScore,
    motivationScore,
    notes,
    detectedSignals: normalizedSignals,
    loggedForDate: resolveLoggedForDateFromTimeReference(message, checkin.loggedForDate)
  };
}

function getBlockingActivityFields(activity: ParsedActivity) {
  return activity.missingFields.filter((field) => BLOCKING_ACTIVITY_MISSING_FIELDS.has(field));
}

function hasBlockingActivityIssue(activities: ParsedActivity[]) {
  return activities.some(
    (activity) =>
      getBlockingActivityFields(activity).length > 0 ||
      activity.ambiguityFlags.includes("multi_day_split_unclear") ||
      activity.ambiguityFlags.includes("grouped_session_count_without_distribution")
  );
}

function formatActivityLabel(activity: ParsedActivity) {
  if (activity.missingFields.includes("activityType")) {
    return "session";
  }

  return activity.activityType.toLowerCase();
}

function buildBlockingClarificationReply(activities: ParsedActivity[]) {
  const missingActivityType = activities.some((activity) =>
    activity.missingFields.includes("activityType")
  );
  const missingSessionSplit = activities.some(
    (activity) =>
      activity.missingFields.includes("sessionSplit") ||
      activity.ambiguityFlags.includes("multi_day_split_unclear") ||
      activity.ambiguityFlags.includes("grouped_session_count_without_distribution")
  );
  const missingDate = activities.some((activity) =>
    activity.missingFields.includes("loggedForDate")
  );

  if (missingActivityType) {
    return 'I can log the timing and details, but what activity was it? A format like "run 20 min light" or "yoga 30 min" works well.';
  }

  if (missingSessionSplit) {
    const activityLabels = Array.from(new Set(activities.map(formatActivityLabel))).join(", ");
    return `I can log that, but how were the ${activityLabels || "sessions"} split across the days? A format like "1 Monday, 1 Wednesday" works well.`;
  }

  if (missingDate) {
    return "I can log that, but when did it happen?";
  }

  return "I can log that, but I need one key detail first.";
}

function buildDietLabel(entry: ParsedDietEntry) {
  const timeText = entry.timeReferenceText?.trim();
  const mealText = entry.mealType ? `${entry.mealType} ` : "";

  return [timeText, `${mealText}${entry.description.toLowerCase()}`].filter(Boolean).join(" ");
}

function buildPartialPersistencePrefix(input: {
  parsedDietEntries: ParsedDietEntry[];
  parsedWellnessCheckin: ParsedWellnessCheckin | null;
}) {
  const parts: string[] = [];

  if (input.parsedDietEntries.length > 0) {
    parts.push(`I logged ${input.parsedDietEntries.map(buildDietLabel).join(", ")}.`);
  }

  if (input.parsedWellnessCheckin) {
    parts.push("I logged your wellness check-in.");
  }

  return parts.length > 0 ? `${parts.join(" ")} ` : "";
}

function hasPersistableData(input: {
  activities: ParsedActivity[];
  dietEntries: ParsedDietEntry[];
  wellnessCheckin: ParsedWellnessCheckin | null;
}) {
  return (
    input.activities.length > 0 ||
    input.dietEntries.length > 0 ||
    Boolean(input.wellnessCheckin)
  );
}

export async function orchestrateFrankieReply(input: {
  profile: AppProfile | null;
  message: string;
  recentMessages: ChatMessage[];
  skipCoachResponse?: boolean;
}): Promise<FrankieOrchestrationResult> {
  if (!hasOpenAiApiKey()) {
    return buildRuleBasedFallback(
      input.profile,
      input.message,
      "OPENAI_API_KEY is not configured."
    );
  }

  try {
    const context = buildChatContext({
      profile: input.profile,
      recentMessages: input.recentMessages
    });
    const extractedUnknown = await createStructuredOpenAiResponse({
      systemPrompt: buildExtractUserUpdatePrompt(),
      userPrompt: input.message,
      schemaName: "frankie_user_update",
      schema: extractedUserUpdateJsonSchema
    });
    const extracted = parseExtractedUserUpdate(extractedUnknown);
    const parsedActivities = sanitizeActivities(
      supplementMissingActivityClauses(mapExtractedActivities(extracted.activities), input.message),
      input.message
    );
    const parsedDietEntries = sanitizeDietEntries(
      mapExtractedDietEntries(extracted.dietEntries),
      input.message
    );
    const parsedWellnessCheckin = sanitizeWellnessCheckin(
      mapExtractedWellnessCheckin(extracted.wellness),
      input.message
    );
    const structuredFallback = buildStructuredLogConfirmation(
      input.profile,
      parsedActivities,
      parsedDietEntries,
      parsedWellnessCheckin
    );
    const blockingActivityIssue = hasBlockingActivityIssue(parsedActivities);
    const usableData = hasPersistableData({
      activities: parsedActivities,
      dietEntries: parsedDietEntries,
      wellnessCheckin: parsedWellnessCheckin
    });

    if (blockingActivityIssue) {
      const persistPlan = {
        activities: false,
        dietEntries: parsedDietEntries.length > 0,
        wellnessCheckin: Boolean(parsedWellnessCheckin)
      };

      return {
        assistantMessageType: "chat",
        parsedActivities,
        parsedDietEntries,
        parsedWellnessCheckin,
        reply: `${buildPartialPersistencePrefix({
          parsedDietEntries,
          parsedWellnessCheckin
        })}${buildBlockingClarificationReply(parsedActivities)}`,
        orchestrationMode: "model",
        shouldPersistStructuredData: persistPlan.dietEntries || persistPlan.wellnessCheckin,
        persistPlan,
        metadata: {
          extractionSource: "model",
          usedOpenAi: true,
          modelName: DEFAULT_OPENAI_MODEL,
          promptVersion: FRANKIE_PROMPT_VERSION,
          intent: extracted.intent,
          needsClarification: true,
          contextSnapshot: context,
          rawModelExtraction: extracted
        }
      };
    }

    if (extracted.needsClarification && extracted.clarificationQuestion.trim() && !usableData) {
      return {
        assistantMessageType: "chat",
        parsedActivities,
        parsedDietEntries,
        parsedWellnessCheckin,
        reply: extracted.clarificationQuestion.trim(),
        orchestrationMode: "model",
        shouldPersistStructuredData: false,
        persistPlan: {
          activities: false,
          dietEntries: false,
          wellnessCheckin: false
        },
        metadata: {
          extractionSource: "model",
          usedOpenAi: true,
          modelName: DEFAULT_OPENAI_MODEL,
          promptVersion: FRANKIE_PROMPT_VERSION,
          intent: extracted.intent,
          needsClarification: true,
          contextSnapshot: context,
          rawModelExtraction: extracted
        }
      };
    }

    const reply = input.skipCoachResponse
      ? null
      : await createTextOpenAiResponse({
          systemPrompt: buildCoachResponseSystemPrompt(),
          userPrompt: buildCoachResponseUserPrompt({
            profile: input.profile,
            userMessage: input.message,
            recentConversation: context.recentConversation,
            activities: parsedActivities,
            dietEntries: parsedDietEntries,
            wellnessCheckin: parsedWellnessCheckin
          })
        });

    return {
      assistantMessageType: structuredFallback ? "log_confirmation" : "chat",
      parsedActivities,
      parsedDietEntries,
      parsedWellnessCheckin,
      reply:
        reply ||
        structuredFallback?.reply ||
        buildRuleBasedFallback(
          input.profile,
          input.message,
          "Model returned an empty reply."
        ).reply,
      orchestrationMode: "model",
      shouldPersistStructuredData: usableData,
      persistPlan: {
        activities: parsedActivities.length > 0,
        dietEntries: parsedDietEntries.length > 0,
        wellnessCheckin: Boolean(parsedWellnessCheckin)
      },
      metadata: {
        extractionSource: "model",
        usedOpenAi: true,
        modelName: DEFAULT_OPENAI_MODEL,
        promptVersion: FRANKIE_PROMPT_VERSION,
        intent: extracted.intent,
        needsClarification: false,
        contextSnapshot: context,
        rawModelExtraction: extracted
      }
    };
  } catch (error) {
    return buildRuleBasedFallback(
      input.profile,
      input.message,
      error instanceof Error ? error.message : "Unknown AI orchestration error."
    );
  }
}
