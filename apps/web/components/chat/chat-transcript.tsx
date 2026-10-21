"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { moodForMessage, type FrankieMood } from "@frankie-fit/brand-core";
import { LoggedEntryCard } from "@/components/chat/logged-entry-card";
import { FrankieAvatar } from "@/components/frankie/frankie-avatar";
import { FrankieThinking } from "@/components/frankie/frankie-thinking";
import { BiscuitAwardChip } from "@/components/frankie-day/biscuit-award-chip";
import type { BiscuitAward } from "@/lib/frankie-day";
import {
  formatActivityDetail,
  formatActivityTitle,
  formatDietDetail,
  formatDietTitle,
  formatLifestyleDetail,
  formatLifestyleTitle,
  formatWellnessDetail,
  formatWellnessTitle,
  type LoggedActivity,
  type LoggedDietEntry,
  type LoggedLifestyleEntry,
  type LoggedWellnessCheckin
} from "@/components/chat/logged-entry-format";
import { WorkoutDraftModal, type SavedWorkoutSummary } from "@/components/chat/workout-draft-modal";
import type { WorkoutDraftPayload } from "@/lib/ai/orchestrator/frankie-orchestrator";
import type { LoggedEntryKind } from "@/components/chat/logged-entry-format";

export type { LoggedEntryKind } from "@/components/chat/logged-entry-format";

type ChatTranscriptMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type?: string;
  structured_payload?: unknown;
};

type ChatTranscriptProps = {
  assistantCardClass: string;
  biscuitAwards?: Record<string, BiscuitAward>;
  assistantName?: string;
  showFrankie?: boolean;
  introMessage: string;
  followupMessage: string;
  isThinking?: boolean;
  messages: ChatTranscriptMessage[];
  onRemoveLoggedEntry?: (
    messageId: string,
    kind: LoggedEntryKind,
    entryId: string
  ) => Promise<void>;
  onEditLoggedEntry?: (
    messageId: string,
    kind: LoggedEntryKind,
    updatedEntry: LoggedActivity | LoggedDietEntry | LoggedLifestyleEntry | LoggedWellnessCheckin
  ) => void;
  onWorkoutDraftSaved?: (messageId: string, savedWorkout: SavedWorkoutSummary) => void;
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
    lifestyleLogged?: LoggedLifestyleEntry[];
    wellnessLogged?: LoggedWellnessCheckin | null;
  } | null;
}

function getWorkoutDraftPayload(message: ChatTranscriptMessage) {
  if (message.message_type !== "workout_draft") {
    return null;
  }

  return (
    (message.structured_payload as { workoutDraft?: WorkoutDraftPayload & { savedWorkout?: SavedWorkoutSummary } } | null)
      ?.workoutDraft ?? null
  );
}

function formatSetSummary(set: SavedWorkoutSummary["exercises"][number]["sets"][number]) {
  const parts: string[] = [];

  if (set.reps !== null) {
    parts.push(`${set.reps} reps`);
  }

  if (set.weight !== null) {
    parts.push(`${set.weight} lb`);
  }

  if (set.durationSeconds !== null) {
    parts.push(`${set.durationSeconds}s`);
  }

  return parts.join(" @ ") || "logged";
}

