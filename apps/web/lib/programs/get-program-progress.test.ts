import { describe, expect, it, vi } from "vitest";
import type { CurrentAppContext } from "@/lib/profile";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

async function importGetProgramProgress() {
  return (await import("./get-program-progress")).getProgramProgress;
}

function readyContext(): CurrentAppContext {
  return {
    schemaReady: true,
    user: { id: "user-1" }
  } as CurrentAppContext;
}

function queryBuilder(result: { data: unknown }) {
  const builder: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    not: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: (onFulfilled: (value: { data: unknown }) => unknown) => Promise<unknown>;
  } = {
    select: vi.fn(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled)
  };
  builder.select.mockReturnValue(builder);
  return builder;
}

describe("getProgramProgress", () => {
  it("returns empty progress when the schema isn't ready or there's no user", async () => {
    const getProgramProgress = await importGetProgramProgress();

    await expect(
      getProgramProgress({ schemaReady: false, user: { id: "user-1" } } as CurrentAppContext, "p90x")
    ).resolves.toEqual({ startDate: null, completedDays: [] });

    await expect(
      getProgramProgress({ schemaReady: true, user: null } as CurrentAppContext, "p90x")
    ).resolves.toEqual({ startDate: null, completedDays: [] });

    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("dedupes and sorts completed program days", async () => {
    const getProgramProgress = await importGetProgramProgress();
    const enrollmentBuilder = queryBuilder({ data: { start_date: "2026-01-01" } });
    const sessionsBuilder = queryBuilder({
      data: [{ program_day: 3 }, { program_day: 1 }, { program_day: 3 }, { program_day: null }]
    });

    const from = vi
      .fn()
      .mockReturnValueOnce(enrollmentBuilder)
      .mockReturnValueOnce(sessionsBuilder);
    createSupabaseServerClient.mockResolvedValue({ from });

    const result = await getProgramProgress(readyContext(), "p90x");

    expect(result).toEqual({ startDate: "2026-01-01", completedDays: [1, 3] });
  });

  it("defaults startDate to null when there's no enrollment", async () => {
    const getProgramProgress = await importGetProgramProgress();
    const enrollmentBuilder = queryBuilder({ data: null });
    const sessionsBuilder = queryBuilder({ data: [] });

    const from = vi
      .fn()
      .mockReturnValueOnce(enrollmentBuilder)
      .mockReturnValueOnce(sessionsBuilder);
    createSupabaseServerClient.mockResolvedValue({ from });

    const result = await getProgramProgress(readyContext(), "p90x");

    expect(result).toEqual({ startDate: null, completedDays: [] });
  });
});
