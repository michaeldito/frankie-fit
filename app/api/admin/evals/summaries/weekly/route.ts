import { NextRequest, NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/admin";
import { getEvalScenarioById } from "@/lib/admin-evals";
import { runEvalScenarioWeeklySummary } from "@/lib/admin-eval-runner";
import { getCurrentAppContext } from "@/lib/profile";

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
    scenarioId?: unknown;
  } | null;
  const scenarioId = typeof body?.scenarioId === "string" ? body.scenarioId : "";
  const scenario = getEvalScenarioById(scenarioId);

  if (!scenario) {
    return NextResponse.json({ error: "Choose a valid eval scenario." }, { status: 400 });
  }

  const startedAt = Date.now();

  try {
    await runEvalScenarioWeeklySummary(scenario);

    return NextResponse.json({
      elapsedMs: Date.now() - startedAt,
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not generate the weekly summary.",
        ok: false
      },
      { status: 500 }
    );
  }
}
