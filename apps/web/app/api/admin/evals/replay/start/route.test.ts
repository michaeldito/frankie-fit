import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, beginEvalScenarioReplay, createSupabaseServiceRoleClient } =
  vi.hoisted(() => ({
    getCurrentAppContext: vi.fn(),
    beginEvalScenarioReplay: vi.fn(),
    createSupabaseServiceRoleClient: vi.fn()
  }));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/admin-eval-runner", () => ({ beginEvalScenarioReplay }));
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

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/evals/replay/start", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/admin/evals/replay/start", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(beginEvalScenarioReplay).not.toHaveBeenCalled();
  });

  it("returns 403 when the user isn't an admin", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ profile: { role: "member" } as unknown as AppProfile }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Admin access is required." });
    expect(beginEvalScenarioReplay).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown scenarioId", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "not-a-real-scenario" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Choose a valid eval scenario." });
    expect(beginEvalScenarioReplay).not.toHaveBeenCalled();
  });

  it("starts the replay and returns its runId/steps/threadId", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    beginEvalScenarioReplay.mockResolvedValue({
      evalRunId: "run-1",
      steps: [{ stepIndex: 0 }],
      threadId: "thread-1"
    });
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      runId: "run-1",
      steps: [{ stepIndex: 0 }],
      threadId: "thread-1"
    });
    expect(beginEvalScenarioReplay).toHaveBeenCalledWith(
      expect.objectContaining({ adminUserId: "admin-1", supabase: fakeSupabaseClient })
    );
  });

  it("returns 500 with the error message when beginEvalScenarioReplay throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    beginEvalScenarioReplay.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("returns 500 with the fallback message when beginEvalScenarioReplay rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    beginEvalScenarioReplay.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not start eval replay." });
  });
});
