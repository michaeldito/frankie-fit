import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, markNotificationRead, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  markNotificationRead: vi.fn(),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/notifications", () => ({ markNotificationRead }));
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

function buildRequest() {
  return new NextRequest("http://localhost/api/notifications/notif-1/read", { method: "POST" });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/notifications/[id]/read", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(markNotificationRead).not.toHaveBeenCalled();
  });

  it("marks the notification read and returns ok", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const supabaseClient = { from: vi.fn() };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    markNotificationRead.mockResolvedValue(undefined);
    const { POST } = await importRoute();

    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(markNotificationRead).toHaveBeenCalledWith(supabaseClient, "user-1", "notif-1");
  });

  it("returns 500 with the error message when markNotificationRead throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    markNotificationRead.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("returns 500 with the fallback message when markNotificationRead rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    markNotificationRead.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not mark as read." });
  });
});
