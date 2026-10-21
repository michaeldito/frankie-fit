import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getServerEnv, evaluateFrankieNudges } = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
  evaluateFrankieNudges: vi.fn()
}));

vi.mock("@/lib/env", () => ({ getServerEnv }));
vi.mock("@/lib/notifications", () => ({ evaluateFrankieNudges }));

beforeEach(() => {
  vi.resetAllMocks();
});

function buildRequest(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/frankie-nudges", {
    headers: authHeader ? { authorization: authHeader } : undefined
  });
}

describe("GET /api/cron/frankie-nudges", () => {
  it("refuses to run without a configured secret", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: undefined });
    const { GET } = await import("./route");
    const response = await GET(buildRequest("Bearer anything"));
    expect(response.status).toBe(500);
    expect(evaluateFrankieNudges).not.toHaveBeenCalled();
  });

  it("rejects the wrong secret", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "s3cret" });
    const { GET } = await import("./route");
    const response = await GET(buildRequest("Bearer nope"));
    expect(response.status).toBe(401);
    expect(evaluateFrankieNudges).not.toHaveBeenCalled();
  });

  it("evaluates nudges with the right secret", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "s3cret" });
    evaluateFrankieNudges.mockResolvedValue({ evaluatedCount: 3, sentCount: 1 });
    const { GET } = await import("./route");
    const response = await GET(buildRequest("Bearer s3cret"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, frankieNudges: { evaluatedCount: 3, sentCount: 1 } });
  });

  it("reports evaluation failures", async () => {
    getServerEnv.mockReturnValue({ CRON_SECRET: "s3cret" });
    evaluateFrankieNudges.mockRejectedValue(new Error("db down"));
    const { GET } = await import("./route");
    const response = await GET(buildRequest("Bearer s3cret"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "db down" });
  });
});
