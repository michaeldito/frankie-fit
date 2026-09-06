import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EvalScenario } from "@/lib/admin-evals";

const { createSupabaseServiceRoleClient } = vi.hoisted(() => ({
  createSupabaseServiceRoleClient: vi.fn()
}));

vi.mock("@/lib/supabase/service-role", () => ({ createSupabaseServiceRoleClient }));

beforeEach(() => {
  vi.resetAllMocks();
});

type Result<T> = { data: T | null; error: { message: string } | null };

type TableScript = {
  select?: Result<unknown>;
  insert?: Result<unknown> | ((payload: unknown) => Result<unknown>);
  update?: Result<unknown>;
  delete?: Result<unknown>;
};

function fakeSupabase(config: {
  users?: Array<{ id: string; email?: string }>;
  listUsersError?: { message: string } | null;
  tables?: Record<string, TableScript>;
}) {
  const insertPayloads: Record<string, unknown[]> = {};
  const updatePayloads: Record<string, unknown[]> = {};
  const deleteCalls: Array<{ table: string; method: "eq" | "in"; column: string; value: unknown }> = [];
  const empty: Result<unknown> = { data: null, error: null };

  function tableScript(table: string): TableScript {
    return config.tables?.[table] ?? {};
  }

  const from = vi.fn((table: string) => {
    return {
      select: vi.fn(() => {
        const result = tableScript(table).select ?? empty;
        const chain = {
          eq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          single: vi.fn(() => Promise.resolve(result)),
          maybeSingle: vi.fn(() => Promise.resolve(result)),
          then: (
            onFulfilled: (value: Result<unknown>) => unknown,
            onRejected?: (error: unknown) => unknown
          ) => Promise.resolve(result).then(onFulfilled, onRejected)
        };
        return chain;
      }),
      insert: vi.fn((payload: unknown) => {
        (insertPayloads[table] ??= []).push(payload);
        const script = tableScript(table).insert;
        const result = typeof script === "function" ? script(payload) : (script ?? empty);
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(result)),
            then: (
              onFulfilled: (value: Result<unknown>) => unknown,
              onRejected?: (error: unknown) => unknown
            ) => Promise.resolve(result).then(onFulfilled, onRejected)
          })),
          then: (
            onFulfilled: (value: Result<unknown>) => unknown,
            onRejected?: (error: unknown) => unknown
          ) => Promise.resolve(result).then(onFulfilled, onRejected)
        };
      }),
      update: vi.fn((payload: unknown) => {
        (updatePayloads[table] ??= []).push(payload);
        const result = tableScript(table).update ?? empty;
        return { eq: vi.fn(() => Promise.resolve(result)) };
      }),
      delete: vi.fn(() => ({
        eq: vi.fn((column: string, value: unknown) => {
          deleteCalls.push({ table, method: "eq", column, value });
          return Promise.resolve(tableScript(table).delete ?? empty);
        }),
        in: vi.fn((column: string, value: unknown) => {
          deleteCalls.push({ table, method: "in", column, value });
          return Promise.resolve(tableScript(table).delete ?? empty);
        })
      }))
    };
  });

  const auth = {
    admin: {
      listUsers: vi.fn(() =>
        Promise.resolve(
          config.listUsersError
            ? { data: { users: [] }, error: config.listUsersError }
            : { data: { users: config.users ?? [] }, error: null }
        )
      )
    }
  };

  return { client: { from, auth } as never, from, auth, insertPayloads, updatePayloads, deleteCalls };
}

function baseScenario(overrides: Partial<EvalScenario> = {}): EvalScenario {
  return {
    id: "cardio-happy-path",
    label: "Cardio happy path",
    pathLabel: "cardio-happy-path",
    accountKey: "cardio-athlete",
    userEmail: "athlete@example.com",
    userName: "Athlete",
    description: "A benchmark scenario",
    weeklyShape: [],
    expectedCoaching: [],
    days: [
      {
        dayIndex: 0,
        date: "2026-05-04",
        label: "Monday",
        updates: [
          {
            pillar: "activity",
            message: "I ran 20 minutes",
            expected: {
              shouldLog: true,
              loggedForDate: "2026-05-04",
              coreFacts: ["ran"],
              shouldNotInfer: []
            }
          }
        ]
      }
    ],
    ...overrides
  };
}

async function importRunner() {
  return import("./admin-eval-runner");
}

describe("resolveEvalScenarioUserIds", () => {
  it("matches scenarios to user ids case-insensitively", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(
      fakeSupabase({ users: [{ id: "user-1", email: "Athlete@Example.com" }] }).client
    );
    const { resolveEvalScenarioUserIds } = await importRunner();

    const ids = await resolveEvalScenarioUserIds([baseScenario({ userEmail: "athlete@EXAMPLE.com" })]);

    expect(ids).toEqual(["user-1"]);
  });

  it("silently drops a scenario whose user doesn't exist", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(fakeSupabase({ users: [] }).client);
    const { resolveEvalScenarioUserIds } = await importRunner();

    const ids = await resolveEvalScenarioUserIds([baseScenario()]);

    expect(ids).toEqual([]);
  });

  it("throws when listUsers errors", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(
      fakeSupabase({ listUsersError: { message: "auth is down" } }).client
    );
    const { resolveEvalScenarioUserIds } = await importRunner();

    await expect(resolveEvalScenarioUserIds([baseScenario()])).rejects.toThrow("auth is down");
  });
});

