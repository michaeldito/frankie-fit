import type { AppProfile, CurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  type WellnessTrendPoint
} from "../packages/dashboard-core";

export type {
  DashboardMetric,
  DashboardNextStep,
  DashboardRecentItem,
  DashboardTrendPoint,
  DietDashboardData,
  ExerciseDashboardData,
  LifestyleDashboardData,
  WellnessDashboardData,
  WellnessTrendPoint
};

export type DashboardData = {
  ready: boolean;
  error: string | null;
  exercise: ExerciseDashboardData;
  diet: DietDashboardData;
  lifestyle: LifestyleDashboardData;
  wellness: WellnessDashboardData;
  nextStep: DashboardNextStep;
};

function buildEmptyNextStep(profile: AppProfile | null): DashboardNextStep {
  return computeDashboardData(profile, [], [], []).nextStep;
}

function isMissingDashboardTable(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    message.includes("public.activity_logs") ||
    message.includes("public.diet_logs") ||
    message.includes("public.lifestyle_logs") ||
    message.includes("public.wellness_checkins")
  );
}

export async function getDashboardData(context: CurrentAppContext): Promise<DashboardData> {
  const emptyExercise = createEmptyActivityDashboard();
  const emptyDiet = createEmptyDietDashboard();
  const emptyLifestyle = createEmptyLifestyleDashboard();
  const emptyWellness = createEmptyWellnessDashboard();
  const emptyNextStep = buildEmptyNextStep(context.profile);

  if (!context.schemaReady || !context.user) {
    return {
      ready: false,
      error: context.error,
      exercise: emptyExercise,
      diet: emptyDiet,
      lifestyle: emptyLifestyle,
      wellness: emptyWellness,
      nextStep: emptyNextStep
    };
  }

  const supabase = await createSupabaseServerClient();
  const sinceDateKey = getSinceDateKey(30);

  const [activityResult, dietResult, lifestyleResult, wellnessResult] = await Promise.all([
    supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", context.user.id)
      .gte("logged_for_date", sinceDateKey)
      .order("logged_for_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("diet_logs")
      .select("*")
      .eq("user_id", context.user.id)
      .gte("logged_for_date", sinceDateKey)
      .order("logged_for_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("lifestyle_logs")
      .select("*")
      .eq("user_id", context.user.id)
      .gte("logged_for_date", sinceDateKey)
      .order("logged_for_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("wellness_checkins")
      .select("*")
      .eq("user_id", context.user.id)
      .gte("logged_for_date", sinceDateKey)
      .order("logged_for_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80)
  ]);

  const firstError =
    activityResult.error?.message ??
    dietResult.error?.message ??
    lifestyleResult.error?.message ??
    wellnessResult.error?.message ??
    null;
  const dashboardReady = !isMissingDashboardTable(firstError);
  const activityLogs = activityResult.data ?? [];
  const dietLogs = dietResult.data ?? [];
  const lifestyleLogs = lifestyleResult.data ?? [];
  const wellnessCheckins = wellnessResult.data ?? [];

  const computed = computeDashboardData(
    context.profile,
    activityLogs,
    dietLogs,
    wellnessCheckins,
    lifestyleLogs
  );

  return {
    ready: dashboardReady,
    error: firstError,
    ...computed
  };
}

export async function getSuggestedNextStep(context: CurrentAppContext) {
  const dashboardData = await getDashboardData(context);
  return dashboardData.nextStep;
}
