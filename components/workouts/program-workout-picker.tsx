"use client";

import type { ProgramWorkoutTemplate } from "../../packages/workout-core";

type ProgramWorkoutPickerProps = {
  onSelect: (template: ProgramWorkoutTemplate) => void;
  templates: ProgramWorkoutTemplate[];
};

export function ProgramWorkoutPicker({ onSelect, templates }: ProgramWorkoutPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((template) => (
        <button
          className="ff-card-soft cursor-pointer p-4 text-left transition hover:bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]"
          key={template.slug}
          onClick={() => onSelect(template)}
          type="button"
        >
          <p className="font-medium">{template.name}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{template.description}</p>
        </button>
      ))}
    </div>
  );
}
