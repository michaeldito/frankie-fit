import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/profile";
import type { Database, Json } from "@/types/database";
import { createTextOpenAiResponse, hasOpenAiApiKey } from "@/lib/ai/openai-responses";

type SupabaseServerClient = SupabaseClient<Database>;
type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
type DietLog = Database["public"]["Tables"]["diet_logs"]["Row"];
type LifestyleLog = Database["public"]["Tables"]["lifestyle_logs"]["Row"];
type WellnessCheckin = Database["public"]["Tables"]["wellness_checkins"]["Row"];
type CoachSummary = Database["public"]["Tables"]["coach_summaries"]["Row"];

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
export const FRANKIE_SUMMARY_PROMPT_VERSION = "frankie-summary-v1";

type LogBundle = {
  activities: ActivityLog[];
  dietEntries: DietLog[];
  lifestyleEntries: LifestyleLog[];
  wellnessCheckins: WellnessCheckin[];
};

function formatActivities(activities: ActivityLog[]) {
  if (activities.length === 0) {
    return "None.";
  }

  return activities
    .map((activity) => {
      const duration = activity.duration_minutes
        ? `${activity.duration_minutes} min`
        : "duration not recorded";
      const intensity = activity.intensity ?? "intensity not recorded";

      return `- ${activity.logged_for_date}: ${activity.activity_type}, ${duration}, ${intensity}. ${activity.description ?? ""}`.trim();
    })
    .join("\n");
}

function formatDiet(entries: DietLog[]) {
  if (entries.length === 0) {
    return "None.";
  }

  return entries
    .map((entry) => {
      const mealType = entry.meal_type ?? "meal not recorded";
      return `- ${entry.logged_for_date}: ${mealType}: ${entry.description}`;
    })
    .join("\n");
}

function formatLifestyle(entries: LifestyleLog[]) {
  if (entries.length === 0) {
    return "None.";
  }

  return entries
    .map((entry) => `- ${entry.logged_for_date}: ${entry.category}: ${entry.description}`)
    .join("\n");
}

function formatWellness(checkins: WellnessCheckin[]) {
  if (checkins.length === 0) {
    return "None.";
  }

  return checkins
    .map((checkin) =>
      [
        `- ${checkin.logged_for_date}:`,
        `energy ${checkin.energy_score ?? "unknown"}`,
        `soreness ${checkin.soreness_score ?? "unknown"}`,
        `mood ${checkin.mood_score ?? "unknown"}`,
        `stress ${checkin.stress_score ?? "unknown"}`,
        `motivation ${checkin.motivation_score ?? "unknown"}`,
        checkin.notes ? `notes: ${checkin.notes}` : "notes: none"
      ].join(" ")
    )
    .join("\n");
}

function buildSummarySystemPrompt() {
  return [
    "You write concise coaching memory for Frankie Fit.",
    "Frankie is a calm, warm fitness, diet, and wellness coach, not a medical professional.",
    "Summaries must be grounded only in the structured logs provided.",
    "Do not invent missing duration, intensity, meal timing, causes, diagnoses, or exact metrics.",
    "Write in a way that helps Frankie coach the user tomorrow or next week.",
    "Keep the summary practical, specific, and compact.",
    "Treat lifestyle logs (social plans, family time, entertainment, travel, substance use) as neutral context, the same as any other log. Never moralize, warn, or lecture about substance use."
  ].join("\n");
}

function buildDailySummaryPrompt(input: {
  date: string;
  profile: AppProfile | null;
  logs: LogBundle;
}) {
  return [
    `Summary type: daily`,
    `Date: ${input.date}`,
    `User goal: ${input.profile?.primary_goal ?? "Not set"}`,
    `Coaching style: ${input.profile?.coaching_style ?? "Balanced mix"}`,
    "",
    "Activity logs:",
    formatActivities(input.logs.activities),
    "",
    "Diet logs:",
    formatDiet(input.logs.dietEntries),
    "",
    "Lifestyle logs:",
    formatLifestyle(input.logs.lifestyleEntries),
    "",
    "Wellness check-ins:",
    formatWellness(input.logs.wellnessCheckins),
    "",
    "Write 3 short parts:",
    "1. What happened today.",
    "2. The coaching signal for tomorrow.",
    "3. One practical tomorrow focus.",
    "If data is thin, say that plainly without scolding."
  ].join("\n");
}

