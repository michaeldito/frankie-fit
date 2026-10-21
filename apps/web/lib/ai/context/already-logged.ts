import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, fromDateKey, getPacificDateKey, toDateKey } from "@frankie-fit/dashboard-core";
import type { Database } from "@/types/database";

export type AlreadyLoggedEntry = {
  pillar: "activity" | "diet" | "lifestyle";
  loggedForDate: string;
  summary: string;
};

const MAX_ENTRIES_PER_PILLAR = 8;

function joinDetails(parts: (string | null | undefined)[]) {
  const present = parts.map((part) => part?.trim()).filter(Boolean);
  return present.length > 0 ? ` (${present.join(", ")})` : "";
}

/**
 * Today's and yesterday's saved logs, summarized for the extraction prompt so it can tell a
 * reference back to something already logged ("I lifted earlier, remember?") from a new log.
 */
export async function loadAlreadyLoggedEntries(input: {
  supabase: SupabaseClient<Database>;
  userId: string;
  todayKey?: string;
}): Promise<AlreadyLoggedEntry[]> {
  const todayKey = input.todayKey ?? getPacificDateKey();
  const sinceKey = toDateKey(addDays(fromDateKey(todayKey), -1));

  const [activities, meals, lifestyle] = await Promise.all([
    input.supabase
      .from("activity_logs")
      .select("activity_type, description, intensity, duration_minutes, logged_for_date")
      .eq("user_id", input.userId)
      .gte("logged_for_date", sinceKey)
      .order("created_at", { ascending: true })
      .limit(MAX_ENTRIES_PER_PILLAR),
    input.supabase
      .from("diet_logs")
      .select("description, meal_type, logged_for_date")
      .eq("user_id", input.userId)
      .gte("logged_for_date", sinceKey)
      .order("created_at", { ascending: true })
      .limit(MAX_ENTRIES_PER_PILLAR),
    input.supabase
      .from("lifestyle_logs")
      .select("description, category, logged_for_date")
      .eq("user_id", input.userId)
      .gte("logged_for_date", sinceKey)
      .order("created_at", { ascending: true })
      .limit(MAX_ENTRIES_PER_PILLAR)
  ]);

  // This context only improves extraction; if it can't load, the turn proceeds without it.
  return [
    ...(activities.data ?? []).map((row) => ({
      pillar: "activity" as const,
      loggedForDate: row.logged_for_date,
      summary: `${row.activity_type}${joinDetails([
        row.description && row.description !== row.activity_type ? row.description : null,
        row.intensity,
        row.duration_minutes ? `${row.duration_minutes} min` : null
      ])}`
    })),
    ...(meals.data ?? []).map((row) => ({
      pillar: "diet" as const,
      loggedForDate: row.logged_for_date,
      summary: `${row.meal_type && row.meal_type !== "unknown" ? `${row.meal_type}: ` : ""}${row.description}`
    })),
    ...(lifestyle.data ?? []).map((row) => ({
      pillar: "lifestyle" as const,
      loggedForDate: row.logged_for_date,
      summary: `${row.category}: ${row.description}`
    }))
  ];
}

export function formatAlreadyLoggedEntries(entries: AlreadyLoggedEntry[], todayKey: string): string {
  return entries
    .map((entry) => `- ${entry.loggedForDate === todayKey ? "today" : entry.loggedForDate} · ${entry.pillar}: ${entry.summary}`)
    .join("\n");
}
