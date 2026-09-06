import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getSupabasePublicKey } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseBearerClient(accessToken: string) {
  const env = getPublicEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    getSupabasePublicKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
}
