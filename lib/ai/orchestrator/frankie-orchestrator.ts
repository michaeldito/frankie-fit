import type { Database } from "@/types/database";
import type { AppProfile } from "@/lib/profile";
import {
  buildAssistantReply,
  buildStructuredLogConfirmation,
  type ParsedActivity,
  type ParsedDietEntry,
  type ParsedWellnessCheckin
} from "@/lib/chat";
import { buildChatContext } from "@/lib/ai/context/load-chat-context";
import {
  buildCoachResponseSystemPrompt,
  buildCoachResponseUserPrompt
} from "@/lib/ai/prompts/coach-response";
import { buildExtractUserUpdatePrompt } from "@/lib/ai/prompts/extract-user-update";
import {
  createStructuredOpenAiResponse,
  createTextOpenAiResponse,
  hasOpenAiApiKey
} from "@/lib/ai/openai-responses";
import {
  extractedUserUpdateJsonSchema,
  extractedUserUpdateSchema,
  mapExtractedActivities,
  mapExtractedDietEntries,
  mapExtractedWellnessCheckin
} from "@/lib/ai/schemas/extracted-user-update";

type ChatMessage = Database["public"]["Tables"]["conversation_messages"]["Row"];

export type FrankieOrchestrationResult = {
  assistantMessageType: "chat" | "log_confirmation";
  parsedActivities: ParsedActivity[];
  parsedDietEntries: ParsedDietEntry[];
  parsedWellnessCheckin: ParsedWellnessCheckin | null;
  reply: string;
  orchestrationMode: "model" | "rule_based_fallback";
  metadata: {
    extractionSource: "model" | "rule_based";
    usedOpenAi: boolean;
    fallbackReason?: string;
    intent?: string;
    needsClarification?: boolean;
  };
};

function buildRuleBasedFallback(
  profile: AppProfile | null,
  message: string,
  fallbackReason: string
): FrankieOrchestrationResult {
  const fallbackReply = buildAssistantReply(profile, message);

  return {
    assistantMessageType: fallbackReply.assistantMessageType,
    parsedActivities: fallbackReply.parsedActivities,
    parsedDietEntries: fallbackReply.parsedDietEntries,
    parsedWellnessCheckin: fallbackReply.parsedWellnessCheckin,
    reply: fallbackReply.reply,
    orchestrationMode: "rule_based_fallback",
    metadata: {
      extractionSource: "rule_based",
      usedOpenAi: false,
      fallbackReason
    }
  };
}

export async function orchestrateFrankieReply(input: {
  profile: AppProfile | null;
  message: string;
  recentMessages: ChatMessage[];
}): Promise<FrankieOrchestrationResult> {
  if (!hasOpenAiApiKey()) {
    return buildRuleBasedFallback(
      input.profile,
      input.message,
      "OPENAI_API_KEY is not configured."
    );
  }

  try {
    const context = buildChatContext({
      profile: input.profile,
      recentMessages: input.recentMessages
    });

    const extractedUnknown = await createStructuredOpenAiResponse({
      systemPrompt: buildExtractUserUpdatePrompt(context),
      userPrompt: input.message,
      schemaName: "frankie_user_update",
      schema: extractedUserUpdateJsonSchema
    });

    const extracted = extractedUserUpdateSchema.parse(extractedUnknown);
    const parsedActivities = mapExtractedActivities(extracted.activities);
    const parsedDietEntries = mapExtractedDietEntries(extracted.dietEntries);
    const parsedWellnessCheckin = mapExtractedWellnessCheckin(extracted.wellness);
    const structuredFallback = buildStructuredLogConfirmation(
      input.profile,
      parsedActivities,
      parsedDietEntries,
      parsedWellnessCheckin
    );

    if (extracted.needsClarification && extracted.clarificationQuestion.trim()) {
      return {
        assistantMessageType: "chat",
        parsedActivities,
        parsedDietEntries,
        parsedWellnessCheckin,
        reply: extracted.clarificationQuestion.trim(),
        orchestrationMode: "model",
        metadata: {
          extractionSource: "model",
          usedOpenAi: true,
          intent: extracted.intent,
          needsClarification: true
        }
      };
    }

    const reply = await createTextOpenAiResponse({
      systemPrompt: buildCoachResponseSystemPrompt(),
      userPrompt: buildCoachResponseUserPrompt({
        profile: input.profile,
        userMessage: input.message,
        recentConversation: context.recentConversation,
        activities: parsedActivities,
        dietEntries: parsedDietEntries,
        wellnessCheckin: parsedWellnessCheckin
      })
    });

    return {
      assistantMessageType: structuredFallback ? "log_confirmation" : "chat",
      parsedActivities,
      parsedDietEntries,
      parsedWellnessCheckin,
      reply:
        reply ||
        structuredFallback?.reply ||
        buildRuleBasedFallback(
          input.profile,
          input.message,
          "Model returned an empty reply."
        ).reply,
      orchestrationMode: "model",
      metadata: {
        extractionSource: "model",
        usedOpenAi: true,
        intent: extracted.intent,
        needsClarification: extracted.needsClarification
      }
    };
  } catch (error) {
    return buildRuleBasedFallback(
      input.profile,
      input.message,
      error instanceof Error ? error.message : "Unknown AI orchestration error."
    );
  }
}
