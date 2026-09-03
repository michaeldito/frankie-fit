import type { CurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProgramProgress = {
  startDate: string | null;
  completedDays: number[];
};

export async function getProgramProgress(
  context: CurrentAppContext,
  programSlug: string
): Promise<ProgramProgress> {
  if (!context.schemaReady || !context.user) {
    return { startDate: null, completedDays: [] };
  }

  const supabase = await createSupabaseServerClient();
  const userId = context.user.id;

  const [{ data: enrollment }, { data: sessions }] = await Promise.all([
    supabase
      .from("program_enrollments")
      .select("start_date")
      .eq("user_id", userId)
      .eq("program_slug", programSlug)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("program_day")
      .eq("user_id", userId)
      .eq("program_slug", programSlug)
      .not("program_day", "is", null)
  ]);

  const completedDays = Array.from(
    new Set(
      (sessions ?? [])
        .map((session) => session.program_day)
        .filter((day): day is number => day !== null)
    )
  ).sort((a, b) => a - b);

  return { startDate: enrollment?.start_date ?? null, completedDays };
}