describe("loadProfile", () => {
  it("returns a mapped profile when found", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(
      fakeSupabase({
        tables: {
          profiles: {
            select: {
              data: {
                full_name: "Athlete",
                role: "member",
                preferred_schedule: { monday: "am" },
                onboarding_summary: "likes running"
              },
              error: null
            }
          }
        }
      }).client
    );
    const { loadProfile } = await importRunner();

    const profile = await loadProfile("user-1");

    expect(profile).toMatchObject({
      full_name: "Athlete",
      preferred_schedule: { monday: "am" },
      onboarding_summary: "likes running"
    });
  });

  it("normalizes a non-object preferred_schedule to null", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(
      fakeSupabase({
        tables: {
          profiles: { select: { data: { preferred_schedule: ["not", "an", "object"] }, error: null } }
        }
      }).client
    );
    const { loadProfile } = await importRunner();

    const profile = await loadProfile("user-1");

    expect(profile?.preferred_schedule).toBeNull();
  });

  it("returns null (not a throw) when no profile is found", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(
      fakeSupabase({ tables: { profiles: { select: { data: null, error: null } } } }).client
    );
    const { loadProfile } = await importRunner();

    await expect(loadProfile("user-1")).resolves.toBeNull();
  });

  it("throws on a query error", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(
      fakeSupabase({
        tables: { profiles: { select: { data: null, error: { message: "db is down" } } } }
      }).client
    );
    const { loadProfile } = await importRunner();

    await expect(loadProfile("user-1")).rejects.toThrow("db is down");
  });
});

describe("resetEvalScenarioUser", () => {
  it("deletes across all tables and returns the counts, firing conditional deletes when ids exist", async () => {
    const { client, deleteCalls } = fakeSupabase({
      users: [{ id: "user-1", email: "athlete@example.com" }],
      tables: {
        conversation_threads: { select: { data: [{ id: "thread-1" }], error: null } },
        eval_runs: { select: { data: [{ id: "run-1" }, { id: "run-2" }], error: null } }
      }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { resetEvalScenarioUser } = await importRunner();

    const result = await resetEvalScenarioUser(baseScenario());

    expect(result).toEqual({
      deletedEvalRunCount: 2,
      userId: "user-1",
      userEmail: "athlete@example.com",
      deletedThreadCount: 1
    });
    expect(deleteCalls).toContainEqual({
      table: "ai_trace_runs",
      method: "in",
      column: "thread_id",
      value: ["thread-1"]
    });
    expect(deleteCalls).toContainEqual({
      table: "eval_runs",
      method: "in",
      column: "id",
      value: ["run-1", "run-2"]
    });
    for (const table of [
      "activity_logs",
      "diet_logs",
      "lifestyle_logs",
      "wellness_checkins",
      "recommendations",
      "weekly_summaries",
      "coach_summaries",
      "conversation_threads"
    ]) {
      expect(deleteCalls).toContainEqual({ table, method: "eq", column: "user_id", value: "user-1" });
    }
  });

  it("skips the conditional ai_trace_runs and eval_runs deletes when there's nothing to delete", async () => {
    const { client, deleteCalls } = fakeSupabase({
      users: [{ id: "user-1", email: "athlete@example.com" }],
      tables: {
        conversation_threads: { select: { data: [], error: null } },
        eval_runs: { select: { data: [], error: null } }
      }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { resetEvalScenarioUser } = await importRunner();

    await resetEvalScenarioUser(baseScenario());

    expect(deleteCalls.some((call) => call.table === "ai_trace_runs")).toBe(false);
    expect(deleteCalls.filter((call) => call.table === "eval_runs")).toHaveLength(0);
    expect(deleteCalls.some((call) => call.table === "conversation_threads")).toBe(true);
  });

  it("propagates a not-found error from resolving the target user", async () => {
    createSupabaseServiceRoleClient.mockReturnValue(fakeSupabase({ users: [] }).client);
    const { resetEvalScenarioUser } = await importRunner();

    await expect(resetEvalScenarioUser(baseScenario())).rejects.toThrow(
      "Could not find benchmark user athlete@example.com."
    );
  });

  it("propagates the eval_runs select error without making any delete calls", async () => {
    const { client, deleteCalls } = fakeSupabase({
      users: [{ id: "user-1", email: "athlete@example.com" }],
      tables: {
        conversation_threads: { select: { data: [], error: null } },
        eval_runs: { select: { data: null, error: { message: "boom" } } }
      }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { resetEvalScenarioUser } = await importRunner();

    await expect(resetEvalScenarioUser(baseScenario())).rejects.toThrow("boom");
    expect(deleteCalls).toHaveLength(0);
  });
});

describe("finishEvalScenarioReplay", () => {
  it("updates the eval run and returns the input verbatim", async () => {
    const { client, updatePayloads } = fakeSupabase({
      tables: { eval_runs: { update: { data: null, error: null } } }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { finishEvalScenarioReplay } = await importRunner();

    const result = await finishEvalScenarioReplay({ evalRunId: "run-1", status: "completed" });

    expect(result).toEqual({ evalRunId: "run-1", status: "completed" });
    expect(updatePayloads.eval_runs[0]).toMatchObject({
      status: "completed",
      error_message: null
    });
  });

  it("passes errorMessage through to the update payload", async () => {
    const { client, updatePayloads } = fakeSupabase({
      tables: { eval_runs: { update: { data: null, error: null } } }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { finishEvalScenarioReplay } = await importRunner();

    await finishEvalScenarioReplay({ evalRunId: "run-1", status: "failed", errorMessage: "boom" });

    expect(updatePayloads.eval_runs[0]).toMatchObject({ status: "failed", error_message: "boom" });
  });

  it("propagates an update error", async () => {
    const { client } = fakeSupabase({
      tables: { eval_runs: { update: { data: null, error: { message: "db is down" } } } }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { finishEvalScenarioReplay } = await importRunner();

    await expect(
      finishEvalScenarioReplay({ evalRunId: "run-1", status: "completed" })
    ).rejects.toThrow("db is down");
  });
});
