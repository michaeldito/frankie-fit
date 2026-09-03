import { NextResponse, type NextRequest } from "next/server";
import { enrollInProgram } from "@/lib/programs/enroll-in-program";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const startDate = typeof body?.startDate === "string" ? body.startDate : null;

  if (!startDate || !isoDatePattern.test(startDate)) {
    return NextResponse.json({ error: "Pick a valid start date." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    await enrollInProgram({ supabase, userId: context.user.id, programSlug: slug, startDate });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start the program." },
      { status: 500 }
    );
  }
}