function buildWeeklySummaryPrompt(input: {
  periodStart: string;
  periodEnd: string;
  profile: AppProfile | null;
  logs: LogBundle;
  dailySummaries: CoachSummary[];
}) {
  const dailySummaryText =
    input.dailySummaries.length > 0
      ? input.dailySummaries
          .map((summary) => `- ${summary.period_start}: ${summary.summary_text}`)
          .join("\n")
      : "None.";

  return [
    `Summary type: weekly`,
    `Period: ${input.periodStart} through ${input.periodEnd}`,
    `User goal: ${input.profile?.primary_goal ?? "Not set"}`,
    `Coaching style: ${input.profile?.coaching_style ?? "Balanced mix"}`,
    "",
    "Daily summaries:",
    dailySummaryText,
    "",
    "Activity logs:",
    formatActivities(input.logs.activities),
    "",
    "Diet logs:",
    formatDiet(input.logs.dietEntries),
    "",
    "Lifestyle logs:",
    formatLifestyle(input.logs.lifestyleEntries),
    "",
    "Wellness check-ins:",
    formatWellness(input.logs.wellnessCheckins),
    "",
    "Write 4 short parts:",
    "1. The week pattern.",
    "2. What supported consistency.",
    "3. What created friction.",
    "4. One practical focus for next week.",
    "Be helpful and specific without pretending to know causes that are not in the logs."
  ].join("\n");
}

function fallbackDailySummary(date: string, logs: LogBundle) {
  const activityCount = logs.activities.length;
  const dietCount = logs.dietEntries.length;
  const lifestyleCount = logs.lifestyleEntries.length;
  const wellnessCount = logs.wellnessCheckins.length;

  return [
    `${date}: logged ${activityCount} activity update(s), ${dietCount} diet update(s), ${lifestyleCount} lifestyle update(s), and ${wellnessCount} wellness check-in(s).`,
    "Tomorrow's coaching signal should come from the clearest logged pattern, without filling in missing details.",
    "A practical next focus is to keep the update simple and add one useful detail if it is easy."
  ].join(" ");
}

function fallbackWeeklySummary(periodStart: string, periodEnd: string, logs: LogBundle) {
  return [
    `${periodStart} through ${periodEnd}: logged ${logs.activities.length} activity update(s), ${logs.dietEntries.length} diet update(s), ${logs.lifestyleEntries.length} lifestyle update(s), and ${logs.wellnessCheckins.length} wellness check-in(s).`,
    "The next-week focus should stay grounded in consistency, recovery, and the user's clearest logged friction points."
  ].join(" ");
}

function buildMetrics(logs: LogBundle): Record<string, Json> {
  return {
    activityCount: logs.activities.length,
    dietCount: logs.dietEntries.length,
    lifestyleCount: logs.lifestyleEntries.length,
    wellnessCount: logs.wellnessCheckins.length,
    activityTypes: Array.from(new Set(logs.activities.map((activity) => activity.activity_type))),
    dietDescriptions: logs.dietEntries.map((entry) => entry.description),
    lifestyleCategories: Array.from(new Set(logs.lifestyleEntries.map((entry) => entry.category))),
    wellnessDates: logs.wellnessCheckins.map((checkin) => checkin.logged_for_date)
  };
}

