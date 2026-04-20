import type { User } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSelect = `
  full_name,
  role,
  account_type,
  age_range,
  primary_goal,
  secondary_goals,
  activity_level,
  fitness_experience,
  current_activities,
  preferred_activities,
  available_equipment,
  training_environment,
  target_training_days,
  typical_session_length,
  preferred_schedule,
  diet_preferences,
  diet_restrictions,
  nutrition_goal,
  energy_baseline,
  stress_baseline,
  wellness_support_focus,
  wellness_checkin_opt_in,
  injuries_limitations,
  health_considerations,
  avoidances,
  coaching_style,
  preferred_checkin_style,
  safety_acknowledged,
  onboarding_completed,
  onboarding_summary
`;

export type AppProfile = {
  full_name: string | null;
  role: "user" | "admin" | null;
  account_type: "real_user" | "internal_test" | "synthetic_demo" | null;
  age_range: string | null;
  primary_goal: string | null;
  secondary_goals: string[];
  activity_level: string | null;
  fitness_experience: string | null;
  current_activities: string[];
  preferred_activities: string[];
  available_equipment: string[];
  training_environment: string | null;
  target_training_days: number | null;
  typical_session_length: number | null;
  preferred_schedule: { notes?: string } | null;
  diet_preferences: string[];
  diet_restrictions: string[];
  nutrition_goal: string | null;
  energy_baseline: string | null;
  stress_baseline: string | null;
  wellness_support_focus: string[];
  wellness_checkin_opt_in: boolean;
  injuries_limitations: string[];
  health_considerations: string[];
  avoidances: string[];
  coaching_style: string | null;
  preferred_checkin_style: string | null;
  safety_acknowledged: boolean;
  onboarding_completed: boolean;
  onboarding_summary: string | null;
};

export type CurrentAppContext = {
  authConfigured: boolean;
  schemaReady: boolean;
  user: User | null;
  profile: AppProfile | null;
  error: string | null;
};

function isMissingProfilesTable(message: string | undefined) {
  return message?.includes("Could not find the table 'public.profiles'") ?? false;
}

export async function getCurrentAppContext(): Promise<CurrentAppContext> {
  if (!hasSupabaseEnv()) {
    return {
      authConfigured: false,
      schemaReady: false,
      user: null,
      profile: null,
      error: null
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authConfigured: true,
      schemaReady: true,
      user: null,
      profile: null,
      error: null
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  if (isMissingProfilesTable(error?.message)) {
    return {
      authConfigured: true,
      schemaReady: false,
      user,
      profile: null,
      error: error?.message ?? "The profiles table is missing in Supabase."
    };
  }

  return {
    authConfigured: true,
    schemaReady: true,
    user,
    profile: (data as AppProfile | null) ?? null,
    error: error?.message ?? null
  };
}

export function getDisplayName(user: User | null, profile: AppProfile | null) {
  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  return (
    profile?.full_name?.trim() ||
    metadataName?.trim() ||
    user?.email?.split("@")[0] ||
    "Frankie Fit member"
  );
}

export function getAccountLabel(accountType: string | null | undefined) {
  switch (accountType) {
    case "admin":
      return "Admin account";
    case "internal_test":
    case "test":
      return "Internal test account";
    case "synthetic_demo":
    case "synthetic":
      return "Synthetic demo account";
    default:
      return "Frankie Fit member";
  }
}

export function getInitials(name: string) {
  const segments = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (segments.length === 0) {
    return "FF";
  }

  return segments.map((segment) => segment[0]?.toUpperCase() ?? "").join("");
}

export function formatList(values: string[] | null | undefined, fallback = "Not set yet") {
  return values && values.length > 0 ? values.join(", ") : fallback;
}

export function formatScheduleNotes(profile: AppProfile | null | undefined) {
  const notes =
    typeof profile?.preferred_schedule?.notes === "string"
      ? profile.preferred_schedule.notes.trim()
      : "";

  return notes || "Not set yet";
}

export function isOnboardingRequired(context: CurrentAppContext) {
  return Boolean(
    context.authConfigured &&
      context.schemaReady &&
      context.user &&
      !context.profile?.onboarding_completed
  );
}
