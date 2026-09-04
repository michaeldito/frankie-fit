"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEvalScenarioById } from "@/lib/admin-evals";
import { requireAdminContext } from "@/lib/admin";
import { resetEvalScenarioUser, runFullEvalScenario } from "@/lib/admin-eval-runner";
import { getCurrentAppContext } from "@/lib/profile";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getScenarioFromForm(formData: FormData) {
  const scenarioId = getStringValue(formData, "scenarioId");
  const scenario = getEvalScenarioById(scenarioId);

  if (!scenario) {
    throw new Error("Choose a valid eval scenario.");
  }

  return scenario;
}

async function requireAdminUserId() {
  const context = await getCurrentAppContext();
  requireAdminContext(context);

  if (!context.user) {
    throw new Error("Admin user context is required.");
  }

  return context.user.id;
}

function redirectToEvals(message: string, runId?: string) {
  const params = new URLSearchParams({ message });

  if (runId) {
    params.set("run", runId);
  }

  redirect(`/app/admin/evals?${params.toString()}`);
}

export async function resetScenarioUserAction(formData: FormData) {
  const scenario = getScenarioFromForm(formData);
  await requireAdminUserId();
  const result = await resetEvalScenarioUser(scenario);

  revalidatePath("/app/admin/evals");
  redirectToEvals(
    `Reset ${scenario.userName}; removed ${result.deletedThreadCount} thread(s) and ${result.deletedEvalRunCount} eval run(s).`
  );
}

export async function runFullScenarioAction(formData: FormData) {
  const scenario = getScenarioFromForm(formData);
  const adminUserId = await requireAdminUserId();
  const result = await runFullEvalScenario({
    adminUserId,
    scenario
  });

  revalidatePath("/app/admin/evals");
  redirectToEvals(`Ran full eval scenario for ${scenario.label}.`, result.evalRunId);
}
