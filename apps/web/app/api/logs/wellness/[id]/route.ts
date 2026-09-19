import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const wellnessScoreSchema = z.number().int().min(0).max(5).nullable();

const wellnessPatchSchema = z.object({
  energyScore: wellnessScoreSchema,
  moodScore: wellnessScoreSchema,
  motivationScore: wellnessScoreSchema,
  sorenessScore: wellnessScoreSchema,
  stressScore: wellnessScoreSchema,
  notes: z.string().nullable()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = wellnessPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "That wellness check-in isn't valid." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("wellness_checkins")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That wellness check-in could not be found." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("wellness_checkins")
    .update({
      energy_score: parsed.data.energyScore,
      mood_score: parsed.data.moodScore,
      motivation_score: parsed.data.motivationScore,
      soreness_score: parsed.data.sorenessScore,
      stress_score: parsed.data.stressScore,
      notes: parsed.data.notes
    })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id, energy_score, mood_score, motivation_score, soreness_score, stress_score, notes, logged_for_date");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Could not save the wellness check-in." }, { status: 500 });
  }

  const row = updated[0];

  return NextResponse.json({
    id: row.id,
    energyScore: row.energy_score,
    moodScore: row.mood_score,
    motivationScore: row.motivation_score,
    sorenessScore: row.soreness_score,
    stressScore: row.stress_score,
    notes: row.notes,
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
    .from("wellness_checkins")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That wellness check-in could not be found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("wellness_checkins")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
