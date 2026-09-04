import { NextRequest, NextResponse } from "next/server";
import {
  orchestrateFrankieReply,
  type PendingClarification
} from "@/lib/ai/orchestrator/frankie-orchestrator";
import { recordAiTraceRun } from "@/lib/ai/tracing/ai-trace-runs";
import { logActivityEntries } from "@/lib/ai/tools/log-activity";
import { logDietEntries } from "@/lib/ai/tools/log-diet";
import { logLifestyleEntries } from "@/lib/ai/tools/log-lifestyle";
import { logWellnessCheckin } from "@/lib/ai/tools/log-wellness";
import { getChatExperience, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat";
import { PERSONAS } from "@/lib/ai/prompts/personas";
import { getCurrentAppContext, getDisplayName } from "@/lib/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CHAT_RATE_LIMIT_PER_MINUTE = 20;

function buildThreadErrorResponse(error: string | null, schemaReady: boolean) {
  return NextResponse.json(
    {
      error: error ?? "Frankie could not open the conversation thread.",
      schemaReady
    },
    { status: schemaReady ? 500 : 503 }
  );
}

export async function GET() {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const displayName = getDisplayName(context.user, context.profile);
  const chatExperience = await getChatExperience(context, displayName);

  if (!chatExperience.thread) {
    return buildThreadErrorResponse(chatExperience.error, chatExperience.schemaReady);
  }

  return NextResponse.json(chatExperience);
}

export async function POST(request: NextRequest) {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`chat:${context.user.id}`, CHAT_RATE_LIMIT_PER_MINUTE);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "You're sending messages a little too fast. Give it a few seconds and try again." },
      { status: 429, headers: { "Retry-After": `${rateLimit.retryAfterSeconds}` } }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    message?: unknown;
    sourceMessageId?: unknown;
    personaId?: unknown;
  } | null;

  if (body?.action === "set_persona") {
    const personaId = typeof body.personaId === "string" ? body.personaId.trim() : "";
    const isKnownPersona = PERSONAS.some((persona) => persona.id === personaId);

    if (personaId && !isKnownPersona) {
      return NextResponse.json({ error: "Unknown coach persona." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ coach_persona: personaId || null })
      .eq("id", context.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: null, personaId: personaId || null });
  }

  const action =
    body?.action === "save_message" || body?.action === "generate_reply"
      ? body.action
      : "send_and_reply";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const sourceMessageId =
    typeof body?.sourceMessageId === "string" ? body.sourceMessageId.trim() : "";

  if (action !== "generate_reply" && !message) {
    return NextResponse.json({ error: "Type a message for Frankie first." }, { status: 400 });
  }

  if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Messages are limited to ${MAX_CHAT_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (action === "generate_reply" && !sourceMessageId) {
    return NextResponse.json(
      { error: "Frankie needs the saved message before thinking through a reply." },
      { status: 400 }
    );
  }

  const displayName = getDisplayName(context.user, context.profile);
  const chatExperience = await getChatExperience(context, displayName);

  if (!chatExperience.thread) {
    return buildThreadErrorResponse(chatExperience.error, chatExperience.schemaReady);
  }

  const supabase = await createSupabaseServerClient();
  let sourceMessage:
    | NonNullable<Awaited<ReturnType<typeof getChatExperience>>["messages"]>[number]
    | null = null;
  let messageForReply = message;

  if (action === "generate_reply") {
    const { data: savedMessage, error: savedMessageError } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("id", sourceMessageId)
      .eq("thread_id", chatExperience.thread.id)
      .eq("user_id", context.user.id)
      .eq("role", "user")
      .maybeSingle();

    if (savedMessageError || !savedMessage) {
      return NextResponse.json(
        {
          error:
            savedMessageError?.message ?? "Frankie could not find the saved message to answer."
        },
        { status: savedMessageError ? 500 : 404 }
      );
    }

    sourceMessage = savedMessage;
    messageForReply = savedMessage.content;
  } else {
    const { data: userMessage, error: userMessageError } = await supabase
      .from("conversation_messages")
      .insert({
        thread_id: chatExperience.thread.id,
        user_id: context.user.id,
        role: "user",
        message_type: "chat",
        content: message,
        structured_payload: {}
      })
      .select("*")
      .single();

    if (userMessageError || !userMessage) {
      return NextResponse.json(
        { error: userMessageError?.message ?? "Frankie could not save your message." },
        { status: 500 }
      );
    }

    sourceMessage = userMessage;

    if (action === "save_message") {
      const refreshedExperience = await getChatExperience(context, displayName);

      return NextResponse.json({
        ...refreshedExperience,
        userMessageId: sourceMessage.id
      });
    }
  }

  if (!sourceMessage) {
    return NextResponse.json(
      { error: "Frankie could not find the message to work from." },
      { status: 500 }
    );
  }

  const startedAt = Date.now();
  const previousMessage = chatExperience.messages.at(-1);
  const pendingClarification =
    previousMessage?.role === "assistant" && previousMessage.message_type === "clarification_request"
      ? (previousMessage.structured_payload as { pendingClarification?: PendingClarification } | null)
          ?.pendingClarification
      : undefined;
  const reply = await orchestrateFrankieReply({
    profile: context.profile,
    message: messageForReply,
    recentMessages: chatExperience.messages,
    pendingClarification
  });
  const persistedLogIds = {
    activityLogIds: [] as string[],
    dietLogIds: [] as string[],
    lifestyleLogIds: [] as string[],
    wellnessCheckinIds: [] as string[]
  };

  if (reply.shouldPersistStructuredData) {
    try {
      if (reply.persistPlan.activities) {
        persistedLogIds.activityLogIds = await logActivityEntries({
          supabase,
          userId: context.user.id,
          sourceMessageId: sourceMessage.id,
          entries: reply.parsedActivities,
          extractionSource: reply.metadata.extractionSource
        });
      }
      if (reply.persistPlan.dietEntries) {
        persistedLogIds.dietLogIds = await logDietEntries({
          supabase,
          userId: context.user.id,
          sourceMessageId: sourceMessage.id,
          entries: reply.parsedDietEntries,
          extractionSource: reply.metadata.extractionSource
        });
      }
      if (reply.persistPlan.lifestyleEntries) {
        persistedLogIds.lifestyleLogIds = await logLifestyleEntries({
          supabase,
          userId: context.user.id,
          sourceMessageId: sourceMessage.id,
          entries: reply.parsedLifestyleEntries,
          extractionSource: reply.metadata.extractionSource
        });
      }
      if (reply.persistPlan.wellnessCheckin) {
        persistedLogIds.wellnessCheckinIds = await logWellnessCheckin({
          supabase,
          userId: context.user.id,
          sourceMessageId: sourceMessage.id,
          entry: reply.parsedWellnessCheckin,
          extractionSource: reply.metadata.extractionSource
        });
      }
    } catch (error) {
      await recordAiTraceRun({
        supabase,
        userId: context.user.id,
        userEmail: context.user.email ?? null,
        displayName,
        profile: context.profile,
        threadId: chatExperience.thread.id,
        threadTitle: chatExperience.thread.title,
        sourceMessageId: sourceMessage.id,
        userMessage: messageForReply,
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

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Frankie could not save the structured logs."
        },
        { status: 500 }
      );
    }
  }

  const structuredPayload = reply.metadata.pendingClarification
    ? { pendingClarification: reply.metadata.pendingClarification }
    : reply.shouldPersistStructuredData &&
      (reply.parsedActivities.length > 0 ||
        reply.parsedDietEntries.length > 0 ||
        reply.parsedLifestyleEntries.length > 0 ||
        reply.parsedWellnessCheckin)
      ? {
          activitiesLogged: reply.persistPlan.activities
            ? reply.parsedActivities.map((activity, index) => ({
            id: persistedLogIds.activityLogIds[index] ?? null,
            activityType: activity.activityType,
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
          wellnessLogged: reply.persistPlan.wellnessCheckin && reply.parsedWellnessCheckin
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
        }
      : {};

  const { data: assistantMessage, error: assistantMessageError } = await supabase
    .from("conversation_messages")
    .insert({
      thread_id: chatExperience.thread.id,
      user_id: context.user.id,
      role: "assistant",
      message_type: reply.assistantMessageType,
      content: reply.reply,
      structured_payload: structuredPayload
    })
    .select("id")
    .single();

  if (assistantMessageError) {
    await recordAiTraceRun({
      supabase,
      userId: context.user.id,
      userEmail: context.user.email ?? null,
      displayName,
      profile: context.profile,
      threadId: chatExperience.thread.id,
      threadTitle: chatExperience.thread.title,
      sourceMessageId: sourceMessage.id,
      userMessage: messageForReply,
      reply,
      persistedLogIds,
      runStatus: "assistant_message_failed",
      errorStage: "assistant_message_insert",
      errorMessage: assistantMessageError.message,
      latencyMs: Date.now() - startedAt
    });

    return NextResponse.json({ error: assistantMessageError.message }, { status: 500 });
  }

  await recordAiTraceRun({
    supabase,
    userId: context.user.id,
    userEmail: context.user.email ?? null,
    displayName,
    profile: context.profile,
    threadId: chatExperience.thread.id,
    threadTitle: chatExperience.thread.title,
    sourceMessageId: sourceMessage.id,
    assistantMessageId: assistantMessage.id,
    userMessage: messageForReply,
    reply,
    persistedLogIds,
    runStatus: reply.metadata.needsClarification ? "clarification" : "completed",
    latencyMs: Date.now() - startedAt
  });

  const refreshedExperience = await getChatExperience(context, displayName);

  return NextResponse.json(refreshedExperience);
}
