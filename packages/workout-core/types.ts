export type WorkoutSessionType = "simple" | "circuit";
export type WeightUnit = "lb" | "kg";

export type WorkoutSetInput = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
};

export type WorkoutExerciseInput = {
  exerciseSlug: string;
  exerciseName: string;
  position: number;
  sets: WorkoutSetInput[];
};

export type WorkoutSessionInput = {
  sessionType: WorkoutSessionType;
  title: string | null;
  notes: string | null;
  wodTemplateSlug: string | null;
  roundsCount: number | null;
  forTime: boolean;
  totalTimeSeconds: number | null;
  loggedForDate: string;
  weightUnit: WeightUnit;
  exercises: WorkoutExerciseInput[];
  programSlug: string | null;
  programDay: number | null;
};
