"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CoachSummaryWithUser } from "@/lib/admin-evals-data";

type CoachingMemoryGridProps = {
  summaries: CoachSummaryWithUser[];
};

const PREVIEW_LENGTH = 140;

function formatPeriod(summary: CoachSummaryWithUser) {
  return summary.period_end !== summary.period_start
    ? `${summary.period_start} to ${summary.period_end}`
    : summary.period_start;
}

export function buildPreview(summaryText: string) {
  const singleLine = summaryText.replace(/\s+/g, " ").trim();

  if (singleLine.length <= PREVIEW_LENGTH) {
    return singleLine;
  }

  return `${singleLine.slice(0, PREVIEW_LENGTH).trimEnd()}…`;
}

function MemoryCard({ summary }: { summary: CoachSummaryWithUser }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="ff-card-soft overflow-hidden p-0">
      <button
        aria-expanded={isExpanded}
        className="flex w-full flex-col items-start gap-1 p-4 text-left"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        type="button"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <p className="font-medium">
            {summary.userName ?? "Unknown user"} &middot; {summary.summary_type}
          </p>
          <svg
            className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            height="14"
            viewBox="0 0 16 16"
            width="14"
          >
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        </div>
        <p className="text-xs italic text-[var(--muted)]">{formatPeriod(summary)}</p>
        {!isExpanded ? (
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {buildPreview(summary.summary_text)}
          </p>
        ) : null}
      </button>

      {isExpanded ? (
        <div className="ff-markdown border-t border-[var(--border)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
          <ReactMarkdown>{summary.summary_text}</ReactMarkdown>
        </div>
      ) : null}
    </article>
  );
}

export function CoachingMemoryGrid({ summaries }: CoachingMemoryGridProps) {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const users = useMemo(() => {
    const names = new Set(summaries.map((summary) => summary.userName ?? "Unknown user"));
    return Array.from(names).sort((left, right) => left.localeCompare(right));
  }, [summaries]);
  const visibleSummaries =
    selectedUser === "all"
      ? summaries
      : summaries.filter((summary) => (summary.userName ?? "Unknown user") === selectedUser);
  const columns = useMemo(() => {
    const byUser = new Map<string, CoachSummaryWithUser[]>();

    visibleSummaries.forEach((summary) => {
      const userName = summary.userName ?? "Unknown user";
      const existing = byUser.get(userName);

      if (existing) {
        existing.push(summary);
      } else {
        byUser.set(userName, [summary]);
      }
    });

    return users
      .filter((userName) => byUser.has(userName))
      .map((userName) => ({ userName, summaries: byUser.get(userName)! }));
  }, [users, visibleSummaries]);

  if (summaries.length === 0) {
    return (
      <p className="leading-7 text-[var(--muted)]">
        Daily and weekly summaries will appear here after a summary action runs. They reflect a
        scenario user&apos;s full logged history and aren&apos;t scoped to a single run.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selectedUser === "all"
                ? "border-[rgba(147,197,253,0.55)] bg-[rgba(147,197,253,0.14)] text-[var(--accent,#93c5fd)]"
                : "border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--muted-strong)] hover:border-[rgba(147,197,253,0.4)]"
            }`}
            onClick={() => setSelectedUser("all")}
            type="button"
          >
            All users
          </button>
          {users.map((user) => (
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selectedUser === user
                  ? "border-[rgba(147,197,253,0.55)] bg-[rgba(147,197,253,0.14)] text-[var(--accent,#93c5fd)]"
                  : "border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--muted-strong)] hover:border-[rgba(147,197,253,0.4)]"
              }`}
              key={user}
              onClick={() => setSelectedUser(user)}
              type="button"
            >
              {user}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 items-start gap-4">
        {columns.map((column) => (
          <div className="space-y-4" key={column.userName}>
            <p className="ff-kicker">{column.userName}</p>
            {column.summaries.map((summary) => (
              <MemoryCard key={summary.id} summary={summary} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
