"use client";

import { useState } from "react";

export type LoggedEntry = {
  id: string | null;
};

type LoggedEntryCardProps<T extends LoggedEntry> = {
  entries: T[];
  formatLabel: (entry: T) => string;
  onRemove: (entryId: string) => Promise<void>;
};

export function LoggedEntryCard<T extends LoggedEntry>({
  entries,
  formatLabel,
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
      {removable.map((entry) => (
        <div
          className="ff-pill flex items-center justify-between gap-3 text-[0.78rem]"
          key={entry.id}
        >
          <span>{formatLabel(entry)}</span>
          <button
            className="shrink-0 cursor-pointer text-[var(--muted)] underline decoration-dotted underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={removingId === entry.id}
            onClick={() => handleRemove(entry.id as string)}
            type="button"
          >
            {removingId === entry.id ? "Removing..." : "Remove"}
          </button>
        </div>
      ))}
    </div>
  );
}
