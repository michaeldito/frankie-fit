import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, runEvalScenarioReplayStep, createSupabaseServiceRoleClient } =
  vi.hoisted(() => ({
    getCurrentAppContext: vi.fn(),
    runEvalScenarioReplayStep: vi.fn(),
    createSupabaseServiceRoleClient: vi.fn()
  }));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/admin-eval-runner", () => ({ runEvalScenarioReplayStep }));
vi.mock("@/lib/supabase/service-role", () => ({ createSupabaseServiceRoleClient }));

const fakeSupabaseClient = { marker: "fake-supabase" } as never;

beforeEach(() => {
  vi.resetAllMocks();
  createSupabaseServiceRoleClient.mockReturnValue(fakeSupabaseClient);
});

function readyContext(overrides: Partial<CurrentAppContext> = {}): CurrentAppContext {
  return {
    schemaReady: true,
    authConfigured: true,
    user: { id: "admin-1" },
    profile: { role: "admin" } as AppProfile,
    error: null,
    ...overrides
  } as CurrentAppContext;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    runId: "run-1",
    scenarioId: "cardio-happy-path",
    stepIndex: 0,
    threadId: "thread-1",
    ...overrides
  };
}

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/evals/replay/step", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/admin/evals/replay/step", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(401);
    expect(runEvalScenarioReplayStep).not.toHaveBeenCalled();
  });

  it("returns 403 when the user isn't an admin", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ profile: { role: "member" } as unknown as AppProfile }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(403);
    expect(runEvalScenarioReplayStep).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown scenario", { scenarioId: "not-a-real-scenario" }],
    ["a missing runId", { runId: "" }],
    ["a missing threadId", { threadId: "" }],
    ["a negative stepIndex", { stepIndex: -1 }]
  ])("returns 400 for %s", async (_label, overrides) => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody(overrides)));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Replay step input is invalid." });
    expect(runEvalScenarioReplayStep).not.toHaveBeenCalled();
  });

  it("returns the step result mapped into the response shape", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    runEvalScenarioReplayStep.mockResolvedValue({
      assistantReply: "Nice work!",
      elapsedMs: 42,
      errorMessage: null,
      evalRunId: "run-1",
      runStatus: "completed",
      step: { stepIndex: 0 },
      traceId: "trace-1"
    });
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      assistantReply: "Nice work!",
      elapsedMs: 42,
      error: null,
      ok: true,
      runId: "run-1",
      runStatus: "completed",
      step: { stepIndex: 0 },
      traceId: "trace-1"
    });
  });

  it("returns ok:false with the error message in a 200 when the step result carries an errorMessage", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    runEvalScenarioReplayStep.mockResolvedValue({
      assistantReply: "",
      elapsedMs: 10,
      errorMessage: "log_write_failed",
      evalRunId: "run-1",
      runStatus: "log_write_failed",
      step: { stepIndex: 0 },
      traceId: "trace-1"
    });
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("log_write_failed");
  });

  it("returns 500 with the error message when runEvalScenarioReplayStep throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    runEvalScenarioReplayStep.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down", ok: false });
  });

  it("returns 500 with the fallback message when runEvalScenarioReplayStep rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    runEvalScenarioReplayStep.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Could not run eval replay step.",
      ok: false
    });
  });
});
