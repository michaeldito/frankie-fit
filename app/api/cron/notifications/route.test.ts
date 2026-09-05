import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getServerEnv,
  evaluateCheckinNudges,
  evaluateDailySummaryNotifications,
  evaluateWeeklySummaryNotifications
} = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
  evaluateCheckinNudges: vi.fn(),
  evaluateDailySummaryNotifications: vi.fn(),
  evaluateWeeklySummaryNotifications: vi.fn()
}));

vi.mock("@/lib/env", () => ({ getServerEnv }));
vi.mock("@/lib/notifications", () => ({
  evaluateCheckinNudges,
  evaluateDailySummaryNotifications,
  evaluateWeeklySummaryNotifications
}));

beforeEach(() => {
  vi.resetAllMocks();
});

function buildRequest(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/notifications", {
    headers: authHeader ? { authorization: authHeader } : undefined
  });
}

function expectNoEvaluationsRan() {
  expect(evaluateCheckinNudges).not.toHaveBeenCalled();
  expect(evaluateDailySummaryNotifications).not.toHaveBeenCalled();
  expect(evaluateWeeklySummaryNotifications).not.toHaveBeenCalled();
}

async function importRoute() {
  return import("./route");
}

describe("GET /api/cron/notifications", () => {
  it("returns 500 when CRON_SECRET is not configured", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: undefined });
    const { GET } = await importRoute();

    const response = await GET(buildRequest("Bearer whatever"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "CRON_SECRET is not configured." });
    expectNoEvaluationsRan();
  });

  it("returns 401 when the Authorization header is missing", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "the-secret" });
    const { GET } = await importRoute();

    const response = await GET(buildRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
    expectNoEvaluationsRan();
  });

  it("returns 401 when the Authorization header doesn't match the configured secret", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "the-secret" });
    const { GET } = await importRoute();

    const response = await GET(buildRequest("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
    expectNoEvaluationsRan();
  });

  it("evaluates all three notification checks and returns their results", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "the-secret" });
    evaluateCheckinNudges.mockResolvedValue({ evaluatedCount: 3, sentCount: 1 });
    evaluateDailySummaryNotifications.mockResolvedValue({ evaluatedCount: 5, sentCount: 2 });
    evaluateWeeklySummaryNotifications.mockResolvedValue({ evaluatedCount: 0, sentCount: 0 });
    const { GET } = await importRoute();

    const response = await GET(buildRequest("Bearer the-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      checkinReminders: { evaluatedCount: 3, sentCount: 1 },
      dailySummaries: { evaluatedCount: 5, sentCount: 2 },
      weeklySummaries: { evaluatedCount: 0, sentCount: 0 }
    });
  });

  it("returns 500 with the error message when an evaluation throws an Error", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "the-secret" });
    evaluateCheckinNudges.mockResolvedValue({ evaluatedCount: 0, sentCount: 0 });
    evaluateDailySummaryNotifications.mockRejectedValue(new Error("db is down"));
    evaluateWeeklySummaryNotifications.mockResolvedValue({ evaluatedCount: 0, sentCount: 0 });
    const { GET } = await importRoute();

    const response = await GET(buildRequest("Bearer the-secret"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down", ok: false });
  });

  it("returns 500 with the fallback message when an evaluation rejects with a non-Error", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "the-secret" });
    evaluateCheckinNudges.mockResolvedValue({ evaluatedCount: 0, sentCount: 0 });
    evaluateDailySummaryNotifications.mockResolvedValue({ evaluatedCount: 0, sentCount: 0 });
    evaluateWeeklySummaryNotifications.mockRejectedValue("boom");
    const { GET } = await importRoute();

    const response = await GET(buildRequest("Bearer the-secret"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Could not evaluate notifications.",
      ok: false
    });
  });
});
