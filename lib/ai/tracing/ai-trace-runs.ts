import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/profile";
import type { FrankieOrchestrationResult } from "@/lib/ai/orchestrator/frankie-orchestrator";
import type { Database, Json } from "@/types/database";

type SupabaseServerClient = SupabaseClient<Database>;

export type AiTraceRunStatus =
  | "completed"
  | "clarification"
  | "unavailable"
  | "log_write_failed"
  | "assistant_message_failed";

type PersistedLogIds = {
  activityLogIds: string[];
  dietLogIds: string[];
  wellnessCheckinIds: string[];
};

function buildProfileSnapshot(profile: AppProfile | null): Json {
  if (!profile) {
    return {};
  }

  return {
    primaryGoal: profile.primary_goal,
    coachingStyle: profile.coaching_style,
    onboardingCompleted: profile.onboarding_completed,
    onboardingSummary: profile.onboarding_summary,
    accountType: profile.account_type,
    role: profile.role
  };
}

function buildExtractedPayload(reply: FrankieOrchestrationResult): Json {
  return {
    rawModelExtraction: (reply.metadata.rawModelExtraction ?? null) as Json,
    activities: reply.parsedActivities.map((activity) => ({
      activityType: activity.activityType,
      activityCategory: activity.activityCategory,
      sessionCount: activity.sessionCount,
      description: activity.description,
      detectedKeyword: activity.detectedKeyword,
      durationMinutes: activity.durationMinutes,
      intensity: activity.intensity,
      timeReferenceText: activity.timeReferenceText,
      loggedForDate: activity.loggedForDate,
      timePrecision: activity.timePrecision,
      confidence: activity.confidence,
      missingFields: activity.missingFields,
      ambiguityFlags: activity.ambiguityFlags
    })),
    dietEntries: reply.parsedDietEntries.map((entry) => ({
      confidence: entry.confidence,
      description: entry.description,
      detectedKeyword: entry.detectedKeyword,
      mealType: entry.mealType,
      timeReferenceText: entry.timeReferenceText,
      loggedForDate: entry.loggedForDate
    })),
    intent: reply.metadata.intent ?? null,
    wellnessCheckin: reply.parsedWellnessCheckin
      ? {
          detectedSignals: reply.parsedWellnessCheckin.detectedSignals,
          energyScore: reply.parsedWellnessCheckin.energyScore,
          loggedForDate: reply.parsedWellnessCheckin.loggedForDate,
          moodScore: reply.parsedWellnessCheckin.moodScore,
          motivationScore: reply.parsedWellnessCheckin.motivationScore,
          notes: reply.parsedWellnessCheckin.notes,
          sorenessScore: reply.parsedWellnessCheckin.sorenessScore,
          stressScore: reply.parsedWellnessCheckin.stressScore
        }
      : null
  };
}

function buildToolCalls(reply: FrankieOrchestrationResult): Json {
  const calls: Json[] = [];

  if (reply.persistPlan.activities && reply.parsedActivities.length > 0) {
    calls.push({
      name: "log_activity",
      entryCount: reply.parsedActivities.length
    });
  }

  if (reply.persistPlan.dietEntries && reply.parsedDietEntries.length > 0) {
    calls.push({
      name: "log_diet",
      entryCount: reply.parsedDietEntries.length
    });
  }

  if (reply.persistPlan.wellnessCheckin && reply.parsedWellnessCheckin) {
    calls.push({
      name: "log_wellness",
      entryCount: 1
    });
  }

  return calls;
}

function buildToolResults(
  persistedLogIds: PersistedLogIds,
  runStatus: AiTraceRunStatus
): Json {
  return {
    persistedCounts: {
      activity: persistedLogIds.activityLogIds.length,
      diet: persistedLogIds.dietLogIds.length,
      wellness: persistedLogIds.wellnessCheckinIds.length
    },
    runStatus
  };
}

export async function recordAiTraceRun(input: {
  assistantMessageId?: string | null;
  displayName: string;
  errorMessage?: string | null;
  errorStage?: string | null;
  persistedLogIds: PersistedLogIds;
  profile: AppProfile | null;
  reply: FrankieOrchestrationResult;
  runStatus: AiTraceRunStatus;
  sourceMessageId: string;
  supabase: SupabaseServerClient;
  threadId: string;
  threadTitle: string | null;
  userEmail: string | null;
  userId: string;
  userMessage: string;
  latencyMs?: number | null;
}) {
  const { data, error } = await input.supabase.from("ai_trace_runs").insert({
    user_id: input.userId,
    thread_id: input.threadId,
    source_message_id: input.sourceMessageId,
    assistant_message_id: input.assistantMessageId ?? null,
    user_email: input.userEmail,
    user_display_name: input.displayName,
    thread_title: input.threadTitle,
    orchestration_mode: input.reply.orchestrationMode,
    extraction_source: input.reply.metadata.extractionSource,
    used_model: input.reply.metadata.usedOpenAi,
    model_name: input.reply.metadata.modelName ?? null,
    prompt_version: input.reply.metadata.promptVersion,
    intent: input.reply.metadata.intent ?? null,
    raw_user_message: input.userMessage,
    profile_snapshot: buildProfileSnapshot(input.profile),
    recent_context_snapshot: input.reply.metadata.contextSnapshot ?? {},
    extracted_payload: buildExtractedPayload(input.reply),
    tool_calls: buildToolCalls(input.reply),
    tool_results: buildToolResults(input.persistedLogIds, input.runStatus),
    persisted_log_ids: {
      activityLogIds: input.persistedLogIds.activityLogIds,
      dietLogIds: input.persistedLogIds.dietLogIds,
      wellnessCheckinIds: input.persistedLogIds.wellnessCheckinIds
    },
    needs_clarification: input.reply.metadata.needsClarification ?? false,
    fallback_reason: input.reply.metadata.fallbackReason ?? null,
    final_reply: input.reply.reply,
    run_status: input.runStatus,
    error_stage: input.errorStage ?? null,
    error_message: input.errorMessage ?? null,
    latency_ms: input.latencyMs ?? null
  }).select("id").single();

  if (error) {
    console.error("Failed to record ai_trace_run", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      userId: input.userId,
      threadId: input.threadId,
      sourceMessageId: input.sourceMessageId,
      assistantMessageId: input.assistantMessageId ?? null
    });
    return null;
  }

  return data.id;
}
