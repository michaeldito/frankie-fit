import type { AppProfile, CurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
type DietLogRow = Database["public"]["Tables"]["diet_logs"]["Row"];
type WellnessCheckinRow = Database["public"]["Tables"]["wellness_checkins"]["Row"];

export type DashboardNextStep = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
};

export type DashboardTrendPoint = {
  label: string;
  value: number;
};

export type DashboardRecentItem = {
  id: string;
  title: string;
  detail: string;
  dateLabel: string;
};

export type ExerciseDashboardData = {
  metrics: DashboardMetric[];
  trend: DashboardTrendPoint[];
  breakdown: Array<{ label: string; value: number }>;
  recent: DashboardRecentItem[];
  insight: string;
  empty: boolean;
};

export type DietDashboardData = {
  metrics: DashboardMetric[];
  patterns: Array<{ label: string; value: number }>;
  recent: DashboardRecentItem[];
  insight: string;
  empty: boolean;
};

export type WellnessTrendPoint = {
  label: string;
  energy: number | null;
  soreness: number | null;
  stress: number | null;
  motivation: number | null;
};

export type WellnessDashboardData = {
  metrics: DashboardMetric[];
  trend: WellnessTrendPoint[];
  recent: DashboardRecentItem[];
  insight: string;
  empty: boolean;
};

export type DashboardData = {
  ready: boolean;
  error: string | null;
  exercise: ExerciseDashboardData;
  diet: DietDashboardData;
  wellness: WellnessDashboardData;
  nextStep: DashboardNextStep;
};

function createDateAtLocalMidnight(value?: Date) {
  const nextValue = value ? new Date(value) : new Date();
  nextValue.setHours(0, 0, 0, 0);
  return nextValue;
}

function addDays(value: Date, amount: number) {
  const nextValue = new Date(value);
  nextValue.setDate(nextValue.getDate() + amount);
  return nextValue;
}

