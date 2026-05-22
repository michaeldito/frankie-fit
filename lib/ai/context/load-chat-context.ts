import type { Database } from "@/types/database";
import type { AppProfile } from "@/lib/profile";

type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

function trimContent(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function dedupeAdjacentMessages(messages: ChatMessage[]) {
  return messages.filter((message, index) => {
    const previousMessage = messages[index - 1];

    if (!previousMessage) {
      return true;
    }

    return !(
      previousMessage.role === message.role &&
      previousMessage.content.trim() === message.content.trim()
    );
  });
}

export function buildChatContext(input: {
  profile: AppProfile | null;
  recentMessages: ChatMessage[];
}) {
  const profileSummary =
    input.profile?.onboarding_summary?.trim() ||
    `Primary goal: ${input.profile?.primary_goal ?? "Not set yet"}. Coaching style: ${
      input.profile?.coaching_style ?? "Balanced mix"
    }.`;

  const recentConversation = dedupeAdjacentMessages(input.recentMessages)
    .slice(-6)
    .map((message) => `${message.role}: ${trimContent(message.content, 180)}`)
    .join("\n");

  return {
    profileSummary,
    recentConversation
  };
}
