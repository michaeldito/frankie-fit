import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, listNotifications, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  listNotifications: vi.fn(),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/notifications", () => ({ listNotifications }));
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

describe("GET /api/notifications", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(listNotifications).not.toHaveBeenCalled();
  });

  it("returns the current user's notifications", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const supabaseClient = { from: vi.fn() };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    const notifications = [{ id: "notif-1" }];
    listNotifications.mockResolvedValue(notifications);
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ notifications });
    expect(listNotifications).toHaveBeenCalledWith(supabaseClient, "user-1");
  });
});
