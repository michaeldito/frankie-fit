import type { Pillar } from "./themes";

// Frankie's short, handwritten one-liners. Warm and lightly funny, never guilt-driven
// (see docs/frankie-voice-and-ui-decisions.md).
export const DAILY_LINES = [
  "Small steps. Big progress.",
  "Good things take time.",
  "Rest is part of the plan.",
  "Good food = longer walks!",
  "Stretch it out. Feel the good.",
  "You got this, human!",
  "A little progress every day makes a big difference.",
  "Healthy body. Happy heart.",
  "Keep going. I'll be right here."
] as const;

export const THINKING_LINES = [
  "Sniffing that out…",
  "Thinking with my whole nose…",
  "Fetching…",
  "Ears up, give me a sec…"
] as const;

export const EMPTY_STATE_LINES: Record<Pillar, string> = {
  exercise: "No moves logged yet. I'm waiting by the door… (so polite)",
  diet: "Nothing in the bowl yet. Tell me what you ate and I'll remember it.",
  wellness: "No check-in yet. How are you really doing? I'm a good listener.",
  lifestyle: "Nothing here yet. Tell me about your day. Naps count."
};

function hashKey(key: string): number {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

// Deterministic per day so web and mobile show the same line, and it doesn't flicker on re-render.
export function dailyLine(dateKey: string): string {
  return DAILY_LINES[hashKey(dateKey) % DAILY_LINES.length];
}

export function thinkingLine(step: number): string {
  return THINKING_LINES[Math.abs(Math.trunc(step)) % THINKING_LINES.length];
}

export function greetingFor(hourPacific: number, firstName?: string | null): string {
  const salutation =
    hourPacific >= 5 && hourPacific < 12
      ? "Good morning"
      : hourPacific >= 12 && hourPacific < 17
        ? "Good afternoon"
        : "Good evening";
  const name = firstName?.trim();
  return `${salutation}, ${name ? name : "Frankie's human"}`;
}
