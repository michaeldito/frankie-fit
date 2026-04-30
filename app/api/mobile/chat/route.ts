import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { orchestrateFrankieReply } from "@/lib/ai/orchestrator/frankie-orchestrator";
import { logActivityEntries } from "@/lib/ai/tools/log-activity";
import { logDietEntries } from "@/lib/ai/tools/log-diet";
import { logWellnessCheckin } from "@/lib/ai/tools/log-wellness";
import type { AppProfile } from "@/lib/profile";
import { getDisplayName } from "@/lib/profile";
import { createSupabaseBearerClient } from "@/lib/supabase/bearer";
import type { Database } from "@/types/database";

type MobileSupabaseClient = SupabaseClient<Database>;
type ChatThread = Database["public"]["Tables"]["conversation_threads"]["Row"];
type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

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

async function createMobileContext(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      error: NextResponse.json({ error: "Missing mobile session token." }, { status: 401 })
    };
  }

  const supabase = createSupabaseBearerClient(token);
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: userError?.message ?? "Could not verify your mobile session." },
        { status: 401 }
      )
    };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: NextResponse.json({ error: profileError.message }, { status: 500 })
    };
  }

  return {
    supabase,
    user,
    profile: (profileData as unknown as AppProfile | null) ?? null
  };
}

async function getOrCreatePrimaryThread(
  supabase: MobileSupabaseClient,
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
      error: existingThreadError.message,
      thread: null
    };
  }

  if (existingThread) {
    return {
      error: null,
      thread: existingThread
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
    error: createdThreadError?.message ?? null,
    thread: createdThread
  };
}

async function seedInitialAssistantMessage(
  supabase: MobileSupabaseClient,
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

  const { error: insertError } = await supabase.from("conversation_messages").insert({
    thread_id: threadId,
    user_id: userId,
    role: "assistant",
    message_type: profile?.onboarding_summary ? "summary" : "chat",
    content: buildInitialAssistantMessage(profile),
    structured_payload: profile?.onboarding_summary
      ? {
          seededFromOnboarding: true
        }
      : {}
  });

  return insertError?.message ?? null;
}

async function loadChatExperience(input: {
  profile: AppProfile | null;
  supabase: MobileSupabaseClient;
  user: User;
}) {
  const displayName = getDisplayName(input.user, input.profile);
  const { thread, error: threadError } = await getOrCreatePrimaryThread(
    input.supabase,
    input.user.id,
    `${displayName}'s Frankie chat`
  );

  if (!thread) {
    return {
      error: threadError,
      messages: [] as ChatMessage[],
      schemaReady: !isMissingChatTable(threadError),
      thread: null as ChatThread | null
    };
  }

  const seedError = await seedInitialAssistantMessage(
    input.supabase,
    thread.id,
    input.user.id,
    input.profile
  );

  if (seedError) {
    return {
      error: seedError,
      messages: [] as ChatMessage[],
      schemaReady: !isMissingChatTable(seedError),
      thread
    };
  }

  const { data: messages, error: messagesError } = await input.supabase
    .from("conversation_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  return {
    error: messagesError?.message ?? null,
    messages: messages ?? [],
    schemaReady: !isMissingChatTable(messagesError?.message),
    thread
  };
}

export async function GET(request: NextRequest) {
  const context = await createMobileContext(request);

  if ("error" in context) {
    return context.error;
  }

  const chatExperience = await loadChatExperience(context);

  if (!chatExperience.thread) {
    return NextResponse.json(
      {
        error: chatExperience.error ?? "Frankie could not open the conversation thread.",
        schemaReady: chatExperience.schemaReady
      },
      { status: chatExperience.schemaReady ? 500 : 503 }
    );
  }

  return NextResponse.json(chatExperience);
}

