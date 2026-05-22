import { NextRequest, NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/admin";
import { getEvalScenarioById } from "@/lib/admin-evals";
import { runEvalScenarioReplayStep } from "@/lib/admin-eval-runner";
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
    runId?: unknown;
    scenarioId?: unknown;
    stepIndex?: unknown;
    threadId?: unknown;
  } | null;
  const runId = typeof body?.runId === "string" ? body.runId : "";
  const scenarioId = typeof body?.scenarioId === "string" ? body.scenarioId : "";
  const stepIndex = typeof body?.stepIndex === "number" ? body.stepIndex : -1;
  const threadId = typeof body?.threadId === "string" ? body.threadId : "";
  const scenario = getEvalScenarioById(scenarioId);

  if (!scenario || !runId || !threadId || stepIndex < 0) {
    return NextResponse.json({ error: "Replay step input is invalid." }, { status: 400 });
  }

  try {
    const result = await runEvalScenarioReplayStep({
      evalRunId: runId,
      scenario,
      stepIndex,
      threadId
    });

    return NextResponse.json({
      assistantReply: result.assistantReply,
      elapsedMs: result.elapsedMs,
      error: result.errorMessage,
      ok: !result.errorMessage,
      runId: result.evalRunId,
      runStatus: result.runStatus,
      step: result.step,
      traceId: result.traceId
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not run eval replay step.",
        ok: false
      },
      { status: 500 }
    );
  }
}

