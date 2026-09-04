import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ParsedActivity } from "@/lib/chat";
import { resolveLoggedForDate } from "@/lib/ai/tools/shared";

type SupabaseServerClient = SupabaseClient<Database>;

export async function logActivityEntries(input: {
  supabase: SupabaseServerClient;
  userId: string;
  sourceMessageId: string;
  entries: ParsedActivity[];
  extractionSource: "model" | "unavailable";
}) {
  if (input.entries.length === 0) {
    return [] as string[];
  }

  const { data, error } = await input.supabase
    .from("activity_logs")
    .insert(
      input.entries.map((activity, index) => ({
        user_id: input.userId,
        source_message_id: input.sourceMessageId,
        activity_type: activity.activityType,
        description: activity.description,
        duration_minutes: activity.durationMinutes,
        intensity: activity.intensity,
        logged_for_date: resolveLoggedForDate(activity.loggedForDate),
        metadata_json: {
          extractionSource: input.extractionSource,
          detectedKeyword: activity.detectedKeyword,
          segmentIndex: index,
          loggedForDate: activity.loggedForDate
        }
      }))
    )
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id);
}
