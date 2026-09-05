import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, resetEvalScenarioUser } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  resetEvalScenarioUser: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/admin-eval-runner", () => ({ resetEvalScenarioUser }));

beforeEach(() => {
  vi.resetAllMocks();
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
  return new NextRequest("http://localhost/api/admin/evals/reset", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/admin/evals/reset", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(401);
    expect(resetEvalScenarioUser).not.toHaveBeenCalled();
  });

  it("returns 403 when the user isn't an admin", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ profile: { role: "member" } as unknown as AppProfile }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(403);
    expect(resetEvalScenarioUser).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown scenarioId", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "not-a-real-scenario" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Choose a valid eval scenario." });
    expect(resetEvalScenarioUser).not.toHaveBeenCalled();
  });

  it("resets the scenario user and returns the deletion counts", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    resetEvalScenarioUser.mockResolvedValue({ deletedEvalRunCount: 2, deletedThreadCount: 1 });
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ deletedEvalRunCount: 2, deletedThreadCount: 1, ok: true });
    expect(typeof json.elapsedMs).toBe("number");
  });

  it("returns 500 with the error message when resetEvalScenarioUser throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    resetEvalScenarioUser.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down", ok: false });
  });

  it("returns 500 with the fallback message when resetEvalScenarioUser rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    resetEvalScenarioUser.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Could not reset test data.",
      ok: false
    });
  });
});
