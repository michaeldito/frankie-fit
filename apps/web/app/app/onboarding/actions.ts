"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import {
  buildCoachingSummary,
  getCheckboxValue,
  getMultiValue,
  getOptionalInt,
  getStringValue,
  parseTextList
} from "@/lib/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toErrorRedirect(message: string) {
  return `/app/onboarding?error=${encodeURIComponent(message)}`;
}

export async function saveOnboarding(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(toErrorRedirect("Configure Supabase env vars first."));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Log%20in%20to%20continue.");
  }

  const primaryGoal = getStringValue(formData, "primaryGoal");
  const activityLevel = getStringValue(formData, "activityLevel");
  const fitnessExperience = getStringValue(formData, "fitnessExperience");
  const trainingEnvironment = getStringValue(formData, "trainingEnvironment");
  const nutritionGoal = getStringValue(formData, "nutritionGoal");
  const coachingStyle = getStringValue(formData, "coachingStyle");
  const preferredCheckinStyle = getStringValue(formData, "preferredCheckinStyle");
  const safetyAcknowledged = getCheckboxValue(formData, "safetyAcknowledged");

  if (
    !primaryGoal ||
    !activityLevel ||
    !fitnessExperience ||
    !trainingEnvironment ||
    !coachingStyle ||
    !preferredCheckinStyle
  ) {
    redirect(
      toErrorRedirect(
        "Fill out the core onboarding questions so Frankie has enough context to help."
      )
    );
  }

  if (!safetyAcknowledged) {
    redirect(
      toErrorRedirect(
        "Please acknowledge the wellness guidance note before continuing."
      )
    );
  }

  const fullName =
    getStringValue(formData, "fullName") ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    null;
  const preferredActivities = getMultiValue(formData, "preferredActivities");
  const targetTrainingDays = getOptionalInt(formData, "targetTrainingDays");
  const preferredScheduleNotes = getStringValue(formData, "preferredScheduleNotes");
  const payload = {
    id: user.id,
    full_name: fullName,
    age_range: getStringValue(formData, "ageRange") || null,
    primary_goal: primaryGoal,
    secondary_goals: getMultiValue(formData, "secondaryGoals"),
    activity_level: activityLevel,
    fitness_experience: fitnessExperience,
    current_activities: parseTextList(getStringValue(formData, "currentActivities")),
    preferred_activities: preferredActivities,
    available_equipment: getMultiValue(formData, "availableEquipment"),
    training_environment: trainingEnvironment,
    target_training_days: targetTrainingDays,
    typical_session_length: getOptionalInt(formData, "typicalSessionLength"),
    preferred_schedule: preferredScheduleNotes
      ? { notes: preferredScheduleNotes }
      : {},
    diet_preferences: getMultiValue(formData, "dietPreferences"),
    diet_restrictions: parseTextList(getStringValue(formData, "dietRestrictions")),
    nutrition_goal: nutritionGoal || null,
    energy_baseline: getStringValue(formData, "energyBaseline") || null,
    stress_baseline: getStringValue(formData, "stressBaseline") || null,
    wellness_support_focus: getMultiValue(formData, "wellnessSupportFocus"),
    wellness_checkin_opt_in: getCheckboxValue(formData, "wellnessCheckinOptIn"),
    injuries_limitations: parseTextList(
      getStringValue(formData, "injuriesLimitations")
    ),
    health_considerations: parseTextList(
      getStringValue(formData, "healthConsiderations")
    ),
    avoidances: parseTextList(getStringValue(formData, "avoidances")),
    coaching_style: coachingStyle,
    preferred_checkin_style: preferredCheckinStyle,
    safety_acknowledged: true,
    onboarding_completed: true,
    onboarding_summary: buildCoachingSummary({
      primaryGoal,
      activityLevel,
      preferredActivities,
      coachingStyle,
      targetTrainingDays,
      nutritionGoal
    })
  };

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id"
  });

  if (error) {
    if (error.message.includes("Could not find the table 'public.profiles'")) {
      redirect(
        toErrorRedirect(
          "The profiles table is not in Supabase yet. Run the migration first."
        )
      );
    }

    redirect(toErrorRedirect(error.message));
  }

  revalidatePath("/app");
  revalidatePath("/app/chat");
  revalidatePath("/app/profile");
  redirect("/app/chat?welcome=1");
}
