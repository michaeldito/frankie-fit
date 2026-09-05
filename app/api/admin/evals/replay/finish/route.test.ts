import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, finishEvalScenarioReplay } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  finishEvalScenarioReplay: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/admin-eval-runner", () => ({ finishEvalScenarioReplay }));

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
  return new NextRequest("http://localhost/api/admin/evals/replay/finish", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/admin/evals/replay/finish", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ runId: "run-1" }));

    expect(response.status).toBe(401);
    expect(finishEvalScenarioReplay).not.toHaveBeenCalled();
  });

  it("returns 403 when the user isn't an admin", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ profile: { role: "member" } as unknown as AppProfile }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ runId: "run-1" }));

    expect(response.status).toBe(403);
    expect(finishEvalScenarioReplay).not.toHaveBeenCalled();
  });

  it("returns 400 when runId is missing", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Eval run id is required." });
    expect(finishEvalScenarioReplay).not.toHaveBeenCalled();
  });

  it("passes status 'failed' through literally", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    finishEvalScenarioReplay.mockResolvedValue({ ok: true });
    const { POST } = await importRoute();

    await POST(buildRequest({ runId: "run-1", status: "failed", errorMessage: "boom" }));

    expect(finishEvalScenarioReplay).toHaveBeenCalledWith({
      evalRunId: "run-1",
      status: "failed",
      errorMessage: "boom"
    });
  });

  it("coerces any non-'failed' status to 'completed'", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    finishEvalScenarioReplay.mockResolvedValue({ ok: true });
    const { POST } = await importRoute();

    await POST(buildRequest({ runId: "run-1", status: "bogus" }));

    expect(finishEvalScenarioReplay).toHaveBeenCalledWith({
      evalRunId: "run-1",
      status: "completed",
      errorMessage: null
    });
  });

  it("returns the runner's result object verbatim", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    finishEvalScenarioReplay.mockResolvedValue({ evalRunId: "run-1", status: "completed" });
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ runId: "run-1" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ evalRunId: "run-1", status: "completed" });
  });

  it("returns 500 with the error message when finishEvalScenarioReplay throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    finishEvalScenarioReplay.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ runId: "run-1" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("returns 500 with the fallback message when finishEvalScenarioReplay rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    finishEvalScenarioReplay.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ runId: "run-1" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not finish eval replay." });
  });
});
