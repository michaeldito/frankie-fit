import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";
import { addDays, getPacificToday, toDateKey } from "@frankie-fit/dashboard-core";

export const MAX_CHAT_MESSAGE_LENGTH = 4000;

type ChatThread = Database["public"]["Tables"]["conversation_threads"]["Row"];
type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

export type ChatExperience = {
  schemaReady: boolean;
  thread: ChatThread | null;
  messages: ChatMessage[];
  error: string | null;
};

export type LoggedForDateValue = string;
export type ActivityTimePrecision =
  | "implicit_today"
  | "relative_day"
  | "explicit_day"
  | "multi_day_window"
  | "week_summary"
  | "unknown";

export type ParsedActivity = {
  activityType: string;
  activityCategory: string | null;
  sessionCount: number | null;
  durationMinutes: number | null;
  intensity: string | null;
  timeReferenceText: string | null;
  description: string;
  detectedKeyword: string;
  loggedForDate: LoggedForDateValue;
  timePrecision: ActivityTimePrecision | null;
  confidence: number | null;
  missingFields: string[];
  ambiguityFlags: string[];
};

export type ParsedDietEntry = {
  description: string;
  mealType: string | null;
  confidence: number;
  detectedKeyword: string;
  timeReferenceText: string | null;
  loggedForDate: LoggedForDateValue;
};

export type ParsedWellnessCheckin = {
  energyScore: number | null;
  sorenessScore: number | null;
  moodScore: number | null;
  stressScore: number | null;
  motivationScore: number | null;
  notes: string | null;
  detectedSignals: string[];
  loggedForDate: LoggedForDateValue;
};

export type ParsedLifestyleEntry = {
  description: string;
  category: string | null;
  confidence: number;
  detectedKeyword: string;
  timeReferenceText: string | null;
  loggedForDate: LoggedForDateValue;
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

const explicitWeekdayPattern =
  /\b(?:(?:this\s+past|last|this)\s+)?(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday|s)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)\b/i;

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
  "beer",
  "wine",
  "alcohol",
  "cocktail",
  "cocktails",
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

function resolveRelativeDaysAgo(daysAgo: number) {
  return toDateKey(addDays(getPacificToday(), -daysAgo));
}

function resolveMostRecentWeekday(targetWeekday: number) {
  const date = getPacificToday();
  const currentWeekday = date.getUTCDay();
  const diff = (currentWeekday - targetWeekday + 7) % 7;
  return toDateKey(addDays(date, -diff));
}

function mapWeekdayTokenToIndex(token: string) {
  const normalizedToken = token.toLowerCase();
  const weekdayMap: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tues: 2,
    tuesday: 2,
    wed: 3,
    weds: 3,
    wednesday: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6
  };

  return weekdayMap[normalizedToken];
}

export function extractTimeReferenceText(text: string) {
  const normalizedText = text.toLowerCase();

  const explicitDateMatch = normalizedText.match(/\b\d{4}-\d{2}-\d{2}\b/);

  if (explicitDateMatch) {
    return explicitDateMatch[0];
  }

  const relativeMatch = normalizedText.match(
    /\b(?:today|yesterday|this morning|this afternoon|tonight|last night|\d+\s+days?\s+ago)\b/i
  );

  if (relativeMatch) {
    return relativeMatch[0];
  }

  const weekdayMatch = normalizedText.match(explicitWeekdayPattern);

  if (weekdayMatch) {
    return weekdayMatch[0];
  }

  return null;
}

