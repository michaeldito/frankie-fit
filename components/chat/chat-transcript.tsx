"use client";

import { useEffect, useRef, useState } from "react";
import { LoggedEntryCard } from "@/components/chat/logged-entry-card";
import {
  formatActivityDetail,
  formatActivityTitle,
  formatDietDetail,
  formatDietTitle,
  formatWellnessDetail,
  formatWellnessTitle,
  type LoggedActivity,
  type LoggedDietEntry,
  type LoggedWellnessCheckin
} from "@/components/chat/logged-entry-format";

export type LoggedEntryKind = "activity" | "diet" | "wellness";

type ChatTranscriptMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type?: string;
  structured_payload?: unknown;
};

type ChatTranscriptProps = {
  assistantCardClass: string;
  introMessage: string;
  followupMessage: string;
  isThinking?: boolean;
  messages: ChatTranscriptMessage[];
  onRemoveLoggedEntry?: (
    messageId: string,
    kind: LoggedEntryKind,
    entryId: string
  ) => Promise<void>;
  pendingMessage?: string | null;
  userCardClass: string;
};

function getStructuredPayload(message: ChatTranscriptMessage) {
  if (message.message_type !== "log_confirmation") {
    return null;
  }

  return message.structured_payload as {
    activitiesLogged?: LoggedActivity[];
    dietLogged?: LoggedDietEntry[];
    wellnessLogged?: LoggedWellnessCheckin | null;
  } | null;
}

function AnimatedStatusText({
  className,
  label
}: {
  className: string;
  label: string;
}) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDotCount((current) => (current >= 3 ? 1 : current + 1));
    }, 350);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <p className={className}>
      {label}
      {".".repeat(dotCount)}
    </p>
  );
}

export function ChatTranscript({
  assistantCardClass,
  introMessage,
  followupMessage,
  isThinking = false,
  messages,
  onRemoveLoggedEntry,
  pendingMessage = null,
  userCardClass
}: ChatTranscriptProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [isThinking, messages.length, pendingMessage]);

  return (
    <div
      className="ff-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
      ref={scrollContainerRef}
    >
      <div className="space-y-3 pb-1">
        {messages.length > 0 ? (
          <>
            {messages.map((message) => {
              const isUser = message.role === "user";
              const speakerLabel = isUser
                ? "You"
                : message.role === "system"
                  ? "System"
                  : "Frankie";
              const payload = getStructuredPayload(message);
              const loggedActivities = payload?.activitiesLogged ?? [];
              const loggedDietEntries = payload?.dietLogged ?? [];
              const loggedWellnessCheckin = payload?.wellnessLogged
                ? [payload.wellnessLogged]
                : [];

              return (
                <article className={isUser ? userCardClass : assistantCardClass} key={message.id}>
                  <p
                    className={
                      isUser
                        ? "mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/72"
                        : "mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
                    }
                  >
                    {speakerLabel}
                  </p>
                  <p className="leading-6">{message.content}</p>
                  {onRemoveLoggedEntry ? (
                    <>
                      <LoggedEntryCard
                        entries={loggedActivities}
                        formatDetail={formatActivityDetail}
                        formatTitle={formatActivityTitle}
                        kicker="Activity"
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "activity", entryId)}
                      />
                      <LoggedEntryCard
                        entries={loggedDietEntries}
                        formatDetail={formatDietDetail}
                        formatTitle={formatDietTitle}
                        kicker="Meal"
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "diet", entryId)}
                      />
                      <LoggedEntryCard
                        entries={loggedWellnessCheckin}
                        formatDetail={formatWellnessDetail}
                        formatTitle={formatWellnessTitle}
                        kicker="Wellness check-in"
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "wellness", entryId)}
                      />
                    </>
                  ) : null}
                </article>
              );
            })}

            {pendingMessage ? (
              <article className={userCardClass}>
                <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/72">
                  You
                </p>
                <p className="leading-6">{pendingMessage}</p>
                <AnimatedStatusText
                  className="pt-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/70"
                  label="Sending"
                />
              </article>
            ) : null}

            {isThinking ? (
              <article className={assistantCardClass}>
                <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Frankie
                </p>
                <AnimatedStatusText
                  className="leading-6 text-[var(--foreground)]"
                  label="Thinking"
                />
              </article>
            ) : null}
          </>
        ) : (
          <>
            <article className={assistantCardClass}>
              <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Frankie
              </p>
              <p className="leading-6">{introMessage}</p>
            </article>

            <article className={assistantCardClass}>
              <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Frankie
              </p>
              <p className="leading-6">{followupMessage}</p>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
