import { frankieMoodFor, type FrankieMood } from "./moods";
import type { Pillar } from "./themes";

type MoodSourceMessage = {
  message_type?: string;
  structured_payload?: unknown;
};

type LogPayload = {
  activitiesLogged?: { activityType?: string | null }[];
  dietLogged?: unknown[];
  lifestyleLogged?: unknown[];
  wellnessLogged?: unknown | null;
};

export function loggedPillarsFor(message: MoodSourceMessage): { pillars: Pillar[]; activityTypes: string[] } {
  if (message.message_type !== "log_confirmation" || !message.structured_payload) {
    return { pillars: [], activityTypes: [] };
  }

  const payload = message.structured_payload as LogPayload;
  const pillars: Pillar[] = [];

  if (payload.activitiesLogged?.length) pillars.push("exercise");
  if (payload.dietLogged?.length) pillars.push("diet");
  if (payload.wellnessLogged) pillars.push("wellness");
  if (payload.lifestyleLogged?.length) pillars.push("lifestyle");

  const activityTypes = (payload.activitiesLogged ?? [])
    .map((activity) => activity.activityType)
    .filter((type): type is string => Boolean(type));

  return { pillars, activityTypes };
}

export function moodForMessage(message: MoodSourceMessage): FrankieMood {
  const { pillars, activityTypes } = loggedPillarsFor(message);
  return frankieMoodFor({
    messageType: message.message_type,
    loggedPillars: pillars,
    activityTypes
  });
}
