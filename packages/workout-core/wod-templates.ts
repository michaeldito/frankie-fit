export type WodTemplateExercise = {
  exerciseSlug: string;
  /** One entry per round, e.g. Fran's thrusters: [21, 15, 9]. */
  repsPerRound?: number[];
  /** Fixed reps used every round, e.g. Cindy's 5 pull-ups. */
  reps?: number;
  defaultWeightLb?: number;
  durationSeconds?: number;
};

export type WodTemplate = {
  slug: string;
  name: string;
  description: string;
  scheme: "for_time" | "amrap";
  amrapMinutes?: number;
  /** null when open-ended (AMRAP) or a single unbroken pass (Grace, Murph). */
  roundsCount: number | null;
  forTime: boolean;
  exercises: WodTemplateExercise[];
};

export const wodTemplates: WodTemplate[] = [
  {
    slug: "fran",
    name: "Fran",
    description: "21-15-9 reps for time of thrusters and pull-ups.",
    scheme: "for_time",
    roundsCount: 3,
    forTime: true,
    exercises: [
      { exerciseSlug: "thruster", repsPerRound: [21, 15, 9], defaultWeightLb: 95 },
      { exerciseSlug: "pull-up", repsPerRound: [21, 15, 9] }
    ]
  },
  {
    slug: "cindy",
    name: "Cindy",
    description: "AMRAP 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats.",
    scheme: "amrap",
    amrapMinutes: 20,
    roundsCount: null,
    forTime: false,
    exercises: [
      { exerciseSlug: "pull-up", reps: 5 },
      { exerciseSlug: "push-up", reps: 10 },
      { exerciseSlug: "air-squat", reps: 15 }
    ]
  },
  {
    slug: "murph",
    name: "Murph",
    description: "For time: 1 mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1 mile run.",
    scheme: "for_time",
    roundsCount: 1,
    forTime: true,
    exercises: [
      { exerciseSlug: "run" },
      { exerciseSlug: "pull-up", reps: 100 },
      { exerciseSlug: "push-up", reps: 200 },
      { exerciseSlug: "air-squat", reps: 300 },
      { exerciseSlug: "run" }
    ]
  },
  {
    slug: "grace",
    name: "Grace",
    description: "30 reps for time of clean and jerks.",
    scheme: "for_time",
    roundsCount: 1,
    forTime: true,
    exercises: [{ exerciseSlug: "clean-and-jerk", reps: 30, defaultWeightLb: 135 }]
  },
  {
    slug: "helen",
    name: "Helen",
    description: "3 rounds for time: 400m run, 21 kettlebell swings, 12 pull-ups.",
    scheme: "for_time",
    roundsCount: 3,
    forTime: true,
    exercises: [
      { exerciseSlug: "run" },
      { exerciseSlug: "kettlebell-swing", repsPerRound: [21, 21, 21], defaultWeightLb: 53 },
      { exerciseSlug: "pull-up", repsPerRound: [12, 12, 12] }
    ]
  }
];
