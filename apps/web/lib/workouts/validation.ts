import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const workoutSetInputSchema = z
  .object({
    setNumber: z.number().int().min(1),
    reps: z.number().int().min(0).nullable(),
    weight: z.number().min(0).nullable(),
    durationSeconds: z.number().int().min(0).nullable()
  })
  .refine((set) => set.reps !== null || set.durationSeconds !== null, {
    message: "Each set needs reps or a duration."
  });

const workoutExerciseInputSchema = z.object({
  exerciseSlug: z.string().min(1),
  exerciseName: z.string().min(1),
  position: z.number().int().min(0),
  sets: z.array(workoutSetInputSchema).min(1, "Add at least one set for each exercise.")
});

export const workoutSessionInputSchema = z.object({
  sessionType: z.enum(["simple", "circuit"]),
  title: z.string().min(1).nullable(),
  notes: z.string().min(1).nullable(),
  wodTemplateSlug: z.string().min(1).nullable(),
  roundsCount: z.number().int().min(1).nullable(),
  forTime: z.boolean(),
  totalTimeSeconds: z.number().int().min(0).nullable(),
  loggedForDate: z.string().regex(isoDatePattern),
  weightUnit: z.enum(["lb", "kg"]),
  exercises: z.array(workoutExerciseInputSchema).min(1, "Add at least one exercise."),
  programSlug: z.string().min(1).nullable(),
  programDay: z.number().int().min(1).nullable()
});
