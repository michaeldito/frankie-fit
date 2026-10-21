"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { LoaderCircle, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChatTranscript, type LoggedEntryKind } from "@/components/chat/chat-transcript";
import type { EditableEntry } from "@/components/chat/edit-logged-entry-modal";
import { loggedEntryRoutes } from "@/components/chat/logged-entry-format";
import type { SavedWorkoutSummary } from "@/components/chat/workout-draft-modal";
import {
  QUICK_START_OPTIONS,
  findBracketBlanks,
  findNextBlank,
  findPreviousBlank
} from "@/components/chat/quick-start";
import { PERSONAS } from "@/lib/ai/prompts/personas";
import { PILLAR_STYLES } from "@/components/frankie/pillars";
import { PILLARS, type Pillar } from "@frankie-fit/brand-core";
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
  frankieVersionLabel: string;
  introMessage: string;
  initialMessages: ChatMessage[];
  initialPersona: string | null;
  schemaReady: boolean;
  userCardClass: string;
};

const DEFAULT_PERSONA_LABEL = "Frankie";

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

function SendIcon({ busy }: { busy: boolean }) {
  return busy ? (
    <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
  ) : (
    <SendHorizontal aria-hidden className="h-4 w-4" strokeWidth={2.4} />
  );
}

export function WebChatExperience({
  assistantCardClass,
  followupMessage,
  frankieVersionLabel,
  introMessage,
  initialMessages,
  initialPersona,
  schemaReady,
  userCardClass
}: WebChatExperienceProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const personaMenuRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [personaId, setPersonaId] = useState<string | null>(initialPersona);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [quickStartHintVisible, setQuickStartHintVisible] = useState(false);
  const quickStartHintTimeoutRef = useRef<number | null>(null);
  const isBusy = Boolean(pendingMessage) || isThinking || isRefreshing;
  const activePersona = PERSONAS.find((persona) => persona.id === personaId) ?? null;

  useEffect(() => {
    return () => {
      if (quickStartHintTimeoutRef.current) {
        window.clearTimeout(quickStartHintTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (personaMenuRef.current && !personaMenuRef.current.contains(event.target as Node)) {
        setPersonaMenuOpen(false);
      }
    }

    if (personaMenuOpen) {
      document.addEventListener("mousedown", handlePointerDown, true);
      return () => document.removeEventListener("mousedown", handlePointerDown, true);
    }
  }, [personaMenuOpen]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

  async function handleSelectPersona(nextPersonaId: string | null) {
    setPersonaMenuOpen(false);

    if (nextPersonaId === personaId) {
      return;
    }

    setPersonaId(nextPersonaId);

    try {
      await chatApiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ action: "set_persona", personaId: nextPersonaId ?? "" })
      });
    } catch {
      setPersonaId(personaId);
      setError("Frankie could not switch coaching voices just now.");
    }
  }

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

  const loggedEntryPayloadKeys: Record<LoggedEntryKind, string> = {
    activity: "activitiesLogged",
    diet: "dietLogged",
    lifestyle: "lifestyleLogged",
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

  function handleEditLoggedEntry(messageId: string, kind: LoggedEntryKind, updatedEntry: EditableEntry) {
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
            ? updatedEntry
            : (payload[payloadKey] as Array<{ id: string | null }>).map((entry) =>
                entry.id === updatedEntry.id ? updatedEntry : entry
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

  function handleWorkoutDraftSaved(messageId: string, savedWorkout: SavedWorkoutSummary) {
    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) => {
        if (currentMessage.id !== messageId) {
          return currentMessage;
        }

        const payload =
          (currentMessage.structured_payload as { workoutDraft?: Record<string, unknown> } | null) ?? {};

        return {
          ...currentMessage,
          structured_payload: {
            ...payload,
            workoutDraft: {
              ...(payload.workoutDraft ?? {}),
              savedWorkout
            }
          } as ChatMessage["structured_payload"]
        };
      })
    );
  }

  function dismissQuickStartHint() {
    if (quickStartHintTimeoutRef.current) {
      window.clearTimeout(quickStartHintTimeoutRef.current);
      quickStartHintTimeoutRef.current = null;
    }

    setQuickStartHintVisible(false);
  }

  function handleQuickStart(template: string) {
    if (!schemaReady || isBusy) {
      return;
    }

    setDraft(template);
    setQuickStartHintVisible(true);

    if (quickStartHintTimeoutRef.current) {
      window.clearTimeout(quickStartHintTimeoutRef.current);
    }

    quickStartHintTimeoutRef.current = window.setTimeout(() => {
      setQuickStartHintVisible(false);
    }, 5000);

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      const firstBlank = findBracketBlanks(template)[0];

      if (firstBlank) {
        textarea.setSelectionRange(firstBlank.start, firstBlank.end);
      } else {
        textarea.setSelectionRange(template.length, template.length);
      }
    });
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Tab") {
      const textarea = event.currentTarget;
      const blanks = findBracketBlanks(textarea.value);
      const nextBlank = event.shiftKey
        ? findPreviousBlank(blanks, textarea.selectionStart)
        : findNextBlank(blanks, textarea.selectionEnd);

      if (nextBlank) {
        event.preventDefault();
        textarea.setSelectionRange(nextBlank.start, nextBlank.end);
        dismissQuickStartHint();
      }

      return;
    }

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
          <div className="rounded-[1.35rem] border border-danger/30 bg-danger/10 px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
            {error}
          </div>
        </div>
      ) : null}

      <ChatTranscript
        assistantCardClass={assistantCardClass}
        assistantName={activePersona?.displayName ?? DEFAULT_PERSONA_LABEL}
        followupMessage={followupMessage}
        introMessage={introMessage}
        isThinking={isThinking}
        messages={messages}
        onRemoveLoggedEntry={handleRemoveLoggedEntry}
        onEditLoggedEntry={handleEditLoggedEntry}
        onWorkoutDraftSaved={handleWorkoutDraftSaved}
        pendingMessage={pendingMessage}
        showFrankie={!activePersona}
        userCardClass={userCardClass}
      />

      <div className="-mx-4 border-t border-[var(--border)] sm:-mx-5" />

      <form
        className="px-5 pt-4 pb-0 sm:px-6"
        onSubmit={handleSend}
        ref={formRef}
      >
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold tracking-[-0.01em]" htmlFor="chat-message-input">
              Tell Frankie anything about your
            </label>
            {QUICK_START_OPTIONS.map((option) => {
              const pillarKey = option.label.toLowerCase() as Pillar;
              const pillar = PILLARS.includes(pillarKey) ? PILLAR_STYLES[pillarKey] : null;
              const PillarIcon = pillar?.icon;

              return (
                <button
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-muted-strong transition hover:-translate-y-px hover:border-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!schemaReady || isBusy}
                  key={option.label}
                  onClick={() => handleQuickStart(option.template)}
                  type="button"
                >
                  {PillarIcon ? <PillarIcon aria-hidden className={`h-4 w-4 ${pillar.text}`} /> : null}
                  {option.label}
                </button>
              );
            })}
          </div>
          {quickStartHintVisible ? (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--border-strong)] bg-[var(--surface-strong)] px-3 py-2 text-xs leading-5 text-[var(--muted-strong)]">
              <span>Type in the highlighted blank, then press Tab for the next one.</span>
              <button
                aria-label="Dismiss hint"
                className="shrink-0 cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={dismissQuickStartHint}
                type="button"
              >
                ×
              </button>
            </div>
          ) : null}
          <div className="ff-textarea flex min-h-0 resize-none items-stretch gap-2">
            <textarea
              className="min-h-[2.5rem] max-h-[16rem] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 text-[0.85rem] text-[var(--foreground)] outline-none"
              disabled={!schemaReady || isBusy}
              id="chat-message-input"
              name="message"
              onChange={(event) => {
                setDraft(event.target.value);

                if (quickStartHintVisible) {
                  dismissQuickStartHint();
                }
              }}
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
            <button
              aria-label={pendingMessage ? "Sending" : isThinking ? "Thinking" : "Send"}
              className="ff-button-primary mb-0.5 h-9 w-9 shrink-0 self-end rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!schemaReady || isBusy || !draft.trim()}
              type="submit"
            >
              <SendIcon busy={isBusy} />
            </button>
          </div>
          <div className="relative mt-2 flex items-center justify-between gap-2" ref={personaMenuRef}>
            <button
              aria-expanded={personaMenuOpen}
              className="cursor-pointer text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
              onClick={() => setPersonaMenuOpen((current) => !current)}
              type="button"
            >
              Coach: {activePersona?.displayName ?? DEFAULT_PERSONA_LABEL}
            </button>
            <span className="text-sm text-[var(--muted)]">{frankieVersionLabel}</span>

            <div
              aria-hidden={!personaMenuOpen}
              className={`ff-card absolute left-0 z-30 max-h-60 w-max min-w-52 max-w-64 origin-bottom-left overflow-y-auto p-1.5 transition-all duration-200 ease-out ${
                personaMenuOpen
                  ? "translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none translate-y-1 scale-95 opacity-0"
              }`}
              style={{ bottom: "calc(100% + 0.5rem)" }}
            >
              <button
                className={`block w-full truncate rounded-[0.55rem] px-2.5 py-2 text-left text-sm font-medium transition ${
                  personaId === null
                    ? "border border-transparent bg-brand text-brand-foreground shadow-[0_12px_28px_color-mix(in_srgb,var(--brand)_28%,transparent)]"
                    : "cursor-pointer border border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-surface-contrast hover:text-[var(--foreground)]"
                }`}
                onClick={() => handleSelectPersona(null)}
                type="button"
              >
                {DEFAULT_PERSONA_LABEL}
              </button>
              {PERSONAS.map((persona) => (
                <button
                  className={`block w-full truncate rounded-[0.55rem] px-2.5 py-2 text-left text-sm font-medium transition ${
                    personaId === persona.id
                      ? "border border-transparent bg-brand text-brand-foreground shadow-[0_12px_28px_color-mix(in_srgb,var(--brand)_28%,transparent)]"
                      : "cursor-pointer border border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-surface-contrast hover:text-[var(--foreground)]"
                  }`}
                  key={persona.id}
                  onClick={() => handleSelectPersona(persona.id)}
                  type="button"
                >
                  {persona.displayName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
