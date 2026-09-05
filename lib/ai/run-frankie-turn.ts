import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/profile";
import type { Database, Json } from "@/types/database";
import { orchestrateFrankieReply } from "@/lib/ai/orchestrator/frankie-orchestrator";
import { recordAiTraceRun } from "@/lib/ai/tracing/ai-trace-runs";
import { logActivityEntries } from "@/lib/ai/tools/log-activity";
import { logDietEntries } from "@/lib/ai/tools/log-diet";
import { logLifestyleEntries } from "@/lib/ai/tools/log-lifestyle";
import { logWellnessCheckin } from "@/lib/ai/tools/log-wellness";

type SupabaseServerClient = SupabaseClient<Database>;
type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

type PersistedLogIds = {
  activityLogIds: string[];
  dietLogIds: string[];
  lifestyleLogIds: string[];
  wellnessCheckinIds: string[];
};

function buildAssistantStructuredPayload(
  reply: Awaited<ReturnType<typeof orchestrateFrankieReply>>
): Json {
  if (
    !reply.shouldPersistStructuredData ||
    (reply.parsedActivities.length === 0 &&
      reply.parsedDietEntries.length === 0 &&
      reply.parsedLifestyleEntries.length === 0 &&
      !reply.parsedWellnessCheckin)
  ) {
    return {};
  }

  return {
    activitiesLogged: reply.persistPlan.activities
      ? reply.parsedActivities.map((activity) => ({
          activityType: activity.activityType,
          description: activity.description,
          activityCategory: activity.activityCategory,
          sessionCount: activity.sessionCount,
          durationMinutes: activity.durationMinutes,
          intensity: activity.intensity,
          timeReferenceText: activity.timeReferenceText,
          loggedForDate: activity.loggedForDate,
          timePrecision: activity.timePrecision,
          confidence: activity.confidence,
          missingFields: activity.missingFields,
          ambiguityFlags: activity.ambiguityFlags
        }))
      : [],
    dietLogged: reply.persistPlan.dietEntries
      ? reply.parsedDietEntries.map((entry) => ({
          confidence: entry.confidence,
          description: entry.description,
          mealType: entry.mealType,
          timeReferenceText: entry.timeReferenceText,
          loggedForDate: entry.loggedForDate
        }))
      : [],
    lifestyleLogged: reply.persistPlan.lifestyleEntries
      ? reply.parsedLifestyleEntries.map((entry) => ({
          category: entry.category,
          confidence: entry.confidence,
          description: entry.description,
          timeReferenceText: entry.timeReferenceText,
          loggedForDate: entry.loggedForDate
        }))
      : [],
    orchestration: reply.metadata,
    wellnessLogged:
      reply.persistPlan.wellnessCheckin && reply.parsedWellnessCheckin
        ? {
            detectedSignals: reply.parsedWellnessCheckin.detectedSignals,
            energyScore: reply.parsedWellnessCheckin.energyScore,
            loggedForDate: reply.parsedWellnessCheckin.loggedForDate,
            moodScore: reply.parsedWellnessCheckin.moodScore,
            motivationScore: reply.parsedWellnessCheckin.motivationScore,
            sorenessScore: reply.parsedWellnessCheckin.sorenessScore,
            stressScore: reply.parsedWellnessCheckin.stressScore
          }
        : null
  };
}

function buildActualJson(input: {
  persistedLogIds: PersistedLogIds;
  reply: Awaited<ReturnType<typeof orchestrateFrankieReply>>;
}): Json {
  return {
    assistantMessageType: input.reply.assistantMessageType,
    orchestrationMode: input.reply.orchestrationMode,
    shouldPersistStructuredData: input.reply.shouldPersistStructuredData,
    persistPlan: input.reply.persistPlan,
    metadata: input.reply.metadata,
    persistedLogIds: input.persistedLogIds,
    activities: input.reply.parsedActivities,
    dietEntries: input.reply.parsedDietEntries,
    lifestyleEntries: input.reply.parsedLifestyleEntries,
    wellnessCheckin: input.reply.parsedWellnessCheckin
  } as Json;
}

