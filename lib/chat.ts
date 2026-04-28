import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

type ChatThread = Database["public"]["Tables"]["conversation_threads"]["Row"];
type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

export type ChatExperience = {
  schemaReady: boolean;
  thread: ChatThread | null;
  messages: ChatMessage[];
  error: string | null;
};

export type RelativeLoggedFor = "today" | "yesterday" | "unknown";

export type ParsedActivity = {
  activityType: string;
  durationMinutes: number | null;
  intensity: string | null;
  description: string;
  detectedKeyword: string;
  loggedFor: RelativeLoggedFor;
};

export type ParsedDietEntry = {
  description: string;
  mealType: string | null;
  confidence: number;
  detectedKeyword: string;
  loggedFor: RelativeLoggedFor;
};

export type ParsedWellnessCheckin = {
  energyScore: number | null;
  sorenessScore: number | null;
  moodScore: number | null;
  stressScore: number | null;
  motivationScore: number | null;
  notes: string | null;
  detectedSignals: string[];
  loggedFor: RelativeLoggedFor;
};

type ActivityMatch = {
  label: string;
  keyword: string;
  index: number;
};

type MealMatch = {
  label: string;
  keyword: string;
  index: number;
};

const activityKeywordMap: Array<{ keywords: string[]; label: string }> = [
  { keywords: ["run", "ran", "jog", "jogged"], label: "Running" },
  { keywords: ["walk", "walked", "hike", "hiked"], label: "Walking" },
  {
    keywords: [
      "weight lifting",
      "strength training",
      "lifting",
      "lift",
      "lifted",
      "weights",
      "strength",
      "trained",
      "clean",
      "cleans",
      "bench",
      "bench press",
      "squat",
      "squats",
      "deadlift",
      "deadlifts"
    ],
    label: "Strength training"
  },
  { keywords: ["bike", "biked", "cycle", "cycled"], label: "Cycling" },
  { keywords: ["row", "rowed", "rowing"], label: "Rowing" },
  { keywords: ["yoga"], label: "Yoga" },
  { keywords: ["stretch", "stretching", "mobility"], label: "Mobility" }
];

const mealKeywordMap: Array<{ keywords: string[]; label: string }> = [
  { keywords: ["breakfast", "brunch"], label: "breakfast" },
  { keywords: ["lunch"], label: "lunch" },
  { keywords: ["dinner", "supper"], label: "dinner" },
  {
    keywords: ["snack", "snacks", "protein bar", "bar", "shake", "smoothie", "dessert"],
    label: "snack"
  }
];

const foodCueKeywords = [
  "egg",
  "eggs",
  "toast",
  "fruit",
  "rice",
  "chicken",
  "beef",
  "steak",
  "salad",
  "sandwich",
  "oatmeal",
  "yogurt",
  "banana",
  "apple",
  "protein",
  "bar",
  "shake",
  "smoothie",
  "coffee",
  "tea",
  "water",
  "milk",
  "pasta",
  "pizza",
  "potato",
  "potatoes",
  "meal",
  "snack",
  "breakfast",
  "lunch",
  "dinner"
];

function isMissingChatTable(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    message.includes("public.conversation_threads") ||
    message.includes("public.conversation_messages") ||
    message.includes("public.activity_logs") ||
    message.includes("public.diet_logs") ||
    message.includes("public.wellness_checkins")
  );
}

function buildInitialAssistantMessage(profile: AppProfile | null) {
  if (profile?.onboarding_summary) {
    return `${profile.onboarding_summary} A good place to start is simple: log today's workout, tell me what you ate, or give me a quick wellness check-in and I will take it from there.`;
  }

  return "Good to see you. Want to log something, check in, or plan today?";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findActivityMatch(clause: string): ActivityMatch | null {
  const normalizedClause = clause.toLowerCase();
  let bestMatch: ActivityMatch | null = null;

  activityKeywordMap.forEach(({ label, keywords }) => {
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
      const match = regex.exec(normalizedClause);

      if (!match || match.index === undefined) {
        return;
      }

      if (
        !bestMatch ||
        match.index < bestMatch.index ||
        (match.index === bestMatch.index && keyword.length > bestMatch.keyword.length)
      ) {
        bestMatch = {
          label,
          keyword,
          index: match.index
        };
      }
    });
  });

  return bestMatch;
}

