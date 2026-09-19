import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mealTypeOptions } from "@/lib/ai/schemas/extracted-user-update";

const validMealTypeValues = mealTypeOptions.filter((option) => option !== "unknown");

const dietPatchSchema = z.object({
  description: z.string().min(1),
  mealType: z.string().nullable()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dietPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "That diet log isn't valid." },
      { status: 400 }
    );
  }

  if (
    parsed.data.mealType !== null &&
    !validMealTypeValues.includes(parsed.data.mealType as (typeof validMealTypeValues)[number])
  ) {
    return NextResponse.json({ error: "That meal type isn't valid." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("diet_logs")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That diet log could not be found." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("diet_logs")
    .update({
      description: parsed.data.description,
      meal_type: parsed.data.mealType
    })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id, description, meal_type, logged_for_date");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Could not save the diet log." }, { status: 500 });
  }

  const row = updated[0];

  return NextResponse.json({
    id: row.id,
    description: row.description,
    mealType: row.meal_type,
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
    .from("diet_logs")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That diet log could not be found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("diet_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
