export function buildCoachingSummary(input) {
  const primaryGoal = input.primaryGoal?.trim() || "building more consistency"
  const activityLevel = input.activityLevel?.trim() || "where you are right now"
  const activities =
    input.preferredActivities && input.preferredActivities.length > 0
      ? input.preferredActivities.slice(0, 2).join(" and ")
      : "whatever movement fits your life"
  const coachingStyle = input.coachingStyle?.trim() || "balanced"
  const trainingDays =
    input.targetTrainingDays && input.targetTrainingDays > 0
      ? `${input.targetTrainingDays} day${input.targetTrainingDays === 1 ? "" : "s"} per week`
      : "a realistic weekly rhythm"
  const nutritionGoal = input.nutritionGoal?.trim()
    ? `keep food guidance pointed at ${input.nutritionGoal.toLowerCase()}`
    : "keep food guidance practical"

  return `You want to focus on ${primaryGoal.toLowerCase()}, you are coming in ${activityLevel.toLowerCase()}, and you enjoy ${activities}. I will coach with a ${coachingStyle.toLowerCase()} tone, build around ${trainingDays}, and ${nutritionGoal}.`
}

export function buildInitialAssistantMessage(onboardingSummary) {
  return `${onboardingSummary} A good place to start is simple: log today's workout, tell me what you ate, or give me a quick wellness check-in and I will take it from there.`
}

function lowercaseGoal(primaryGoal) {
  return primaryGoal ? primaryGoal.toLowerCase() : "your current focus"
}

export function buildActivityConfirmation(activity, primaryGoal) {
  const durationText = activity.durationMinutes
    ? ` for ${activity.durationMinutes} minutes`
    : ""
  const intensityText = activity.intensity
    ? ` at a ${activity.intensity.toLowerCase()} intensity`
    : ""
  const goalText = primaryGoal
    ? ` That supports ${lowercaseGoal(primaryGoal)}.`
    : ""

  return `Nice. I logged ${activity.activityType.toLowerCase()}${durationText}${intensityText}.${goalText} Keep going and let me know how recovery feels tomorrow.`
}

export function buildDietConfirmation(entry) {
  const mealLabel = entry.mealType
    ? `${entry.mealType}: ${entry.description}`
    : entry.description

  return `Nice. I logged ${mealLabel}. That gives us a cleaner read on your nutrition and consistency.`
}

function getWellnessDescriptor(score, descriptors) {
  if (score === null || score === undefined) {
    return null
  }

  return descriptors[score - 1]
}

export function buildWellnessConfirmation(checkin) {
  const segments = [
    getWellnessDescriptor(checkin.energyScore, [
      "very low energy",
      "low energy",
      "steady energy",
      "solid energy",
      "high energy"
    ]),
    getWellnessDescriptor(checkin.sorenessScore, [
      "very low soreness",
      "light soreness",
      "moderate soreness",
      "high soreness",
      "very high soreness"
    ]),
    getWellnessDescriptor(checkin.moodScore, [
      "a rough mood",
      "a lower mood",
      "a steady mood",
      "a good mood",
      "a very strong mood"
    ]),
    getWellnessDescriptor(checkin.stressScore, [
      "low stress",
      "manageable stress",
      "moderate stress",
      "high stress",
      "very high stress"
    ]),
    getWellnessDescriptor(checkin.motivationScore, [
      "very low motivation",
      "low motivation",
      "steady motivation",
      "solid motivation",
      "high motivation"
    ])
  ].filter(Boolean)

  if (segments.length === 0) {
    return "Nice. I logged a wellness check-in."
  }

  if (segments.length === 1) {
    return `Nice. I logged a wellness check-in with ${segments[0]}.`
  }

  if (segments.length === 2) {
    return `Nice. I logged a wellness check-in with ${segments[0]} and ${segments[1]}.`
  }

  return `Nice. I logged a wellness check-in with ${segments.slice(0, -1).join(", ")}, and ${segments[segments.length - 1]}.`
}
