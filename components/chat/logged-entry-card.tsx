"use client";

import { useState } from "react";

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
    <div className="mt-3 space-y-2">
      {removable.map((entry) => {
        const detail = formatDetail(entry);

        return (
          <div
            className="ff-card-soft border-l-2 border-l-[var(--border-strong)] p-3"
            key={entry.id}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="ff-kicker">{kicker}</p>
              <div className="flex items-center gap-2 text-[0.72rem] text-[var(--muted)]">
                {entry.loggedForDate ? <span>{entry.loggedForDate}</span> : null}
                <button
                  className="cursor-pointer underline decoration-dotted underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={removingId === entry.id}
                  onClick={() => handleRemove(entry.id as string)}
                  type="button"
                >
                  {removingId === entry.id ? "Removing..." : "Remove"}
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
