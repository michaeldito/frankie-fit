import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database";
import type { AppProfile } from "@/lib/profile";
import { buildChatContext } from "./load-chat-context";

type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

function message(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: "msg-1",
    thread_id: "thread-1",
    user_id: "user-1",
    role: "user",
    message_type: "chat",
    content: "hello",
    structured_payload: {},
    created_at: "2026-01-15T00:00:00.000Z",
    ...overrides
  } as ChatMessage;
}

describe("buildChatContext", () => {
  it("uses the onboarding summary when present", () => {
    const profile = { onboarding_summary: "  Loves running.  " } as AppProfile;
    const result = buildChatContext({ profile, recentMessages: [] });
    expect(result.profileSummary).toBe("Loves running.");
  });

  it("falls back to primary goal and coaching style when no summary exists", () => {
    const profile = { onboarding_summary: null, primary_goal: "lose fat", coaching_style: "tough" } as AppProfile;
    const result = buildChatContext({ profile, recentMessages: [] });
    expect(result.profileSummary).toBe("Primary goal: lose fat. Coaching style: tough.");
  });

  it("defaults profile summary fields when there's no profile", () => {
    const result = buildChatContext({ profile: null, recentMessages: [] });
    expect(result.profileSummary).toBe("Primary goal: Not set yet. Coaching style: Balanced mix.");
  });

  it("dedupes adjacent messages with the same role and content", () => {
    const messages = [
      message({ id: "1", role: "user", content: "hi" }),
      message({ id: "2", role: "user", content: "hi" }),
      message({ id: "3", role: "assistant", content: "hello!" })
    ];

    const result = buildChatContext({ profile: null, recentMessages: messages });
    expect(result.recentConversation).toBe("user: hi\nassistant: hello!");
  });

  it("keeps repeated content when a different role separates the repeats", () => {
    const messages = [
      message({ id: "1", role: "user", content: "hi" }),
      message({ id: "2", role: "assistant", content: "hi" }),
      message({ id: "3", role: "user", content: "hi" })
    ];

    const result = buildChatContext({ profile: null, recentMessages: messages });
    expect(result.recentConversation).toBe("user: hi\nassistant: hi\nuser: hi");
  });

  it("keeps only the last six messages", () => {
    const messages = Array.from({ length: 8 }, (_, index) =>
      message({ id: `${index}`, role: "user", content: `msg-${index}` })
    );

    const result = buildChatContext({ profile: null, recentMessages: messages });
    expect(result.recentConversation.split("\n")).toHaveLength(6);
    expect(result.recentConversation).toContain("msg-7");
    expect(result.recentConversation).not.toContain("msg-1\n");
  });

  it("truncates long message content", () => {
    const longContent = "a".repeat(200);
    const result = buildChatContext({ profile: null, recentMessages: [message({ content: longContent })] });
    expect(result.recentConversation).toBe(`user: ${"a".repeat(179)}...`);
  });
});