function findMealMatch(clause: string): MealMatch | null {
  const normalizedClause = clause.toLowerCase();
  let bestMatch: MealMatch | null = null;

  mealKeywordMap.forEach(({ label, keywords }) => {
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
      const match = regex.exec(normalizedClause);

      if (!match || match.index === undefined) {
        return;
      }

      if (
        !bestMatch ||
        match.index < bestMatch.index ||
        (match.index === bestMatch.index && keyword.length > bestMatch.keyword.length)
      ) {
        bestMatch = {
          label,
          keyword,
          index: match.index
        };
      }
    });
  });

  return bestMatch;
}

function splitActivityClauses(message: string) {
  return message
    .split(/\s*(?:,|;|\band then\b|\bthen\b|\band\b|\bplus\b|&)\s*/i)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function splitDietClauses(message: string) {
  return message
    .split(
      /\s*(?:,|;|\band then\b|\bthen\b|\bplus\b|&|\band (?=(?:i\s+(?:had|ate|drank|snacked)\b|for\s+(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b|(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b)))\s*/i
    )
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function splitWellnessClauses(message: string) {
  return message
    .split(/\s*(?:,|;|\band\b|\bbut\b|\bwhile\b|&|\.)\s*/i)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function getDurationMinutes(clause: string) {
  const normalizedClause = clause.toLowerCase();
  const minuteMatch = normalizedClause.match(/(\d+)\s*(minutes?|mins?|min)\b/);
  const hourMatch = normalizedClause.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr)\b/);

  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1], 10);
  }

  if (hourMatch) {
    return Math.round(Number.parseFloat(hourMatch[1]) * 60);
  }

  return null;
}

function getIntensity(clause: string) {
  const normalizedClause = clause.toLowerCase();

  if (normalizedClause.match(/\b(easy|light|recovery)\b/)) {
    return "Light";
  }

  if (normalizedClause.match(/\b(moderate|steady)\b/)) {
    return "Moderate";
  }

  if (normalizedClause.match(/\b(hard|intense|heavy)\b/)) {
    return "Hard";
  }

  return null;
}

function hasFoodCue(clause: string) {
  const normalizedClause = clause.toLowerCase();

  return foodCueKeywords.some((keyword) => {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
    return regex.test(normalizedClause);
  });
}

