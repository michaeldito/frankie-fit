import type { CurrentAppContext } from "@/lib/profile";
import { isAdminProfile } from "@/lib/admin";
import { EVAL_SCENARIOS, TUNING_REVIEW_CHECK_ID } from "@/lib/admin-evals";
import { resolveEvalScenarioUserIds } from "@/lib/admin-eval-runner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

type EvalRunRow = Database["public"]["Tables"]["eval_runs"]["Row"];
type EvalRunItemRow = Database["public"]["Tables"]["eval_run_items"]["Row"];
type EvalReviewRow = Database["public"]["Tables"]["eval_reviews"]["Row"];
type CoachSummaryRow = Database["public"]["Tables"]["coach_summaries"]["Row"];

export type RunItemStatusCounts = {
  total: number;
  good: number;
  warn: number;
  bad: number;
};

export type CoachSummaryWithUser = CoachSummaryRow & {
  userName: string | null;
};

export type AdminEvalsData = {
  ready: boolean;
  error: string | null;
  runs: EvalRunRow[];
  runItemStatusCounts: Record<string, RunItemStatusCounts>;
  selectedRun: EvalRunRow | null;
  selectedRunItems: EvalRunItemRow[];
  reviews: EvalReviewRow[];
  summaries: CoachSummaryWithUser[];
};

function classifyItemRunStatus(runStatus: string, flaggedForTuning: boolean): "good" | "warn" | "bad" {
  if (flaggedForTuning) {
    return "warn";
  }

  if (runStatus === "completed") {
    return "good";
  }

  if (runStatus === "clarification") {
    return "warn";
  }

  return "bad";
}

function buildRunItemStatusCounts(
  items: Array<{ id: string; eval_run_id: string; run_status: string }>,
  flaggedItemIds: Set<string>
): Record<string, RunItemStatusCounts> {
  const counts: Record<string, RunItemStatusCounts> = {};

  for (const item of items) {
    const bucket = (counts[item.eval_run_id] ??= { total: 0, good: 0, warn: 0, bad: 0 });
    bucket.total += 1;
    bucket[classifyItemRunStatus(item.run_status, flaggedItemIds.has(item.id))] += 1;
  }

  return counts;
}

function isMissingEvalTable(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    message.includes("public.eval_runs") ||
    message.includes("public.eval_run_items") ||
    message.includes("public.eval_reviews") ||
    message.includes("public.coach_summaries") ||
    message.includes("Could not find the table")
  );
}

function buildEmptyEvalsData(error: string | null): AdminEvalsData {
  return {
    ready: false,
    error,
    runs: [],
    runItemStatusCounts: {},
    selectedRun: null,
    selectedRunItems: [],
    reviews: [],
    summaries: []
  };
}

export async function getAdminEvalsData(input: {
  context: CurrentAppContext;
  selectedRunId?: string | null;
}): Promise<AdminEvalsData> {
  if (!input.context.schemaReady || !input.context.user || !isAdminProfile(input.context.profile)) {
    return buildEmptyEvalsData(input.context.error);
  }

  const supabase = await createSupabaseServerClient();
  const runsResult = await supabase
    .from("eval_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  if (runsResult.error) {
    if (isMissingEvalTable(runsResult.error.message)) {
      return buildEmptyEvalsData(runsResult.error.message);
    }

    return buildEmptyEvalsData(runsResult.error.message);
  }

  const runs = runsResult.data ?? [];
  const runIds = runs.map((run) => run.id);
  const selectedRun = input.selectedRunId
    ? (runs.find((run) => run.id === input.selectedRunId) ?? null)
    : null;
  const [itemsResult, statusCountsResult, scenarioUserIds] = await Promise.all([
    selectedRun
      ? supabase
          .from("eval_run_items")
          .select("*")
          .eq("eval_run_id", selectedRun.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    runIds.length > 0
      ? supabase
          .from("eval_run_items")
          .select("id, eval_run_id, run_status")
          .in("eval_run_id", runIds)
      : Promise.resolve({ data: [], error: null }),
    resolveEvalScenarioUserIds(createSupabaseServiceRoleClient(), EVAL_SCENARIOS).catch(
      () => [] as string[]
    )
  ]);

  // Scoped to the known benchmark personas rather than a flat global "most recent" query, so
  // one persona's summaries can never crowd another's out of the window (see the "Coaching
  // memory" bug where Maya Patel's freshly-generated summaries were hidden by more recent
  // activity on other personas).
  const summariesResult =
    scenarioUserIds.length > 0
      ? await supabase
          .from("coach_summaries")
          .select("*, profiles ( full_name )")
          .in("user_id", scenarioUserIds)
          .order("created_at", { ascending: false })
          .limit(60)
      : { data: [], error: null };

  const firstError =
    itemsResult.error?.message ??
    statusCountsResult.error?.message ??
    summariesResult.error?.message ??
    null;

  if (firstError) {
    return buildEmptyEvalsData(firstError);
  }

  const selectedRunItems = itemsResult.data ?? [];
  const itemIds = selectedRunItems.map((item) => item.id);
  const allListedItemIds = (statusCountsResult.data ?? []).map((item) => item.id);
  const [reviewsResult, flaggedReviewsResult] = await Promise.all([
    itemIds.length > 0
      ? supabase.from("eval_reviews").select("*").in("eval_run_item_id", itemIds)
      : Promise.resolve({ data: [], error: null }),
    allListedItemIds.length > 0
      ? supabase
          .from("eval_reviews")
          .select("eval_run_item_id")
          .in("eval_run_item_id", allListedItemIds)
          .eq("review_check", TUNING_REVIEW_CHECK_ID)
          .eq("status", "needs_work")
      : Promise.resolve({ data: [], error: null })
  ]);

  if (reviewsResult.error) {
    return buildEmptyEvalsData(reviewsResult.error.message);
  }

  if (flaggedReviewsResult.error) {
    return buildEmptyEvalsData(flaggedReviewsResult.error.message);
  }

  const flaggedItemIds = new Set(
    (flaggedReviewsResult.data ?? []).map((review) => review.eval_run_item_id)
  );

  const summaries = (summariesResult.data ?? []).map((summary) => {
    const { profiles, ...summaryRow } = summary as CoachSummaryRow & {
      profiles: { full_name: string | null } | null;
    };

    return {
      ...summaryRow,
      userName: profiles?.full_name ?? null
    };
  });

  return {
    ready: true,
    error: null,
    runs,
    runItemStatusCounts: buildRunItemStatusCounts(statusCountsResult.data ?? [], flaggedItemIds),
    selectedRun,
    selectedRunItems,
    reviews: reviewsResult.data ?? [],
    summaries
  };
}

