import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ParsedLifestyleEntry } from "@/lib/chat";
import { resolveLoggedForDate } from "@/lib/ai/tools/shared";

type SupabaseServerClient = SupabaseClient<Database>;

export async function logLifestyleEntries(input: {
  supabase: SupabaseServerClient;
  userId: string;
  sourceMessageId: string;
  entries: ParsedLifestyleEntry[];
  extractionSource: "model" | "unavailable";
}) {
  if (input.entries.length === 0) {
    return [] as string[];
  }

  const { data, error } = await input.supabase
    .from("lifestyle_logs")
    .insert(
      input.entries.map((entry, index) => ({
        user_id: input.userId,
        source_message_id: input.sourceMessageId,
        description: entry.description,
        category: entry.category ?? "other",
        logged_for_date: resolveLoggedForDate(entry.loggedForDate),
        metadata_json: {
          extractionSource: input.extractionSource,
          detectedKeyword: entry.detectedKeyword,
          segmentIndex: index,
          confidence: entry.confidence,
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
