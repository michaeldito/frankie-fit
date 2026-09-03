"use client";

import { useEffect, useRef, useState } from "react";
import { LoggedEntryCard } from "@/components/chat/logged-entry-card";

export type LoggedEntryKind = "activity" | "diet" | "wellness";

type LoggedActivity = {
  id: string | null;
  activityType: string;
  durationMinutes: number | null;
  intensity: string | null;
  loggedForDate: string | null;
};

type LoggedDietEntry = {
  id: string | null;
  description: string;
  mealType: string | null;
  loggedForDate: string | null;
};

type LoggedWellnessCheckin = {
  id: string | null;
  energyScore: number | null;
  moodScore: number | null;
  motivationScore: number | null;
  sorenessScore: number | null;
  stressScore: number | null;
  loggedForDate: string | null;
};

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

function formatActivityLabel(activity: LoggedActivity) {
  const parts = [activity.activityType];

  if (activity.durationMinutes) {
    parts.push(`${activity.durationMinutes} min`);
  }

  if (activity.intensity) {
    parts.push(activity.intensity);
  }

  const label = parts.join(" · ");

  return activity.loggedForDate ? `Logged: ${label} (${activity.loggedForDate})` : `Logged: ${label}`;
}

function formatDietLabel(entry: LoggedDietEntry) {
  const parts = [entry.description];

  if (entry.mealType) {
    parts.push(entry.mealType);
  }

  const label = parts.join(" · ");

  return entry.loggedForDate ? `Logged: ${label} (${entry.loggedForDate})` : `Logged: ${label}`;
}

function formatWellnessLabel(checkin: LoggedWellnessCheckin) {
  const scoreLabels: Array<[string, number | null]> = [
    ["energy", checkin.energyScore],
    ["mood", checkin.moodScore],
    ["motivation", checkin.motivationScore],
    ["soreness", checkin.sorenessScore],
    ["stress", checkin.stressScore]
  ];
  const parts = scoreLabels
    .filter(([, score]) => score !== null)
    .map(([name, score]) => `${name} ${score}`);
  const label = parts.length > 0 ? `Wellness check-in · ${parts.join(", ")}` : "Wellness check-in";

  return checkin.loggedForDate ? `Logged: ${label} (${checkin.loggedForDate})` : `Logged: ${label}`;
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
                        ? "mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72"
                        : "mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]"
                    }
                  >
                    {speakerLabel}
                  </p>
                  <p className="leading-7">{message.content}</p>
                  {onRemoveLoggedEntry ? (
                    <>
                      <LoggedEntryCard
                        entries={loggedActivities}
                        formatLabel={formatActivityLabel}
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "activity", entryId)}
                      />
                      <LoggedEntryCard
                        entries={loggedDietEntries}
                        formatLabel={formatDietLabel}
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "diet", entryId)}
                      />
                      <LoggedEntryCard
                        entries={loggedWellnessCheckin}
                        formatLabel={formatWellnessLabel}
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "wellness", entryId)}
                      />
                    </>
                  ) : null}
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
