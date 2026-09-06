import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/profile";
import type { Database, Json } from "@/types/database";
import {
  orchestrateFrankieReply,
  type PendingClarification
} from "@/lib/ai/orchestrator/frankie-orchestrator";
import { recordAiTraceRun } from "@/lib/ai/tracing/ai-trace-runs";
import { logActivityEntries } from "@/lib/ai/tools/log-activity";
import { logDietEntries } from "@/lib/ai/tools/log-diet";
import { logLifestyleEntries } from "@/lib/ai/tools/log-lifestyle";
import { logWellnessCheckin } from "@/lib/ai/tools/log-wellness";
import { getLatestCoachSummary } from "@/lib/ai/summaries/frankie-summaries";

type SupabaseServerClient = SupabaseClient<Database>;
type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

export type PersistedLogIds = {
  activityLogIds: string[];
  dietLogIds: string[];
  lifestyleLogIds: string[];
  wellnessCheckinIds: string[];
};

export function derivePendingClarification(
  previousMessage: ChatMessage | undefined
): PendingClarification | undefined {
  return previousMessage?.role === "assistant" &&
    previousMessage.message_type === "clarification_request"
    ? (
        previousMessage.structured_payload as {
          pendingClarification?: PendingClarification;
        } | null
      )?.pendingClarification
    : undefined;
}

export function buildAssistantStructuredPayload(input: {
  persistedLogIds: PersistedLogIds;
  reply: Awaited<ReturnType<typeof orchestrateFrankieReply>>;
}): Json {
  const { persistedLogIds, reply } = input;

  if (reply.metadata.pendingClarification) {
    return { pendingClarification: reply.metadata.pendingClarification };
  }

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
      ? reply.parsedActivities.map((activity, index) => ({
          id: persistedLogIds.activityLogIds[index] ?? null,
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
      ? reply.parsedDietEntries.map((entry, index) => ({
          id: persistedLogIds.dietLogIds[index] ?? null,
          confidence: entry.confidence,
          description: entry.description,
          mealType: entry.mealType,
          timeReferenceText: entry.timeReferenceText,
          loggedForDate: entry.loggedForDate
        }))
      : [],
    lifestyleLogged: reply.persistPlan.lifestyleEntries
      ? reply.parsedLifestyleEntries.map((entry, index) => ({
          id: persistedLogIds.lifestyleLogIds[index] ?? null,
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
            id: persistedLogIds.wellnessCheckinIds[0] ?? null,
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
  pendingClarification?: PendingClarification;
  profile: AppProfile | null;
  recentMessages: ChatMessage[];
  sourceMessageId?: string;
  supabase: SupabaseServerClient;
  threadId: string;
  threadTitle: string | null;
  userEmail: string | null;
  userId: string;
}) {
  let userMessage: ChatMessage;

  if (input.sourceMessageId) {
    const { data: existingMessage, error: existingMessageError } = await input.supabase
      .from("conversation_messages")
      .select("*")
      .eq("id", input.sourceMessageId)
      .single();

    if (existingMessageError || !existingMessage) {
      throw new Error(
        existingMessageError?.message ?? "Frankie could not find the saved message."
      );
    }

    userMessage = existingMessage;
  } else {
    const { data: insertedMessage, error: userMessageError } = await input.supabase
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

    if (userMessageError || !insertedMessage) {
      throw new Error(userMessageError?.message ?? "Frankie could not save the user message.");
    }

    userMessage = insertedMessage;
  }

  const startedAt = Date.now();
  const latestCoachSummary = await getLatestCoachSummary({
    supabase: input.supabase,
    userId: input.userId
  });
  const reply = await orchestrateFrankieReply({
    profile: input.profile,
    message: input.message,
    recentMessages: input.recentMessages,
    pendingClarification: input.pendingClarification,
    latestCoachSummary
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
        structuredPayload: buildAssistantStructuredPayload({ persistedLogIds, reply }),
        traceId,
        userMessage
      };
    }
  }

  const structuredPayload = buildAssistantStructuredPayload({ persistedLogIds, reply });
  const { data: assistantMessage, error: assistantMessageError } = await input.supabase
    .from("conversation_messages")
    .insert({
      thread_id: input.threadId,
      user_id: input.userId,
      role: "assistant",
      message_type: reply.assistantMessageType,
      content: reply.reply,
      structured_payload: structuredPayload
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
      structuredPayload,
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
    structuredPayload,
    traceId,
    userMessage
  };
}

export type RunFrankieTurnResult = Awaited<ReturnType<typeof runFrankieTurn>>;

