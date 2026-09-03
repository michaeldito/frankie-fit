"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChatTranscript, type LoggedEntryKind } from "@/components/chat/chat-transcript";
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
  schemaReady: boolean;
  userCardClass: string;
};

const QUICK_START_PLACEHOLDER = "[fill in]";

const QUICK_START_OPTIONS: Array<{ label: string; template: string }> = [
  { label: "Exercise", template: `Today I exercised, what I did was ${QUICK_START_PLACEHOLDER}` },
  { label: "Food", template: `Today I ate, what I had was ${QUICK_START_PLACEHOLDER}` },
  {
    label: "Wellness",
    template: `Today I'm checking in, how I'm feeling is ${QUICK_START_PLACEHOLDER}`
  }
];

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
  schemaReady,
  userCardClass
}: WebChatExperienceProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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

  const loggedEntryRoutes: Record<LoggedEntryKind, string> = {
    activity: "/api/logs/activity",
    diet: "/api/logs/diet",
    wellness: "/api/logs/wellness"
  };
  const loggedEntryPayloadKeys: Record<LoggedEntryKind, string> = {
    activity: "activitiesLogged",
    diet: "dietLogged",
    wellness: "wellnessLogged"
  };

  async function handleRemoveLoggedEntry(
    messageId: string,
    kind: LoggedEntryKind,
    entryId: string
  ) {
    setError(null);

    try {
      await chatApiFetch(`${loggedEntryRoutes[kind]}/${entryId}`, { method: "DELETE" });
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Frankie could not remove that log."
      );
      return;
    }

    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) => {
        if (currentMessage.id !== messageId) {
          return currentMessage;
        }

        const payloadKey = loggedEntryPayloadKeys[kind];
        const payload = currentMessage.structured_payload as Record<string, unknown> | null;

        if (!payload || !(payloadKey in payload)) {
          return currentMessage;
        }

        const updatedValue =
          kind === "wellness"
            ? null
            : (payload[payloadKey] as Array<{ id: string | null }>).filter(
                (entry) => entry.id !== entryId
              );

        return {
          ...currentMessage,
          structured_payload: {
            ...payload,
            [payloadKey]: updatedValue
          } as ChatMessage["structured_payload"]
        };
      })
    );
  }

  function handleQuickStart(template: string) {
    if (!schemaReady || isBusy) {
      return;
    }

    setDraft(template);
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      const placeholderIndex = template.indexOf(QUICK_START_PLACEHOLDER);

      if (placeholderIndex >= 0) {
        textarea.setSelectionRange(
          placeholderIndex,
          placeholderIndex + QUICK_START_PLACEHOLDER.length
        );
      } else {
        textarea.setSelectionRange(template.length, template.length);
      }
    });
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
        onRemoveLoggedEntry={handleRemoveLoggedEntry}
        pendingMessage={pendingMessage}
        userCardClass={userCardClass}
      />

      <form
        className="border-t border-[var(--border)] px-5 py-4 sm:px-6"
        onSubmit={handleSend}
        ref={formRef}
      >
        <label className="block">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tracking-[-0.01em]">
              Tell Frankie anything about your
            </span>
            {QUICK_START_OPTIONS.map((option) => (
              <button
                className="cursor-pointer rounded-full border border-[var(--border-strong)] bg-[var(--surface-strong)] px-3 py-1.5 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[rgba(147,197,253,0.5)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!schemaReady || isBusy}
                key={option.label}
                onClick={() => handleQuickStart(option.template)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            className="ff-textarea min-h-32"
            disabled={!schemaReady || isBusy}
            name="message"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={
              schemaReady
                ? "I ran 30 minutes this morning, had eggs and toast after, and my energy's been solid today."
                : "Run the Supabase schema first, then Frankie can start saving chat and logs."
            }
            ref={textareaRef}
            required
            value={draft}
          />
        </label>
        <div className="mt-4 flex justify-end">
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
