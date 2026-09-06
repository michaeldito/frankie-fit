import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const { createSupabaseServerClient, createSupabaseServiceRoleClient, resolveEvalScenarioUserIds } =
  vi.hoisted(() => ({
    createSupabaseServerClient: vi.fn(),
    createSupabaseServiceRoleClient: vi.fn(),
    resolveEvalScenarioUserIds: vi.fn()
  }));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("@/lib/supabase/service-role", () => ({ createSupabaseServiceRoleClient }));
vi.mock("@/lib/admin-eval-runner", () => ({ resolveEvalScenarioUserIds }));

async function importAdminEvalsData() {
  return import("./admin-evals-data");
}

beforeEach(() => {
  vi.resetAllMocks();
  createSupabaseServiceRoleClient.mockReturnValue({ marker: "fake-supabase" });
  resolveEvalScenarioUserIds.mockResolvedValue([]);
});

function readyContext(overrides: Partial<CurrentAppContext> = {}): CurrentAppContext {
  return {
    schemaReady: true,
    authConfigured: true,
    user: { id: "user-1" },
    profile: { role: "admin" } as AppProfile,
    error: null,
    ...overrides
  } as CurrentAppContext;
}

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

function fakeSupabase(responses: {
  evalRuns: QueryResult<Record<string, unknown>>;
  selectedRunItems?: QueryResult<Record<string, unknown>>;
  statusCountItems?: QueryResult<Record<string, unknown>>;
  coachSummaries?: QueryResult<Record<string, unknown>>;
  itemReviews?: QueryResult<Record<string, unknown>>;
  flaggedReviews?: QueryResult<Record<string, unknown>>;
}) {
  const empty: QueryResult<never> = { data: [], error: null };

  const from = vi.fn().mockImplementation((table: string) => {
    let selectArgs: unknown[] = [];
    const chain = {
      select: vi.fn((...args: unknown[]) => {
        selectArgs = args;
        return chain;
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (onFulfilled: (value: QueryResult<unknown>) => unknown) => {
        let result: QueryResult<unknown> = empty;

        if (table === "eval_runs") {
          result = responses.evalRuns;
        } else if (table === "eval_run_items") {
          result =
            selectArgs[0] === "*"
              ? (responses.selectedRunItems ?? empty)
              : (responses.statusCountItems ?? empty);
        } else if (table === "coach_summaries") {
          result = responses.coachSummaries ?? empty;
        } else if (table === "eval_reviews") {
          result =
            selectArgs[0] === "*" ? (responses.itemReviews ?? empty) : (responses.flaggedReviews ?? empty);
        }

        return Promise.resolve(result).then(onFulfilled);
      }
    };
    return chain;
  });

  return { from, client: { from } };
}

describe("getAdminEvalsData", () => {
  it("returns an empty, not-ready result without touching supabase when the context isn't a ready admin", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();

    const result = await getAdminEvalsData({
      context: readyContext({ profile: { role: "member" } as unknown as AppProfile })
    });

    expect(result.ready).toBe(false);
    expect(result.runs).toEqual([]);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns an empty result when eval_runs errors, regardless of whether it's a missing-table error", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();

    const missingTable = fakeSupabase({
      evalRuns: { data: null, error: { message: 'relation "public.eval_runs" does not exist' } }
    });
    createSupabaseServerClient.mockResolvedValue(missingTable.client);
    const missingTableResult = await getAdminEvalsData({ context: readyContext() });

    const genericError = fakeSupabase({
      evalRuns: { data: null, error: { message: "connection timed out" } }
    });
    createSupabaseServerClient.mockResolvedValue(genericError.client);
    const genericErrorResult = await getAdminEvalsData({ context: readyContext() });

    expect(missingTableResult).toEqual({
      ready: false,
      error: 'relation "public.eval_runs" does not exist',
      runs: [],
      runItemStatusCounts: {},
      selectedRun: null,
      selectedRunItems: [],
      reviews: [],
      summaries: []
    });
    expect(genericErrorResult).toEqual({
      ready: false,
      error: "connection timed out",
      runs: [],
      runItemStatusCounts: {},
      selectedRun: null,
      selectedRunItems: [],
      reviews: [],
      summaries: []
    });
  });

  it("classifies run-item statuses: flagged overrides completed, clarification and flagged both warn, anything else is bad", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();

    const { client } = fakeSupabase({
      evalRuns: { data: [{ id: "run-1" }], error: null },
      statusCountItems: {
        data: [
          { id: "item-1", eval_run_id: "run-1", run_status: "completed" },
          { id: "item-2", eval_run_id: "run-1", run_status: "completed" },
          { id: "item-3", eval_run_id: "run-1", run_status: "clarification" },
          { id: "item-4", eval_run_id: "run-1", run_status: "log_write_failed" }
        ],
        error: null
      },
      flaggedReviews: { data: [{ eval_run_item_id: "item-2" }], error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);

    const result = await getAdminEvalsData({ context: readyContext() });

    expect(result.runItemStatusCounts["run-1"]).toEqual({ total: 4, good: 1, warn: 2, bad: 1 });
  });

  it("returns whichever of items/statusCounts/summaries errors first", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();
    resolveEvalScenarioUserIds.mockResolvedValue(["scenario-user-1"]);

    const itemsErrorFirst = fakeSupabase({
      evalRuns: { data: [{ id: "run-1" }], error: null },
      selectedRunItems: { data: null, error: { message: "items query failed" } },
      statusCountItems: { data: null, error: { message: "status counts query failed" } },
      coachSummaries: { data: null, error: { message: "summaries query failed" } }
    });
    createSupabaseServerClient.mockResolvedValue(itemsErrorFirst.client);
    const itemsErrorResult = await getAdminEvalsData({
      context: readyContext(),
      selectedRunId: "run-1"
    });
    expect(itemsErrorResult.error).toBe("items query failed");

    const statusCountsErrorOnly = fakeSupabase({
      evalRuns: { data: [{ id: "run-1" }], error: null },
      statusCountItems: { data: null, error: { message: "status counts query failed" } }
    });
    createSupabaseServerClient.mockResolvedValue(statusCountsErrorOnly.client);
    const statusCountsResult = await getAdminEvalsData({ context: readyContext() });
    expect(statusCountsResult.error).toBe("status counts query failed");

    const summariesErrorOnly = fakeSupabase({
      evalRuns: { data: [{ id: "run-1" }], error: null },
      coachSummaries: { data: null, error: { message: "summaries query failed" } }
    });
    createSupabaseServerClient.mockResolvedValue(summariesErrorOnly.client);
    const summariesResult = await getAdminEvalsData({ context: readyContext() });
    expect(summariesResult.error).toBe("summaries query failed");
  });

  it("scopes the coach_summaries query to exactly the resolved benchmark-persona user ids", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();
    resolveEvalScenarioUserIds.mockResolvedValue(["persona-user-1", "persona-user-2"]);

    const { client, from } = fakeSupabase({
      evalRuns: { data: [], error: null },
      coachSummaries: { data: [], error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);

    await getAdminEvalsData({ context: readyContext() });

    const coachSummariesCall = from.mock.results.find(
      (_, index) => from.mock.calls[index][0] === "coach_summaries"
    );
    expect(from).toHaveBeenCalledWith("coach_summaries");
    const chain = coachSummariesCall!.value;
    expect(chain.in).toHaveBeenCalledWith("user_id", ["persona-user-1", "persona-user-2"]);
  });

  it("resolves with empty summaries, without querying coach_summaries, when resolveEvalScenarioUserIds rejects", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();
    resolveEvalScenarioUserIds.mockRejectedValue(new Error("boom"));

    const { client, from } = fakeSupabase({ evalRuns: { data: [], error: null } });
    createSupabaseServerClient.mockResolvedValue(client);

    const result = await getAdminEvalsData({ context: readyContext() });

    expect(result.ready).toBe(true);
    expect(result.summaries).toEqual([]);
    expect(from).not.toHaveBeenCalledWith("coach_summaries");
  });

  it("assembles a full happy-path result with a selected run and strips the joined profiles field", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();
    resolveEvalScenarioUserIds.mockResolvedValue(["persona-user-1"]);

    const { client } = fakeSupabase({
      evalRuns: { data: [{ id: "run-1" }, { id: "run-2" }], error: null },
      selectedRunItems: { data: [{ id: "item-1", eval_run_id: "run-1", run_status: "completed" }], error: null },
      statusCountItems: {
        data: [{ id: "item-1", eval_run_id: "run-1", run_status: "completed" }],
        error: null
      },
      coachSummaries: {
        data: [
          {
            id: "summary-1",
            user_id: "persona-user-1",
            profiles: { full_name: "Maya Patel" }
          }
        ],
        error: null
      },
      itemReviews: { data: [{ id: "review-1", eval_run_item_id: "item-1" }], error: null },
      flaggedReviews: { data: [], error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);

    const result = await getAdminEvalsData({ context: readyContext(), selectedRunId: "run-1" });

    expect(result.ready).toBe(true);
    expect(result.selectedRun).toEqual({ id: "run-1" });
    expect(result.selectedRunItems).toEqual([
      { id: "item-1", eval_run_id: "run-1", run_status: "completed" }
    ]);
    expect(result.reviews).toEqual([{ id: "review-1", eval_run_item_id: "item-1" }]);
    expect(result.summaries).toEqual([
      { id: "summary-1", user_id: "persona-user-1", userName: "Maya Patel" }
    ]);
    expect((result.summaries[0] as unknown as { profiles?: unknown }).profiles).toBeUndefined();
  });

  it("leaves selectedRun null and skips the run-scoped eval_run_items query when no selectedRunId is given", async () => {
    const { getAdminEvalsData } = await importAdminEvalsData();

    const { client, from } = fakeSupabase({
      evalRuns: { data: [{ id: "run-1" }], error: null },
      statusCountItems: { data: [], error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);

    const result = await getAdminEvalsData({ context: readyContext() });

    expect(result.selectedRun).toBeNull();
    expect(result.selectedRunItems).toEqual([]);
    const evalRunItemsCalls = from.mock.calls.filter(([table]) => table === "eval_run_items");
    expect(evalRunItemsCalls).toHaveLength(1);
  });
});
