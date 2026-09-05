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

/** P90X Classic named workouts, with the real exercise breakdown for each. */
export const programWorkoutTemplates: ProgramWorkoutTemplate[] = [
  {
    slug: "chest-and-back",
    name: "Chest & Back",
    description: "Push/pull superset of pushup and pull-up variations.",
    category: "strength",
    exercises: [
      { exerciseSlug: "push-up", repsPerRound: [15, 15, 12] },
      { exerciseSlug: "wide-front-pull-up", repsPerRound: [8, 8, 6] },
      { exerciseSlug: "military-push-up", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "closer-grip-pull-up", repsPerRound: [8, 8, 6] },
      { exerciseSlug: "wide-fly-push-up", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "corn-cob-pull-up", repsPerRound: [8, 8, 6] }
    ]
  },
  {
    slug: "plyometrics",
    name: "Plyometrics",
    description: "Explosive jump-training cardio circuit.",
    category: "cardio",
    exercises: [
      { exerciseSlug: "squat-jump", reps: 15 },
      { exerciseSlug: "jump-lunge", reps: 20 },
      { exerciseSlug: "lateral-jump", reps: 20 },
      { exerciseSlug: "box-jump", reps: 15 },
      { exerciseSlug: "burpee", reps: 10 },
      { exerciseSlug: "high-knee-run", durationSeconds: 30 }
    ]
  },
  {
    slug: "shoulder-and-arms",
    name: "Shoulder & Arms",
    description: "Shoulder press, lateral raise, bicep and tricep isolation circuit.",
    category: "strength",
    exercises: [
      { exerciseSlug: "dumbbell-shoulder-press", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "lateral-raise", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "dumbbell-bicep-curl", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "dumbbell-tricep-extension", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "front-raise", repsPerRound: [10, 10, 10] },
      { exerciseSlug: "dip", repsPerRound: [10, 10, 8] }
    ]
  },
  {
    slug: "yoga-x",
    name: "Yoga X",
    description: "Balance, strength, and flexibility yoga flow.",
    category: "flexibility",
    exercises: [
      { exerciseSlug: "downward-dog", durationSeconds: 30 },
      { exerciseSlug: "warrior-pose", durationSeconds: 30 },
      { exerciseSlug: "chair-pose", durationSeconds: 30 },
      { exerciseSlug: "triangle-pose", durationSeconds: 30 },
      { exerciseSlug: "tree-pose", durationSeconds: 30 },
      { exerciseSlug: "cobra-pose", durationSeconds: 30 }
    ]
  },
  {
    slug: "legs-and-back",
    name: "Legs and Back",
    description: "Squat and lunge variations paired with pull-ups.",
    category: "strength",
    exercises: [
      { exerciseSlug: "air-squat", repsPerRound: [25, 20, 15] },
      { exerciseSlug: "lunge", repsPerRound: [20, 20, 16] },
      { exerciseSlug: "pistol-squat", repsPerRound: [6, 6, 4] },
      { exerciseSlug: "calf-raise", repsPerRound: [20, 20, 20] },
      { exerciseSlug: "pull-up", repsPerRound: [10, 10, 8] },
      { exerciseSlug: "chin-up", repsPerRound: [10, 10, 8] }
    ]
  },
  {
    slug: "kenpo-x",
    name: "Kenpo X",
    description: "Martial-arts inspired striking cardio.",
    category: "cardio",
    exercises: [
      { exerciseSlug: "jab-cross", reps: 20 },
      { exerciseSlug: "front-kick", reps: 15 },
      { exerciseSlug: "roundhouse-kick", reps: 15 },
      { exerciseSlug: "horse-stance-punch", reps: 20 },
      { exerciseSlug: "high-knee-run", durationSeconds: 30 },
      { exerciseSlug: "burpee", reps: 10 }
    ]
  },
  {
    slug: "ab-ripper-x",
    name: "Ab Ripper X",
    description: "Fixed sequence of core exercises, done for reps.",
    category: "core",
    exercises: [
      { exerciseSlug: "crunch", reps: 25 },
      { exerciseSlug: "bicycle-crunch", reps: 25 },
      { exerciseSlug: "crunchy-frog", reps: 25 },
      { exerciseSlug: "fifer-scissors", reps: 25 },
      { exerciseSlug: "hip-rock-and-raise", reps: 25 },
      { exerciseSlug: "pulse-up", reps: 20 },
      { exerciseSlug: "oblique-v-up", reps: 25 },
      { exerciseSlug: "v-up", reps: 25 },
      { exerciseSlug: "leg-climb", reps: 10 },
      { exerciseSlug: "mason-twist", reps: 50 },
      { exerciseSlug: "cherry-picker", reps: 25 }
    ]
  },
  {
    slug: "core-synergistics",
    name: "Core Synergistics",
    description: "Full-body functional strength circuit built around the core.",
    category: "core",
    exercises: [
      { exerciseSlug: "mountain-climber", reps: 30 },
      { exerciseSlug: "plank", durationSeconds: 45 },
      { exerciseSlug: "side-plank", durationSeconds: 30 },
      { exerciseSlug: "russian-twist", reps: 30 },
      { exerciseSlug: "burpee", reps: 15 },
      { exerciseSlug: "hollow-hold", durationSeconds: 30 }
    ]
  },
  {
    slug: "x-stretch",
    name: "X Stretch",
    description: "Full-body stretching and mobility flow.",
    category: "flexibility",
    exercises: [
      { exerciseSlug: "seated-forward-bend", durationSeconds: 30 },
      { exerciseSlug: "hip-flexor-stretch", durationSeconds: 30 },
      { exerciseSlug: "hamstring-stretch", durationSeconds: 30 },
      { exerciseSlug: "quad-stretch", durationSeconds: 30 },
      { exerciseSlug: "shoulder-stretch", durationSeconds: 30 },
      { exerciseSlug: "cat-cow-stretch", durationSeconds: 30 }
    ]
  },
  {
    slug: "chest-shoulders-and-triceps",
    name: "Chest, Shoulders & Triceps",
    description: "Push-focused superset targeting chest, shoulders, and triceps.",
    category: "strength",
    exercises: [
      { exerciseSlug: "push-up", repsPerRound: [20, 15, 12] },
      { exerciseSlug: "dumbbell-shoulder-press", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "dip", repsPerRound: [12, 10, 8] },
      { exerciseSlug: "lateral-raise", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "dumbbell-tricep-extension", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "wide-fly-push-up", repsPerRound: [15, 12, 10] }
    ]
  },
  {
    slug: "back-and-biceps",
    name: "Back and Biceps",
    description: "Pull-focused superset targeting back and biceps.",
    category: "strength",
    exercises: [
      { exerciseSlug: "pull-up", repsPerRound: [10, 10, 8] },
      { exerciseSlug: "dumbbell-row", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "chin-up", repsPerRound: [10, 10, 8] },
      { exerciseSlug: "dumbbell-bicep-curl", repsPerRound: [12, 12, 10] },
      { exerciseSlug: "wide-front-pull-up", repsPerRound: [8, 8, 6] },
      { exerciseSlug: "renegade-row", repsPerRound: [10, 10, 8] }
    ]
  }
];

export function findProgramWorkout(slug: string): ProgramWorkoutTemplate | undefined {
  return programWorkoutTemplates.find((workout) => workout.slug === slug);
}