function cleanDietDescription(clause: string) {
  return clause
    .replace(
      /^(?:for\s+)?(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b\s*(?:was|were|is|=|:)?\s*/i,
      ""
    )
    .replace(/^i\s+(?:had|ate|drank|snacked(?:\s+on)?)\s+/i, "")
    .replace(
      /\s+for\s+(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b/i,
      ""
    )
    .replace(
      /\s+(?:as\s+a\s+)?(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b/i,
      ""
    )
    .replace(/[.]+$/g, "")
    .trim();
}

function looksLikeDietClause(clause: string, mealMatch: MealMatch | null) {
  const normalizedClause = clause.toLowerCase();
  const hasDietVerb = /\b(?:had|ate|drank|snacked(?:\s+on)?)\b/i.test(normalizedClause);
  const hasMealContext =
    mealMatch !== null ||
    /\bfor\s+(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b/i.test(
      normalizedClause
    ) ||
    /^(?:my\s+)?(?:breakfast|brunch|lunch|dinner|supper|snack|snacks|dessert)\b/i.test(
      normalizedClause
    );

  if (hasMealContext) {
    return true;
  }

  if (!hasDietVerb) {
    return false;
  }

  if (hasFoodCue(clause)) {
    return true;
  }

  return findActivityMatch(clause) === null;
}

function hasAnyCue(clause: string, cues: string[]) {
  return cues.some((cue) => {
    const regex = new RegExp(`\\b${escapeRegex(cue)}\\b`, "i");
    return regex.test(clause);
  });
}

function hasCueDescriptorPattern(
  clause: string,
  cues: string[],
  descriptors: string[]
) {
  const cuePattern = cues.map((cue) => escapeRegex(cue)).join("|");
  const descriptorPattern = descriptors
    .sort((left, right) => right.length - left.length)
    .map((descriptor) => escapeRegex(descriptor))
    .join("|");

  if (!cuePattern || !descriptorPattern) {
    return false;
  }

  return new RegExp(
    `\\b(?:${cuePattern})\\b(?:\\s+(?:is|feels|felt|seems|has been))?\\s+(?:${descriptorPattern})\\b`,
    "i"
  ).test(clause);
}

function getNumericScore(clause: string, cues: string[]) {
  const normalizedClause = clause.toLowerCase();

  for (const cue of cues) {
    const escapedCue = escapeRegex(cue);
    const afterCue = new RegExp(
      `\\b${escapedCue}\\b[^\\d]{0,16}([1-5])(?:\\s*(?:\\/|out of)\\s*5)?`,
      "i"
    );
    const afterMatch = normalizedClause.match(afterCue);

    if (afterMatch) {
      return Number.parseInt(afterMatch[1], 10);
    }

    const beforeCue = new RegExp(
      `([1-5])(?:\\s*(?:\\/|out of)\\s*5)?[^\\d]{0,16}\\b${escapedCue}\\b`,
      "i"
    );
    const beforeMatch = normalizedClause.match(beforeCue);

    if (beforeMatch) {
      return Number.parseInt(beforeMatch[1], 10);
    }
  }

  return null;
}

function getEnergyScore(clause: string) {
  const numericScore = getNumericScore(clause, ["energy"]);

  if (numericScore !== null) {
    return numericScore;
  }

  const normalizedClause = clause.toLowerCase();
  const hasEnergyCue = hasAnyCue(normalizedClause, [
    "energy",
    "energized",
    "energised",
    "tired",
    "fatigued",
    "fatigue",
    "exhausted",
    "drained",
    "wiped",
    "sluggish"
  ]);

  if (!hasEnergyCue) {
    return null;
  }

  if (/\b(?:no energy|zero energy|exhausted|drained|wiped)\b/i.test(normalizedClause)) {
    return 1;
  }

  if (
    /\b(?:low energy|tired|fatigued|fatigue|sluggish|a bit tired)\b/i.test(
      normalizedClause
    ) ||
    hasCueDescriptorPattern(normalizedClause, ["energy"], ["low", "tired", "sluggish"])
  ) {
    return 2;
  }

  if (
    /\b(?:okay|ok|fine|decent|moderate|all right|alright)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["energy"], ["okay", "ok", "fine", "decent"])
  ) {
    return 3;
  }

  if (
    /\b(?:great|amazing|excellent|energized|energised|high energy)\b/i.test(
      normalizedClause
    ) ||
    hasCueDescriptorPattern(normalizedClause, ["energy"], ["great", "amazing", "excellent", "high"])
  ) {
    return 5;
  }

  if (
    /\b(?:solid|good|steady|pretty good)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["energy"], ["solid", "good", "steady"])
  ) {
    return 4;
  }

  return 3;
}

function getSorenessScore(clause: string) {
  const numericScore = getNumericScore(clause, ["soreness", "sore", "recovery"]);

  if (numericScore !== null) {
    return numericScore;
  }

  const normalizedClause = clause.toLowerCase();
  const hasSorenessCue = hasAnyCue(normalizedClause, [
    "sore",
    "soreness",
    "stiff",
    "beat up",
    "wrecked",
    "fresh",
    "recovered",
    "recovery"
  ]);

  if (!hasSorenessCue) {
    return null;
  }

  if (/\b(?:not sore|no soreness|fresh|fully recovered)\b/i.test(normalizedClause)) {
    return 1;
  }

  if (
    /\b(?:a little sore|slightly sore|mild soreness|light soreness)\b/i.test(
      normalizedClause
    ) ||
    hasCueDescriptorPattern(normalizedClause, ["soreness", "sore"], ["light", "mild", "slight"])
  ) {
    return 2;
  }

  if (
    /\b(?:very sore|pretty sore|quite sore|beat up)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["soreness", "sore"], ["high", "very sore"])
  ) {
    return 4;
  }

  if (/\b(?:wrecked|extremely sore|can barely move)\b/i.test(normalizedClause)) {
    return 5;
  }

  if (
    /\b(?:sore|soreness|stiff|tight)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["soreness", "sore"], ["moderate", "okay", "ok"])
  ) {
    return 3;
  }

  return 3;
}

