const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

/**
 * Consecutive days (ending today, or yesterday if today has no care yet) with at least one
 * care action. "Frankie forgives": one missed day inside any rolling 7-day window doesn't break it.
 */
export function careStreak(careDateKeys: readonly string[], todayKey: string): number {
  const days = new Set(careDateKeys.map(dayNumber));
  const today = dayNumber(todayKey);
  let cursor = days.has(today) ? today : today - 1;
  let streak = 0;
  const forgiven: number[] = [];

  while (cursor > today - 400) {
    if (days.has(cursor)) {
      streak += 1;
    } else if (streak > 0 && !forgiven.some((day) => day - cursor < 7) && days.has(cursor - 1)) {
      forgiven.push(cursor);
    } else {
      break;
    }
    cursor -= 1;
  }

  return streak;
}
