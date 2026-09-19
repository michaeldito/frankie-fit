import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { savedWorkout?: Json } | null;

  if (!body || !body.savedWorkout) {
    return NextResponse.json({ error: "A saved workout summary is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("conversation_messages")
    .select("id, structured_payload")
    .eq("id", messageId)
    .eq("user_id", context.user.id)
    .eq("message_type", "workout_draft")
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That draft could not be found." }, { status: 404 });
  }

  const currentPayload =
    (existing.structured_payload as { workoutDraft?: Record<string, Json> } | null) ?? {};
  const updatedWorkoutDraft = {
    ...(currentPayload.workoutDraft ?? {}),
    savedWorkout: body.savedWorkout
  };

  const { data: updated, error: updateError } = await supabase
    .from("conversation_messages")
    .update({
      structured_payload: {
        ...currentPayload,
        workoutDraft: updatedWorkoutDraft
      } as Json
    })
    .eq("id", messageId)
    .eq("user_id", context.user.id)
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Could not save the workout summary." }, { status: 500 });
  }

  return NextResponse.json({ workoutDraft: updatedWorkoutDraft });
}
