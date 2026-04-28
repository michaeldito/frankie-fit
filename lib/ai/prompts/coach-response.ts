import type { AppProfile } from "@/lib/profile";
import type { ParsedActivity, ParsedDietEntry, ParsedWellnessCheckin } from "@/lib/chat";

function formatActivities(activities: ParsedActivity[]) {
  if (activities.length === 0) {
    return "None.";
  }

  return activities
    .map((activity) => {
      const duration = activity.durationMinutes
        ? ` for ${activity.durationMinutes} minutes`
        : "";
      const intensity = activity.intensity
        ? ` at ${activity.intensity.toLowerCase()} intensity`
        : "";

      return `- ${activity.activityType}${duration}${intensity}`;
    })
    .join("\n");
}

function formatDietEntries(entries: ParsedDietEntry[]) {
  if (entries.length === 0) {
    return "None.";
  }

  return entries
    .map((entry) => `- ${entry.mealType ?? "meal"}: ${entry.description}`)
    .join("\n");
}

function formatWellness(checkin: ParsedWellnessCheckin | null) {
  if (!checkin) {
    return "None.";
  }

  return [
    `- energyScore: ${checkin.energyScore ?? "unknown"}`,
    `- sorenessScore: ${checkin.sorenessScore ?? "unknown"}`,
    `- moodScore: ${checkin.moodScore ?? "unknown"}`,
    `- stressScore: ${checkin.stressScore ?? "unknown"}`,
    `- motivationScore: ${checkin.motivationScore ?? "unknown"}`,
    `- notes: ${checkin.notes ?? "none"}`
  ].join("\n");
}

export function buildCoachResponseSystemPrompt() {
  return [
    "You are Frankie, the coaching voice inside Frankie Fit.",
    "Your tone is calm, wise, warm, and practical.",
    "You are a coach-friend hybrid, not a clinician.",
    "You can acknowledge logs, reinforce momentum, and suggest one useful next step.",
    "Keep replies concise: usually 2 to 4 sentences.",
    "Do not mention internal schemas, JSON, or tool execution.",
    "Do not overclaim causality or medical certainty."
  ].join("\n");
}

export function buildCoachResponseUserPrompt(input: {
  profile: AppProfile | null;
  userMessage: string;
  recentConversation: string;
  activities: ParsedActivity[];
  dietEntries: ParsedDietEntry[];
  wellnessCheckin: ParsedWellnessCheckin | null;
}) {
  const goalText = input.profile?.primary_goal ?? "Not set";
  const styleText = input.profile?.coaching_style ?? "Balanced mix";

  return [
    `User profile goal: ${goalText}`,
    `Coaching style preference: ${styleText}`,
    `Recent conversation: ${input.recentConversation || "No recent conversation context."}`,
    `Latest user message: ${input.userMessage}`,
    "Structured activity updates:",
    formatActivities(input.activities),
    "Structured diet updates:",
    formatDietEntries(input.dietEntries),
    "Structured wellness update:",
    formatWellness(input.wellnessCheckin),
    "Respond as Frankie. If logs were detected, acknowledge what was logged and offer one useful next step. If no logs were detected, answer as a coach and keep the reply grounded."
  ].join("\n\n");
}