function getStressScore(clause: string) {
  const numericScore = getNumericScore(clause, ["stress", "stressed"]);

  if (numericScore !== null) {
    return numericScore;
  }

  const normalizedClause = clause.toLowerCase();
  const hasStressCue = hasAnyCue(normalizedClause, [
    "stress",
    "stressed",
    "overwhelmed",
    "tense",
    "pressure",
    "anxious",
    "anxiety",
    "calm",
    "relaxed"
  ]);

  if (!hasStressCue) {
    return null;
  }

  if (/\b(?:calm|relaxed|low stress|stress is low)\b/i.test(normalizedClause)) {
    return 1;
  }

  if (
    /\b(?:manageable|a little stressed|slight stress|some pressure)\b/i.test(
      normalizedClause
    ) ||
    hasCueDescriptorPattern(normalizedClause, ["stress"], ["manageable", "light", "slight"])
  ) {
    return 2;
  }

  if (
    /\b(?:moderate stress|stress is okay|stress is fine|some stress)\b/i.test(
      normalizedClause
    ) ||
    hasCueDescriptorPattern(normalizedClause, ["stress"], ["moderate", "okay", "ok", "fine"])
  ) {
    return 3;
  }

  if (/\b(?:extremely stressed|maxed out|swamped|burned out)\b/i.test(normalizedClause)) {
    return 5;
  }

  if (
    /\b(?:stressed|high stress|overwhelmed|tense|anxious)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["stress"], ["high"])
  ) {
    return 4;
  }

  return 3;
}

function getMotivationScore(clause: string) {
  const numericScore = getNumericScore(clause, ["motivation", "motivated"]);

  if (numericScore !== null) {
    return numericScore;
  }

  const normalizedClause = clause.toLowerCase();
  const hasMotivationCue = hasAnyCue(normalizedClause, [
    "motivation",
    "motivated",
    "unmotivated",
    "drive",
    "fired up",
    "not feeling it",
    "ready to train"
  ]);

  if (!hasMotivationCue) {
    return null;
  }

  if (/\b(?:no motivation|zero motivation|unmotivated|not feeling it)\b/i.test(normalizedClause)) {
    return 1;
  }

  if (
    /\b(?:low motivation|hard to get going|motivation is low)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["motivation"], ["low"])
  ) {
    return 2;
  }

  if (
    /\b(?:mixed motivation|okay motivation|motivation is okay|some motivation)\b/i.test(
      normalizedClause
    ) ||
    hasCueDescriptorPattern(normalizedClause, ["motivation"], ["okay", "ok", "fine", "mixed", "steady"])
  ) {
    return 3;
  }

  if (
    /\b(?:fired up|very motivated|high motivation)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["motivation"], ["high"])
  ) {
    return 5;
  }

  if (
    /\b(?:motivated|ready to train|solid motivation)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["motivation"], ["solid", "good"])
  ) {
    return 4;
  }

  return 3;
}

function getMoodScore(clause: string) {
  const numericScore = getNumericScore(clause, ["mood", "headspace", "mindset"]);

  if (numericScore !== null) {
    return numericScore;
  }

  const normalizedClause = clause.toLowerCase();
  const hasOtherWellnessCue =
    getEnergyScore(clause) !== null ||
    getSorenessScore(clause) !== null ||
    getStressScore(clause) !== null ||
    getMotivationScore(clause) !== null;
  const hasMoodCue =
    hasAnyCue(normalizedClause, [
      "mood",
      "headspace",
      "mindset",
      "mental",
      "emotionally"
    ]) ||
    (/\b(?:feel|feeling)\b/i.test(normalizedClause) && !hasOtherWellnessCue);

  if (!hasMoodCue) {
    return null;
  }

  if (/\b(?:awful|terrible|miserable|really down)\b/i.test(normalizedClause)) {
    return 1;
  }

  if (/\b(?:rough|off|not great|down|low mood)\b/i.test(normalizedClause)) {
    return 2;
  }

  if (
    /\b(?:okay|ok|fine|neutral|steady)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["mood", "headspace", "mindset"], [
      "okay",
      "ok",
      "fine",
      "neutral",
      "steady"
    ])
  ) {
    return 3;
  }

  if (
    /\b(?:great|excellent|amazing|really good)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["mood", "headspace", "mindset"], [
      "great",
      "excellent",
      "amazing"
    ])
  ) {
    return 5;
  }

  if (
    /\b(?:good|calm|pretty good|positive)\b/i.test(normalizedClause) ||
    hasCueDescriptorPattern(normalizedClause, ["mood", "headspace", "mindset"], [
      "good",
      "calm",
      "positive"
    ])
  ) {
    return 4;
  }

  return 3;
}

