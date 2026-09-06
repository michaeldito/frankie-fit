import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see
// packages/dashboard-core/dashboard.ts for the same known IOU and its rationale.
import type { Database } from '../../../apps/web/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasMobileSupabaseEnv = Boolean(supabaseUrl && supabasePublishableKey);

if (!hasMobileSupabaseEnv) {
  console.warn('Missing Expo Supabase environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabasePublishableKey ?? '', {
  auth: {
    storage: globalThis.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
