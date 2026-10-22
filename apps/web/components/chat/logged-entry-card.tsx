"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { PILLAR_BY_ENTRY_KIND, PILLAR_STYLES } from "@/components/frankie/pillars";
import { EditLoggedEntryModal, type EditableEntry } from "@/components/chat/edit-logged-entry-modal";
import { formatLoggedDate, type LoggedEntryKind } from "@/components/chat/logged-entry-format";

export type LoggedEntry = {
  id: string | null;
  loggedForDate: string | null;
};

type LoggedEntryCardProps<T extends EditableEntry> = {
  entries: T[];
  kicker: string;
  kind: LoggedEntryKind;
  formatTitle: (entry: T) => string;
  formatDetail: (entry: T) => string | null;
  onRemove: (entryId: string) => Promise<void>;
  onEdit?: (updatedEntry: T) => void;
};

export function LoggedEntryCard<T extends EditableEntry>({
  entries,
  kicker,
  kind,
  formatTitle,
  formatDetail,
  onRemove,
  onEdit
}: LoggedEntryCardProps<T>) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<T | null>(null);
  const removable = entries.filter((entry) => entry.id);
  const pillar = PILLAR_STYLES[PILLAR_BY_ENTRY_KIND[kind]];
  const PillarIcon = pillar.icon;

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
            className={`ff-card-soft ff-pop border-l-[3px] p-3.5 ${pillar.edge}`}
            key={entry.id}
          >
            <div className="flex items-center justify-between gap-3">
              <p className={`ff-kicker flex items-center gap-1.5 ${pillar.text}`}>
                <PillarIcon aria-hidden className="h-3.5 w-3.5" />
                {kicker}
              </p>
              <div className="flex items-center gap-2 text-[0.72rem] text-[var(--muted)]">
                {entry.loggedForDate ? <span>{formatLoggedDate(entry.loggedForDate)}</span> : null}
                {onEdit ? (
                  <button
                    aria-label="Edit"
                    className="cursor-pointer text-[var(--muted)] transition hover:text-[var(--foreground)]"
                    onClick={() => setEditingEntry(entry)}
                    title="Edit"
                    type="button"
                  >
                    <Pencil aria-hidden className="h-3.5 w-3.5" />
                  </button>
                ) : null}
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
                  <Trash2 aria-hidden className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-sm font-medium leading-6">{formatTitle(entry)}</p>
            {detail ? <p className="text-xs leading-5 text-[var(--muted)]">{detail}</p> : null}
          </div>
        );
      })}
      {editingEntry ? (
        <EditLoggedEntryModal
          entry={editingEntry}
          kind={kind}
          onClose={() => setEditingEntry(null)}
          onSaved={(updatedEntry) => {
            setEditingEntry(null);
            onEdit?.(updatedEntry);
          }}
        />
      ) : null}
    </div>
  );
}
