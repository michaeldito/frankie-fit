import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Database } from '../../../types/database';

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

export function getDisplayName(user: User | null, profile: AppProfile | null) {
  const metadataName =
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;

  return (
    profile?.full_name?.trim() ||
    metadataName?.trim() ||
    user?.email?.split('@')[0] ||
    'Frankie Fit member'
  );
}

export function getAccountLabel(accountType: string | null | undefined) {
  switch (accountType) {
    case 'admin':
      return 'Admin account';
    case 'internal_test':
    case 'test':
      return 'Internal test account';
    case 'synthetic_demo':
    case 'synthetic':
      return 'Synthetic demo account';
    default:
      return 'Frankie Fit member';
  }
}

export function formatList(values: string[] | null | undefined, fallback = 'Not set yet') {
  return values && values.length > 0 ? values.join(', ') : fallback;
}

export function formatScheduleNotes(profile: AppProfile | null | undefined) {
  const schedule = profile?.preferred_schedule;
  const notes =
    schedule && typeof schedule === 'object' && !Array.isArray(schedule) && typeof schedule.notes === 'string'
      ? schedule.notes.trim()
      : '';

  return notes || 'Not set yet';
}
