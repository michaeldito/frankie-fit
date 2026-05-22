import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ParsedDietEntry } from "@/lib/chat";
import { resolveLoggedForDate } from "@/lib/ai/tools/shared";

type SupabaseServerClient = SupabaseClient<Database>;

export async function logDietEntries(input: {
  supabase: SupabaseServerClient;
  userId: string;
  sourceMessageId: string;
  entries: ParsedDietEntry[];
  extractionSource: "model" | "rule_based";
}) {
  if (input.entries.length === 0) {
    return [] as string[];
  }

  const { data, error } = await input.supabase
    .from("diet_logs")
    .insert(
      input.entries.map((entry, index) => ({
        user_id: input.userId,
        source_message_id: input.sourceMessageId,
        description: entry.description,
        meal_type: entry.mealType,
        confidence: entry.confidence,
        logged_for_date: resolveLoggedForDate(entry.loggedForDate),
        metadata_json: {
          extractionSource: input.extractionSource,
          detectedKeyword: entry.detectedKeyword,
          segmentIndex: index,
          timeReferenceText: entry.timeReferenceText,
          loggedForDate: entry.loggedForDate
        }
      }))
    )
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id);
}
