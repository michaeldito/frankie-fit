import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { intensityOptions } from "@/lib/ai/schemas/extracted-user-update";

const validIntensityValues = intensityOptions.filter((option) => option !== "unknown");

const activityPatchSchema = z.object({
  activityType: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().min(0).nullable(),
  intensity: z.string().nullable()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = activityPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "That activity log isn't valid." },
      { status: 400 }
    );
  }

  if (
    parsed.data.intensity !== null &&
    !validIntensityValues.includes(parsed.data.intensity as (typeof validIntensityValues)[number])
  ) {
    return NextResponse.json({ error: "That intensity isn't valid." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("activity_logs")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That activity log could not be found." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("activity_logs")
    .update({
      activity_type: parsed.data.activityType,
      description: parsed.data.description,
      duration_minutes: parsed.data.durationMinutes,
      intensity: parsed.data.intensity
    })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id, activity_type, description, duration_minutes, intensity, logged_for_date");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Could not save the activity log." }, { status: 500 });
  }

  const row = updated[0];

  return NextResponse.json({
    id: row.id,
    activityType: row.activity_type,
    description: row.description ?? "",
    durationMinutes: row.duration_minutes,
    intensity: row.intensity,
    loggedForDate: row.logged_for_date
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("activity_logs")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That activity log could not be found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("activity_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
