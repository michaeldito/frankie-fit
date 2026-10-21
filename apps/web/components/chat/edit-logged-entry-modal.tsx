"use client";

import { useState } from "react";
import {
  capitalize,
  loggedEntryRoutes,
  type LoggedActivity,
  type LoggedDietEntry,
  type LoggedEntryKind,
  type LoggedLifestyleEntry,
  type LoggedWellnessCheckin
} from "@/components/chat/logged-entry-format";
import {
  intensityOptions,
  lifestyleCategoryOptions,
  mealTypeOptions
} from "@/lib/ai/schemas/log-field-options";

export type EditableEntry = LoggedActivity | LoggedDietEntry | LoggedLifestyleEntry | LoggedWellnessCheckin;

const intensityChoices = intensityOptions.filter((option) => option !== "unknown");
const mealTypeChoices = mealTypeOptions.filter((option) => option !== "unknown");
const lifestyleCategoryChoices = lifestyleCategoryOptions.filter((option) => option !== "unknown");

type SaveState = "idle" | "saving" | "failed";

function toNullableInt(value: string, min: number, max: number) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : null;
}

export function EditLoggedEntryModal<T extends EditableEntry>({
  entry,
  kind,
  onClose,
  onSaved
}: {
  entry: T;
  kind: LoggedEntryKind;
  onClose: () => void;
  onSaved: (updatedEntry: T) => void;
}) {
  const [activityType, setActivityType] = useState(
    kind === "activity" ? (entry as LoggedActivity).activityType : ""
  );
  const [description, setDescription] = useState(
    kind === "activity"
      ? (entry as LoggedActivity).description
      : kind === "diet"
        ? (entry as LoggedDietEntry).description
        : kind === "lifestyle"
          ? (entry as LoggedLifestyleEntry).description
          : ""
  );
  const [durationMinutes, setDurationMinutes] = useState(
    kind === "activity" ? ((entry as LoggedActivity).durationMinutes?.toString() ?? "") : ""
  );
  const [intensity, setIntensity] = useState(
    kind === "activity" ? ((entry as LoggedActivity).intensity ?? "") : ""
  );
  const [mealType, setMealType] = useState(
    kind === "diet" ? ((entry as LoggedDietEntry).mealType ?? "") : ""
  );
  const [category, setCategory] = useState(
    kind === "lifestyle" ? ((entry as LoggedLifestyleEntry).category ?? "") : ""
  );
  const [energyScore, setEnergyScore] = useState(
    kind === "wellness" ? ((entry as LoggedWellnessCheckin).energyScore?.toString() ?? "") : ""
  );
  const [moodScore, setMoodScore] = useState(
    kind === "wellness" ? ((entry as LoggedWellnessCheckin).moodScore?.toString() ?? "") : ""
  );
  const [motivationScore, setMotivationScore] = useState(
    kind === "wellness" ? ((entry as LoggedWellnessCheckin).motivationScore?.toString() ?? "") : ""
  );
  const [sorenessScore, setSorenessScore] = useState(
    kind === "wellness" ? ((entry as LoggedWellnessCheckin).sorenessScore?.toString() ?? "") : ""
  );
  const [stressScore, setStressScore] = useState(
    kind === "wellness" ? ((entry as LoggedWellnessCheckin).stressScore?.toString() ?? "") : ""
  );
  const [notes, setNotes] = useState(
    kind === "wellness" ? ((entry as LoggedWellnessCheckin).notes ?? "") : ""
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaveState("saving");
    setError(null);

    const body =
      kind === "activity"
        ? {
            activityType,
            description,
            durationMinutes: toNullableInt(durationMinutes, 0, 1440),
            intensity: intensity || null
          }
        : kind === "diet"
          ? { description, mealType: mealType || null }
          : kind === "lifestyle"
            ? { description, category: category || null }
            : {
                energyScore: toNullableInt(energyScore, 0, 5),
                moodScore: toNullableInt(moodScore, 0, 5),
                motivationScore: toNullableInt(motivationScore, 0, 5),
                sorenessScore: toNullableInt(sorenessScore, 0, 5),
                stressScore: toNullableInt(stressScore, 0, 5),
                notes: notes.trim() || null
              };

    try {
      const response = await fetch(`${loggedEntryRoutes[kind]}/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save that log.");
      }

      onSaved(data as T);
    } catch (saveError) {
      setSaveState("failed");
      setError(saveError instanceof Error ? saveError.message : "Could not save that log.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="ff-panel-strong w-full max-w-md space-y-4 p-6 sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="ff-kicker">Edit log</p>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">
              {kind === "wellness" ? "Wellness check-in" : capitalize(kind)}
            </h2>
          </div>
          <button
            aria-label="Close"
            className="ff-button-secondary h-10 w-10 cursor-pointer p-0 text-base"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="space-y-3">
          {kind === "activity" ? (
            <>
              <label className="block space-y-1.5 text-sm">
                <span className="text-[var(--muted)]">Activity</span>
                <input
                  className="ff-input"
                  onChange={(event) => setActivityType(event.target.value)}
                  type="text"
                  value={activityType}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="text-[var(--muted)]">Description</span>
                <input
                  className="ff-input"
                  onChange={(event) => setDescription(event.target.value)}
                  type="text"
                  value={description}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm">
                  <span className="text-[var(--muted)]">Duration (minutes)</span>
                  <input
                    className="ff-input"
                    inputMode="numeric"
                    onChange={(event) => setDurationMinutes(event.target.value)}
                    type="text"
                    value={durationMinutes}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="text-[var(--muted)]">Intensity</span>
                  <select
                    className="ff-select"
                    onChange={(event) => setIntensity(event.target.value)}
                    value={intensity}
                  >
                    <option value="">Not set</option>
                    {intensityChoices.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          ) : null}

          {kind === "diet" ? (
            <>
              <label className="block space-y-1.5 text-sm">
                <span className="text-[var(--muted)]">Description</span>
                <input
                  className="ff-input"
                  onChange={(event) => setDescription(event.target.value)}
                  type="text"
                  value={description}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="text-[var(--muted)]">Meal type</span>
                <select
                  className="ff-select"
                  onChange={(event) => setMealType(event.target.value)}
                  value={mealType}
                >
                  <option value="">Not set</option>
                  {mealTypeChoices.map((option) => (
                    <option key={option} value={option}>
                      {capitalize(option)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {kind === "lifestyle" ? (
            <>
              <label className="block space-y-1.5 text-sm">
                <span className="text-[var(--muted)]">Description</span>
                <input
                  className="ff-input"
                  onChange={(event) => setDescription(event.target.value)}
                  type="text"
                  value={description}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="text-[var(--muted)]">Category</span>
                <select
                  className="ff-select"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  <option value="">Not set</option>
                  {lifestyleCategoryChoices.map((option) => (
                    <option key={option} value={option}>
                      {capitalize(option.replace(/_/g, " "))}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {kind === "wellness" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm">
                  <span className="text-[var(--muted)]">Energy (0-5)</span>
                  <input
                    className="ff-input"
                    inputMode="numeric"
                    onChange={(event) => setEnergyScore(event.target.value)}
                    type="text"
                    value={energyScore}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="text-[var(--muted)]">Mood (0-5)</span>
                  <input
                    className="ff-input"
                    inputMode="numeric"
                    onChange={(event) => setMoodScore(event.target.value)}
                    type="text"
                    value={moodScore}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="text-[var(--muted)]">Motivation (0-5)</span>
                  <input
                    className="ff-input"
                    inputMode="numeric"
                    onChange={(event) => setMotivationScore(event.target.value)}
                    type="text"
                    value={motivationScore}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="text-[var(--muted)]">Soreness (0-5)</span>
                  <input
                    className="ff-input"
                    inputMode="numeric"
                    onChange={(event) => setSorenessScore(event.target.value)}
                    type="text"
                    value={sorenessScore}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="text-[var(--muted)]">Stress (0-5)</span>
                  <input
                    className="ff-input"
                    inputMode="numeric"
                    onChange={(event) => setStressScore(event.target.value)}
                    type="text"
                    value={stressScore}
                  />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm">
                <span className="text-[var(--muted)]">Notes</span>
                <textarea
                  className="ff-textarea"
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>
            </>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            className="ff-button-primary cursor-pointer px-4 py-2.5 text-sm disabled:cursor-not-allowed"
            disabled={saveState === "saving"}
            onClick={handleSave}
            type="button"
          >
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
          <button
            className="ff-button-secondary cursor-pointer px-4 py-2.5 text-sm"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
