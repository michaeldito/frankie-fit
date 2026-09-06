import { supabase } from '@/lib/supabase';
// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see
// packages/dashboard-core/dashboard.ts for the same known IOU and its rationale.
import type { Database } from '../../../apps/web/types/database';
import { formatList, formatScheduleNotes, getAccountLabel, getDisplayName } from '@frankie-fit/profile-core';

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
