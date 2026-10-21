import { parseTimeInput, type WorkoutExerciseInput, type WorkoutSetInput } from "@frankie-fit/workout-core";
import type { EditableSet } from "./set-rows";

export function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseOptionalDuration(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? parseTimeInput(trimmed) : null;
}

export function buildSetInput(set: EditableSet, setNumber: number): WorkoutSetInput | null {
  const reps = parseOptionalInt(set.reps);
  const durationSeconds = parseOptionalDuration(set.durationSeconds);

  if (reps === null && durationSeconds === null) {
    return null;
  }

  return { setNumber, reps, weight: parseOptionalFloat(set.weight), durationSeconds };
}

export function buildExercisesInput(
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
