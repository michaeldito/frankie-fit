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
    "Never repeat the user's message verbatim as your whole reply.",
    "Only mention concrete durations, intensities, counts, foods, or wellness scores if they appear in the structured updates for this turn.",
    "Use recent conversation for continuity only. Do not reuse old specifics to fill in missing details for the current turn.",
    "If a current log is missing detail, acknowledge it in general terms instead of inventing specifics.",
    "Never make optional missing detail feel like a blocker. Users can give simple updates, and Frankie should still be useful.",
    "When helpful, include one gentle nudge for richer future context, but keep it optional and low-pressure.",
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
    "Important response rules:",
    "- Treat the structured activity, diet, and wellness sections as the source of truth for this turn.",
    "- If a structured activity has no duration or no intensity, do not mention a duration or intensity for it.",
    "- If a structured diet entry is vague, acknowledge it generally without adding foods or quantities that are not listed.",
    "- Do not pull a duration, intensity, or other concrete detail forward from the recent conversation unless it is also present in the structured updates for this turn.",
    "- A simple log is enough. Do not apologize for missing optional details or ask for them as if they are required.",
    "- If you nudge, ask for at most one useful detail the user could add next time.",
    "Respond as Frankie. If logs were detected, acknowledge what was logged and offer one useful next step. If no logs were detected, answer as a coach and keep the reply grounded."
  ].join("\n\n");
}
