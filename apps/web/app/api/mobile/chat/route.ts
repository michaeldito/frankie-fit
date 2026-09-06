import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { derivePendingClarification, runFrankieTurn } from "@/lib/ai/run-frankie-turn";
import { loadChatThreadAndMessages, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat";
import type { AppProfile } from "@/lib/profile";
import { getDisplayName } from "@/lib/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseBearerClient } from "@/lib/supabase/bearer";
import type { Database } from "@/types/database";

const CHAT_RATE_LIMIT_PER_MINUTE = 20;

type MobileSupabaseClient = SupabaseClient<Database>;
type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
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

function loadChatExperience(input: {
  profile: AppProfile | null;
  supabase: MobileSupabaseClient;
  user: User;
}) {
  const displayName = getDisplayName(input.user, input.profile);

  return loadChatThreadAndMessages({
    supabase: input.supabase,
    userId: input.user.id,
    profile: input.profile,
    threadTitle: `${displayName}'s Frankie chat`
  });
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

  const displayName = getDisplayName(context.user, context.profile);
  const pendingClarification = derivePendingClarification(chatExperience.messages.at(-1));

  const turn = await runFrankieTurn({
    displayName,
    message: messageForReply,
    pendingClarification,
    profile: context.profile,
    recentMessages: chatExperience.messages,
    sourceMessageId: sourceMessage.id,
    supabase: context.supabase,
    threadId: chatExperience.thread.id,
    threadTitle: chatExperience.thread.title,
    userEmail: context.user.email ?? null,
    userId: context.user.id
  });

  if (turn.runStatus === "log_write_failed" || turn.runStatus === "assistant_message_failed") {
    return NextResponse.json({ error: turn.errorMessage }, { status: 500 });
  }

  const refreshedExperience = await loadChatExperience(context);

  return NextResponse.json(refreshedExperience);
}
