import { NextResponse } from "next/server";
import { respondWithFrankieDay } from "@/lib/frankie-day-routes";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ day: null, error: "Log in to continue." }, { status: 401 });
  }

  return respondWithFrankieDay(await createSupabaseServerClient(), context.user.id);
}