async function loadLogs(input: {
  supabase: SupabaseServerClient;
  userId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<LogBundle> {
  const [activitiesResult, dietResult, lifestyleResult, wellnessResult] = await Promise.all([
    input.supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", input.userId)
      .gte("logged_for_date", input.periodStart)
      .lte("logged_for_date", input.periodEnd)
      .order("logged_for_date", { ascending: true }),
    input.supabase
      .from("diet_logs")
      .select("*")
      .eq("user_id", input.userId)
      .gte("logged_for_date", input.periodStart)
      .lte("logged_for_date", input.periodEnd)
      .order("logged_for_date", { ascending: true }),
    input.supabase
      .from("lifestyle_logs")
      .select("*")
      .eq("user_id", input.userId)
      .gte("logged_for_date", input.periodStart)
      .lte("logged_for_date", input.periodEnd)
      .order("logged_for_date", { ascending: true }),
    input.supabase
      .from("wellness_checkins")
      .select("*")
      .eq("user_id", input.userId)
      .gte("logged_for_date", input.periodStart)
      .lte("logged_for_date", input.periodEnd)
      .order("logged_for_date", { ascending: true })
  ]);

  const firstError =
    activitiesResult.error?.message ??
    dietResult.error?.message ??
    lifestyleResult.error?.message ??
    wellnessResult.error?.message ??
    null;

  if (firstError) {
    throw new Error(firstError);
  }

  return {
    activities: activitiesResult.data ?? [],
    dietEntries: dietResult.data ?? [],
    lifestyleEntries: lifestyleResult.data ?? [],
    wellnessCheckins: wellnessResult.data ?? []
  };
}

async function upsertSummary(input: {
  modelName: string | null;
  periodEnd: string;
  periodStart: string;
  promptVersion: string;
  sourceJson: Json;
  structuredMetricsJson: Json;
  summaryText: string;
  summaryType: "daily" | "weekly";
  supabase: SupabaseServerClient;
  userId: string;
}) {
  const { data, error } = await input.supabase
    .from("coach_summaries")
    .upsert(
      {
        user_id: input.userId,
        summary_type: input.summaryType,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        summary_text: input.summaryText,
        structured_metrics_json: input.structuredMetricsJson,
        model_name: input.modelName,
        prompt_version: input.promptVersion,
        source_json: input.sourceJson
      },
      {
        onConflict: "user_id,summary_type,period_start,period_end"
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Frankie could not save the coaching summary.");
  }

  return data;
}

export async function generateDailyCoachSummary(input: {
  date: string;
  profile: AppProfile | null;
  supabase: SupabaseServerClient;
  userId: string;
}) {
  const logs = await loadLogs({
    supabase: input.supabase,
    userId: input.userId,
    periodStart: input.date,
    periodEnd: input.date
  });
  const summaryText = hasOpenAiApiKey()
    ? await createTextOpenAiResponse({
        model: DEFAULT_OPENAI_MODEL,
        systemPrompt: buildSummarySystemPrompt(),
        userPrompt: buildDailySummaryPrompt({
          date: input.date,
          profile: input.profile,
          logs
        })
      })
    : fallbackDailySummary(input.date, logs);

  return upsertSummary({
    supabase: input.supabase,
    userId: input.userId,
    summaryType: "daily",
    periodStart: input.date,
    periodEnd: input.date,
    summaryText,
    structuredMetricsJson: buildMetrics(logs),
    sourceJson: logs as Json,
    modelName: hasOpenAiApiKey() ? DEFAULT_OPENAI_MODEL : null,
    promptVersion: FRANKIE_SUMMARY_PROMPT_VERSION
  });
}

export async function generateWeeklyCoachSummary(input: {
  periodEnd: string;
  periodStart: string;
  profile: AppProfile | null;
  supabase: SupabaseServerClient;
  userId: string;
}) {
  const [logs, dailySummariesResult] = await Promise.all([
    loadLogs({
      supabase: input.supabase,
      userId: input.userId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd
    }),
    input.supabase
      .from("coach_summaries")
      .select("*")
      .eq("user_id", input.userId)
      .eq("summary_type", "daily")
      .gte("period_start", input.periodStart)
      .lte("period_end", input.periodEnd)
      .order("period_start", { ascending: true })
  ]);

  if (dailySummariesResult.error) {
    throw new Error(dailySummariesResult.error.message);
  }

  const dailySummaries = dailySummariesResult.data ?? [];
  const summaryText = hasOpenAiApiKey()
    ? await createTextOpenAiResponse({
        model: DEFAULT_OPENAI_MODEL,
        systemPrompt: buildSummarySystemPrompt(),
        userPrompt: buildWeeklySummaryPrompt({
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          profile: input.profile,
          logs,
          dailySummaries
        })
      })
    : fallbackWeeklySummary(input.periodStart, input.periodEnd, logs);

  return upsertSummary({
    supabase: input.supabase,
    userId: input.userId,
    summaryType: "weekly",
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    summaryText,
    structuredMetricsJson: {
      ...buildMetrics(logs),
      dailySummaryCount: dailySummaries.length
    },
    sourceJson: {
      logs,
      dailySummaries
    } as Json,
    modelName: hasOpenAiApiKey() ? DEFAULT_OPENAI_MODEL : null,
    promptVersion: FRANKIE_SUMMARY_PROMPT_VERSION
  });
}
