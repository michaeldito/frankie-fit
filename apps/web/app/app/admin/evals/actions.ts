"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEvalScenarioById } from "@/lib/admin-evals";
import { requireAdminContext } from "@/lib/admin";
import { resetEvalScenarioUser } from "@/lib/admin-eval-runner";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

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

function redirectToEvals(message: string, options?: { runId?: string; scenarioId?: string }) {
  const params = new URLSearchParams({ message });

  if (options?.runId) {
    params.set("run", options.runId);
  }

  if (options?.scenarioId) {
    params.set("scenario", options.scenarioId);
  }

  redirect(`/app/admin/evals?${params.toString()}`);
}

export async function resetScenarioUserAction(formData: FormData) {
  const scenario = getScenarioFromForm(formData);
  await requireAdminUserId();
  const supabase = createSupabaseServiceRoleClient();
  const result = await resetEvalScenarioUser(supabase, scenario);

  revalidatePath("/app/admin/evals");
  redirectToEvals(
    `Reset ${scenario.userName}; removed chat histories (${result.deletedThreadCount}) and eval runs (${result.deletedEvalRunCount}).`,
    { scenarioId: scenario.id }
  );
}
