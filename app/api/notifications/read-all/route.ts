import { NextResponse } from "next/server";
import { getCurrentAppContext } from "@/lib/profile";
import { markAllNotificationsRead } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    await markAllNotificationsRead(supabase, context.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not mark notifications as read." },
      { status: 500 }
    );
  }
}
