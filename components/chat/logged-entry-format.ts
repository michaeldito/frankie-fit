export type LoggedActivity = {
  id: string | null;
  activityType: string;
  durationMinutes: number | null;
  intensity: string | null;
  loggedForDate: string | null;
};

export type LoggedDietEntry = {
  id: string | null;
  description: string;
  mealType: string | null;
  loggedForDate: string | null;
};

export type LoggedWellnessCheckin = {
  id: string | null;
  energyScore: number | null;
  moodScore: number | null;
  motivationScore: number | null;
  sorenessScore: number | null;
  stressScore: number | null;
  loggedForDate: string | null;
};

export function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export function formatLoggedDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[2]}-${match[3]}-${match[1]}` : value;
}

export function formatActivityTitle(activity: LoggedActivity) {
  return capitalize(activity.activityType);
}

export function formatActivityDetail(activity: LoggedActivity) {
  const parts: string[] = [];

  if (activity.durationMinutes) {
    parts.push(`${activity.durationMinutes} min`);
  }

  if (activity.intensity) {
    parts.push(activity.intensity);
  }

  return parts.length > 0 ? parts.join(" • ") : null;
}

export function formatDietTitle(entry: LoggedDietEntry) {
  return entry.mealType ? capitalize(entry.mealType) : "Meal";
}

export function formatDietDetail(entry: LoggedDietEntry) {
  return entry.description || null;
}

export function formatWellnessTitle() {
  return "Check-in";
}

export function formatWellnessDetail(checkin: LoggedWellnessCheckin) {
  const scoreLabels: Array<[string, number | null]> = [
    ["Energy", checkin.energyScore],
    ["Stress", checkin.stressScore],
    ["Soreness", checkin.sorenessScore],
    ["Mood", checkin.moodScore],
    ["Motivation", checkin.motivationScore]
  ];
  const parts = scoreLabels
    .filter(([, score]) => score !== null)
    .map(([name, score]) => `${name} ${score}/5`);

  return parts.length > 0 ? parts.join(" • ") : null;
}
