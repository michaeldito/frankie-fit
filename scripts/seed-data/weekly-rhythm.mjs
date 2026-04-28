const DAY_COUNT = 7

export function activityTemplate({
  message,
  activityType,
  description,
  durationMinutes = null,
  intensity = null
}) {
  return {
    domain: "activity",
    message,
    activityType,
    description,
    durationMinutes,
    intensity
  }
}

export function mealTemplate({
  message,
  mealType,
  description,
  confidence = 0.92
}) {
  return {
    domain: "diet",
    message,
    mealType,
    description,
    confidence
  }
}

export function wellnessTemplate({
  message,
  energyScore,
  sorenessScore,
  moodScore,
  stressScore,
  motivationScore,
  notes = null
}) {
  return {
    domain: "wellness",
    message,
    energyScore,
    sorenessScore,
    moodScore,
    stressScore,
    motivationScore,
    notes: notes ?? message.replace(/[.]+$/g, "")
  }
}

export function buildWeek({ activities, meals, wellness }) {
  if (
    activities.length !== DAY_COUNT ||
    meals.length !== DAY_COUNT ||
    wellness.length !== DAY_COUNT
  ) {
    throw new Error("Each weekly seed plan must provide exactly 7 activity, meal, and wellness entries.")
  }

  return Array.from({ length: DAY_COUNT }, (_, index) => ({
    dayIndex: index,
    activity: activities[index],
    diet: meals[index],
    wellness: wellness[index]
  }))
}

export function getLoggedForDate(dayIndex) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - (DAY_COUNT - 1 - dayIndex))

  return date.toISOString().slice(0, 10)
}

export function getTimestampForDay(dayIndex, hour, minute, offsetMinutes = 0) {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  date.setDate(date.getDate() - (DAY_COUNT - 1 - dayIndex))
  date.setMinutes(date.getMinutes() + offsetMinutes)

  return date.toISOString()
}
