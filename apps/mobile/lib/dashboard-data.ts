import { supabase } from '@/lib/supabase';
import type { AppProfile } from '@/lib/profile-data';
import {
  computeDashboardData,
  createEmptyActivityDashboard,
  createEmptyDietDashboard,
  createEmptyLifestyleDashboard,
  createEmptyWellnessDashboard,
  getSinceDateKey,
  type DashboardMetric,
  type DashboardNextStep,
  type DashboardRecentItem,
  type DashboardTrendPoint,
  type DietDashboardData,
  type ExerciseDashboardData,
  type LifestyleDashboardData,
  type WellnessDashboardData,
  type WellnessTrendPoint,
} from '@frankie-fit/dashboard-core';

export type {
  DashboardMetric,
  DashboardNextStep,
  DashboardRecentItem,
  DashboardTrendPoint,
  DietDashboardData,
  ExerciseDashboardData,
  LifestyleDashboardData,
  WellnessDashboardData,
  WellnessTrendPoint,
};

export type DashboardData = {
  diet: DietDashboardData;
  error: string | null;
  exercise: ExerciseDashboardData;
  lifestyle: LifestyleDashboardData;
  nextStep: DashboardNextStep;
  ready: boolean;
  wellness: WellnessDashboardData;
};

function isMissingDashboardTable(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    message.includes('public.activity_logs') ||
    message.includes('public.diet_logs') ||
    message.includes('public.wellness_checkins') ||
    message.includes('public.lifestyle_logs')
  );
}

export async function getDashboardData(userId: string, profile: AppProfile | null): Promise<DashboardData> {
  const emptyExercise = createEmptyActivityDashboard();
  const emptyDiet = createEmptyDietDashboard();
  const emptyLifestyle = createEmptyLifestyleDashboard();
  const emptyWellness = createEmptyWellnessDashboard();
  const sinceDateKey = getSinceDateKey(30);

  const [activityResult, dietResult, wellnessResult, lifestyleResult] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_for_date', sinceDateKey)
      .order('logged_for_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('diet_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_for_date', sinceDateKey)
      .order('logged_for_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(120),
    supabase
      .from('wellness_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_for_date', sinceDateKey)
      .order('logged_for_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('lifestyle_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_for_date', sinceDateKey)
      .order('logged_for_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(80),
  ]);

  const firstError =
    activityResult.error?.message ??
    dietResult.error?.message ??
    wellnessResult.error?.message ??
    lifestyleResult.error?.message ??
    null;
  const ready = !isMissingDashboardTable(firstError);
  const activityLogs = activityResult.data ?? [];
  const dietLogs = dietResult.data ?? [];
  const wellnessCheckins = wellnessResult.data ?? [];
  const lifestyleLogs = lifestyleResult.data ?? [];

  if (!ready) {
    return {
      diet: emptyDiet,
      error: firstError,
      exercise: emptyExercise,
      lifestyle: emptyLifestyle,
      nextStep: computeDashboardData(profile, [], [], []).nextStep,
      ready,
      wellness: emptyWellness,
    };
  }

  const computed = computeDashboardData(profile, activityLogs, dietLogs, wellnessCheckins, lifestyleLogs);

  return {
    diet: computed.diet,
    error: firstError,
    exercise: computed.exercise,
    lifestyle: computed.lifestyle,
    nextStep: computed.nextStep,
    ready,
    wellness: computed.wellness,
  };
}
