"use client";

export type EditableSet = {
  reps: string;
  weight: string;
  durationSeconds: string;
};

type SetRowsProps = {
  addLabel?: string;
  onAdd: () => void;
  onChange: (index: number, patch: Partial<EditableSet>) => void;
  onRemove: (index: number) => void;
  roundLabels?: boolean;
  sets: EditableSet[];
};

export function SetRows({
  addLabel = "+ Add set",
  onAdd,
  onChange,
  onRemove,
  roundLabels = false,
  sets
}: SetRowsProps) {
  return (
    <div className="space-y-2">
      {sets.map((set, index) => (
        <div className="flex flex-wrap items-center gap-2" key={index}>
          <span className="w-16 shrink-0 text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
            {roundLabels ? `Round ${index + 1}` : `Set ${index + 1}`}
          </span>
          <input
            className="ff-input w-20"
            inputMode="numeric"
            onChange={(event) => onChange(index, { reps: event.target.value })}
            placeholder="Reps"
            type="text"
            value={set.reps}
          />
          <input
            className="ff-input w-24"
            inputMode="decimal"
            onChange={(event) => onChange(index, { weight: event.target.value })}
            placeholder="Weight"
            type="text"
            value={set.weight}
          />
          <input
            className="ff-input w-24"
            onChange={(event) => onChange(index, { durationSeconds: event.target.value })}
            placeholder="mm:ss"
            type="text"
            value={set.durationSeconds}
          />
          <button
            aria-label="Remove"
            className="ff-button-secondary h-9 w-9 cursor-pointer p-0 text-sm"
            onClick={() => onRemove(index)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
      <button className="ff-button-secondary cursor-pointer px-3 py-2 text-sm" onClick={onAdd} type="button">
        {addLabel}
      </button>
    </div>
  );
}
