import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { evaluateCheckinNudges } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const { CRON_SECRET } = getServerEnv();

  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await evaluateCheckinNudges();

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not evaluate check-in nudges.", ok: false },
      { status: 500 }
    );
  }
}
