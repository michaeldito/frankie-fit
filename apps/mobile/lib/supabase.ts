import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../../types/database';

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