async function getOrCreatePrimaryThread(userId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const { data: existingThread, error: existingThreadError } = await supabase
    .from("conversation_threads")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingThreadError) {
    return {
      thread: null,
      error: existingThreadError.message
    };
  }

  if (existingThread) {
    return {
      thread: existingThread,
      error: null
    };
  }

  const { data: createdThread, error: createdThreadError } = await supabase
    .from("conversation_threads")
    .insert({
      user_id: userId,
      title
    })
    .select("*")
    .single();

  return {
    thread: createdThread,
    error: createdThreadError?.message ?? null
  };
}

async function seedInitialAssistantMessage(
  threadId: string,
  userId: string,
  profile: AppProfile | null
) {
  const supabase = await createSupabaseServerClient();
  const { data: existingMessages, error: existingMessagesError } = await supabase
    .from("conversation_messages")
    .select("id")
    .eq("thread_id", threadId)
    .limit(1);

  if (existingMessagesError) {
    return existingMessagesError.message;
  }

  if (existingMessages && existingMessages.length > 0) {
    return null;
  }

  const initialMessage = buildInitialAssistantMessage(profile);
  const { error: insertError } = await supabase.from("conversation_messages").insert({
    thread_id: threadId,
    user_id: userId,
    role: "assistant",
    message_type: profile?.onboarding_summary ? "summary" : "chat",
    content: initialMessage,
    structured_payload: profile?.onboarding_summary
      ? {
          seededFromOnboarding: true
        }
      : {}
  });

  return insertError?.message ?? null;
}

