"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/profile";
import {
  buildCoachingSummary,
  getCheckboxValue,
  getMultiValue,
  getOptionalInt,
  getStringValue,
  parseTextList
} from "@/lib/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toProfileRedirect(params: { error?: string; saved?: boolean }) {
  if (params.error) {
    return `/app/profile?error=${encodeURIComponent(params.error)}`;
  }

  if (params.saved) {
    return "/app/profile?saved=1";
  }

  return "/app/profile";
}

export async function saveProfile(formData: FormData) {
  const context = await getCurrentAppContext();

  if (!context.authConfigured) {
    redirect(toProfileRedirect({ error: "Connect Supabase before editing the profile." }));
  }

  if (!context.user) {
    redirect("/login?message=Log%20in%20to%20continue.");
  }

  if (!context.schemaReady) {
    redirect(
      toProfileRedirect({
        error: "The profiles table is not available yet. Run the Supabase migration first."
      })
    );
  }

  const preferredActivities = getMultiValue(formData, "preferredActivities");
  const primaryGoal = getStringValue(formData, "primaryGoal") || null;
  const activityLevel = getStringValue(formData, "activityLevel") || null;
  const coachingStyle = getStringValue(formData, "coachingStyle") || null;
  const targetTrainingDays = getOptionalInt(formData, "targetTrainingDays");
  const nutritionGoal = getStringValue(formData, "nutritionGoal") || null;
  const preferredScheduleNotes = getStringValue(formData, "preferredScheduleNotes");
  const fullName = getStringValue(formData, "fullName") || context.profile?.full_name || null;

  const payload = {
    id: context.user.id,
    full_name: fullName,
    age_range: getStringValue(formData, "ageRange") || null,
    primary_goal: primaryGoal,
    secondary_goals: getMultiValue(formData, "secondaryGoals"),
    activity_level: activityLevel,
    fitness_experience: getStringValue(formData, "fitnessExperience") || null,
    current_activities: parseTextList(getStringValue(formData, "currentActivities")),
    preferred_activities: preferredActivities,
    available_equipment: getMultiValue(formData, "availableEquipment"),
    training_environment: getStringValue(formData, "trainingEnvironment") || null,
    target_training_days: targetTrainingDays,
    typical_session_length: getOptionalInt(formData, "typicalSessionLength"),
    preferred_schedule: preferredScheduleNotes ? { notes: preferredScheduleNotes } : {},
    diet_preferences: getMultiValue(formData, "dietPreferences"),
    diet_restrictions: parseTextList(getStringValue(formData, "dietRestrictions")),
    nutrition_goal: nutritionGoal,
    energy_baseline: getStringValue(formData, "energyBaseline") || null,
    stress_baseline: getStringValue(formData, "stressBaseline") || null,
    wellness_support_focus: getMultiValue(formData, "wellnessSupportFocus"),
    wellness_checkin_opt_in: getCheckboxValue(formData, "wellnessCheckinOptIn"),
    injuries_limitations: parseTextList(getStringValue(formData, "injuriesLimitations")),
    health_considerations: parseTextList(getStringValue(formData, "healthConsiderations")),
    avoidances: parseTextList(getStringValue(formData, "avoidances")),
    coaching_style: coachingStyle,
    preferred_checkin_style: getStringValue(formData, "preferredCheckinStyle") || null,
    safety_acknowledged: context.profile?.safety_acknowledged ?? true,
    onboarding_completed: context.profile?.onboarding_completed ?? true,
    onboarding_summary: buildCoachingSummary({
      primaryGoal,
      activityLevel,
      preferredActivities,
      coachingStyle,
      targetTrainingDays,
      nutritionGoal
    })
  };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id"
  });

  if (error) {
    redirect(toProfileRedirect({ error: error.message }));
  }

  revalidatePath("/app");
  revalidatePath("/app/chat");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/profile");
  redirect(toProfileRedirect({ saved: true }));
}
