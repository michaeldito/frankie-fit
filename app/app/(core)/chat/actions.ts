"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getChatExperience } from "@/lib/chat";
import { orchestrateFrankieReply } from "@/lib/ai/orchestrator/frankie-orchestrator";
import { logActivityEntries } from "@/lib/ai/tools/log-activity";
import { logDietEntries } from "@/lib/ai/tools/log-diet";
import { logWellnessCheckin } from "@/lib/ai/tools/log-wellness";
import { getCurrentAppContext, getDisplayName } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendChatMessage(formData: FormData) {
  const message = getStringValue(formData, "message");

  if (!message) {
    redirect("/app/chat");
  }

  const context = await getCurrentAppContext();

  if (!context.user) {
    redirect("/login?message=Log%20in%20to%20continue.");
  }

  const user = context.user;
  const displayName = getDisplayName(user, context.profile);
  const chatExperience = await getChatExperience(context, displayName);

  if (!chatExperience.thread) {
    redirect(
      `/app/chat?error=${encodeURIComponent(
        chatExperience.error ?? "Frankie could not open the conversation thread."
      )}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: userMessage, error: userMessageError } = await supabase
    .from("conversation_messages")
    .insert({
      thread_id: chatExperience.thread.id,
      user_id: user.id,
      role: "user",
      message_type: "chat",
      content: message,
      structured_payload: {}
    })
    .select("*")
    .single();

  if (userMessageError || !userMessage) {
    redirect(
      `/app/chat?error=${encodeURIComponent(
        userMessageError?.message ?? "Frankie could not save your message."
      )}`
    );
  }

  const reply = await orchestrateFrankieReply({
    profile: context.profile,
    message,
    recentMessages: chatExperience.messages
  });

  try {
    await logActivityEntries({
      supabase,
      userId: user.id,
      sourceMessageId: userMessage.id,
      entries: reply.parsedActivities,
      extractionSource: reply.metadata.extractionSource
    });
    await logDietEntries({
      supabase,
      userId: user.id,
      sourceMessageId: userMessage.id,
      entries: reply.parsedDietEntries,
      extractionSource: reply.metadata.extractionSource
    });
    await logWellnessCheckin({
      supabase,
      userId: user.id,
      sourceMessageId: userMessage.id,
      entry: reply.parsedWellnessCheckin,
      extractionSource: reply.metadata.extractionSource
    });
  } catch (error) {
    redirect(
      `/app/chat?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Frankie could not save the structured logs."
      )}`
    );
  }

  const { error: assistantMessageError } = await supabase
    .from("conversation_messages")
    .insert({
      thread_id: chatExperience.thread.id,
      user_id: user.id,
      role: "assistant",
      message_type: reply.assistantMessageType,
      content: reply.reply,
      structured_payload:
        reply.parsedActivities.length > 0 ||
          reply.parsedDietEntries.length > 0 ||
          reply.parsedWellnessCheckin
          ? {
            activitiesLogged: reply.parsedActivities.map((activity) => ({
              activityType: activity.activityType,
              durationMinutes: activity.durationMinutes,
              intensity: activity.intensity
            })),
            dietLogged: reply.parsedDietEntries.map((entry) => ({
              description: entry.description,
              mealType: entry.mealType,
              confidence: entry.confidence
            })),
            wellnessLogged: reply.parsedWellnessCheckin
              ? {
                  energyScore: reply.parsedWellnessCheckin.energyScore,
                  sorenessScore: reply.parsedWellnessCheckin.sorenessScore,
                  moodScore: reply.parsedWellnessCheckin.moodScore,
                  stressScore: reply.parsedWellnessCheckin.stressScore,
                  motivationScore: reply.parsedWellnessCheckin.motivationScore,
                  detectedSignals: reply.parsedWellnessCheckin.detectedSignals,
                  loggedFor: reply.parsedWellnessCheckin.loggedFor
                }
              : null
            ,
            orchestration: reply.metadata
          }
          : {}
    });

  if (assistantMessageError) {
    redirect(`/app/chat?error=${encodeURIComponent(assistantMessageError.message)}`);
  }

  revalidatePath("/app/chat");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/profile");
  redirect("/app/chat");
}
