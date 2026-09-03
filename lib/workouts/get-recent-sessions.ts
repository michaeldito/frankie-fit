import type { CurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatShortDate } from "../../packages/dashboard-core";

export type RecentWorkoutSession = {
  id: string;
  dateLabel: string;
  title: string;
  detail: string;
};

const RECENT_SESSIONS_LIMIT = 10;

export async function getRecentWorkoutSessions(
  context: CurrentAppContext
): Promise<RecentWorkoutSession[]> {
  if (!context.schemaReady || !context.user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, title, session_type, rounds_count, for_time, logged_for_date")
    .eq("user_id", context.user.id)
    .order("logged_for_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(RECENT_SESSIONS_LIMIT);

  if (sessionsError || !sessions || sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);
  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("session_id, exercise_name, position")
    .in("session_id", sessionIds)
    .order("position", { ascending: true });

  const exerciseNamesBySessionId = new Map<string, string[]>();

  for (const exercise of exercises ?? []) {
    const names = exerciseNamesBySessionId.get(exercise.session_id) ?? [];
    names.push(exercise.exercise_name);
    exerciseNamesBySessionId.set(exercise.session_id, names);
  }

  return sessions.map((session) => {
    const exerciseNames = exerciseNamesBySessionId.get(session.id) ?? [];
    const detail =
      session.session_type === "circuit"
        ? `${exerciseNames.join(" + ")}${session.rounds_count ? ` · ${session.rounds_count} rounds` : ""}${
            session.for_time ? ", for time" : ""
          }`
        : exerciseNames.join(", ");

    return {
      id: session.id,
      dateLabel: formatShortDate(session.logged_for_date),
      title: session.title?.trim() || exerciseNames[0] || "Workout",
      detail: detail || "Logged workout"
    };
  });
}
