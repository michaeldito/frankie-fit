import type { RelativeLoggedFor } from "@/lib/chat";

export function resolveRelativeLoggedForDate(relativeLoggedFor: RelativeLoggedFor) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);

  if (relativeLoggedFor === "yesterday") {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().slice(0, 10);
}
