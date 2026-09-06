import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const {
  getCurrentAppContext,
  runEvalScenarioDailySummaryStep,
  createSupabaseServiceRoleClient
} = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  runEvalScenarioDailySummaryStep: vi.fn(),
  createSupabaseServiceRoleClient: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/admin-eval-runner", () => ({ runEvalScenarioDailySummaryStep }));
vi.mock("@/lib/supabase/service-role", () => ({ createSupabaseServiceRoleClient }));

beforeEach(() => {
  vi.resetAllMocks();
  createSupabaseServiceRoleClient.mockReturnValue({ marker: "fake-supabase" });
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
  return new NextRequest("http://localhost/api/admin/evals/summaries/daily-step", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/admin/evals/summaries/daily-step", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path", dayIndex: 0 }));

    expect(response.status).toBe(401);
    expect(runEvalScenarioDailySummaryStep).not.toHaveBeenCalled();
  });

  it("returns 403 when the user isn't an admin", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ profile: { role: "member" } as unknown as AppProfile }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path", dayIndex: 0 }));

    expect(response.status).toBe(403);
    expect(runEvalScenarioDailySummaryStep).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown scenario", { scenarioId: "not-a-real-scenario", dayIndex: 0 }],
    ["a negative dayIndex", { scenarioId: "cardio-happy-path", dayIndex: -1 }]
  ])("returns 400 for %s", async (_label, body) => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Daily summary step input is invalid."
    });
    expect(runEvalScenarioDailySummaryStep).not.toHaveBeenCalled();
  });

  it("runs the daily summary step and returns its day label", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    runEvalScenarioDailySummaryStep.mockResolvedValue({ day: { label: "Monday" } });
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path", dayIndex: 0 }));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ dayLabel: "Monday", ok: true });
    expect(typeof json.elapsedMs).toBe("number");
  });

  it("returns 500 with the error message when runEvalScenarioDailySummaryStep throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    runEvalScenarioDailySummaryStep.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path", dayIndex: 0 }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down", ok: false });
  });

  it("returns 500 with the fallback message when runEvalScenarioDailySummaryStep rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    runEvalScenarioDailySummaryStep.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ scenarioId: "cardio-happy-path", dayIndex: 0 }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Could not generate that day's summary.",
      ok: false
    });
  });
});
