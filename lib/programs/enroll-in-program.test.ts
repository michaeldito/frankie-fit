import { describe, expect, it, vi } from "vitest";
import { enrollInProgram } from "./enroll-in-program";

function fakeSupabase(upsertResult: { error: { message: string } | null }) {
  const upsert = vi.fn().mockResolvedValue(upsertResult);
  const from = vi.fn().mockReturnValue({ upsert });
  return { client: { from } as never, upsert, from };
}

describe("enrollInProgram", () => {
  it("upserts on the user/program conflict target", async () => {
    const { client, upsert, from } = fakeSupabase({ error: null });

    await enrollInProgram({
      supabase: client,
      userId: "user-1",
      programSlug: "p90x",
      startDate: "2026-01-15"
    });

    expect(from).toHaveBeenCalledWith("program_enrollments");
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", program_slug: "p90x", start_date: "2026-01-15" },
      { onConflict: "user_id,program_slug" }
    );
  });

  it("throws when the upsert fails", async () => {
    const { client } = fakeSupabase({ error: { message: "constraint violation" } });

    await expect(
      enrollInProgram({
        supabase: client,
        userId: "user-1",
        programSlug: "p90x",
        startDate: "2026-01-15"
      })
    ).rejects.toThrow("constraint violation");
  });
});
