"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildAssistantReply, getChatExperience } from "@/lib/chat";
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

  const reply = buildAssistantReply(context.profile, message);

  if (reply.parsedActivities.length > 0) {
    const { error: activityLogError } = await supabase.from("activity_logs").insert(
      reply.parsedActivities.map((activity, index) => ({
        user_id: user.id,
        source_message_id: userMessage.id,
        activity_type: activity.activityType,
        description: activity.description,
        duration_minutes: activity.durationMinutes,
        intensity: activity.intensity,
        metadata_json: {
          detectedKeyword: activity.detectedKeyword,
          segmentIndex: index
        }
      }))
    );

    if (activityLogError) {
      redirect(`/app/chat?error=${encodeURIComponent(activityLogError.message)}`);
    }
  }

  if (reply.parsedDietEntries.length > 0) {
    const { error: dietLogError } = await supabase.from("diet_logs").insert(
      reply.parsedDietEntries.map((entry, index) => ({
        user_id: user.id,
        source_message_id: userMessage.id,
        description: entry.description,
        meal_type: entry.mealType,
        confidence: entry.confidence,
        metadata_json: {
          detectedKeyword: entry.detectedKeyword,
          segmentIndex: index
        }
      }))
    );

    if (dietLogError) {
      redirect(`/app/chat?error=${encodeURIComponent(dietLogError.message)}`);
    }
  }

  if (reply.parsedWellnessCheckin) {
    const { error: wellnessLogError } = await supabase.from("wellness_checkins").insert({
      user_id: user.id,
      source_message_id: userMessage.id,
      energy_score: reply.parsedWellnessCheckin.energyScore,
      soreness_score: reply.parsedWellnessCheckin.sorenessScore,
      mood_score: reply.parsedWellnessCheckin.moodScore,
      stress_score: reply.parsedWellnessCheckin.stressScore,
      motivation_score: reply.parsedWellnessCheckin.motivationScore,
      notes: reply.parsedWellnessCheckin.notes
    });

    if (wellnessLogError) {
      redirect(`/app/chat?error=${encodeURIComponent(wellnessLogError.message)}`);
    }
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
                  detectedSignals: reply.parsedWellnessCheckin.detectedSignals
                }
              : null
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
