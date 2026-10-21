import { NextRequest } from "next/server";
import { respondToRedeem } from "@/lib/frankie-day-routes";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  return respondToRedeem(auth.supabase, auth.user.id, body);
}
