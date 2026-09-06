import { describe, expect, it } from "vitest";
import { workoutSessionInputSchema } from "./validation";
import type { z } from "zod";

type WorkoutSessionInput = z.input<typeof workoutSessionInputSchema>;

function baseSession(): WorkoutSessionInput {
  return {
    sessionType: "simple" as const,
    title: "Morning lift",
    notes: null,
    wodTemplateSlug: null,
    roundsCount: null,
    forTime: false,
    totalTimeSeconds: null,
    loggedForDate: "2026-01-01",
    weightUnit: "lb" as const,
    exercises: [
      {
        exerciseSlug: "back-squat",
        exerciseName: "Back Squat",
        position: 0,
        sets: [{ setNumber: 1, reps: 5, weight: 135, durationSeconds: null }]
      }
    ],
    programSlug: null,
    programDay: null
  };
}

describe("workoutSessionInputSchema", () => {
  it("accepts a valid rep-based session", () => {
    expect(workoutSessionInputSchema.safeParse(baseSession()).success).toBe(true);
  });

  it("accepts a set with duration instead of reps", () => {
    const session = baseSession();
    session.exercises[0].sets = [{ setNumber: 1, reps: null, weight: null, durationSeconds: 30 }];
    expect(workoutSessionInputSchema.safeParse(session).success).toBe(true);
  });

  it("rejects a set with neither reps nor duration", () => {
    const session = baseSession();
    session.exercises[0].sets = [{ setNumber: 1, reps: null, weight: null, durationSeconds: null }];
    expect(workoutSessionInputSchema.safeParse(session).success).toBe(false);
  });

  it("rejects a session with no exercises", () => {
    const session = baseSession();
    session.exercises = [];
    expect(workoutSessionInputSchema.safeParse(session).success).toBe(false);
  });

  it("rejects an exercise with no sets", () => {
    const session = baseSession();
    session.exercises[0].sets = [];
    expect(workoutSessionInputSchema.safeParse(session).success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const session = baseSession();
    session.loggedForDate = "01-01-2026";
    expect(workoutSessionInputSchema.safeParse(session).success).toBe(false);
  });

  it("rejects a negative weight", () => {
    const session = baseSession();
    session.exercises[0].sets[0].weight = -5;
    expect(workoutSessionInputSchema.safeParse(session).success).toBe(false);
  });
});
