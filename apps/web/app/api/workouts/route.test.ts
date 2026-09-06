import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { CurrentAppContext } from "@/lib/profile";

const { getCurrentAppContext, saveWorkoutSession, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentAppContext: vi.fn(),
  saveWorkoutSession: vi.fn(),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/profile", () => ({ getCurrentAppContext }));
vi.mock("@/lib/workouts/save-workout-session", () => ({ saveWorkoutSession }));
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

function validSessionBody() {
  return {
    sessionType: "simple",
    title: "Morning lift",
    notes: null,
    wodTemplateSlug: null,
    roundsCount: null,
    forTime: false,
    totalTimeSeconds: null,
    loggedForDate: "2026-01-01",
    weightUnit: "lb",
    exercises: [
      {
        exerciseSlug: "back-squat",
        exerciseName: "Back Squat",
        position: 0,
        sets: [{ setNumber: 1, reps: 5, weight: 135, durationSeconds: null }]
      }
    ],
    programSlug: null,
    programDay: null
  };
}

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/workouts", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function importRoute() {
  return import("./route");
}

describe("POST /api/workouts", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext({ user: null }));
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validSessionBody()));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Log in to continue." });
    expect(saveWorkoutSession).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid session", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const { POST } = await importRoute();

    const body = validSessionBody();
    body.exercises = [];

    const response = await POST(buildRequest(body));

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(typeof json.error).toBe("string");
    expect(saveWorkoutSession).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("saves the session and returns 201 with the new id", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    const supabaseClient = { from: vi.fn() };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    saveWorkoutSession.mockResolvedValue("session-123");
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validSessionBody()));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "session-123" });
    expect(saveWorkoutSession).toHaveBeenCalledWith({
      supabase: supabaseClient,
      userId: "user-1",
      session: expect.objectContaining({ title: "Morning lift" })
    });
  });

  it("returns 500 with the error message when saveWorkoutSession throws an Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    saveWorkoutSession.mockRejectedValue(new Error("db is down"));
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validSessionBody()));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "db is down" });
  });

  it("returns 500 with the fallback message when saveWorkoutSession rejects with a non-Error", async () => {
    getCurrentAppContext.mockResolvedValue(readyContext());
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    saveWorkoutSession.mockRejectedValue("boom");
    const { POST } = await importRoute();

    const response = await POST(buildRequest(validSessionBody()));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Could not save the workout session." });
  });
});
