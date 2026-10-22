import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppContext } from "@/lib/profile";
import { getNotificationDetail } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  try {
    const detail = await getNotificationDetail(await createSupabaseServerClient(), context.user.id, id);
    return detail
      ? NextResponse.json(detail)
      : NextResponse.json({ error: "Notification not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load that notification." },
      { status: 500 }
    );
  }
}
