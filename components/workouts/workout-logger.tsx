"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getPacificDateKey } from "../../packages/dashboard-core";
import {
  exerciseCatalog,
  findProgramWorkout,
  parseTimeInput,
  programWorkoutTemplates,
  wodTemplates,
  type ProgramWorkoutTemplate,
  type WeightUnit,
  type WodTemplate,
  type WodTemplateExercise,
  type WorkoutExerciseInput,
  type WorkoutSessionInput,
  type WorkoutSessionType,
  type WorkoutSetInput
} from "../../packages/workout-core";
import { ExercisePicker, type SelectedExercise } from "./exercise-picker";
import { ProgramWorkoutPicker } from "./program-workout-picker";
import { SetRows, type EditableSet } from "./set-rows";
import { Stopwatch } from "./stopwatch";
import { WodPicker } from "./wod-picker";

type SimpleExerciseState = {
  name: string;
  sets: EditableSet[];
  slug: string;
};

type CircuitSlotState = {
  defaultDuration: string;
  defaultReps: string;
  defaultWeight: string;
  /** True when every round was already known up front (from a template) and there's nothing left to add. */
  fixedRounds: boolean;
  name: string;
  rounds: EditableSet[];
  slug: string;
};

type SaveState = "idle" | "saving" | "saved" | "failed";

const emptySet: EditableSet = { reps: "", weight: "", durationSeconds: "" };

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalDuration(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? parseTimeInput(trimmed) : null;
}

function buildSetInput(set: EditableSet, setNumber: number): WorkoutSetInput | null {
  const reps = parseOptionalInt(set.reps);
  const durationSeconds = parseOptionalDuration(set.durationSeconds);

  if (reps === null && durationSeconds === null) {
    return null;
  }

  return { setNumber, reps, weight: parseOptionalFloat(set.weight), durationSeconds };
}

function buildCircuitSlotsFromExercises(
  exercises: WodTemplateExercise[],
  singleRound: boolean
): CircuitSlotState[] {
  return exercises.map((templateExercise) => {
    const catalogEntry = exerciseCatalog.find((entry) => entry.slug === templateExercise.exerciseSlug);
    const defaultReps = templateExercise.reps != null ? String(templateExercise.reps) : "";
    const defaultWeight = templateExercise.defaultWeightLb != null ? String(templateExercise.defaultWeightLb) : "";
    const defaultDuration =
      templateExercise.durationSeconds != null ? String(templateExercise.durationSeconds) : "";

    let rounds: EditableSet[] = [];

    if (templateExercise.repsPerRound) {
      rounds = templateExercise.repsPerRound.map((reps) => ({
        reps: String(reps),
        weight: defaultWeight,
        durationSeconds: ""
      }));
    } else if (singleRound) {
      rounds = [{ reps: defaultReps, weight: defaultWeight, durationSeconds: defaultDuration }];
    }

    return {
      slug: templateExercise.exerciseSlug,
      name: catalogEntry?.name ?? templateExercise.exerciseSlug,
      defaultReps,
      defaultWeight,
      defaultDuration,
      fixedRounds: rounds.length > 0,
      rounds
    };
  });
}

type DeepLinkContext = {
  workout: ProgramWorkoutTemplate;
  dayContext?: { programSlug: string; day: number };
};

function getDeepLinkContext(searchParams: URLSearchParams): DeepLinkContext | null {
  const workoutSlug = searchParams.get("workout");

  if (!workoutSlug) {
    return null;
  }

  const workout = findProgramWorkout(workoutSlug);

  if (!workout) {
    return null;
  }

  const programSlugParam = searchParams.get("program");
  const dayParam = searchParams.get("day");
  const day = dayParam ? Number.parseInt(dayParam, 10) : NaN;
  const dayContext =
    programSlugParam && Number.isFinite(day) ? { programSlug: programSlugParam, day } : undefined;

  return { workout, dayContext };
}

function buildExercisesInput(
  entries: Array<{ name: string; rows: EditableSet[]; slug: string }>
): WorkoutExerciseInput[] {
  return entries
    .map((entry, position) => {
      const sets = entry.rows
        .map((row, index) => buildSetInput(row, index + 1))
        .filter((set): set is WorkoutSetInput => set !== null);

      return { exerciseSlug: entry.slug, exerciseName: entry.name, position, sets };
    })
    .filter((exercise) => exercise.sets.length > 0);
}

