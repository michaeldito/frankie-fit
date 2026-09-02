"use client";

import { useMemo, useState } from "react";
import type { CoachSummaryWithUser } from "@/lib/admin-evals-data";

type CoachingMemoryGridProps = {
  summaries: CoachSummaryWithUser[];
};

function formatPeriod(summary: CoachSummaryWithUser) {
  return summary.period_end !== summary.period_start
    ? `${summary.period_start} to ${summary.period_end}`
    : summary.period_start;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
          Independent of any single replay &mdash; daily and weekly summaries accumulate over time
          for each scenario user.
        </p>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleSummaries.map((summary) => (
          <article className="ff-card-soft p-4" key={summary.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {summary.userName ?? "Unknown user"} &middot; {summary.summary_type}
              </p>
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {summary.prompt_version ?? "no prompt"}
              </span>
            </div>
            <p className="mt-1 text-xs italic text-[var(--muted)]">{formatPeriod(summary)}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{summary.summary_text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
