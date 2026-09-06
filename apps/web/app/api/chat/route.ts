import { NextRequest, NextResponse } from "next/server";
import { derivePendingClarification, runFrankieTurn } from "@/lib/ai/run-frankie-turn";
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

  const pendingClarification = derivePendingClarification(chatExperience.messages.at(-1));

  const turn = await runFrankieTurn({
    displayName,
    message: messageForReply,
    pendingClarification,
    profile: context.profile,
    recentMessages: chatExperience.messages,
    sourceMessageId: sourceMessage.id,
    supabase,
    threadId: chatExperience.thread.id,
    threadTitle: chatExperience.thread.title,
    userEmail: context.user.email ?? null,
    userId: context.user.id
  });

  if (turn.runStatus === "log_write_failed" || turn.runStatus === "assistant_message_failed") {
    return NextResponse.json({ error: turn.errorMessage }, { status: 500 });
  }

  const refreshedExperience = await getChatExperience(context, displayName);

  return NextResponse.json(refreshedExperience);
}
