import { supabase } from '@/lib/supabase';
import type { Database } from '../../../types/database';
import { formatList, formatScheduleNotes, getAccountLabel, getDisplayName } from '../../../packages/profile-core';

export { formatList, formatScheduleNotes, getAccountLabel, getDisplayName };

export type AppProfile = Database['public']['Tables']['profiles']['Row'];

export type ProfileLoadResult = {
  error: string | null;
  profile: AppProfile | null;
};

export async function loadProfile(userId: string): Promise<ProfileLoadResult> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  return {
    error: error?.message ?? null,
    profile: data ?? null,
  };
}
