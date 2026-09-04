"use client";

import { useState } from "react";
import { formatLoggedDate } from "@/components/chat/logged-entry-format";

export type LoggedEntry = {
  id: string | null;
  loggedForDate: string | null;
};

type LoggedEntryCardProps<T extends LoggedEntry> = {
  entries: T[];
  kicker: string;
  formatTitle: (entry: T) => string;
  formatDetail: (entry: T) => string | null;
  onRemove: (entryId: string) => Promise<void>;
};

export function LoggedEntryCard<T extends LoggedEntry>({
  entries,
  kicker,
  formatTitle,
  formatDetail,
  onRemove
}: LoggedEntryCardProps<T>) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removable = entries.filter((entry) => entry.id);

  if (removable.length === 0) {
    return null;
  }

  async function handleRemove(entryId: string) {
    setRemovingId(entryId);

    try {
      await onRemove(entryId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mt-2 space-y-1.5">
      {removable.map((entry) => {
        const detail = formatDetail(entry);

        return (
          <div
            className="ff-card-soft border-l-2 border-l-[var(--border-strong)] p-3.5"
            key={entry.id}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="ff-kicker">{kicker}</p>
              <div className="flex items-center gap-2 text-[0.72rem] text-[var(--muted)]">
                {entry.loggedForDate ? <span>{formatLoggedDate(entry.loggedForDate)}</span> : null}
                <button
                  aria-label={removingId === entry.id ? "Removing" : "Remove"}
                  className={`cursor-pointer text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed ${
                    removingId === entry.id ? "animate-pulse opacity-60" : ""
                  }`}
                  disabled={removingId === entry.id}
                  onClick={() => handleRemove(entry.id as string)}
                  title="Remove"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-sm font-medium leading-6">{formatTitle(entry)}</p>
            {detail ? <p className="text-xs leading-5 text-[var(--muted)]">{detail}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