function WorkoutDraftCard({
  messageId,
  onSaved,
  workoutDraft
}: {
  messageId: string;
  onSaved?: (messageId: string, savedWorkout: SavedWorkoutSummary) => void;
  workoutDraft: WorkoutDraftPayload & { savedWorkout?: SavedWorkoutSummary };
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const exerciseSummary = workoutDraft.exercises.map((exercise) => exercise.exerciseName).join(", ");

  if (workoutDraft.savedWorkout) {
    return (
      <div className="ff-card-soft mt-3 space-y-2 p-4">
        <p className="ff-kicker">Workout logged</p>
        {workoutDraft.savedWorkout.exercises.map((exercise, index) => (
          <div key={`${exercise.exerciseName}-${index}`}>
            <p className="text-sm font-medium">{exercise.exerciseName}</p>
            <p className="text-sm text-[var(--muted)]">
              {exercise.sets.map((set) => formatSetSummary(set)).join(", ")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ff-card-soft mt-3 space-y-2 p-4">
      <p className="ff-kicker">Workout draft</p>
      <p className="text-sm leading-6">
        I drafted {exerciseSummary || "a workout"} from what you described — review the sets, reps,
        and weight before I save it.
      </p>
      <button
        className="ff-button-secondary cursor-pointer px-3 py-1.5 text-xs"
        onClick={() => setModalOpen(true)}
        type="button"
      >
        Review &amp; save workout
      </button>
      {modalOpen ? (
        <WorkoutDraftModal
          draft={workoutDraft}
          messageId={messageId}
          onClose={() => setModalOpen(false)}
          onSaved={(savedWorkout) => {
            setModalOpen(false);
            onSaved?.(messageId, savedWorkout);
          }}
        />
      ) : null}
    </div>
  );
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

// Frankie's art only shows for the default coach; personas get a plain initial badge.
function AssistantRow({
  assistantName,
  children,
  mood,
  showFrankie
}: {
  assistantName: string;
  children: ReactNode;
  mood: FrankieMood;
  showFrankie: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {showFrankie ? (
        <FrankieAvatar className="mt-0.5" mood={mood} size={38} />
      ) : (
        <span className="mt-0.5 flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-surface-contrast text-sm font-semibold text-muted-strong">
          {assistantName.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ChatTranscript({
  assistantCardClass,
  assistantName = "Frankie",
  biscuitAwards = {},
  showFrankie = true,
  introMessage,
  followupMessage,
  isThinking = false,
  messages,
  onRemoveLoggedEntry,
  onEditLoggedEntry,
  onWorkoutDraftSaved,
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
                  : assistantName;
              const payload = getStructuredPayload(message);
              const loggedActivities = payload?.activitiesLogged ?? [];
              const loggedDietEntries = payload?.dietLogged ?? [];
              const loggedLifestyleEntries = payload?.lifestyleLogged ?? [];
              const loggedWellnessCheckin = payload?.wellnessLogged
                ? [payload.wellnessLogged]
                : [];
              const workoutDraft = getWorkoutDraftPayload(message);

              const card = (
                <article className={isUser ? userCardClass : assistantCardClass} key={isUser ? message.id : undefined}>
                  <p
                    className={
                      isUser
                        ? "mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent-foreground/75"
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
                        kind="activity"
                        onEdit={
                          onEditLoggedEntry
                            ? (entry) => onEditLoggedEntry(message.id, "activity", entry)
                            : undefined
                        }
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "activity", entryId)}
                      />
                      <LoggedEntryCard
                        entries={loggedDietEntries}
                        formatDetail={formatDietDetail}
                        formatTitle={formatDietTitle}
                        kicker="Meal"
                        kind="diet"
                        onEdit={
                          onEditLoggedEntry
                            ? (entry) => onEditLoggedEntry(message.id, "diet", entry)
                            : undefined
                        }
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "diet", entryId)}
                      />
                      <LoggedEntryCard
                        entries={loggedLifestyleEntries}
                        formatDetail={formatLifestyleDetail}
                        formatTitle={formatLifestyleTitle}
                        kicker="Lifestyle"
                        kind="lifestyle"
                        onEdit={
                          onEditLoggedEntry
                            ? (entry) => onEditLoggedEntry(message.id, "lifestyle", entry)
                            : undefined
                        }
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "lifestyle", entryId)}
                      />
                      <LoggedEntryCard
                        entries={loggedWellnessCheckin}
                        formatDetail={formatWellnessDetail}
                        formatTitle={formatWellnessTitle}
                        kicker="Wellness check-in"
                        kind="wellness"
                        onEdit={
                          onEditLoggedEntry
                            ? (entry) => onEditLoggedEntry(message.id, "wellness", entry)
                            : undefined
                        }
                        onRemove={(entryId) => onRemoveLoggedEntry(message.id, "wellness", entryId)}
                      />
                    </>
                  ) : null}
                  {workoutDraft ? (
                    <WorkoutDraftCard messageId={message.id} onSaved={onWorkoutDraftSaved} workoutDraft={workoutDraft} />
                  ) : null}
                  {biscuitAwards[message.id] ? (
                    <BiscuitAwardChip
                      award={biscuitAwards[message.id]}
                      isLatest={message.id === messages.at(-1)?.id}
                    />
                  ) : null}
                </article>
              );

              return isUser ? (
                card
              ) : (
                <AssistantRow
                  assistantName={assistantName}
                  key={message.id}
                  mood={moodForMessage(message)}
                  showFrankie={showFrankie}
                >
                  {card}
                </AssistantRow>
              );
            })}

            {pendingMessage ? (
              <article className={userCardClass}>
                <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent-foreground/75">
                  You
                </p>
                <p className="leading-6">{pendingMessage}</p>
                <AnimatedStatusText
                  className="pt-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-accent-foreground/70"
                  label="Sending"
                />
              </article>
            ) : null}

            {isThinking ? (
              showFrankie ? (
                <FrankieThinking className="py-1" />
              ) : (
                <AssistantRow assistantName={assistantName} mood="focused" showFrankie={false}>
                  <article className={assistantCardClass}>
                    <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      {assistantName}
                    </p>
                    <AnimatedStatusText className="leading-6 text-[var(--foreground)]" label="Thinking" />
                  </article>
                </AssistantRow>
              )
            ) : null}
          </>
        ) : (
          <>
            {[introMessage, followupMessage].map((text, index) => (
              <AssistantRow assistantName={assistantName} key={index} mood="happy" showFrankie={showFrankie}>
                <article className={assistantCardClass}>
                  <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    {assistantName}
                  </p>
                  <p className="leading-6">{text}</p>
                </article>
              </AssistantRow>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
