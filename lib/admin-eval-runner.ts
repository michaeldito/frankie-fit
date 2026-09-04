import type { User } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/profile";
import type { Database, Json } from "@/types/database";
import { getScenarioReplaySteps, type EvalScenario } from "@/lib/admin-evals";
import { FRANKIE_PROMPT_VERSION } from "@/lib/ai/orchestrator/frankie-orchestrator";
import {
  generateDailyCoachSummary,
  generateWeeklyCoachSummary
} from "@/lib/ai/summaries/frankie-summaries";
import { runFrankieTurn } from "@/lib/ai/run-frankie-turn";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function toAppProfile(row: ProfileRow | null): AppProfile | null {
  if (!row) {
    return null;
  }

  return {
    full_name: row.full_name,
    role: row.role,
    account_type: row.account_type,
    age_range: row.age_range,
    primary_goal: row.primary_goal,
    secondary_goals: row.secondary_goals,
    activity_level: row.activity_level,
    fitness_experience: row.fitness_experience,
    current_activities: row.current_activities,
    preferred_activities: row.preferred_activities,
    available_equipment: row.available_equipment,
    training_environment: row.training_environment,
    target_training_days: row.target_training_days,
    typical_session_length: row.typical_session_length,
    preferred_schedule:
      row.preferred_schedule &&
      typeof row.preferred_schedule === "object" &&
      !Array.isArray(row.preferred_schedule)
        ? row.preferred_schedule
        : null,
    diet_preferences: row.diet_preferences,
    diet_restrictions: row.diet_restrictions,
    nutrition_goal: row.nutrition_goal,
    energy_baseline: row.energy_baseline,
    stress_baseline: row.stress_baseline,
    wellness_support_focus: row.wellness_support_focus,
    wellness_checkin_opt_in: row.wellness_checkin_opt_in,
    injuries_limitations: row.injuries_limitations,
    health_considerations: row.health_considerations,
    avoidances: row.avoidances,
    coaching_style: row.coaching_style,
    coach_persona: row.coach_persona,
    preferred_checkin_style: row.preferred_checkin_style,
    safety_acknowledged: row.safety_acknowledged,
    onboarding_completed: row.onboarding_completed,
    onboarding_summary: row.onboarding_summary
  };
}

function getScenarioDates(scenario: EvalScenario) {
  const dates = scenario.days.map((day) => day.date);
  return {
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1]
  };
}

async function resolveTargetUser(email: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    throw new Error(error.message);
  }

  const targetUser =
    data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;

  if (!targetUser) {
    throw new Error(`Could not find benchmark user ${email}.`);
  }

  return targetUser;
}

// Resolves every scenario's user in one listUsers() call instead of one per scenario, and
// skips (rather than throws on) a scenario whose benchmark account doesn't exist yet — a
// missing account shouldn't break admin pages that just want to scope data to known personas.
export async function resolveEvalScenarioUserIds(scenarios: EvalScenario[]) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    throw new Error(error.message);
  }

  const emailToId = new Map(
    data.users.filter((user) => user.email).map((user) => [user.email!.toLowerCase(), user.id])
  );

  return scenarios
    .map((scenario) => emailToId.get(scenario.userEmail.toLowerCase()))
    .filter((id): id is string => Boolean(id));
}

async function loadProfile(userId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toAppProfile(data);
}

