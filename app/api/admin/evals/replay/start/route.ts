import { NextRequest, NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/admin";
import { getEvalScenarioById } from "@/lib/admin-evals";
import { beginEvalScenarioReplay } from "@/lib/admin-eval-runner";
import { getCurrentAppContext } from "@/lib/profile";

async function requireAdminUserId() {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return {
      error: NextResponse.json({ error: "Log in to continue." }, { status: 401 }),
      userId: null
    };
  }

  if (!isAdminProfile(context.profile)) {
    return {
      error: NextResponse.json({ error: "Admin access is required." }, { status: 403 }),
      userId: null
    };
  }

  return {
    error: null,
    userId: context.user.id
  };
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminUserId();

  if (admin.error) {
    return admin.error;
  }

  if (!admin.userId) {
    return NextResponse.json({ error: "Admin user context is required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    scenarioId?: unknown;
  } | null;
  const scenarioId = typeof body?.scenarioId === "string" ? body.scenarioId : "";
  const scenario = getEvalScenarioById(scenarioId);

  if (!scenario) {
    return NextResponse.json({ error: "Choose a valid eval scenario." }, { status: 400 });
  }

  try {
    const replay = await beginEvalScenarioReplay({
      adminUserId: admin.userId,
      scenario
    });

    return NextResponse.json({
      runId: replay.evalRunId,
      steps: replay.steps,
      threadId: replay.threadId
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not start eval replay."
      },
      { status: 500 }
    );
  }
}