type CircuitSlotEntry = { slot: CircuitSlotState; index: number };

type CircuitRoundGridProps = {
  entries: CircuitSlotEntry[];
  maxRounds: number;
  onRoundChange: (slotIndex: number, roundIndex: number, patch: Partial<EditableSet>) => void;
  onRemoveRound?: (slotIndex: number, roundIndex: number) => void;
};

function CircuitRoundGrid({ entries, maxRounds, onRoundChange, onRemoveRound }: CircuitRoundGridProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: maxRounds }, (_, roundIndex) => {
        const rows = entries.filter(({ slot }) => slot.rounds[roundIndex]);

        if (rows.length === 0) {
          return null;
        }

        return (
          <div className="ff-card-soft space-y-2 p-4" key={`round-${roundIndex}`}>
            <p className="ff-kicker">Round {roundIndex + 1}</p>
            <div className="space-y-2">
              {rows.map(({ slot, index }) => {
                const round = slot.rounds[roundIndex];

                return (
                  <div className="flex flex-wrap items-center gap-2" key={`${slot.slug}-${index}`}>
                    <span className="w-40 shrink-0 text-sm">{slot.name}</span>
                    <input
                      className="ff-input w-20"
                      inputMode="numeric"
                      onChange={(event) => onRoundChange(index, roundIndex, { reps: event.target.value })}
                      placeholder="Reps"
                      type="text"
                      value={round.reps}
                    />
                    <input
                      className="ff-input w-24"
                      inputMode="decimal"
                      onChange={(event) => onRoundChange(index, roundIndex, { weight: event.target.value })}
                      placeholder="Weight"
                      type="text"
                      value={round.weight}
                    />
                    <input
                      className="ff-input w-24"
                      onChange={(event) => onRoundChange(index, roundIndex, { durationSeconds: event.target.value })}
                      placeholder="mm:ss"
                      type="text"
                      value={round.durationSeconds}
                    />
                    {onRemoveRound ? (
                      <button
                        aria-label="Remove"
                        className="ff-button-secondary h-9 w-9 cursor-pointer p-0 text-sm"
                        onClick={() => onRemoveRound(index, roundIndex)}
                        type="button"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WorkoutLogger() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialDeepLink] = useState(() => getDeepLinkContext(searchParams));

  const [mode, setMode] = useState<WorkoutSessionType>(initialDeepLink ? "circuit" : "simple");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [loggedForDate, setLoggedForDate] = useState(() => getPacificDateKey());
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [simpleExercises, setSimpleExercises] = useState<SimpleExerciseState[]>([]);
  const [pendingSimplePicker, setPendingSimplePicker] = useState(true);

  const [circuitSlots, setCircuitSlots] = useState<CircuitSlotState[]>(() =>
    initialDeepLink ? buildCircuitSlotsFromExercises(initialDeepLink.workout.exercises, true) : []
  );
  const [pendingCircuitPicker, setPendingCircuitPicker] = useState(!initialDeepLink);
  const [forTime, setForTime] = useState(false);
  const [timeText, setTimeText] = useState("");
  const [wodTemplateSlug, setWodTemplateSlug] = useState<string | null>(initialDeepLink?.workout.slug ?? null);
  const [title, setTitle] = useState<string | null>(initialDeepLink?.workout.name ?? null);
  const [programSlug, setProgramSlug] = useState<string | null>(initialDeepLink?.dayContext?.programSlug ?? null);
  const [programDay, setProgramDay] = useState<number | null>(initialDeepLink?.dayContext?.day ?? null);

  function handleModeChange(nextMode: WorkoutSessionType) {
    setMode(nextMode);

    if (nextMode === "simple") {
      setWodTemplateSlug(null);
      setTitle(null);
      setForTime(false);
      setTimeText("");
      setProgramSlug(null);
      setProgramDay(null);
    }
  }

  function handleSimpleExerciseSelect(entry: SelectedExercise) {
    setSimpleExercises((current) => [...current, { slug: entry.slug, name: entry.name, sets: [{ ...emptySet }] }]);
    setPendingSimplePicker(false);
  }

  function handleAddSimpleSet(exerciseIndex: number) {
    setSimpleExercises((current) =>
      current.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise;
        }

        const lastSet = exercise.sets[exercise.sets.length - 1];
        return { ...exercise, sets: [...exercise.sets, lastSet ? { ...lastSet } : { ...emptySet }] };
      })
    );
  }

  function handleSimpleSetChange(exerciseIndex: number, setIndex: number, patch: Partial<EditableSet>) {
    setSimpleExercises((current) =>
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

  function handleRemoveSimpleSet(exerciseIndex: number, setIndex: number) {
    setSimpleExercises((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, sets: exercise.sets.filter((_, sIndex) => sIndex !== setIndex) }
          : exercise
      )
    );
  }

  function handleRemoveSimpleExercise(exerciseIndex: number) {
    setSimpleExercises((current) => current.filter((_, index) => index !== exerciseIndex));
  }

  function handleCircuitExerciseSelect(entry: SelectedExercise) {
    setCircuitSlots((current) => [
      ...current,
      {
        slug: entry.slug,
        name: entry.name,
        defaultReps: "",
        defaultWeight: "",
        defaultDuration: "",
        fixedRounds: false,
        rounds: []
      }
    ]);
    setPendingCircuitPicker(false);
  }

  function handleCircuitDefaultChange(
    slotIndex: number,
    patch: Partial<Pick<CircuitSlotState, "defaultReps" | "defaultWeight" | "defaultDuration">>
  ) {
    setCircuitSlots((current) =>
      current.map((slot, index) => (index === slotIndex ? { ...slot, ...patch } : slot))
    );
  }

  function handleRemoveCircuitSlot(slotIndex: number) {
    setCircuitSlots((current) => current.filter((_, index) => index !== slotIndex));
  }

  function handleCompleteRound() {
    setCircuitSlots((current) =>
      current.map((slot) =>
        slot.fixedRounds
          ? slot
          : {
              ...slot,
              rounds: [
                ...slot.rounds,
                { reps: slot.defaultReps, weight: slot.defaultWeight, durationSeconds: slot.defaultDuration }
              ]
            }
      )
    );
  }

  function handleCircuitRoundChange(slotIndex: number, roundIndex: number, patch: Partial<EditableSet>) {
    setCircuitSlots((current) =>
      current.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              rounds: slot.rounds.map((round, rIndex) => (rIndex === roundIndex ? { ...round, ...patch } : round))
            }
          : slot
      )
    );
  }

  function handleRemoveCircuitRound(slotIndex: number, roundIndex: number) {
    setCircuitSlots((current) =>
      current.map((slot, index) =>
        index === slotIndex
          ? { ...slot, rounds: slot.rounds.filter((_, rIndex) => rIndex !== roundIndex) }
          : slot
      )
    );
  }

  function handleTemplateSelect(template: WodTemplate) {
    setMode("circuit");
    setWodTemplateSlug(template.slug);
    setTitle(template.name);
    setForTime(template.forTime);
    setPendingCircuitPicker(false);
    setProgramSlug(null);
    setProgramDay(null);
    setCircuitSlots(buildCircuitSlotsFromExercises(template.exercises, template.roundsCount === 1));
  }

  function handleProgramWorkoutSelect(
    workout: ProgramWorkoutTemplate,
    dayContext?: { programSlug: string; day: number }
  ) {
    setMode("circuit");
    setWodTemplateSlug(workout.slug);
    setTitle(workout.name);
    setForTime(false);
    setTimeText("");
    setPendingCircuitPicker(false);
    setProgramSlug(dayContext?.programSlug ?? null);
    setProgramDay(dayContext?.day ?? null);
    setCircuitSlots(buildCircuitSlotsFromExercises(workout.exercises, true));
  }

  function handleChangeTemplate() {
    setWodTemplateSlug(null);
    setTitle(null);
    setForTime(false);
    setTimeText("");
    setProgramSlug(null);
    setProgramDay(null);
    setCircuitSlots([]);
    setPendingCircuitPicker(true);
  }

  function resetBuilder() {
    setSimpleExercises([]);
    setPendingSimplePicker(true);
    setCircuitSlots([]);
    setPendingCircuitPicker(true);
    setForTime(false);
    setTimeText("");
    setWodTemplateSlug(null);
    setTitle(null);
    setProgramSlug(null);
    setProgramDay(null);
    setNotes("");
  }

  async function handleSave() {
    setSaveState("saving");
    setError(null);

    const exercises =
      mode === "simple"
        ? buildExercisesInput(
            simpleExercises.map((exercise) => ({ slug: exercise.slug, name: exercise.name, rows: exercise.sets }))
          )
        : buildExercisesInput(
            circuitSlots.map((slot) => ({ slug: slot.slug, name: slot.name, rows: slot.rounds }))
          );

    const payload: WorkoutSessionInput = {
      sessionType: mode,
      title,
      notes: notes.trim() || null,
      wodTemplateSlug,
      roundsCount:
        mode === "circuit" && exercises.length > 0
          ? Math.max(...exercises.map((exercise) => exercise.sets.length))
          : null,
      forTime: mode === "circuit" ? forTime : false,
      totalTimeSeconds: parseOptionalDuration(timeText),
      loggedForDate,
      weightUnit,
      exercises,
      programSlug,
      programDay
    };

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save the workout session.");
      }

      setSaveState("saved");
      resetBuilder();
      router.refresh();
    } catch (saveError) {
      setSaveState("failed");
      setError(saveError instanceof Error ? saveError.message : "Could not save the workout session.");
    }
  }

  return (
    <div className="ff-panel space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="ff-card flex gap-2 p-1.5">
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "simple"
                ? "bg-[linear-gradient(180deg,rgba(96,165,250,0.98)_0%,rgba(37,99,235,0.98)_100%)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => handleModeChange("simple")}
            type="button"
          >
            Simple
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "circuit"
                ? "bg-[linear-gradient(180deg,rgba(96,165,250,0.98)_0%,rgba(37,99,235,0.98)_100%)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => handleModeChange("circuit")}
            type="button"
          >
            Circuit
          </button>
        </div>

        <div className="ff-card flex gap-2 p-1.5 text-sm">
          {(["lb", "kg"] as WeightUnit[]).map((unit) => (
            <button
              className={`rounded-full px-3 py-1.5 font-medium transition ${
                weightUnit === unit
                  ? "bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              key={unit}
              onClick={() => setWeightUnit(unit)}
              type="button"
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      {mode === "simple" ? (
        <div className="space-y-4">
          {simpleExercises.map((exercise, exerciseIndex) => (
            <div className="ff-card-soft space-y-3 p-4" key={`${exercise.slug}-${exerciseIndex}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{exercise.name}</p>
                <button
                  className="ff-button-secondary cursor-pointer px-3 py-1.5 text-xs"
                  onClick={() => handleRemoveSimpleExercise(exerciseIndex)}
                  type="button"
                >
                  Remove exercise
                </button>
              </div>
              <SetRows
                onAdd={() => handleAddSimpleSet(exerciseIndex)}
                onChange={(setIndex, patch) => handleSimpleSetChange(exerciseIndex, setIndex, patch)}
                onRemove={(setIndex) => handleRemoveSimpleSet(exerciseIndex, setIndex)}
                sets={exercise.sets}
              />
            </div>
          ))}

          {pendingSimplePicker ? (
            <ExercisePicker onSelect={handleSimpleExerciseSelect} placeholder="Search an exercise…" />
          ) : (
            <button
              className="ff-button-secondary cursor-pointer px-3 py-2 text-sm"
              onClick={() => setPendingSimplePicker(true)}
              type="button"
            >
              + Add another exercise
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {title ? (
            <div className="ff-card-soft flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{title}</p>
                {programDay ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">Logging this toward P90X day {programDay}.</p>
                ) : null}
              </div>
              <button
                className="ff-button-secondary cursor-pointer px-3 py-1.5 text-xs"
                onClick={handleChangeTemplate}
                type="button"
              >
                Change template
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="ff-kicker">CrossFit WODs</p>
                <div className="mt-3">
                  <WodPicker onSelect={handleTemplateSelect} templates={wodTemplates} />
                </div>
              </div>

              <div>
                <p className="ff-kicker">P90X</p>
                <div className="mt-3">
                  <ProgramWorkoutPicker onSelect={(workout) => handleProgramWorkoutSelect(workout)} templates={programWorkoutTemplates} />
                </div>
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input checked={forTime} onChange={(event) => setForTime(event.target.checked)} type="checkbox" />
            For time
          </label>

          {forTime ? <Stopwatch onChange={setTimeText} value={timeText} /> : null}

          {(() => {
            const entries = circuitSlots.map((slot, index) => ({ slot, index }));
            const fixedEntries = entries.filter(({ slot }) => slot.fixedRounds);
            const openEntries = entries.filter(({ slot }) => !slot.fixedRounds);
            const fixedMaxRounds = Math.max(0, ...fixedEntries.map(({ slot }) => slot.rounds.length));
            const openMaxRounds = Math.max(0, ...openEntries.map(({ slot }) => slot.rounds.length));

            return (
              <>
                {fixedEntries.length > 0 ? (
                  <div className="space-y-3">
                    <div className="ff-card-soft flex flex-wrap gap-2 p-3">
                      {fixedEntries.map(({ slot, index }) => (
                        <span
                          className="flex items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)] px-3 py-1.5 text-xs"
                          key={`${slot.slug}-${index}`}
                        >
                          {slot.name}
                          <button
                            aria-label={`Remove ${slot.name}`}
                            className="cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]"
                            onClick={() => handleRemoveCircuitSlot(index)}
                            type="button"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <CircuitRoundGrid
                      entries={fixedEntries}
                      maxRounds={fixedMaxRounds}
                      onRoundChange={handleCircuitRoundChange}
                    />
                  </div>
                ) : null}

                {openEntries.length > 0 ? (
                  <div className="space-y-3">
                    {openEntries.map(({ slot, index }) => (
                      <div className="ff-card-soft flex flex-wrap items-center justify-between gap-2 p-3" key={`${slot.slug}-${index}`}>
                        <p className="font-medium">{slot.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            className="ff-input w-24"
                            inputMode="numeric"
                            onChange={(event) => handleCircuitDefaultChange(index, { defaultReps: event.target.value })}
                            placeholder="Reps / round"
                            type="text"
                            value={slot.defaultReps}
                          />
                          <input
                            className="ff-input w-24"
                            inputMode="decimal"
                            onChange={(event) => handleCircuitDefaultChange(index, { defaultWeight: event.target.value })}
                            placeholder="Weight"
                            type="text"
                            value={slot.defaultWeight}
                          />
                          <input
                            className="ff-input w-24"
                            onChange={(event) => handleCircuitDefaultChange(index, { defaultDuration: event.target.value })}
                            placeholder="mm:ss"
                            type="text"
                            value={slot.defaultDuration}
                          />
                          <button
                            className="ff-button-secondary cursor-pointer px-3 py-1.5 text-xs"
                            onClick={() => handleRemoveCircuitSlot(index)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <CircuitRoundGrid
                      entries={openEntries}
                      maxRounds={openMaxRounds}
                      onRemoveRound={handleRemoveCircuitRound}
                      onRoundChange={handleCircuitRoundChange}
                    />
                  </div>
                ) : null}
              </>
            );
          })()}

          {pendingCircuitPicker ? (
            <ExercisePicker onSelect={handleCircuitExerciseSelect} placeholder="Add an exercise to the circuit…" />
          ) : (
            <button
              className="ff-button-secondary cursor-pointer px-3 py-2 text-sm"
              onClick={() => setPendingCircuitPicker(true)}
              type="button"
            >
              + Add exercise to circuit
            </button>
          )}

          {circuitSlots.some((slot) => !slot.fixedRounds) ? (
            <button
              className="ff-button-primary cursor-pointer px-4 py-2.5 text-sm"
              onClick={handleCompleteRound}
              type="button"
            >
              + Complete round
            </button>
          ) : null}
        </div>
      )}

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
        <label className="space-y-1.5 text-sm sm:col-span-1">
          <span className="text-[var(--muted)]">Notes (optional)</span>
          <textarea className="ff-textarea" onChange={(event) => setNotes(event.target.value)} value={notes} />
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          className="ff-button-primary cursor-pointer px-4 py-2.5 text-sm disabled:cursor-not-allowed"
          disabled={saveState === "saving"}
          onClick={handleSave}
          type="button"
        >
          {saveState === "saving" ? "Saving…" : "Save workout"}
        </button>
        {saveState === "saved" ? <span className="text-sm text-[var(--muted)]">Saved.</span> : null}
      </div>
    </div>
  );
}
