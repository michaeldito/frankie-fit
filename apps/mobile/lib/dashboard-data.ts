import { supabase } from '@/lib/supabase';
import type { AppProfile } from '@/lib/profile-data';
import {
  computeDashboardData,
  createEmptyActivityDashboard,
  createEmptyDietDashboard,
  createEmptyWellnessDashboard,
  getSinceDateKey,
  type DashboardMetric,
  type DashboardNextStep,
  type DashboardRecentItem,
  type DashboardTrendPoint,
  type DietDashboardData,
  type ExerciseDashboardData,
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
  WellnessDashboardData,
  WellnessTrendPoint,
};

export type DashboardData = {
  diet: DietDashboardData;
  error: string | null;
  exercise: ExerciseDashboardData;
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
    message.includes('public.wellness_checkins')
  );
}

export async function getDashboardData(userId: string, profile: AppProfile | null): Promise<DashboardData> {
  const emptyExercise = createEmptyActivityDashboard();
  const emptyDiet = createEmptyDietDashboard();
  const emptyWellness = createEmptyWellnessDashboard();
  const sinceDateKey = getSinceDateKey(30);

  const [activityResult, dietResult, wellnessResult] = await Promise.all([
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
  ]);

  const firstError =
    activityResult.error?.message ??
    dietResult.error?.message ??
    wellnessResult.error?.message ??
    null;
  const ready = !isMissingDashboardTable(firstError);
  const activityLogs = activityResult.data ?? [];
  const dietLogs = dietResult.data ?? [];
  const wellnessCheckins = wellnessResult.data ?? [];

  if (!ready) {
    return {
      diet: emptyDiet,
      error: firstError,
      exercise: emptyExercise,
      nextStep: computeDashboardData(profile, [], [], []).nextStep,
      ready,
      wellness: emptyWellness,
    };
  }

  const computed = computeDashboardData(profile, activityLogs, dietLogs, wellnessCheckins);

  return {
    diet: computed.diet,
    error: firstError,
    exercise: computed.exercise,
    nextStep: computed.nextStep,
    ready,
    wellness: computed.wellness,
  };
}
