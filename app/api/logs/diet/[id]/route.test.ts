import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
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

function fakeSupabase(opts: {
  lookup: { data: { id: string } | null; error: { message: string } | null };
  deleteResult?: { error: { message: string } | null };
}) {
  const maybeSingle = vi.fn().mockResolvedValue(opts.lookup);
  const selectEq2 = { eq: vi.fn().mockReturnValue({ maybeSingle }) };
  const selectEq1 = { eq: vi.fn().mockReturnValue(selectEq2) };
  const select = vi.fn().mockReturnValue(selectEq1);

  const deleteEq2 = vi.fn().mockResolvedValue(opts.deleteResult ?? { error: null });
  const deleteEq1 = { eq: vi.fn().mockReturnValue({ eq: deleteEq2 }) };
  const del = vi.fn().mockReturnValue(deleteEq1);

  const from = vi.fn().mockReturnValue({ select, delete: del });
  return { client: { from } as never, from, select, deleteEq1, deleteEq2 };
}

function buildRequest(id: string) {
  return new NextRequest(`http://localhost/api/logs/diet/${id}`, { method: "DELETE" });
}

async function importRoute() {
  return import("./route");
}

describe("DELETE /api/logs/diet/[id]", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { DELETE } = await importRoute();

    const response = await DELETE(buildRequest("log-1"), { params: Promise.resolve({ id: "log-1" }) });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns 500 when the ownership lookup fails", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client, deleteEq1 } = fakeSupabase({
      lookup: { data: null, error: { message: "connection timed out" } }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { DELETE } = await importRoute();

    const response = await DELETE(buildRequest("log-1"), { params: Promise.resolve({ id: "log-1" }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "connection timed out" });
    expect(deleteEq1.eq).not.toHaveBeenCalled();
  });

  it("returns 404 when the log doesn't exist or isn't owned by the user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client } = fakeSupabase({ lookup: { data: null, error: null } });
    createSupabaseServerClient.mockResolvedValue(client);
    const { DELETE } = await importRoute();

    const response = await DELETE(buildRequest("log-1"), { params: Promise.resolve({ id: "log-1" }) });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "That diet log could not be found."
    });
  });

  it("returns 500 when the delete fails", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client } = fakeSupabase({
      lookup: { data: { id: "log-1" }, error: null },
      deleteResult: { error: { message: "db is down" } }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { DELETE } = await importRoute();

    const response = await DELETE(buildRequest("log-1"), { params: Promise.resolve({ id: "log-1" }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("deletes the log scoped to id and user_id, and returns ok on success", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client, from, deleteEq1, deleteEq2 } = fakeSupabase({
      lookup: { data: { id: "log-1" }, error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { DELETE } = await importRoute();

    const response = await DELETE(buildRequest("log-1"), { params: Promise.resolve({ id: "log-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("diet_logs");
    expect(deleteEq1.eq).toHaveBeenCalledWith("id", "log-1");
    expect(deleteEq2).toHaveBeenCalledWith("user_id", "user-1");
  });
});
