export function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getMultiValue(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function getOptionalInt(formData: FormData, key: string) {
  const value = getStringValue(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getCheckboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function parseTextList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildCoachingSummary(input: {
  primaryGoal: string | null | undefined;
  activityLevel: string | null | undefined;
  preferredActivities: string[] | null | undefined;
  coachingStyle: string | null | undefined;
  targetTrainingDays: number | null | undefined;
  nutritionGoal: string | null | undefined;
}) {
  const primaryGoal = input.primaryGoal?.trim() || "building more consistency";
  const activityLevel = input.activityLevel?.trim() || "where you are right now";
  const activities =
    input.preferredActivities && input.preferredActivities.length > 0
      ? input.preferredActivities.slice(0, 2).join(" and ")
      : "whatever movement fits your life";
  const coachingStyle = input.coachingStyle?.trim() || "balanced";
  const trainingDays =
    input.targetTrainingDays && input.targetTrainingDays > 0
      ? `${input.targetTrainingDays} day${input.targetTrainingDays === 1 ? "" : "s"} per week`
      : "a realistic weekly rhythm";
  const nutritionGoal = input.nutritionGoal?.trim()
    ? `keep food guidance pointed at ${input.nutritionGoal.toLowerCase()}`
    : "keep food guidance practical";

  return `You want to focus on ${primaryGoal.toLowerCase()}, you are coming in ${activityLevel.toLowerCase()}, and you enjoy ${activities}. I will coach with a ${coachingStyle.toLowerCase()} tone, build around ${trainingDays}, and ${nutritionGoal}.`;
}
