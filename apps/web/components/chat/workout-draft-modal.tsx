"use client";

import { useState } from "react";
import { findExercises, slugifyExerciseName, type WorkoutSessionInput } from "@frankie-fit/workout-core";
import { SetRows, type EditableSet } from "@/components/workouts/set-rows";
import { buildExercisesInput } from "@/components/workouts/workout-input-helpers";
import type { WorkoutDraftPayload } from "@/lib/ai/orchestrator/frankie-orchestrator";

export type SavedWorkoutSummary = {
  loggedForDate: string;
  exercises: Array<{
    exerciseName: string;
    sets: Array<{ reps: number | null; weight: number | null; durationSeconds: number | null }>;
  }>;
};

type DraftExerciseState = {
  slug: string;
  name: string;
  sets: EditableSet[];
};

type SaveState = "idle" | "saving" | "failed";

function toEditableSets(sets: WorkoutDraftPayload["exercises"][number]["sets"]): EditableSet[] {
  if (sets.length === 0) {
    return [{ reps: "", weight: "", durationSeconds: "" }];
  }

  return sets.map((set) => ({
    reps: set.reps?.toString() ?? "",
    weight: set.weight?.toString() ?? "",
    durationSeconds: set.durationSeconds?.toString() ?? ""
  }));
}

function buildInitialExercises(draft: WorkoutDraftPayload): DraftExerciseState[] {
  return draft.exercises.map((exercise) => {
    const match = findExercises(exercise.exerciseName)[0];

    return {
      slug: match?.slug ?? slugifyExerciseName(exercise.exerciseName),
      name: match?.name ?? exercise.exerciseName,
      sets: toEditableSets(exercise.sets)
    };
  });
}

export function WorkoutDraftModal({
  draft,
  messageId,
  onClose,
  onSaved
}: {
  draft: WorkoutDraftPayload;
  messageId: string;
  onClose: () => void;
  onSaved: (savedWorkout: SavedWorkoutSummary) => void;
}) {
  const [exercises, setExercises] = useState<DraftExerciseState[]>(() => buildInitialExercises(draft));
  const [loggedForDate, setLoggedForDate] = useState(draft.loggedForDate);
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSetChange(exerciseIndex: number, setIndex: number, patch: Partial<EditableSet>) {
    setExercises((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, sIndex) => (sIndex === setIndex ? { ...set, ...patch } : set))
            }
          : exercise
      )
    );
  }

  function handleAddSet(exerciseIndex: number) {
    setExercises((current) =>
      current.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise;
        }

        const lastSet = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [...exercise.sets, lastSet ? { ...lastSet } : { reps: "", weight: "", durationSeconds: "" }]
        };
      })
    );
  }

  function handleRemoveSet(exerciseIndex: number, setIndex: number) {
    setExercises((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, sets: exercise.sets.filter((_, sIndex) => sIndex !== setIndex) }
          : exercise
      )
    );
  }

  function handleRemoveExercise(exerciseIndex: number) {
    setExercises((current) => current.filter((_, index) => index !== exerciseIndex));
  }

  async function handleSave() {
    setSaveState("saving");
    setError(null);

    const builtExercises = buildExercisesInput(
      exercises.map((exercise) => ({ slug: exercise.slug, name: exercise.name, rows: exercise.sets }))
    );

    if (builtExercises.length === 0) {
      setSaveState("failed");
      setError("Add at least one set before saving.");
      return;
    }

    const payload: WorkoutSessionInput = {
      sessionType: "simple",
      title: draft.title,
      notes: notes.trim() || null,
      wodTemplateSlug: null,
      roundsCount: null,
      forTime: false,
      totalTimeSeconds: null,
      loggedForDate,
      weightUnit: "lb",
      exercises: builtExercises,
      programSlug: null,
      programDay: null
    };

    try {
      const saveResponse = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const saveData = (await saveResponse.json().catch(() => ({}))) as { error?: string };

      if (!saveResponse.ok) {
        throw new Error(saveData.error ?? "Could not save the workout session.");
      }

      const savedWorkout: SavedWorkoutSummary = {
        loggedForDate,
        exercises: builtExercises.map((exercise) => ({
          exerciseName: exercise.exerciseName,
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            durationSeconds: set.durationSeconds
          }))
        }))
      };

      const draftResponse = await fetch(`/api/workouts/drafts/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedWorkout })
      });

      if (!draftResponse.ok) {
        const draftData = (await draftResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(draftData.error ?? "Saved the workout, but could not update the chat card.");
      }

      onSaved(savedWorkout);
    } catch (saveError) {
      setSaveState("failed");
      setError(saveError instanceof Error ? saveError.message : "Could not save the workout session.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="ff-panel-strong max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto p-6 sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="ff-kicker">Workout draft</p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">Review before saving</h2>
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

        <div className="space-y-4">
          {exercises.map((exercise, exerciseIndex) => (
            <div className="ff-card-soft space-y-3 p-4" key={`${exercise.slug}-${exerciseIndex}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{exercise.name}</p>
                <button
                  className="ff-button-secondary cursor-pointer px-3 py-1.5 text-xs"
                  onClick={() => handleRemoveExercise(exerciseIndex)}
                  type="button"
                >
                  Remove exercise
                </button>
              </div>
              <SetRows
                onAdd={() => handleAddSet(exerciseIndex)}
                onChange={(setIndex, patch) => handleSetChange(exerciseIndex, setIndex, patch)}
                onRemove={(setIndex) => handleRemoveSet(exerciseIndex, setIndex)}
                sets={exercise.sets}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="text-[var(--muted)]">Date</span>
            <input
              className="ff-input"
              onChange={(event) => setLoggedForDate(event.target.value)}
              type="date"
              value={loggedForDate}
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-[var(--muted)]">Notes (optional)</span>
            <textarea className="ff-textarea" onChange={(event) => setNotes(event.target.value)} value={notes} />
          </label>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            className="ff-button-primary cursor-pointer px-4 py-2.5 text-sm disabled:cursor-not-allowed"
            disabled={saveState === "saving" || exercises.length === 0}
            onClick={handleSave}
            type="button"
          >
            {saveState === "saving" ? "Saving…" : "Save workout"}
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
