import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppContext } from "@/lib/profile";
import { markNotificationRead } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    await markNotificationRead(supabase, context.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not mark as read." },
      { status: 500 }
    );
  }
}