function getWeekStart(value?: Date) {
  const today = createDateAtLocalMidnight(value);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(today, diff);
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatShortDay(value: string) {
  return fromDateKey(value).toLocaleDateString("en-US", { weekday: "short" });
}

function formatShortDate(value: string) {
  return fromDateKey(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function capitalizeLabel(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function average(values: Array<number | null | undefined>) {
  const validValues = values.filter((value): value is number => typeof value === "number");

  if (validValues.length === 0) {
    return null;
  }

  const total = validValues.reduce((sum, value) => sum + value, 0);
  return total / validValues.length;
}

function createEmptyActivityDashboard(): ExerciseDashboardData {
  return {
    metrics: [
      { label: "Workouts", value: "0" },
      { label: "Active days", value: "0" },
      { label: "Minutes", value: "0" }
    ],
    trend: [],
    breakdown: [],
    recent: [],
    insight:
      "No exercise has been logged yet. A short walk, quick lift, or brief mobility session is enough to start the picture.",
    empty: true
  };
}

function createEmptyDietDashboard(): DietDashboardData {
  return {
    metrics: [
      { label: "Meals logged", value: "0" },
      { label: "Days with logs", value: "0" },
      { label: "Most logged", value: "None yet" }
    ],
    patterns: [],
    recent: [],
    insight:
      "No food has been logged yet. Even one simple meal update gives Frankie a much better read on your routine.",
    empty: true
  };
}

function createEmptyWellnessDashboard(): WellnessDashboardData {
  return {
    metrics: [
      { label: "Check-ins", value: "0" },
      { label: "Energy", value: "No data" },
      { label: "Recovery", value: "No data" }
    ],
    trend: [],
    recent: [],
    insight:
      "No wellness check-ins are saved yet. A quick energy, stress, or soreness update will make Frankie much more useful.",
    empty: true
  };
}

function getScoreDescriptor(
  score: number | null,
  options: [string, string, string, string, string]
) {
  if (score === null) {
    return "No data";
  }

  const roundedScore = Math.max(1, Math.min(5, Math.round(score)));
  return options[roundedScore - 1];
}

function getEnergyLabel(score: number | null) {
  return getScoreDescriptor(score, [
    "Very low",
    "Low",
    "Steady",
    "Solid",
    "High"
  ]);
}

function getRecoveryLabel(score: number | null) {
  return getScoreDescriptor(score, [
    "Fresh",
    "Light strain",
    "Moderate strain",
    "High strain",
    "Heavy strain"
  ]);
}

function formatActivityDetail(activity: ActivityLogRow) {
  const segments: string[] = [];

  if (activity.duration_minutes) {
    segments.push(`${activity.duration_minutes} min`);
  }

  if (activity.intensity) {
    segments.push(activity.intensity);
  }

  if (activity.description && activity.description !== activity.activity_type) {
    segments.push(activity.description);
  }

  return segments.join(" • ") || "Logged through chat";
}

function formatDietDetail(entry: DietLogRow) {
  const mealType = entry.meal_type ? `${capitalizeLabel(entry.meal_type, "Meal")} • ` : "";
  return `${mealType}${entry.description}`;
}

function formatWellnessDetail(entry: WellnessCheckinRow) {
  const segments: string[] = [];

  if (entry.energy_score !== null) {
    segments.push(`Energy ${entry.energy_score}/5`);
  }

  if (entry.stress_score !== null) {
    segments.push(`Stress ${entry.stress_score}/5`);
  }

  if (entry.motivation_score !== null) {
    segments.push(`Motivation ${entry.motivation_score}/5`);
  }

  if (entry.soreness_score !== null) {
    segments.push(`Soreness ${entry.soreness_score}/5`);
  }

  return entry.notes?.trim() || segments.join(" • ") || "Wellness check-in";
}

function buildActivityTrend(activityLogs: ActivityLogRow[]) {
  const today = createDateAtLocalMidnight();
  const trendMap = new Map<string, number>();

  activityLogs.forEach((activity) => {
    trendMap.set(activity.logged_for_date, (trendMap.get(activity.logged_for_date) ?? 0) + 1);
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const dateKey = toDateKey(date);

    return {
      label: formatShortDay(dateKey),
      value: trendMap.get(dateKey) ?? 0
    };
  });
}

function buildWellnessTrend(wellnessCheckins: WellnessCheckinRow[]): WellnessTrendPoint[] {
  const today = createDateAtLocalMidnight();
  const groupedByDay = new Map<string, WellnessCheckinRow[]>();

  wellnessCheckins.forEach((checkin) => {
    const group = groupedByDay.get(checkin.logged_for_date) ?? [];
    group.push(checkin);
    groupedByDay.set(checkin.logged_for_date, group);
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const dateKey = toDateKey(date);
    const dayEntries = groupedByDay.get(dateKey) ?? [];

    return {
      label: formatShortDay(dateKey),
      energy: average(dayEntries.map((entry) => entry.energy_score)),
      soreness: average(dayEntries.map((entry) => entry.soreness_score)),
      stress: average(dayEntries.map((entry) => entry.stress_score)),
      motivation: average(dayEntries.map((entry) => entry.motivation_score))
    };
  });
}

function buildExerciseInsight(
  profile: AppProfile | null,
  activityLogs: ActivityLogRow[],
  workoutsThisWeek: number,
  activeDaysThisWeek: number
) {
  if (activityLogs.length === 0) {
    return createEmptyActivityDashboard().insight;
  }

  const targetTrainingDays = profile?.target_training_days ?? 3;
  const activityBreakdown = activityLogs.reduce<Map<string, number>>((map, log) => {
    map.set(log.activity_type, (map.get(log.activity_type) ?? 0) + 1);
    return map;
  }, new Map());
  const topActivity = Array.from(activityBreakdown.entries()).sort((left, right) => right[1] - left[1])[0];

  if (workoutsThisWeek < Math.min(targetTrainingDays, 2)) {
    return `You have some movement logged, but consistency is still the opening. A couple more sessions this week would make Frankie's guidance much sharper.`;
  }

  if (activeDaysThisWeek >= targetTrainingDays) {
    return `You are matching your current training target. The move now is staying steady instead of forcing extra volume just for the sake of it.`;
  }

  if (topActivity) {
    return `Most of your recent training is ${topActivity[0].toLowerCase()}. That gives Frankie a clear read, and adding one complementary session could round the week out well.`;
  }

  return "Your activity picture is starting to take shape. Keep logging the basics and Frankie can get more precise about what to do next.";
}

function buildDietInsight(dietLogs: DietLogRow[], daysWithFoodLogs: number) {
  if (dietLogs.length === 0) {
    return createEmptyDietDashboard().insight;
  }

  const mealBreakdown = dietLogs.reduce<Map<string, number>>((map, log) => {
    const label = log.meal_type ?? "unlabeled";
    map.set(label, (map.get(label) ?? 0) + 1);
    return map;
  }, new Map());
  const topMeal = Array.from(mealBreakdown.entries()).sort((left, right) => right[1] - left[1])[0];

  if (daysWithFoodLogs <= 2) {
    return "You are starting to build nutrition visibility, but the biggest win right now is simply logging meals on more days rather than chasing detail.";
  }

  if (topMeal?.[0] === "snack") {
    return "Most of your recent food logs are snack-like entries. A couple more full meal logs would give Frankie a more grounded read on the rhythm of your week.";
  }

  if (topMeal && topMeal[0] !== "unlabeled") {
    return `Your logging rhythm is getting more useful. ${capitalizeLabel(topMeal[0], "Meal")} is showing up most often, so Frankie can start nudging the rest of the day around that pattern.`;
  }

  return "You have enough meal data for Frankie to start spotting patterns. Keep the updates simple and consistent.";
}

function buildWellnessInsight(wellnessCheckins: WellnessCheckinRow[]) {
  if (wellnessCheckins.length === 0) {
    return createEmptyWellnessDashboard().insight;
  }

  const recentCheckins = wellnessCheckins.slice(0, 7);
  const averageEnergy = average(recentCheckins.map((entry) => entry.energy_score));
  const averageStress = average(recentCheckins.map((entry) => entry.stress_score));
  const averageMotivation = average(recentCheckins.map((entry) => entry.motivation_score));
  const averageSoreness = average(recentCheckins.map((entry) => entry.soreness_score));

  if ((averageEnergy ?? 5) <= 2.5 && (averageMotivation ?? 5) <= 2.5) {
    return "Energy and motivation both look a little low lately. That usually points to backing off the pressure and keeping the next move simple.";
  }

  if ((averageStress ?? 1) >= 4) {
    return "Stress is running high enough that recovery probably deserves more weight in the next few days. Frankie should keep the plan supportive, not aggressive.";
  }

  if ((averageSoreness ?? 1) >= 4) {
    return "Recovery looks strained right now. A lighter day or a mobility-focused session would probably help more than forcing intensity.";
  }

  return "Your wellness signals look fairly steady. Keep checking in when something shifts so Frankie can adjust before the week gets away from you.";
}

function buildNextStep(
  profile: AppProfile | null,
  activityLogs: ActivityLogRow[],
  dietLogs: DietLogRow[],
  wellnessCheckins: WellnessCheckinRow[]
): DashboardNextStep {
  if (!profile?.onboarding_completed) {
    return {
      title: "Complete your onboarding",
      description:
        "Frankie needs your goals, preferences, and constraints before the coaching can get personal.",
      href: "/app/onboarding",
      ctaLabel: "Finish onboarding"
    };
  }

  const today = createDateAtLocalMidnight();
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(addDays(today, -1));
  const weekStartKey = toDateKey(getWeekStart(today));
  const workoutsThisWeek = activityLogs.filter((log) => log.logged_for_date >= weekStartKey).length;
  const targetTrainingDays = profile.target_training_days ?? 3;
  const hasMealToday = dietLogs.some((log) => log.logged_for_date === todayKey);
  const hasActivityToday = activityLogs.some((log) => log.logged_for_date === todayKey);
  const hasRecentWellnessCheckin = wellnessCheckins.some(
    (checkin) => checkin.logged_for_date >= yesterdayKey
  );

  if (profile.wellness_checkin_opt_in && !hasRecentWellnessCheckin) {
    return {
      title: "Quick recovery check-in",
      description:
        "A short energy, soreness, or stress update will keep today's guidance grounded in how the week actually feels.",
      href: "/app/chat",
      ctaLabel: "Check in with Frankie"
    };
  }

  if (!hasMealToday) {
    return {
      title: "Log today's meal",
      description:
        "One simple food update gives Frankie a much better read on whether your routine is supporting the goal you set.",
      href: "/app/chat",
      ctaLabel: "Log a meal"
    };
  }

  if (!hasActivityToday && workoutsThisWeek < targetTrainingDays) {
    return {
      title: "Ask Frankie for today's workout",
      description:
        "You are still a little short of your current weekly rhythm. A small session today may be the highest-value move.",
      href: "/app/chat",
      ctaLabel: "Get a workout idea"
    };
  }

  if (wellnessCheckins.length === 0) {
    return {
      title: "Start a wellness trail",
      description:
        "Even a single check-in helps Frankie connect your training, meals, and energy more clearly.",
      href: "/app/chat",
      ctaLabel: "Log a check-in"
    };
  }

  return {
    title: "Ask Frankie for the next move",
    description:
      "You have enough signal in the app now that Frankie can start shaping a smarter recommendation for the rest of the day.",
    href: "/app/chat",
    ctaLabel: "Open chat"
  };
}

function buildExerciseDashboardData(
  profile: AppProfile | null,
  activityLogs: ActivityLogRow[]
): ExerciseDashboardData {
  if (activityLogs.length === 0) {
    return createEmptyActivityDashboard();
  }

  const weekStartKey = toDateKey(getWeekStart());
  const activityLogsThisWeek = activityLogs.filter((log) => log.logged_for_date >= weekStartKey);
  const totalMinutesThisWeek = activityLogsThisWeek.reduce(
    (sum, log) => sum + (log.duration_minutes ?? 0),
    0
  );
  const activeDaysThisWeek = new Set(activityLogsThisWeek.map((log) => log.logged_for_date)).size;
  const activityBreakdown = Array.from(
    activityLogs.reduce<Map<string, number>>((map, log) => {
      map.set(log.activity_type, (map.get(log.activity_type) ?? 0) + 1);
      return map;
    }, new Map())
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, value]) => ({ label, value }));

  return {
    metrics: [
      { label: "Workouts", value: `${activityLogsThisWeek.length}` },
      { label: "Active days", value: `${activeDaysThisWeek}` },
      { label: "Minutes", value: `${totalMinutesThisWeek}` }
    ],
    trend: buildActivityTrend(activityLogs),
    breakdown: activityBreakdown,
    recent: activityLogs.slice(0, 5).map((activity) => ({
      id: activity.id,
      title: activity.activity_type,
      detail: formatActivityDetail(activity),
      dateLabel: formatShortDate(activity.logged_for_date)
    })),
    insight: buildExerciseInsight(
      profile,
      activityLogs,
      activityLogsThisWeek.length,
      activeDaysThisWeek
    ),
    empty: false
  };
}

function buildDietDashboardData(dietLogs: DietLogRow[]): DietDashboardData {
  if (dietLogs.length === 0) {
    return createEmptyDietDashboard();
  }

  const weekStartKey = toDateKey(getWeekStart());
  const dietLogsThisWeek = dietLogs.filter((log) => log.logged_for_date >= weekStartKey);
  const daysWithFoodLogs = new Set(dietLogsThisWeek.map((log) => log.logged_for_date)).size;
  const mealBreakdown = Array.from(
    dietLogs.reduce<Map<string, number>>((map, log) => {
      const label = log.meal_type ?? "unlabeled";
      map.set(label, (map.get(label) ?? 0) + 1);
      return map;
    }, new Map())
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, value]) => ({ label: capitalizeLabel(label, "Unlabeled"), value }));
  const topMeal = mealBreakdown[0]?.label ?? "None yet";

  return {
    metrics: [
      { label: "Meals logged", value: `${dietLogsThisWeek.length}` },
      { label: "Days with logs", value: `${daysWithFoodLogs}` },
      { label: "Most logged", value: topMeal }
    ],
    patterns: mealBreakdown,
    recent: dietLogs.slice(0, 6).map((entry) => ({
      id: entry.id,
      title: capitalizeLabel(entry.meal_type, "Meal"),
      detail: formatDietDetail(entry),
      dateLabel: formatShortDate(entry.logged_for_date)
    })),
    insight: buildDietInsight(dietLogsThisWeek, daysWithFoodLogs),
    empty: false
  };
}

