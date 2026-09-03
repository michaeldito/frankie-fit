import type { WodTemplateExercise } from "./wod-templates";

export type ProgramWorkoutCategory = "strength" | "cardio" | "flexibility" | "core";

export type ProgramWorkoutTemplate = {
  slug: string;
  name: string;
  description: string;
  category: ProgramWorkoutCategory;
  /** Filled in incrementally as exercise breakdowns are added per workout. */
  exercises: WodTemplateExercise[];
};

/**
 * P90X Classic named workouts. Exercise breakdowns start empty and get filled
 * in one workout at a time as they're added.
 */
export const programWorkoutTemplates: ProgramWorkoutTemplate[] = [
  {
    slug: "chest-and-back",
    name: "Chest & Back",
    description: "Push/pull superset of pushup and pull-up variations.",
    category: "strength",
    exercises: []
  },
  {
    slug: "plyometrics",
    name: "Plyometrics",
    description: "Explosive jump-training cardio circuit.",
    category: "cardio",
    exercises: []
  },
  {
    slug: "shoulder-and-arms",
    name: "Shoulder & Arms",
    description: "Shoulder press, lateral raise, bicep and tricep isolation circuit.",
    category: "strength",
    exercises: []
  },
  {
    slug: "yoga-x",
    name: "Yoga X",
    description: "Balance, strength, and flexibility yoga flow.",
    category: "flexibility",
    exercises: []
  },
  {
    slug: "legs-and-back",
    name: "Legs and Back",
    description: "Squat and lunge variations paired with pull-ups.",
    category: "strength",
    exercises: []
  },
  {
    slug: "kenpo-x",
    name: "Kenpo X",
    description: "Martial-arts inspired striking cardio.",
    category: "cardio",
    exercises: []
  },
  {
    slug: "ab-ripper-x",
    name: "Ab Ripper X",
    description: "Fixed sequence of core exercises, done for reps.",
    category: "core",
    exercises: []
  },
  {
    slug: "core-synergistics",
    name: "Core Synergistics",
    description: "Full-body functional strength circuit built around the core.",
    category: "core",
    exercises: []
  },
  {
    slug: "x-stretch",
    name: "X Stretch",
    description: "Full-body stretching and mobility flow.",
    category: "flexibility",
    exercises: []
  },
  {
    slug: "chest-shoulders-and-triceps",
    name: "Chest, Shoulders & Triceps",
    description: "Push-focused superset targeting chest, shoulders, and triceps.",
    category: "strength",
    exercises: []
  },
  {
    slug: "back-and-biceps",
    name: "Back and Biceps",
    description: "Pull-focused superset targeting back and biceps.",
    category: "strength",
    exercises: []
  }
];

export function findProgramWorkout(slug: string): ProgramWorkoutTemplate | undefined {
  return programWorkoutTemplates.find((workout) => workout.slug === slug);
}
