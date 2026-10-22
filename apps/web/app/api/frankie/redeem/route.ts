import { NextRequest, NextResponse } from "next/server";
import { respondToRedeem } from "@/lib/frankie-day-routes";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ day: null, error: "Log in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  return respondToRedeem(await createSupabaseServerClient(), context.user.id, body);
}