function buildWellnessDashboardData(
  wellnessCheckins: WellnessCheckinRow[]
): WellnessDashboardData {
  if (wellnessCheckins.length === 0) {
    return createEmptyWellnessDashboard();
  }

  const weekStartKey = toDateKey(getWeekStart());
  const checkinsThisWeek = wellnessCheckins.filter(
    (checkin) => checkin.logged_for_date >= weekStartKey
  );
  const averageEnergy = average(checkinsThisWeek.map((entry) => entry.energy_score));
  const averageSoreness = average(checkinsThisWeek.map((entry) => entry.soreness_score));

  return {
    metrics: [
      { label: "Check-ins", value: `${checkinsThisWeek.length}` },
      { label: "Energy", value: getEnergyLabel(averageEnergy) },
      { label: "Recovery", value: getRecoveryLabel(averageSoreness) }
    ],
    trend: buildWellnessTrend(wellnessCheckins),
    recent: wellnessCheckins.slice(0, 5).map((entry) => ({
      id: entry.id,
      title: `Check-in • ${formatShortDate(entry.logged_for_date)}`,
      detail: formatWellnessDetail(entry),
      dateLabel: formatShortDate(entry.logged_for_date)
    })),
    insight: buildWellnessInsight(wellnessCheckins),
    empty: false
  };
}