export function resolveLoggedForDateFromTimeReference(
  timeReferenceText: string | null | undefined,
  fallbackDate?: string | null
): LoggedForDateValue {
  const normalizedText = timeReferenceText?.trim().toLowerCase() ?? "";
  const normalizedFallbackDate =
    fallbackDate && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDate) ? fallbackDate : null;
  const explicitDateMatch = normalizedText.match(/\b\d{4}-\d{2}-\d{2}\b/);

  if (explicitDateMatch) {
    return explicitDateMatch[0];
  }

  if (!normalizedText) {
    return normalizedFallbackDate ?? toDateKey(getPacificToday());
  }

  if (/\byesterday\b/.test(normalizedText)) {
    return resolveRelativeDaysAgo(1);
  }

  if (/\btoday\b|\bthis morning\b|\bthis afternoon\b|\btonight\b|\blast night\b/.test(normalizedText)) {
    return normalizedFallbackDate ?? toDateKey(getPacificToday());
  }

  const daysAgoMatch = normalizedText.match(/\b(\d+)\s+days?\s+ago\b/);

  if (daysAgoMatch) {
    const daysAgo = Number.parseInt(daysAgoMatch[1], 10);

    if (!Number.isNaN(daysAgo) && daysAgo >= 0) {
      return resolveRelativeDaysAgo(daysAgo);
    }
  }

  const weekdayMatch = normalizedText.match(explicitWeekdayPattern);

  if (weekdayMatch) {
    if (normalizedFallbackDate) {
      return normalizedFallbackDate;
    }

    const weekday = mapWeekdayTokenToIndex(weekdayMatch[1] ?? "");

    if (weekday !== undefined) {
      return resolveMostRecentWeekday(weekday);
    }
  }

  return normalizedFallbackDate ?? toDateKey(getPacificToday());
}

function getLoggedForDate(text: string): LoggedForDateValue {
  return resolveLoggedForDateFromTimeReference(extractTimeReferenceText(text), null);
}

function getActivityTimePrecision(text: string): ActivityTimePrecision {
  const normalizedText = text.toLowerCase();

  if (
    /\b(?:over\s+the\s+last|for\s+the\s+last|for\s+the\s+past|the\s+last|last|past)\s+\d+\s+days\b/.test(
      normalizedText
    )
  ) {
    return "multi_day_window";
  }

  if (/\b(?:this week|this past week|earlier this week|later this week|over the week)\b/.test(normalizedText)) {
    return "week_summary";
  }

  if (explicitWeekdayPattern.test(normalizedText) || /\bweekend\b/.test(normalizedText)) {
    return "explicit_day";
  }

  if (/\b(?:today|yesterday|this morning|this afternoon|tonight|\d+\s+days?\s+ago)\b/.test(normalizedText)) {
    return "relative_day";
  }

  return "implicit_today";
}

function getActivityCategory(label: string) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("run") || normalizedLabel.includes("cycl") || normalizedLabel.includes("row")) {
    return "cardio";
  }

  if (
    normalizedLabel.includes("strength") ||
    normalizedLabel.includes("lift") ||
    normalizedLabel.includes("weight")
  ) {
    return "strength";
  }

  if (normalizedLabel.includes("yoga")) {
    return "mind_body";
  }

  if (normalizedLabel.includes("mobility") || normalizedLabel.includes("stretch")) {
    return "mobility";
  }

  if (normalizedLabel.includes("walk") || normalizedLabel.includes("hik")) {
    return "outdoor_recreation";
  }

  return "other";
}

function getFallbackActivityMissingFields(durationMinutes: number | null, intensity: string | null) {
  const missingFields: string[] = [];

  if (!durationMinutes) {
    missingFields.push("durationMinutes");
  }

  if (!intensity) {
    missingFields.push("intensity");
  }

  return missingFields;
}

