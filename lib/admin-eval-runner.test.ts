import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EvalScenario } from "@/lib/admin-evals";

const { createSupabaseServiceRoleClient, runFrankieTurn, generateDailyCoachSummary, generateWeeklyCoachSummary } =
  vi.hoisted(() => ({
    createSupabaseServiceRoleClient: vi.fn(),
    runFrankieTurn: vi.fn(),
    generateDailyCoachSummary: vi.fn(),
    generateWeeklyCoachSummary: vi.fn()
  }));

vi.mock("@/lib/supabase/service-role", () => ({ createSupabaseServiceRoleClient }));
vi.mock("@/lib/ai/run-frankie-turn", () => ({ runFrankieTurn }));
vi.mock("@/lib/ai/summaries/frankie-summaries", () => ({
  generateDailyCoachSummary,
  generateWeeklyCoachSummary
}));

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

function scenarioUser() {
  return { id: "user-1", email: "athlete@example.com" };
}

const successfulEvalRunInsert = { data: { id: "eval-run-1" }, error: null };

describe("beginEvalScenarioReplay", () => {
  it("composes createEvalRun and createEvalThread and returns the replay steps", async () => {
    const { client, insertPayloads } = fakeSupabase({
      users: [scenarioUser()],
      tables: {
        profiles: { select: { data: { onboarding_summary: "likes running" }, error: null } },
        eval_runs: { insert: successfulEvalRunInsert },
        conversation_threads: { insert: { data: { id: "thread-1", title: "Eval: Cardio happy path" }, error: null } },
        conversation_messages: { insert: { data: { id: "message-1" }, error: null } }
      }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { beginEvalScenarioReplay } = await importRunner();
    const scenario = baseScenario();

    const result = await beginEvalScenarioReplay({ adminUserId: "admin-1", scenario });

    expect(result.evalRunId).toBe("eval-run-1");
    expect(result.threadId).toBe("thread-1");
    expect(result.userId).toBe("user-1");
    expect(result.steps.length).toBeGreaterThan(0);
    expect(insertPayloads.conversation_messages[0]).toMatchObject({
      content: expect.stringContaining("likes running")
    });
  });

  it("uses a scenario-derived fallback message when the profile has no onboarding summary", async () => {
    const { client, insertPayloads } = fakeSupabase({
      users: [scenarioUser()],
      tables: {
        profiles: { select: { data: null, error: null } },
        eval_runs: { insert: successfulEvalRunInsert },
        conversation_threads: { insert: { data: { id: "thread-1", title: "Eval: Cardio happy path" }, error: null } },
        conversation_messages: { insert: { data: { id: "message-1" }, error: null } }
      }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { beginEvalScenarioReplay } = await importRunner();
    const scenario = baseScenario();

    await beginEvalScenarioReplay({ adminUserId: "admin-1", scenario });

    expect(insertPayloads.conversation_messages[0]).toMatchObject({
      content: expect.stringContaining(`${scenario.userName} benchmark profile`)
    });
  });

  it("propagates an eval_runs insert failure without attempting the thread insert", async () => {
    const { client, insertPayloads } = fakeSupabase({
      users: [scenarioUser()],
      tables: {
        profiles: { select: { data: null, error: null } },
        eval_runs: { insert: { data: null, error: { message: "insert failed" } } }
      }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { beginEvalScenarioReplay } = await importRunner();

    await expect(
      beginEvalScenarioReplay({ adminUserId: "admin-1", scenario: baseScenario() })
    ).rejects.toThrow("insert failed");
    expect(insertPayloads.conversation_threads).toBeUndefined();
  });
});

describe("runEvalScenarioReplayStep", () => {
  function replayFixtureTables(overrides: Record<string, TableScript> = {}) {
    return {
      eval_runs: { select: { data: { id: "eval-run-1", scenario_id: "cardio-happy-path", status: "running" }, error: null } },
      conversation_threads: { select: { data: { id: "thread-1", title: "Eval thread" }, error: null } },
      conversation_messages: { select: { data: [], error: null } },
      eval_run_items: { insert: { data: null, error: null } },
      ...overrides
    };
  }

  it("runs the step, inserts an eval_run_item, and returns the mapped result", async () => {
    const { client, insertPayloads } = fakeSupabase({
      users: [scenarioUser()],
      tables: replayFixtureTables()
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    runFrankieTurn.mockResolvedValue({
      assistantReply: "Nice work!",
      actualJson: {},
      errorMessage: null,
      runStatus: "completed",
      traceId: "trace-1",
      userMessage: { id: "user-msg-1" },
      assistantMessage: { id: "assistant-msg-1" }
    });
    const { runEvalScenarioReplayStep } = await importRunner();
    const scenario = baseScenario();

    const result = await runEvalScenarioReplayStep({
      evalRunId: "eval-run-1",
      scenario,
      stepIndex: 0,
      threadId: "thread-1"
    });

    expect(result).toMatchObject({
      assistantReply: "Nice work!",
      errorMessage: null,
      evalRunId: "eval-run-1",
      runStatus: "completed",
      traceId: "trace-1"
    });
    expect(typeof result.elapsedMs).toBe("number");
    expect(runFrankieTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: client,
        userId: "user-1",
        threadId: "thread-1"
      })
    );
    expect(insertPayloads.eval_run_items[0]).toMatchObject({
      eval_run_id: "eval-run-1",
      source_message_id: "user-msg-1",
      assistant_message_id: "assistant-msg-1",
      run_status: "completed"
    });
  });

  it("throws when the eval run's scenario doesn't match the requested scenario", async () => {
    const { client } = fakeSupabase({
      users: [scenarioUser()],
      tables: replayFixtureTables({
        eval_runs: { select: { data: { id: "eval-run-1", scenario_id: "other-scenario", status: "running" }, error: null } }
      })
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { runEvalScenarioReplayStep } = await importRunner();

    await expect(
      runEvalScenarioReplayStep({
        evalRunId: "eval-run-1",
        scenario: baseScenario(),
        stepIndex: 0,
        threadId: "thread-1"
      })
    ).rejects.toThrow("Eval run does not match the requested scenario.");
  });

  it("throws when the eval run is not active", async () => {
    const { client } = fakeSupabase({
      users: [scenarioUser()],
      tables: replayFixtureTables({
        eval_runs: { select: { data: { id: "eval-run-1", scenario_id: "cardio-happy-path", status: "completed" }, error: null } }
      })
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { runEvalScenarioReplayStep } = await importRunner();

    await expect(
      runEvalScenarioReplayStep({
        evalRunId: "eval-run-1",
        scenario: baseScenario(),
        stepIndex: 0,
        threadId: "thread-1"
      })
    ).rejects.toThrow("Eval run is not active.");
  });

  it("throws when the step index is out of range", async () => {
    const { client } = fakeSupabase({
      users: [scenarioUser()],
      tables: replayFixtureTables()
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { runEvalScenarioReplayStep } = await importRunner();

    await expect(
      runEvalScenarioReplayStep({
        evalRunId: "eval-run-1",
        scenario: baseScenario(),
        stepIndex: 99,
        threadId: "thread-1"
      })
    ).rejects.toThrow("Replay step index is out of range.");
  });
});

describe("runEvalScenarioDailySummaryStep", () => {
  it("generates the daily summary for the matching day", async () => {
    const { client } = fakeSupabase({
      users: [scenarioUser()],
      tables: { profiles: { select: { data: { onboarding_summary: "likes running" }, error: null } } }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    generateDailyCoachSummary.mockResolvedValue({ summary_text: "Great day!" });
    const { runEvalScenarioDailySummaryStep } = await importRunner();
    const scenario = baseScenario();

    const result = await runEvalScenarioDailySummaryStep({ dayIndex: 0, scenario });

    expect(result.day).toEqual(scenario.days[0]);
    expect(result.summary).toEqual({ summary_text: "Great day!" });
    expect(generateDailyCoachSummary).toHaveBeenCalledWith(
      expect.objectContaining({ supabase: client, userId: "user-1", date: scenario.days[0].date })
    );
  });

  it("throws when the dayIndex doesn't match any scenario day", async () => {
    const { client } = fakeSupabase({ users: [scenarioUser()] });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { runEvalScenarioDailySummaryStep } = await importRunner();

    await expect(
      runEvalScenarioDailySummaryStep({ dayIndex: 99, scenario: baseScenario() })
    ).rejects.toThrow("Daily summary step index is out of range.");
  });
});

describe("runEvalScenarioWeeklySummary", () => {
  it("generates the weekly summary and returns it verbatim", async () => {
    const { client } = fakeSupabase({
      users: [scenarioUser()],
      tables: { profiles: { select: { data: { onboarding_summary: "likes running" }, error: null } } }
    });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const weeklySummary = { summary_text: "Great week!" };
    generateWeeklyCoachSummary.mockResolvedValue(weeklySummary);
    const { runEvalScenarioWeeklySummary } = await importRunner();
    const scenario = baseScenario();

    const result = await runEvalScenarioWeeklySummary(scenario);

    expect(result).toBe(weeklySummary);
    expect(generateWeeklyCoachSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: client,
        userId: "user-1",
        periodStart: scenario.days[0].date,
        periodEnd: scenario.days[scenario.days.length - 1].date
      })
    );
  });
});
