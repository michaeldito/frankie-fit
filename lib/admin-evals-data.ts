import type { CurrentAppContext } from "@/lib/profile";
import { isAdminProfile } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type EvalRunRow = Database["public"]["Tables"]["eval_runs"]["Row"];
type EvalRunItemRow = Database["public"]["Tables"]["eval_run_items"]["Row"];
type EvalReviewRow = Database["public"]["Tables"]["eval_reviews"]["Row"];
type CoachSummaryRow = Database["public"]["Tables"]["coach_summaries"]["Row"];

export type AdminEvalsData = {
  ready: boolean;
  error: string | null;
  runs: EvalRunRow[];
  selectedRun: EvalRunRow | null;
  selectedRunItems: EvalRunItemRow[];
  reviews: EvalReviewRow[];
  summaries: CoachSummaryRow[];
};

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
  const selectedRun =
    runs.find((run) => run.id === input.selectedRunId) ?? runs[0] ?? null;
  const [itemsResult, summariesResult] = await Promise.all([
    selectedRun
      ? supabase
          .from("eval_run_items")
          .select("*")
          .eq("eval_run_id", selectedRun.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("coach_summaries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  const firstError = itemsResult.error?.message ?? summariesResult.error?.message ?? null;

  if (firstError) {
    return buildEmptyEvalsData(firstError);
  }

  const selectedRunItems = itemsResult.data ?? [];
  const itemIds = selectedRunItems.map((item) => item.id);
  const reviewsResult =
    itemIds.length > 0
      ? await supabase
          .from("eval_reviews")
          .select("*")
          .in("eval_run_item_id", itemIds)
      : { data: [], error: null };

  if (reviewsResult.error) {
    return buildEmptyEvalsData(reviewsResult.error.message);
  }

  return {
    ready: true,
    error: null,
    runs,
    selectedRun,
    selectedRunItems,
    reviews: reviewsResult.data ?? [],
    summaries: summariesResult.data ?? []
  };
}

