import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { evaluateFrankieNudges } from "@/lib/notifications";

// Runs hourly (see .github/workflows/frankie-nudges.yml); quiet hours and the daily cap live in
// companion-core's pickNudge, so extra runs are harmless.
export async function GET(request: NextRequest) {
  const { CRON_SECRET } = getServerEnv();

  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json({ ok: true, frankieNudges: await evaluateFrankieNudges() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not evaluate Frankie's nudges.", ok: false },
      { status: 500 }
    );
  }
}