export async function runFrankieTurn(input: {
  displayName: string;
  message: string;
  profile: AppProfile | null;
  recentMessages: ChatMessage[];
  supabase: SupabaseServerClient;
  threadId: string;
  threadTitle: string | null;
  userEmail: string | null;
  userId: string;
}) {
  const { data: userMessage, error: userMessageError } = await input.supabase
    .from("conversation_messages")
    .insert({
      thread_id: input.threadId,
      user_id: input.userId,
      role: "user",
      message_type: "chat",
      content: input.message,
      structured_payload: {}
    })
    .select("*")
    .single();

  if (userMessageError || !userMessage) {
    throw new Error(userMessageError?.message ?? "Frankie could not save the user message.");
  }

  const startedAt = Date.now();
  const reply = await orchestrateFrankieReply({
    profile: input.profile,
    message: input.message,
    recentMessages: input.recentMessages
  });
  const persistedLogIds: PersistedLogIds = {
    activityLogIds: [],
    dietLogIds: [],
    lifestyleLogIds: [],
    wellnessCheckinIds: []
  };

  if (reply.shouldPersistStructuredData) {
    try {
      if (reply.persistPlan.activities) {
        persistedLogIds.activityLogIds = await logActivityEntries({
          supabase: input.supabase,
          userId: input.userId,
          sourceMessageId: userMessage.id,
          entries: reply.parsedActivities,
          extractionSource: reply.metadata.extractionSource
        });
      }

      if (reply.persistPlan.dietEntries) {
        persistedLogIds.dietLogIds = await logDietEntries({
          supabase: input.supabase,
          userId: input.userId,
          sourceMessageId: userMessage.id,
          entries: reply.parsedDietEntries,
          extractionSource: reply.metadata.extractionSource
        });
      }

      if (reply.persistPlan.lifestyleEntries) {
        persistedLogIds.lifestyleLogIds = await logLifestyleEntries({
          supabase: input.supabase,
          userId: input.userId,
          sourceMessageId: userMessage.id,
          entries: reply.parsedLifestyleEntries,
          extractionSource: reply.metadata.extractionSource
        });
      }

      if (reply.persistPlan.wellnessCheckin) {
        persistedLogIds.wellnessCheckinIds = await logWellnessCheckin({
          supabase: input.supabase,
          userId: input.userId,
          sourceMessageId: userMessage.id,
          entry: reply.parsedWellnessCheckin,
          extractionSource: reply.metadata.extractionSource
        });
      }
    } catch (error) {
      const traceId = await recordAiTraceRun({
        supabase: input.supabase,
        userId: input.userId,
        userEmail: input.userEmail,
        displayName: input.displayName,
        profile: input.profile,
        threadId: input.threadId,
        threadTitle: input.threadTitle,
        sourceMessageId: userMessage.id,
        userMessage: input.message,
        reply,
        persistedLogIds,
        runStatus: "log_write_failed",
        errorStage: "structured_log_write",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Frankie could not save the structured logs.",
        latencyMs: Date.now() - startedAt
      });

      return {
        assistantMessage: null,
        assistantReply: reply.reply,
        actualJson: buildActualJson({ persistedLogIds, reply }),
        errorMessage:
          error instanceof Error
            ? error.message
            : "Frankie could not save the structured logs.",
        persistedLogIds,
        reply,
        runStatus: "log_write_failed",
        traceId,
        userMessage
      };
    }
  }

  const { data: assistantMessage, error: assistantMessageError } = await input.supabase
    .from("conversation_messages")
    .insert({
      thread_id: input.threadId,
      user_id: input.userId,
      role: "assistant",
      message_type: reply.assistantMessageType,
      content: reply.reply,
      structured_payload: buildAssistantStructuredPayload(reply)
    })
    .select("*")
    .single();

  if (assistantMessageError || !assistantMessage) {
    const traceId = await recordAiTraceRun({
      supabase: input.supabase,
      userId: input.userId,
      userEmail: input.userEmail,
      displayName: input.displayName,
      profile: input.profile,
      threadId: input.threadId,
      threadTitle: input.threadTitle,
      sourceMessageId: userMessage.id,
      userMessage: input.message,
      reply,
      persistedLogIds,
      runStatus: "assistant_message_failed",
      errorStage: "assistant_message_insert",
      errorMessage: assistantMessageError?.message ?? "Frankie could not save the reply.",
      latencyMs: Date.now() - startedAt
    });

    return {
      assistantMessage: null,
      assistantReply: reply.reply,
      actualJson: buildActualJson({ persistedLogIds, reply }),
      errorMessage: assistantMessageError?.message ?? "Frankie could not save the reply.",
      persistedLogIds,
      reply,
      runStatus: "assistant_message_failed",
      traceId,
      userMessage
    };
  }

  const runStatus =
    reply.orchestrationMode === "unavailable"
      ? "unavailable"
      : reply.metadata.needsClarification
        ? "clarification"
        : "completed";

  const traceId = await recordAiTraceRun({
    supabase: input.supabase,
    userId: input.userId,
    userEmail: input.userEmail,
    displayName: input.displayName,
    profile: input.profile,
    threadId: input.threadId,
    threadTitle: input.threadTitle,
    sourceMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    userMessage: input.message,
    reply,
    persistedLogIds,
    runStatus,
    latencyMs: Date.now() - startedAt
  });

  return {
    assistantMessage,
    assistantReply: reply.reply,
    actualJson: buildActualJson({ persistedLogIds, reply }),
    errorMessage: null,
    persistedLogIds,
    reply,
    runStatus,
    traceId,
    userMessage
  };
}

