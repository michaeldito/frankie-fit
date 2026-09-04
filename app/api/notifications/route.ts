import { NextResponse } from "next/server";
import { getCurrentAppContext } from "@/lib/profile";
import { listNotifications } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const notifications = await listNotifications(supabase, context.user.id);

  return NextResponse.json({ notifications });
}
