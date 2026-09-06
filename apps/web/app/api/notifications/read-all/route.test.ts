import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, markAllNotificationsRead, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/notifications", () => ({ markAllNotificationsRead }));
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

async function importRoute() {
  return import("./route");
}

describe("POST /api/notifications/read-all", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });

  it("marks all notifications read and returns ok", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const supabaseClient = { from: vi.fn() };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    markAllNotificationsRead.mockResolvedValue(undefined);
    const { POST } = await importRoute();

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(markAllNotificationsRead).toHaveBeenCalledWith(supabaseClient, "user-1");
  });

  it("returns 500 with the error message when markAllNotificationsRead throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    markAllNotificationsRead.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("returns 500 with the fallback message when markAllNotificationsRead rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    markAllNotificationsRead.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not mark notifications as read." });
  });
});
