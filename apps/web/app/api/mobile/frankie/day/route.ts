import { NextRequest } from "next/server";
import { respondWithFrankieDay } from "@/lib/frankie-day-routes";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);

  if ("error" in auth) {
    return auth.error;
  }

  return respondWithFrankieDay(auth.supabase, auth.user.id);
}