function hasFoodCue(clause: string) {
  const normalizedClause = clause.toLowerCase();

  return foodCueKeywords.some((keyword) => {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
    return regex.test(normalizedClause);
  });
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

export function isLikelyDietClause(clause: string) {
  const mealMatch = findMealMatch(clause);
  return looksLikeDietClause(clause, mealMatch);
}

export function isLikelyActivityClause(clause: string) {
  return findActivityMatch(clause) !== null;
}

type SupabaseServerClient = SupabaseClient<Database>;

async function getOrCreatePrimaryThread(
  supabase: SupabaseServerClient,
  userId: string,
  title: string
) {
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
  supabase: SupabaseServerClient,
  threadId: string,
  userId: string,
  profile: AppProfile | null
) {
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

/**
 * Client-agnostic core shared by the web and mobile chat routes: get-or-create the user's
 * primary thread, seed its opening assistant message if empty, then load the full message
 * history. Takes an already-constructed Supabase client so callers can use whichever auth
 * style fits their transport (cookie-based on web, bearer-token on mobile).
 */
export async function loadChatThreadAndMessages(input: {
  supabase: SupabaseServerClient;
  userId: string;
  profile: AppProfile | null;
  threadTitle: string;
}): Promise<ChatExperience> {
  const { thread, error: threadError } = await getOrCreatePrimaryThread(
    input.supabase,
    input.userId,
    input.threadTitle
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
    input.supabase,
    thread.id,
    input.userId,
    input.profile
  );

  if (seedError) {
    return {
      schemaReady: !isMissingChatTable(seedError),
      thread,
      messages: [],
      error: seedError
    };
  }

  const { data: messages, error: messagesError } = await input.supabase
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

  const supabase = await createSupabaseServerClient();

  return loadChatThreadAndMessages({
    supabase,
    userId: context.user.id,
    profile: context.profile,
    threadTitle: `${displayName}'s Frankie chat`
  });
}

export function parseActivityMessage(message: string): ParsedActivity[] {
  const clauses = splitActivityClauses(message);
  const parsedActivities: ParsedActivity[] = [];

  clauses.forEach((clause) => {
    const activityMatch = findActivityMatch(clause);

    if (!activityMatch) {
      return;
    }

    const timeReferenceText = extractTimeReferenceText(clause);
    const loggedForDate = getLoggedForDate(clause);

    parsedActivities.push({
      activityType: activityMatch.label,
      activityCategory: getActivityCategory(activityMatch.label),
      sessionCount: 1,
      durationMinutes: getDurationMinutes(clause),
      intensity: getIntensity(clause),
      timeReferenceText,
      description: clause,
      detectedKeyword: activityMatch.keyword,
      loggedForDate,
      timePrecision: getActivityTimePrecision(clause),
      confidence: 0.72,
      missingFields: getFallbackActivityMissingFields(
        getDurationMinutes(clause),
        getIntensity(clause)
      ),
      ambiguityFlags: []
    });
  });

  return parsedActivities;
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

function formatLifestyleConfirmation(entry: ParsedLifestyleEntry) {
  return entry.description;
}

function joinLifestyleConfirmations(entries: ParsedLifestyleEntry[]) {
  if (entries.length === 1) {
    return formatLifestyleConfirmation(entries[0]);
  }

  if (entries.length === 2) {
    return `${formatLifestyleConfirmation(entries[0])} and ${formatLifestyleConfirmation(
      entries[1]
    )}`;
  }

  const leading = entries
    .slice(0, -1)
    .map((entry) => formatLifestyleConfirmation(entry))
    .join(", ");

  return `${leading}, and ${formatLifestyleConfirmation(entries[entries.length - 1])}`;
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
  parsedWellnessCheckin: ParsedWellnessCheckin | null,
  parsedLifestyleEntries: ParsedLifestyleEntry[] = []
) {
  if (
    parsedActivities.length === 0 &&
    parsedDietEntries.length === 0 &&
    !parsedWellnessCheckin &&
    parsedLifestyleEntries.length === 0
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

  if (parsedLifestyleEntries.length > 0) {
    confirmationSegments.push(joinLifestyleConfirmations(parsedLifestyleEntries));
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
    parsedLifestyleEntries,
    reply: `Nice. I logged ${confirmationText}.${goalText} If you want, tell me how it felt, how the meals lined up with your day, or how recovery is trending and I can help shape the next step.`
  };
}
