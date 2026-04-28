"use client";

import { useEffect, useRef } from "react";

type ChatTranscriptMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatTranscriptProps = {
  assistantCardClass: string;
  introMessage: string;
  followupMessage: string;
  messages: ChatTranscriptMessage[];
  userCardClass: string;
};

export function ChatTranscript({
  assistantCardClass,
  introMessage,
  followupMessage,
  messages,
  userCardClass
}: ChatTranscriptProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  return (
    <div
      className="ff-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
      ref={scrollContainerRef}
    >
      <div className="space-y-4 pb-2">
        {messages.length > 0 ? (
          messages.map((message) => {
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
          })
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