function isMissingDashboardTable(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    message.includes("public.activity_logs") ||
    message.includes("public.diet_logs") ||
    message.includes("public.wellness_checkins")
  );
}

export async function getDashboardData(
  context: CurrentAppContext
): Promise<DashboardData> {
  const emptyExercise = createEmptyActivityDashboard();
  const emptyDiet = createEmptyDietDashboard();
  const emptyWellness = createEmptyWellnessDashboard();
  const emptyNextStep = buildNextStep(context.profile, [], [], []);

  if (!context.schemaReady || !context.user) {
    return {
      ready: false,
      error: context.error,
      exercise: emptyExercise,
      diet: emptyDiet,
      wellness: emptyWellness,
      nextStep: emptyNextStep
    };
  }

  const supabase = await createSupabaseServerClient();
  const sinceDateKey = toDateKey(addDays(createDateAtLocalMidnight(), -29));

  const [activityResult, dietResult, wellnessResult] = await Promise.all([
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
    wellnessResult.error?.message ??
    null;
  const dashboardReady = !isMissingDashboardTable(firstError);
  const activityLogs = activityResult.data ?? [];
  const dietLogs = dietResult.data ?? [];
  const wellnessCheckins = wellnessResult.data ?? [];

  return {
    ready: dashboardReady,
    error: firstError,
    exercise: buildExerciseDashboardData(context.profile, activityLogs),
    diet: buildDietDashboardData(dietLogs),
    wellness: buildWellnessDashboardData(wellnessCheckins),
    nextStep: buildNextStep(context.profile, activityLogs, dietLogs, wellnessCheckins)
  };
}

export async function getSuggestedNextStep(context: CurrentAppContext) {
  const dashboardData = await getDashboardData(context);
  return dashboardData.nextStep;
}
