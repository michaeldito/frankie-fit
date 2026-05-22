"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChatTranscript } from "@/components/chat/chat-transcript";
import type { Database } from "@/types/database";

type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

type ChatApiResponse = {
  error: string | null;
  messages: ChatMessage[];
  schemaReady: boolean;
  userMessageId?: string;
};

type WebChatExperienceProps = {
  assistantCardClass: string;
  followupMessage: string;
  introMessage: string;
  initialMessages: ChatMessage[];
  primaryGoal: string | null;
  schemaReady: boolean;
  userCardClass: string;
};

async function chatApiFetch<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = (await response.json().catch(() => null)) as T & { error?: string | null };

  if (!response.ok) {
    throw new Error(payload?.error ?? "Frankie could not complete that request.");
  }

  return payload;
}

export function WebChatExperience({
  assistantCardClass,
  followupMessage,
  introMessage,
  initialMessages,
  primaryGoal,
  schemaReady,
  userCardClass
}: WebChatExperienceProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const isBusy = Boolean(pendingMessage) || isThinking || isRefreshing;

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content || isBusy || !schemaReady) {
      return;
    }

    setDraft("");
    setError(null);
    setPendingMessage(content);

    try {
      const saveResponse = await chatApiFetch<ChatApiResponse>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          action: "save_message",
          message: content
        })
      });

      if (!saveResponse.userMessageId) {
        throw new Error("Frankie saved the message but did not return a message id.");
      }

      setMessages(saveResponse.messages);
      setPendingMessage(null);
      setIsThinking(true);

      const replyResponse = await chatApiFetch<ChatApiResponse>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          action: "generate_reply",
          sourceMessageId: saveResponse.userMessageId
        })
      });

      setMessages(replyResponse.messages);
      setError(replyResponse.error);
      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (sendError) {
      setPendingMessage(null);
      setIsThinking(false);
      setError(
        sendError instanceof Error ? sendError.message : "Frankie could not send that just now."
      );
      return;
    }

    setIsThinking(false);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (!schemaReady || isBusy || !draft.trim()) {
      return;
    }

    formRef.current?.requestSubmit();
  }

  return (
    <>
      {error ? (
        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="rounded-[1.35rem] border border-[rgba(248,113,113,0.28)] bg-[rgba(127,29,29,0.24)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
            {error}
          </div>
        </div>
      ) : null}

      <ChatTranscript
        assistantCardClass={assistantCardClass}
        followupMessage={followupMessage}
        introMessage={introMessage}
        isThinking={isThinking}
        messages={messages}
        pendingMessage={pendingMessage}
        userCardClass={userCardClass}
      />

      <form
        className="border-t border-[var(--border)] px-5 py-4 sm:px-6"
        onSubmit={handleSend}
        ref={formRef}
      >
        <label className="block">
          <span className="mb-3 block text-sm font-semibold tracking-[-0.01em]">
            Tell Frankie what you did, ate, or how you are feeling.
          </span>
          <textarea
            className="ff-textarea min-h-32"
            disabled={!schemaReady || isBusy}
            name="message"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={
              schemaReady
                ? primaryGoal
                  ? `I want to stay on track with ${primaryGoal.toLowerCase()}, and today looked like...`
                  : "I had eggs and fruit for breakfast, walked for an hour, and motivation feels a little low."
                : "Run the Supabase schema first, then Frankie can start saving chat and logs."
            }
            required
            value={draft}
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
            Say it however you would normally say it. Frankie is meant to handle the messy
            version now.
          </p>
          <button
            className="ff-button-primary min-w-28 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!schemaReady || isBusy || !draft.trim()}
            type="submit"
          >
            {pendingMessage ? "Sending..." : isThinking ? "Thinking..." : "Send"}
          </button>
        </div>
      </form>
    </>
  );
}