export async function POST(request: NextRequest) {
  const context = await createMobileContext(request);

  if ("error" in context) {
    return context.error;
  }

  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    message?: unknown;
    sourceMessageId?: unknown;
  } | null;
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

  if (action === "generate_reply" && !sourceMessageId) {
    return NextResponse.json(
      { error: "Frankie needs the saved message before thinking through a reply." },
      { status: 400 }
    );
  }

  const chatExperience = await loadChatExperience(context);

  if (!chatExperience.thread) {
    return NextResponse.json(
      {
        error: chatExperience.error ?? "Frankie could not open the conversation thread.",
        schemaReady: chatExperience.schemaReady
      },
      { status: chatExperience.schemaReady ? 500 : 503 }
    );
  }

  let sourceMessage: ChatMessage;
  let messageForReply = message;

  if (action === "generate_reply") {
    const { data: savedMessage, error: savedMessageError } = await context.supabase
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
            savedMessageError?.message ??
            "Frankie could not find the saved message to answer."
        },
        { status: savedMessageError ? 500 : 404 }
      );
    }

    sourceMessage = savedMessage;
    messageForReply = savedMessage.content;
  } else {
    const { data: userMessage, error: userMessageError } = await context.supabase
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
      const refreshedExperience = await loadChatExperience(context);

      return NextResponse.json({
        ...refreshedExperience,
        userMessageId: sourceMessage.id
      });
    }
  }

  const reply = await orchestrateFrankieReply({
    profile: context.profile,
    message: messageForReply,
    recentMessages: chatExperience.messages
  });

  try {
    await logActivityEntries({
      supabase: context.supabase,
      userId: context.user.id,
      sourceMessageId: sourceMessage.id,
      entries: reply.parsedActivities,
      extractionSource: reply.metadata.extractionSource
    });
    await logDietEntries({
      supabase: context.supabase,
      userId: context.user.id,
      sourceMessageId: sourceMessage.id,
      entries: reply.parsedDietEntries,
      extractionSource: reply.metadata.extractionSource
    });
    await logWellnessCheckin({
      supabase: context.supabase,
      userId: context.user.id,
      sourceMessageId: sourceMessage.id,
      entry: reply.parsedWellnessCheckin,
      extractionSource: reply.metadata.extractionSource
    });
  } catch (error) {
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

  const structuredPayload =
    reply.parsedActivities.length > 0 ||
    reply.parsedDietEntries.length > 0 ||
    reply.parsedWellnessCheckin
      ? {
          activitiesLogged: reply.parsedActivities.map((activity) => ({
            activityType: activity.activityType,
            durationMinutes: activity.durationMinutes,
            intensity: activity.intensity
          })),
          dietLogged: reply.parsedDietEntries.map((entry) => ({
            confidence: entry.confidence,
            description: entry.description,
            mealType: entry.mealType
          })),
          orchestration: reply.metadata,
          wellnessLogged: reply.parsedWellnessCheckin
            ? {
                detectedSignals: reply.parsedWellnessCheckin.detectedSignals,
                energyScore: reply.parsedWellnessCheckin.energyScore,
                loggedFor: reply.parsedWellnessCheckin.loggedFor,
                moodScore: reply.parsedWellnessCheckin.moodScore,
                motivationScore: reply.parsedWellnessCheckin.motivationScore,
                sorenessScore: reply.parsedWellnessCheckin.sorenessScore,
                stressScore: reply.parsedWellnessCheckin.stressScore
              }
            : null
        }
      : {};

  const { error: assistantMessageError } = await context.supabase
    .from("conversation_messages")
    .insert({
      thread_id: chatExperience.thread.id,
      user_id: context.user.id,
      role: "assistant",
      message_type: reply.assistantMessageType,
      content: reply.reply,
      structured_payload: structuredPayload
    });

  if (assistantMessageError) {
    return NextResponse.json({ error: assistantMessageError.message }, { status: 500 });
  }

  const refreshedExperience = await loadChatExperience(context);

  return NextResponse.json(refreshedExperience);
}
