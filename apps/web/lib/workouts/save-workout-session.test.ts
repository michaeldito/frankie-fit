import { describe, expect, it, vi } from "vitest";
import type { WorkoutSessionInput } from "@frankie-fit/workout-core";

function baseSession(overrides: Partial<WorkoutSessionInput> = {}): WorkoutSessionInput {
  return {
    sessionType: "simple",
    title: "Morning lift",
    notes: null,
    wodTemplateSlug: null,
    roundsCount: null,
    forTime: false,
    totalTimeSeconds: 600,
    loggedForDate: "2026-01-01",
    weightUnit: "lb",
    exercises: [
      {
        exerciseSlug: "back-squat",
        exerciseName: "Back Squat",
        position: 0,
        sets: [{ setNumber: 1, reps: 5, weight: 135, durationSeconds: null }]
      }
    ],
    programSlug: null,
    programDay: null,
    ...overrides
  };
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

type TableConfig = {
  insert?: {
    result: QueryResult<unknown>;
  };
};

function fakeSupabase(config: {
  activityLogs?: TableConfig;
  workoutSessions?: TableConfig;
  workoutExercises?: TableConfig;
  workoutSets?: TableConfig;
}) {
  const insertPayloads: Record<string, unknown[]> = {};
  const deleteCalls: Array<{ table: string; column: string; value: unknown }> = [];

  function tableConfigFor(table: string): TableConfig | undefined {
    switch (table) {
      case "activity_logs":
        return config.activityLogs;
      case "workout_sessions":
        return config.workoutSessions;
      case "workout_exercises":
        return config.workoutExercises;
      case "workout_sets":
        return config.workoutSets;
      default:
        return undefined;
    }
  }

  const from = vi.fn().mockImplementation((table: string) => {
    return {
      insert: vi.fn().mockImplementation((payload: unknown) => {
        insertPayloads[table] = Array.isArray(payload) ? payload : [payload];
        const insertResult = tableConfigFor(table)?.insert?.result ?? { data: null, error: null };

        return {
          select: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue(insertResult),
            then: (onFulfilled: (value: QueryResult<unknown>) => unknown) =>
              Promise.resolve(insertResult).then(onFulfilled)
          })),
          then: (onFulfilled: (value: { error: unknown }) => unknown) =>
            Promise.resolve({ error: insertResult.error }).then(onFulfilled)
        };
      }),
      delete: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation((column: string, value: unknown) => {
          deleteCalls.push({ table, column, value });
          return Promise.resolve({ data: null, error: null });
        })
      }))
    };
  });

  return { from, client: { from } as never, insertPayloads, deleteCalls };
}

async function importSaveWorkoutSession() {
  return import("./save-workout-session");
}

const successConfig = {
  activityLogs: { insert: { result: { data: { id: "log-1" }, error: null } } },
  workoutSessions: { insert: { result: { data: { id: "session-1" }, error: null } } },
  workoutExercises: {
    insert: { result: { data: [{ id: "ex-1", position: 0 }], error: null } }
  },
  workoutSets: { insert: { result: { data: null, error: null } } }
};

