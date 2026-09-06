import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, enrollInProgram, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  enrollInProgram: vi.fn(),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/programs/enroll-in-program", () => ({ enrollInProgram }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  vi.resetAllMocks();
});

function readyContext(overrides: Partial<CurrentAppContext> = {}): CurrentAppContext {
  return {
    authConfigured: true,
    schemaReady: true,
    user: { id: "user-1" },
    profile: null,
    error: null,
    ...overrides
  } as CurrentAppContext;
}

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/programs/wod-101/enroll", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function buildMalformedRequest() {
  return new NextRequest("http://localhost/api/programs/wod-101/enroll", {
    method: "POST",
    body: "not json"
  });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/programs/[slug]/enroll", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ startDate: "2026-05-04" }), {
      params: Promise.resolve({ slug: "wod-101" })
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(enrollInProgram).not.toHaveBeenCalled();
  });

  it.each([
    ["a missing startDate", {}],
    ["a non-ISO-date startDate", { startDate: "not-a-date" }]
  ])("returns 400 for %s", async (_label, body) => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest(body), { params: Promise.resolve({ slug: "wod-101" }) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Pick a valid start date." });
    expect(enrollInProgram).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body isn't valid JSON", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildMalformedRequest(), {
      params: Promise.resolve({ slug: "wod-101" })
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Pick a valid start date." });
  });

  it("enrolls the user and returns ok", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const supabaseClient = { from: vi.fn() };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    enrollInProgram.mockResolvedValue(undefined);
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ startDate: "2026-05-04" }), {
      params: Promise.resolve({ slug: "wod-101" })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(enrollInProgram).toHaveBeenCalledWith({
      supabase: supabaseClient,
      userId: "user-1",
      programSlug: "wod-101",
      startDate: "2026-05-04"
    });
  });

  it("returns 500 with the error message when enrollInProgram throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    enrollInProgram.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ startDate: "2026-05-04" }), {
      params: Promise.resolve({ slug: "wod-101" })
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("returns 500 with the fallback message when enrollInProgram rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    enrollInProgram.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ startDate: "2026-05-04" }), {
      params: Promise.resolve({ slug: "wod-101" })
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not start the program." });
  });
});
