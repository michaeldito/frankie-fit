import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type SupabaseServerClient = SupabaseClient<Database>;

export async function enrollInProgram(input: {
  supabase: SupabaseServerClient;
  userId: string;
  programSlug: string;
  startDate: string;
}): Promise<void> {
  const { supabase, userId, programSlug, startDate } = input;

  const { error } = await supabase
    .from("program_enrollments")
    .upsert(
      { user_id: userId, program_slug: programSlug, start_date: startDate },
      { onConflict: "user_id,program_slug" }
    );

  if (error) {
    throw new Error(error.message);
  }
}
