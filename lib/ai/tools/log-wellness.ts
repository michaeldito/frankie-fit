import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ParsedWellnessCheckin } from "@/lib/chat";
import { resolveRelativeLoggedForDate } from "@/lib/ai/tools/shared";

type SupabaseServerClient = SupabaseClient<Database>;

export async function logWellnessCheckin(input: {
  supabase: SupabaseServerClient;
  userId: string;
  sourceMessageId: string;
  entry: ParsedWellnessCheckin | null;
  extractionSource: "model" | "rule_based";
}) {
  if (!input.entry) {
    return;
  }

  const { error } = await input.supabase.from("wellness_checkins").insert({
    user_id: input.userId,
    source_message_id: input.sourceMessageId,
    energy_score: input.entry.energyScore,
    soreness_score: input.entry.sorenessScore,
    mood_score: input.entry.moodScore,
    stress_score: input.entry.stressScore,
    motivation_score: input.entry.motivationScore,
    notes: input.entry.notes,
    logged_for_date: resolveRelativeLoggedForDate(input.entry.loggedFor)
  });

  if (error) {
    throw new Error(error.message);
  }
}
