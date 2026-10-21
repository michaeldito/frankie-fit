import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { lifestyleCategoryOptions } from "@/lib/ai/schemas/extracted-user-update";

const validCategoryValues = lifestyleCategoryOptions.filter((option) => option !== "unknown");

const lifestylePatchSchema = z.object({
  description: z.string().min(1),
  category: z.string().nullable()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = lifestylePatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "That lifestyle log isn't valid." },
      { status: 400 }
    );
  }

  if (
    parsed.data.category !== null &&
    !validCategoryValues.includes(parsed.data.category as (typeof validCategoryValues)[number])
  ) {
    return NextResponse.json({ error: "That category isn't valid." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("lifestyle_logs")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That lifestyle log could not be found." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("lifestyle_logs")
    .update({
      description: parsed.data.description,
      category: parsed.data.category ?? "other"
    })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id, description, category, logged_for_date");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Could not save the lifestyle log." }, { status: 500 });
  }

  const row = updated[0];

  return NextResponse.json({
    id: row.id,
    description: row.description,
    category: row.category,
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
    .from("lifestyle_logs")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "That lifestyle log could not be found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("lifestyle_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
