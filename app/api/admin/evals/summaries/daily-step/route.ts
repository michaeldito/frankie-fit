import { NextRequest, NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/admin";
import { getEvalScenarioById } from "@/lib/admin-evals";
import { runEvalScenarioDailySummaryStep } from "@/lib/admin-eval-runner";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

async function requireAdminResponse() {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  if (!isAdminProfile(context.profile)) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const adminError = await requireAdminResponse();

  if (adminError) {
    return adminError;
  }

  const body = (await request.json().catch(() => null)) as {
    dayIndex?: unknown;
    scenarioId?: unknown;
  } | null;
  const scenarioId = typeof body?.scenarioId === "string" ? body.scenarioId : "";
  const dayIndex = typeof body?.dayIndex === "number" ? body.dayIndex : -1;
  const scenario = getEvalScenarioById(scenarioId);

  if (!scenario || dayIndex < 0) {
    return NextResponse.json({ error: "Daily summary step input is invalid." }, { status: 400 });
  }

  const startedAt = Date.now();

  try {
    const supabase = createSupabaseServiceRoleClient();
    const result = await runEvalScenarioDailySummaryStep({ dayIndex, scenario, supabase });

    return NextResponse.json({
      dayLabel: result.day.label,
      elapsedMs: Date.now() - startedAt,
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not generate that day's summary.",
        ok: false
      },
      { status: 500 }
    );
  }
}
