export type ProgramScheduleDay = {
  day: number;
  week: number;
  phase: 1 | 2 | 3;
  weekday: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  /** Workout slugs to complete this day, e.g. ["chest-and-back", "ab-ripper-x"]. Empty on rest days. */
  workoutSlugs: string[];
  /** Optional alternative for a rest day, e.g. X Stretch. */
  optionalWorkoutSlugs?: string[];
};

export type ProgramSchedule = {
  slug: string;
  name: string;
  description: string;
  totalDays: number;
  days: ProgramScheduleDay[];
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

type WeekPattern = Array<{ workoutSlugs: string[]; optionalWorkoutSlugs?: string[] }>;

const patternA: WeekPattern = [
  { workoutSlugs: ["chest-and-back", "ab-ripper-x"] },
  { workoutSlugs: ["plyometrics"] },
  { workoutSlugs: ["shoulder-and-arms", "ab-ripper-x"] },
  { workoutSlugs: ["yoga-x"] },
  { workoutSlugs: ["legs-and-back", "ab-ripper-x"] },
  { workoutSlugs: ["kenpo-x"] },
  { workoutSlugs: [], optionalWorkoutSlugs: ["x-stretch"] }
];

const patternB: WeekPattern = [
  { workoutSlugs: ["chest-shoulders-and-triceps", "ab-ripper-x"] },
  { workoutSlugs: ["plyometrics"] },
  { workoutSlugs: ["back-and-biceps", "ab-ripper-x"] },
  { workoutSlugs: ["yoga-x"] },
  { workoutSlugs: ["legs-and-back", "ab-ripper-x"] },
  { workoutSlugs: ["kenpo-x"] },
  { workoutSlugs: [], optionalWorkoutSlugs: ["x-stretch"] }
];

const recoveryPattern: WeekPattern = [
  { workoutSlugs: ["yoga-x"] },
  { workoutSlugs: ["core-synergistics"] },
  { workoutSlugs: ["kenpo-x"] },
  { workoutSlugs: ["x-stretch"] },
  { workoutSlugs: ["core-synergistics"] },
  { workoutSlugs: ["yoga-x"] },
  { workoutSlugs: [], optionalWorkoutSlugs: ["x-stretch"] }
];

/** Week (1-indexed) -> pattern + phase, per the Classic P90X calendar. */
const weekPlan: Array<{ pattern: WeekPattern; phase: 1 | 2 | 3 }> = [
  { pattern: patternA, phase: 1 },
  { pattern: patternA, phase: 1 },
  { pattern: patternA, phase: 1 },
  { pattern: recoveryPattern, phase: 1 },
  { pattern: patternB, phase: 2 },
  { pattern: patternB, phase: 2 },
  { pattern: patternB, phase: 2 },
  { pattern: recoveryPattern, phase: 2 },
  { pattern: patternA, phase: 3 },
  { pattern: patternB, phase: 3 },
  { pattern: patternA, phase: 3 },
  { pattern: patternB, phase: 3 },
  { pattern: recoveryPattern, phase: 3 }
];

function buildDays(): ProgramScheduleDay[] {
  const days: ProgramScheduleDay[] = [];
  let day = 1;

  weekPlan.forEach(({ pattern, phase }, weekIndex) => {
    pattern.forEach((entry, weekdayIndex) => {
      days.push({
        day,
        week: weekIndex + 1,
        phase,
        weekday: WEEKDAYS[weekdayIndex],
        workoutSlugs: entry.workoutSlugs,
        optionalWorkoutSlugs: entry.optionalWorkoutSlugs
      });
      day += 1;
    });
  });

  return days;
}

export const p90xClassicSchedule: ProgramSchedule = {
  slug: "p90x-classic",
  name: "P90X — Classic",
  description: "13-week rotation of resistance, plyometric, cardio, and flexibility training.",
  totalDays: 91,
  days: buildDays()
};

export const programSchedules: ProgramSchedule[] = [p90xClassicSchedule];

export function findProgramSchedule(slug: string): ProgramSchedule | undefined {
  return programSchedules.find((schedule) => schedule.slug === slug);
}
