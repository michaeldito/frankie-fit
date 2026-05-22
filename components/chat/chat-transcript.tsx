"use client";

import { useEffect, useRef, useState } from "react";

type ChatTranscriptMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatTranscriptProps = {
  assistantCardClass: string;
  introMessage: string;
  followupMessage: string;
  isThinking?: boolean;
  messages: ChatTranscriptMessage[];
  pendingMessage?: string | null;
  userCardClass: string;
};

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
      className="ff-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
      ref={scrollContainerRef}
    >
      <div className="space-y-4 pb-2">
        {messages.length > 0 ? (
          <>
            {messages.map((message) => {
              const isUser = message.role === "user";
              const speakerLabel = isUser
                ? "You"
                : message.role === "system"
                  ? "System"
                  : "Frankie";

              return (
                <article className={isUser ? userCardClass : assistantCardClass} key={message.id}>
                  <p
                    className={
                      isUser
                        ? "mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72"
                        : "mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]"
                    }
                  >
                    {speakerLabel}
                  </p>
                  <p className="leading-7">{message.content}</p>
                </article>
              );
            })}

            {pendingMessage ? (
              <article className={userCardClass}>
                <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72">
                  You
                </p>
                <p className="leading-7">{pendingMessage}</p>
                <AnimatedStatusText
                  className="pt-3 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-white/70"
                  label="Sending"
                />
              </article>
            ) : null}

            {isThinking ? (
              <article className={assistantCardClass}>
                <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Frankie
                </p>
                <AnimatedStatusText
                  className="leading-7 text-[var(--foreground)]"
                  label="Thinking"
                />
              </article>
            ) : null}
          </>
        ) : (
          <>
            <article className={assistantCardClass}>
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Frankie
              </p>
              <p className="leading-7">{introMessage}</p>
            </article>

            <article className={assistantCardClass}>
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Frankie
              </p>
              <p className="leading-7">{followupMessage}</p>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
