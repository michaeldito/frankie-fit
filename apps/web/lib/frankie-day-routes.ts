import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isFrankieNeed } from "@frankie-fit/companion-core";
import { loadFrankieDay, redeemFrankieAction } from "@/lib/frankie-day";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

// Shared by the cookie-auth web routes and the bearer-auth mobile routes.
export async function respondWithFrankieDay(supabase: Client, userId: string) {
  try {
    return NextResponse.json({ day: await loadFrankieDay(supabase, userId), error: null });
  } catch (error) {
    return NextResponse.json(
      { day: null, error: error instanceof Error ? error.message : "Could not load Frankie's day." },
      { status: 500 }
    );
  }
}

export async function respondToRedeem(supabase: Client, userId: string, body: unknown) {
  const kind = (body as { kind?: unknown } | null)?.kind;

  if (!isFrankieNeed(kind)) {
    return NextResponse.json({ day: null, error: "unknown_action" }, { status: 400 });
  }

  try {
    const result = await redeemFrankieAction(supabase, userId, kind);
    return result.ok
      ? NextResponse.json({ day: result.day, error: null })
      : NextResponse.json({ day: null, error: result.error }, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { day: null, error: error instanceof Error ? error.message : "Could not redeem that." },
      { status: 500 }
    );
  }
}
