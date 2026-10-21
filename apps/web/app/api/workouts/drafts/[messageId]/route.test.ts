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
  lookup: {
    data: { id: string; structured_payload: unknown } | null;
    error: { message: string } | null;
  };
  updateResult?: { data: Array<{ id: string }> | null; error: { message: string } | null };
}) {
  const maybeSingle = vi.fn().mockResolvedValue(opts.lookup);
  const selectEq3 = { eq: vi.fn().mockReturnValue({ maybeSingle }) };
  const selectEq2 = { eq: vi.fn().mockReturnValue(selectEq3) };
  const selectEq1 = { eq: vi.fn().mockReturnValue(selectEq2) };
  const select = vi.fn().mockReturnValue(selectEq1);

  const updateSelect = vi
    .fn()
    .mockResolvedValue(opts.updateResult ?? { data: [{ id: "msg-1" }], error: null });
  const updateEq2 = { eq: vi.fn().mockReturnValue({ select: updateSelect }) };
  const updateEq1 = { eq: vi.fn().mockReturnValue(updateEq2) };
  const update = vi.fn().mockReturnValue(updateEq1);

  const from = vi.fn().mockReturnValue({ select, update });
  return { client: { from } as never, from, select, selectEq1, selectEq2, update, updateEq1, updateSelect };
}

function buildRequest(messageId: string, body: unknown) {
  return new NextRequest(`http://localhost/api/workouts/drafts/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

async function importRoute() {
  return import("./route");
}

describe("PATCH /api/workouts/drafts/[messageId]", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { PATCH } = await importRoute();

    const response = await PATCH(buildRequest("msg-1", { savedWorkout: {} }), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns 400 when savedWorkout is missing from the body", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { PATCH } = await importRoute();

    const response = await PATCH(buildRequest("msg-1", {}), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(response.status).toBe(400);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns 500 when the ownership lookup fails", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client } = fakeSupabase({
      lookup: { data: null, error: { message: "connection timed out" } }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { PATCH } = await importRoute();

    const response = await PATCH(buildRequest("msg-1", { savedWorkout: { exercises: [] } }), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "connection timed out" });
  });

  it("returns 404 when the draft doesn't exist or isn't owned by the user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client } = fakeSupabase({ lookup: { data: null, error: null } });
    createSupabaseServerClient.mockResolvedValue(client);
    const { PATCH } = await importRoute();

    const response = await PATCH(buildRequest("msg-1", { savedWorkout: { exercises: [] } }), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "That draft could not be found." });
  });

  it("scopes the lookup by id, user_id, and message_type", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client, from, selectEq1, selectEq2 } = fakeSupabase({
      lookup: { data: { id: "msg-1", structured_payload: { workoutDraft: { exercises: [] } } }, error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { PATCH } = await importRoute();

    await PATCH(buildRequest("msg-1", { savedWorkout: { exercises: [] } }), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(from).toHaveBeenCalledWith("conversation_messages");
    expect(selectEq1.eq).toHaveBeenCalledWith("id", "msg-1");
    expect(selectEq2.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns 500 when the update fails", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client } = fakeSupabase({
      lookup: { data: { id: "msg-1", structured_payload: { workoutDraft: { exercises: [] } } }, error: null },
      updateResult: { data: null, error: { message: "db is down" } }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { PATCH } = await importRoute();

    const response = await PATCH(buildRequest("msg-1", { savedWorkout: { exercises: [] } }), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("returns 500 when the update silently affects zero rows (e.g. a missing RLS policy)", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { client } = fakeSupabase({
      lookup: { data: { id: "msg-1", structured_payload: { workoutDraft: { exercises: [] } } }, error: null },
      updateResult: { data: [], error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { PATCH } = await importRoute();

    const response = await PATCH(buildRequest("msg-1", { savedWorkout: { exercises: [] } }), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not save the workout summary." });
  });

  it("merges savedWorkout into the existing workoutDraft payload and returns it", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const existingPayload = {
      workoutDraft: { title: null, loggedForDate: "2026-01-01", notes: null, exercises: [{ exerciseName: "Squat", sets: [] }] }
    };
    const { client, update } = fakeSupabase({
      lookup: { data: { id: "msg-1", structured_payload: existingPayload }, error: null }
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const { PATCH } = await importRoute();

    const savedWorkout = { loggedForDate: "2026-01-01", exercises: [{ exerciseName: "Squat", sets: [{ reps: 5, weight: 135, durationSeconds: null }] }] };
    const response = await PATCH(buildRequest("msg-1", { savedWorkout }), {
      params: Promise.resolve({ messageId: "msg-1" })
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.workoutDraft.savedWorkout).toEqual(savedWorkout);
    expect(json.workoutDraft.exercises).toEqual(existingPayload.workoutDraft.exercises);
    expect(update).toHaveBeenCalledWith({
      structured_payload: expect.objectContaining({
        workoutDraft: expect.objectContaining({ savedWorkout })
      })
    });
  });
});