async function listThreadIds(userId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("conversation_threads")
    .select("id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((thread) => thread.id);
}

export async function resetEvalScenarioUser(scenario: EvalScenario) {
  const supabase = createSupabaseServiceRoleClient();
  const targetUser = await resolveTargetUser(scenario.userEmail);
  const threadIds = await listThreadIds(targetUser.id);
  const { data: evalRuns, error: evalRunsError } = await supabase
    .from("eval_runs")
    .select("id")
    .eq("scenario_id", scenario.id);

  if (evalRunsError) {
    throw new Error(evalRunsError.message);
  }

  const evalRunIds = (evalRuns ?? []).map((run) => run.id);

  await supabase.from("activity_logs").delete().eq("user_id", targetUser.id);
  await supabase.from("diet_logs").delete().eq("user_id", targetUser.id);
  await supabase.from("lifestyle_logs").delete().eq("user_id", targetUser.id);
  await supabase.from("wellness_checkins").delete().eq("user_id", targetUser.id);
  await supabase.from("recommendations").delete().eq("user_id", targetUser.id);
  await supabase.from("weekly_summaries").delete().eq("user_id", targetUser.id);
  await supabase.from("coach_summaries").delete().eq("user_id", targetUser.id);

  if (threadIds.length > 0) {
    await supabase.from("ai_trace_runs").delete().in("thread_id", threadIds);
  }

  await supabase.from("conversation_threads").delete().eq("user_id", targetUser.id);

  if (evalRunIds.length > 0) {
    await supabase.from("eval_runs").delete().in("id", evalRunIds);
  }

  return {
    deletedEvalRunCount: evalRunIds.length,
    userId: targetUser.id,
    userEmail: targetUser.email ?? scenario.userEmail,
    deletedThreadCount: threadIds.length
  };
}

async function createEvalThread(input: {
  scenario: EvalScenario;
  user: User;
  profile: AppProfile | null;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const title = `Eval: ${input.scenario.label}`;
  const { data: thread, error } = await supabase
    .from("conversation_threads")
    .insert({
      user_id: input.user.id,
      title
    })
    .select("*")
    .single();

  if (error || !thread) {
    throw new Error(error?.message ?? "Could not create eval conversation thread.");
  }

  const summaryText =
    input.profile?.onboarding_summary ??
    `${input.scenario.userName} benchmark profile for ${input.scenario.label}.`;
  const { data: initialMessage, error: initialMessageError } = await supabase
    .from("conversation_messages")
    .insert({
      thread_id: thread.id,
      user_id: input.user.id,
      role: "assistant",
      message_type: "summary",
      content: `${summaryText} This conversation is being replayed for a Frankie eval benchmark.`,
      structured_payload: {
        evalSeed: true,
        scenarioId: input.scenario.id,
        accountKey: input.scenario.accountKey
      }
    })
    .select("*")
    .single();

  if (initialMessageError || !initialMessage) {
    throw new Error(initialMessageError?.message ?? "Could not create eval intro message.");
  }

  return {
    thread,
    initialMessage
  };
}

async function createEvalRun(input: {
  adminUserId: string;
  scenario: EvalScenario;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { periodStart, periodEnd } = getScenarioDates(input.scenario);
  const { data, error } = await supabase
    .from("eval_runs")
    .insert({
      suite_id: "frankie-benchmark-v1",
      scenario_id: input.scenario.id,
      run_scope: "scenario",
      status: "running",
      model_name: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      prompt_version: FRANKIE_PROMPT_VERSION,
      created_by: input.adminUserId,
      metadata_json: {
        userEmail: input.scenario.userEmail,
        accountKey: input.scenario.accountKey,
        periodStart,
        periodEnd
      }
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create eval run.");
  }

  return data;
}

async function updateEvalRun(input: {
  errorMessage?: string | null;
  runId: string;
  status: "completed" | "failed";
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("eval_runs")
    .update({
      status: input.status,
      completed_at: new Date().toISOString(),
      error_message: input.errorMessage ?? null
    })
    .eq("id", input.runId);

  if (error) {
    throw new Error(error.message);
  }
}

async function insertEvalRunItem(input: {
  actualJson: Json;
  assistantMessageId: string | null;
  assistantReply: string | null;
  dayIndex: number;
  errorMessage: string | null;
  evalRunId: string;
  expectedJson: Json;
  inputMessage: string;
  pillar: "activity" | "diet" | "lifestyle" | "wellness" | "summary";
  runStatus: string;
  scenarioId: string;
  sourceMessageId: string | null;
  traceId: string | null;
  userId: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("eval_run_items").insert({
    eval_run_id: input.evalRunId,
    scenario_id: input.scenarioId,
    user_id: input.userId,
    day_index: input.dayIndex,
    pillar: input.pillar,
    input_message: input.inputMessage,
    expected_json: input.expectedJson,
    trace_id: input.traceId,
    source_message_id: input.sourceMessageId,
    assistant_message_id: input.assistantMessageId,
    assistant_reply: input.assistantReply,
    actual_json: input.actualJson,
    run_status: input.runStatus,
    error_message: input.errorMessage
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function loadThreadMessages(input: {
  threadId: string;
  userId: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("thread_id", input.threadId)
    .eq("user_id", input.userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function loadEvalRun(runId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("eval_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not find eval run.");
  }

  return data;
}

async function loadEvalThread(input: {
  threadId: string;
  userId: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("conversation_threads")
    .select("*")
    .eq("id", input.threadId)
    .eq("user_id", input.userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not find eval conversation thread.");
  }

  return data;
}

export async function beginEvalScenarioReplay(input: {
  adminUserId: string;
  scenario: EvalScenario;
}) {
  const targetUser = await resolveTargetUser(input.scenario.userEmail);
  const profile = await loadProfile(targetUser.id);
  const evalRun = await createEvalRun({
    adminUserId: input.adminUserId,
    scenario: input.scenario
  });
  const { thread } = await createEvalThread({
    scenario: input.scenario,
    user: targetUser,
    profile
  });

  return {
    evalRunId: evalRun.id,
    threadId: thread.id,
    steps: getScenarioReplaySteps(input.scenario),
    userId: targetUser.id
  };
}

export async function runEvalScenarioReplayStep(input: {
  evalRunId: string;
  scenario: EvalScenario;
  stepIndex: number;
  threadId: string;
}) {
  const startedAt = Date.now();
  const evalRun = await loadEvalRun(input.evalRunId);

  if (evalRun.scenario_id !== input.scenario.id) {
    throw new Error("Eval run does not match the requested scenario.");
  }

  if (evalRun.status !== "running") {
    throw new Error("Eval run is not active.");
  }

  const steps = getScenarioReplaySteps(input.scenario);
  const step = steps[input.stepIndex];

  if (!step) {
    throw new Error("Replay step index is out of range.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const targetUser = await resolveTargetUser(input.scenario.userEmail);
  const profile = await loadProfile(targetUser.id);
  const thread = await loadEvalThread({
    threadId: input.threadId,
    userId: targetUser.id
  });
  const recentMessages = await loadThreadMessages({
    threadId: input.threadId,
    userId: targetUser.id
  });
  const result = await runFrankieTurn({
    supabase,
    userId: targetUser.id,
    userEmail: targetUser.email ?? input.scenario.userEmail,
    displayName: input.scenario.userName,
    profile,
    threadId: thread.id,
    threadTitle: thread.title,
    message: step.message,
    recentMessages
  });

  await insertEvalRunItem({
    evalRunId: evalRun.id,
    scenarioId: input.scenario.id,
    userId: targetUser.id,
    dayIndex: step.dayIndex,
    pillar: step.pillar,
    inputMessage: step.message,
    expectedJson: step.expected as Json,
    traceId: result.traceId,
    sourceMessageId: result.userMessage.id,
    assistantMessageId: result.assistantMessage?.id ?? null,
    assistantReply: result.assistantReply,
    actualJson: result.actualJson,
    runStatus: result.runStatus,
    errorMessage: result.errorMessage
  });

  return {
    assistantReply: result.assistantReply,
    elapsedMs: Date.now() - startedAt,
    errorMessage: result.errorMessage,
    evalRunId: evalRun.id,
    runStatus: result.runStatus,
    step,
    traceId: result.traceId
  };
}

export async function finishEvalScenarioReplay(input: {
  errorMessage?: string | null;
  evalRunId: string;
  status: "completed" | "failed";
}) {
  await updateEvalRun({
    runId: input.evalRunId,
    status: input.status,
    errorMessage: input.errorMessage ?? null
  });

  return {
    evalRunId: input.evalRunId,
    status: input.status
  };
}

export async function runEvalScenarioDailySummaryStep(input: {
  dayIndex: number;
  scenario: EvalScenario;
}) {
  const day = input.scenario.days.find((candidate) => candidate.dayIndex === input.dayIndex);

  if (!day) {
    throw new Error("Daily summary step index is out of range.");
  }

  const targetUser = await resolveTargetUser(input.scenario.userEmail);
  const profile = await loadProfile(targetUser.id);
  const supabase = createSupabaseServiceRoleClient();
  const summary = await generateDailyCoachSummary({
    supabase,
    userId: targetUser.id,
    profile,
    date: day.date
  });

  return { day, summary };
}

export async function runEvalScenarioWeeklySummary(scenario: EvalScenario) {
  const targetUser = await resolveTargetUser(scenario.userEmail);
  const profile = await loadProfile(targetUser.id);
  const supabase = createSupabaseServiceRoleClient();
  const { periodStart, periodEnd } = getScenarioDates(scenario);

  return generateWeeklyCoachSummary({
    supabase,
    userId: targetUser.id,
    profile,
    periodStart,
    periodEnd
  });
}