export async function getChatExperience(
  context: CurrentAppContext,
  displayName: string
): Promise<ChatExperience> {
  if (!context.schemaReady || !context.user) {
    return {
      schemaReady: context.schemaReady,
      thread: null,
      messages: [],
      error: context.error
    };
  }

  const threadTitle = `${displayName}'s Frankie chat`;
  const { thread, error: threadError } = await getOrCreatePrimaryThread(
    context.user.id,
    threadTitle
  );

  if (!thread) {
    return {
      schemaReady: !isMissingChatTable(threadError),
      thread: null,
      messages: [],
      error: threadError
    };
  }

  const seedError = await seedInitialAssistantMessage(
    thread.id,
    context.user.id,
    context.profile
  );

  if (seedError) {
    return {
      schemaReady: !isMissingChatTable(seedError),
      thread,
      messages: [],
      error: seedError
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: messages, error: messagesError } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  return {
    schemaReady: !isMissingChatTable(messagesError?.message),
    thread,
    messages: messages ?? [],
    error: messagesError?.message ?? null
  };
}

export function parseActivityMessage(message: string): ParsedActivity[] {
  const clauses = splitActivityClauses(message);
  const parsedActivities: ParsedActivity[] = [];

  clauses.forEach((clause) => {
    const activityMatch = findActivityMatch(clause);

    if (!activityMatch) {
      return;
    }

    parsedActivities.push({
      activityType: activityMatch.label,
      durationMinutes: getDurationMinutes(clause),
      intensity: getIntensity(clause),
      description: clause,
      detectedKeyword: activityMatch.keyword,
      loggedFor: "today"
    });
  });

  return parsedActivities;
}

export function parseDietMessage(message: string): ParsedDietEntry[] {
  const clauses = splitDietClauses(message);
  const parsedEntries: ParsedDietEntry[] = [];
  const seenKeys = new Set<string>();

  clauses.forEach((clause) => {
    const mealMatch = findMealMatch(clause);

    if (!looksLikeDietClause(clause, mealMatch)) {
      return;
    }

    const cleanedDescription = cleanDietDescription(clause);

    if (!cleanedDescription) {
      return;
    }

    const entry: ParsedDietEntry = {
      description: cleanedDescription,
      mealType: mealMatch?.label ?? null,
      confidence: mealMatch ? 0.92 : hasFoodCue(clause) ? 0.82 : 0.7,
      detectedKeyword: mealMatch?.keyword ?? "food_update",
      loggedFor: "today"
    };
    const dedupeKey = `${entry.mealType ?? "unknown"}::${entry.description.toLowerCase()}`;

    if (seenKeys.has(dedupeKey)) {
      return;
    }

    seenKeys.add(dedupeKey);
    parsedEntries.push(entry);
  });

  return parsedEntries;
}

export function parseWellnessMessage(message: string): ParsedWellnessCheckin | null {
  const clauses = splitWellnessClauses(message);
  const relevantClauses: string[] = [];
  const detectedSignals = new Set<string>();
  let energyScore: number | null = null;
  let sorenessScore: number | null = null;
  let moodScore: number | null = null;
  let stressScore: number | null = null;
  let motivationScore: number | null = null;

  clauses.forEach((clause) => {
    const normalizedClause = clause.trim();

    if (!normalizedClause) {
      return;
    }

    let clauseMatched = false;

    const nextEnergyScore = getEnergyScore(normalizedClause);

    if (nextEnergyScore !== null) {
      energyScore = nextEnergyScore;
      detectedSignals.add("energy");
      clauseMatched = true;
    }

    const nextSorenessScore = getSorenessScore(normalizedClause);

    if (nextSorenessScore !== null) {
      sorenessScore = nextSorenessScore;
      detectedSignals.add("soreness");
      clauseMatched = true;
    }

    const nextMoodScore = getMoodScore(normalizedClause);

    if (nextMoodScore !== null) {
      moodScore = nextMoodScore;
      detectedSignals.add("mood");
      clauseMatched = true;
    }

    const nextStressScore = getStressScore(normalizedClause);

    if (nextStressScore !== null) {
      stressScore = nextStressScore;
      detectedSignals.add("stress");
      clauseMatched = true;
    }

    const nextMotivationScore = getMotivationScore(normalizedClause);

    if (nextMotivationScore !== null) {
      motivationScore = nextMotivationScore;
      detectedSignals.add("motivation");
      clauseMatched = true;
    }

    if (clauseMatched) {
      relevantClauses.push(normalizedClause.replace(/[.]+$/g, ""));
    }
  });

  if (
    energyScore === null &&
    sorenessScore === null &&
    moodScore === null &&
    stressScore === null &&
    motivationScore === null
  ) {
    return null;
  }

  return {
    energyScore,
    sorenessScore,
    moodScore,
    stressScore,
    motivationScore,
    notes: relevantClauses.length > 0 ? relevantClauses.join("; ") : null,
    detectedSignals: Array.from(detectedSignals),
    loggedFor: "today"
  };
}

function formatActivityConfirmation(activity: ParsedActivity) {
  const durationText = activity.durationMinutes
    ? ` for ${activity.durationMinutes} minutes`
    : "";
  const intensityText = activity.intensity
    ? ` at a ${activity.intensity.toLowerCase()} intensity`
    : "";

  return `${activity.activityType.toLowerCase()}${durationText}${intensityText}`;
}

function joinActivityConfirmations(activities: ParsedActivity[]) {
  if (activities.length === 1) {
    return formatActivityConfirmation(activities[0]);
  }

  if (activities.length === 2) {
    return `${formatActivityConfirmation(activities[0])} and ${formatActivityConfirmation(
      activities[1]
    )}`;
  }

  const leading = activities
    .slice(0, -1)
    .map((activity) => formatActivityConfirmation(activity))
    .join(", ");

  return `${leading}, and ${formatActivityConfirmation(
    activities[activities.length - 1]
  )}`;
}

function formatDietConfirmation(entry: ParsedDietEntry) {
  return entry.mealType
    ? `${entry.mealType}: ${entry.description}`
    : `food update: ${entry.description}`;
}

function joinDietConfirmations(entries: ParsedDietEntry[]) {
  if (entries.length === 1) {
    return formatDietConfirmation(entries[0]);
  }

  if (entries.length === 2) {
    return `${formatDietConfirmation(entries[0])} and ${formatDietConfirmation(
      entries[1]
    )}`;
  }

  const leading = entries
    .slice(0, -1)
    .map((entry) => formatDietConfirmation(entry))
    .join(", ");

  return `${leading}, and ${formatDietConfirmation(entries[entries.length - 1])}`;
}

function getWellnessDescriptor(
  score: number | null,
  descriptors: [string, string, string, string, string]
) {
  if (score === null) {
    return null;
  }

  return descriptors[score - 1];
}

function formatWellnessConfirmation(checkin: ParsedWellnessCheckin) {
  const wellnessSegments = [
    getWellnessDescriptor(checkin.energyScore, [
      "very low energy",
      "low energy",
      "steady energy",
      "solid energy",
      "high energy"
    ]),
    getWellnessDescriptor(checkin.sorenessScore, [
      "very low soreness",
      "light soreness",
      "moderate soreness",
      "high soreness",
      "very high soreness"
    ]),
    getWellnessDescriptor(checkin.moodScore, [
      "a rough mood",
      "a lower mood",
      "a steady mood",
      "a good mood",
      "a very strong mood"
    ]),
    getWellnessDescriptor(checkin.stressScore, [
      "low stress",
      "manageable stress",
      "moderate stress",
      "high stress",
      "very high stress"
    ]),
    getWellnessDescriptor(checkin.motivationScore, [
      "very low motivation",
      "low motivation",
      "steady motivation",
      "solid motivation",
      "high motivation"
    ])
  ].filter((segment): segment is string => Boolean(segment));

  if (wellnessSegments.length === 0) {
    return "a wellness check-in";
  }

  if (wellnessSegments.length === 1) {
    return `a wellness check-in with ${wellnessSegments[0]}`;
  }

  if (wellnessSegments.length === 2) {
    return `a wellness check-in with ${wellnessSegments[0]} and ${wellnessSegments[1]}`;
  }

  return `a wellness check-in with ${wellnessSegments
    .slice(0, -1)
    .join(", ")}, and ${wellnessSegments[wellnessSegments.length - 1]}`;
}

function joinConfirmationSegments(segments: string[]) {
  if (segments.length === 1) {
    return segments[0];
  }

  if (segments.length === 2) {
    return `${segments[0]} and ${segments[1]}`;
  }

  return `${segments.slice(0, -1).join(", ")}, and ${segments[segments.length - 1]}`;
}

export function buildStructuredLogConfirmation(
  profile: AppProfile | null,
  parsedActivities: ParsedActivity[],
  parsedDietEntries: ParsedDietEntry[],
  parsedWellnessCheckin: ParsedWellnessCheckin | null
) {
  if (
    parsedActivities.length === 0 &&
    parsedDietEntries.length === 0 &&
    !parsedWellnessCheckin
  ) {
    return null;
  }

  const confirmationSegments: string[] = [];

  if (parsedActivities.length > 0) {
    confirmationSegments.push(joinActivityConfirmations(parsedActivities));
  }

  if (parsedDietEntries.length > 0) {
    confirmationSegments.push(joinDietConfirmations(parsedDietEntries));
  }

  if (parsedWellnessCheckin) {
    confirmationSegments.push(formatWellnessConfirmation(parsedWellnessCheckin));
  }

  const confirmationText = joinConfirmationSegments(confirmationSegments);
  const goalText = profile?.primary_goal
    ? ` That keeps us moving toward ${profile.primary_goal.toLowerCase()}.`
    : "";

  return {
    assistantMessageType: "log_confirmation" as const,
    parsedActivities,
    parsedDietEntries,
    parsedWellnessCheckin,
    reply: `Nice. I logged ${confirmationText}.${goalText} If you want, tell me how it felt, how the meals lined up with your day, or how recovery is trending and I can help shape the next step.`
  };
}

export function buildAssistantReply(profile: AppProfile | null, message: string) {
  const parsedActivities = parseActivityMessage(message);
  const parsedDietEntries = parseDietMessage(message);
  const parsedWellnessCheckin = parseWellnessMessage(message);
  const structuredConfirmation = buildStructuredLogConfirmation(
    profile,
    parsedActivities,
    parsedDietEntries,
    parsedWellnessCheckin
  );

  if (structuredConfirmation) {
    return structuredConfirmation;
  }

  const coachingStyleText = profile?.coaching_style
    ? ` I will keep the tone ${profile.coaching_style.toLowerCase()}.`
    : "";

  return {
    assistantMessageType: "chat" as const,
    parsedActivities: [],
    parsedDietEntries: [],
    parsedWellnessCheckin: null,
    reply: `I am ready to help with that.${coachingStyleText} Right now the live workflows are activity logging, food logging, and wellness check-ins, so if you tell me what movement you did, what you ate, or how energy and recovery feel, I can save it and respond from there.`
  };
}
