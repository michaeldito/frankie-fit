import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv, getSupabasePublicKey } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always mutate cookies directly.
          }
        }
      }
    }
  );
}