describe("saveWorkoutSession", () => {
  it("inserts all four tables and returns the workout_sessions id", async () => {
    const { client, insertPayloads } = fakeSupabase(successConfig);
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    const id = await saveWorkoutSession({
      supabase: client,
      userId: "user-1",
      session: baseSession()
    });

    expect(id).toBe("session-1");
    expect(insertPayloads.activity_logs[0]).toMatchObject({
      user_id: "user-1",
      activity_type: "weight lifting",
      description: "Back Squat · 1 set",
      duration_minutes: 10,
      logged_for_date: "2026-01-01"
    });
    expect(insertPayloads.workout_sets[0]).toMatchObject({
      workout_exercise_id: "ex-1",
      set_number: 1,
      reps: 5,
      weight: 135,
      weight_unit: "lb"
    });
  });

  it("throws and makes no rollback calls when the activity_logs insert fails", async () => {
    const { client, deleteCalls } = fakeSupabase({
      activityLogs: { insert: { result: { data: null, error: { message: "log insert failed" } } } }
    });
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    await expect(
      saveWorkoutSession({ supabase: client, userId: "user-1", session: baseSession() })
    ).rejects.toThrow("log insert failed");
    expect(deleteCalls).toHaveLength(0);
  });

  it("rolls back activity_logs only when the workout_sessions insert fails", async () => {
    const { client, deleteCalls } = fakeSupabase({
      activityLogs: { insert: { result: { data: { id: "log-1" }, error: null } } },
      workoutSessions: {
        insert: { result: { data: null, error: { message: "session insert failed" } } }
      }
    });
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    await expect(
      saveWorkoutSession({ supabase: client, userId: "user-1", session: baseSession() })
    ).rejects.toThrow("session insert failed");
    expect(deleteCalls).toEqual([{ table: "activity_logs", column: "id", value: "log-1" }]);
  });

  it("rolls back workout_sessions then activity_logs when the workout_exercises insert fails", async () => {
    const { client, deleteCalls } = fakeSupabase({
      activityLogs: { insert: { result: { data: { id: "log-1" }, error: null } } },
      workoutSessions: { insert: { result: { data: { id: "session-1" }, error: null } } },
      workoutExercises: {
        insert: { result: { data: null, error: { message: "exercises insert failed" } } }
      }
    });
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    await expect(
      saveWorkoutSession({ supabase: client, userId: "user-1", session: baseSession() })
    ).rejects.toThrow("exercises insert failed");
    expect(deleteCalls).toEqual([
      { table: "workout_sessions", column: "id", value: "session-1" },
      { table: "activity_logs", column: "id", value: "log-1" }
    ]);
  });

  it("rolls back workout_sessions then activity_logs when the workout_sets insert fails", async () => {
    const { client, deleteCalls } = fakeSupabase({
      activityLogs: { insert: { result: { data: { id: "log-1" }, error: null } } },
      workoutSessions: { insert: { result: { data: { id: "session-1" }, error: null } } },
      workoutExercises: {
        insert: { result: { data: [{ id: "ex-1", position: 0 }], error: null } }
      },
      workoutSets: { insert: { result: { data: null, error: { message: "sets insert failed" } } } }
    });
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    await expect(
      saveWorkoutSession({ supabase: client, userId: "user-1", session: baseSession() })
    ).rejects.toThrow("sets insert failed");
    expect(deleteCalls).toEqual([
      { table: "workout_sessions", column: "id", value: "session-1" },
      { table: "activity_logs", column: "id", value: "log-1" }
    ]);
  });

  it("silently skips sets for an exercise whose position isn't in the returned rows", async () => {
    const session = baseSession({
      exercises: [
        {
          exerciseSlug: "back-squat",
          exerciseName: "Back Squat",
          position: 0,
          sets: [{ setNumber: 1, reps: 5, weight: 135, durationSeconds: null }]
        },
        {
          exerciseSlug: "bench-press",
          exerciseName: "Bench Press",
          position: 1,
          sets: [{ setNumber: 1, reps: 5, weight: 95, durationSeconds: null }]
        }
      ]
    });
    const { client, insertPayloads } = fakeSupabase(successConfig);
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    await saveWorkoutSession({ supabase: client, userId: "user-1", session });

    expect(insertPayloads.workout_sets).toHaveLength(1);
    expect(insertPayloads.workout_sets[0]).toMatchObject({ workout_exercise_id: "ex-1" });
  });

  it("resolves activity type and description from a matching wodTemplateSlug", async () => {
    const session = baseSession({ wodTemplateSlug: "fran", forTime: true, sessionType: "circuit" });
    const { client, insertPayloads } = fakeSupabase(successConfig);
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    await saveWorkoutSession({ supabase: client, userId: "user-1", session });

    expect(insertPayloads.activity_logs[0]).toMatchObject({
      activity_type: "crossfit",
      description: "Fran (for time)"
    });
  });

  it("resolves activity type/description from a program workout slug", async () => {
    const session = baseSession({ wodTemplateSlug: "plyometrics", programDay: 3 });
    const { client, insertPayloads } = fakeSupabase(successConfig);
    const { saveWorkoutSession } = await importSaveWorkoutSession();

    await saveWorkoutSession({ supabase: client, userId: "user-1", session });

    expect(insertPayloads.activity_logs[0]).toMatchObject({
      activity_type: "cardio",
      description: "Plyometrics · Day 3"
    });
  });
});
