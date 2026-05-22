import { NextRequest, NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/admin";
import { finishEvalScenarioReplay } from "@/lib/admin-eval-runner";
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
    errorMessage?: unknown;
    runId?: unknown;
    status?: unknown;
  } | null;
  const runId = typeof body?.runId === "string" ? body.runId : "";
  const status = body?.status === "failed" ? "failed" : "completed";
  const errorMessage = typeof body?.errorMessage === "string" ? body.errorMessage : null;

  if (!runId) {
    return NextResponse.json({ error: "Eval run id is required." }, { status: 400 });
  }

  try {
    const result = await finishEvalScenarioReplay({
      evalRunId: runId,
      status,
      errorMessage
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not finish eval replay."
      },
      { status: 500 }
    );
  }
}

