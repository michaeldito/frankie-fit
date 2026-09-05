import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const { redirect, getCurrentAppContext, createSupabaseServiceRoleClient } = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
  getCurrentAppContext: vi.fn(),
  createSupabaseServiceRoleClient: vi.fn()
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/supabase/service-role", () => ({ createSupabaseServiceRoleClient }));

beforeEach(() => {
  vi.resetAllMocks();
  redirect.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
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

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    itemId: "item-1",
    reviewCheck: "activities_count",
    actualBehavior: "logged 2 activities",
    expectedBehavior: "logged 1 activity",
    status: "needs_work",
    ...overrides
  };
}

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/evals/tuning-notes", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function fakeSupabase(result: { error: { message: string } | null }) {
  const upsert = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ upsert });
  return { client: { from } as never, from, upsert };
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/admin/evals/tuning-notes", () => {
  it("redirects to /login when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    await expect(POST(buildRequest(validBody()))).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login?message=Log%20in%20to%20continue.");
    expect(createSupabaseServiceRoleClient).not.toHaveBeenCalled();
  });

  it("redirects to /app/chat when the user isn't an admin", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ profile: { role: "member" } as unknown as AppProfile }));
    const { POST } = await importRoute();

    await expect(POST(buildRequest(validBody()))).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      "/app/chat?error=Admin%20access%20is%20restricted%20to%20approved%20accounts."
    );
    expect(createSupabaseServiceRoleClient).not.toHaveBeenCalled();
  });

  it("returns 400 when itemId and reviewCheck are missing", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody({ itemId: "", reviewCheck: "" })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Eval review item and check are required."
    });
    expect(createSupabaseServiceRoleClient).not.toHaveBeenCalled();
  });

  it("returns 500 when the status is invalid, even with itemId/reviewCheck present", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody({ status: "bogus" })));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Choose a valid review status." });
    expect(createSupabaseServiceRoleClient).not.toHaveBeenCalled();
  });

  it("saves the tuning note and returns ok with the reviewed timestamp", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client, from, upsert } = fakeSupabase({ error: null });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(typeof json.reviewedAt).toBe("string");
    expect(from).toHaveBeenCalledWith("eval_reviews");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actual_behavior: "logged 2 activities",
        eval_run_item_id: "item-1",
        expected_behavior: "logged 1 activity",
        issue_tags: [],
        field_note: null,
        review_check: "activities_count",
        reviewed_by: "admin-1",
        status: "needs_work"
      }),
      { onConflict: "eval_run_item_id,review_check" }
    );
  });

  it("returns 500 when the Supabase upsert fails", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client } = fakeSupabase({ error: { message: "db is down" } });
    createSupabaseServiceRoleClient.mockReturnValue(client);
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });
});
