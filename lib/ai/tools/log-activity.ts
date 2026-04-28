import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ParsedActivity } from "@/lib/chat";
import { resolveRelativeLoggedForDate } from "@/lib/ai/tools/shared";

type SupabaseServerClient = SupabaseClient<Database>;

export async function logActivityEntries(input: {
  supabase: SupabaseServerClient;
  userId: string;
  sourceMessageId: string;
  entries: ParsedActivity[];
  extractionSource: "model" | "rule_based";
}) {
  if (input.entries.length === 0) {
    return;
  }

  const { error } = await input.supabase.from("activity_logs").insert(
    input.entries.map((activity, index) => ({
      user_id: input.userId,
      source_message_id: input.sourceMessageId,
      activity_type: activity.activityType,
      description: activity.description,
      duration_minutes: activity.durationMinutes,
      intensity: activity.intensity,
      logged_for_date: resolveRelativeLoggedForDate(activity.loggedFor),
      metadata_json: {
        extractionSource: input.extractionSource,
        detectedKeyword: activity.detectedKeyword,
        segmentIndex: index,
        loggedFor: activity.loggedFor
      }
    }))
  );

  if (error) {
    throw new Error(error.message);
  }
}
