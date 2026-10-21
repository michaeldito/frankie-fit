import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { QualityCheckResult, QualitySummary } from "./quality-checks";

type SupabaseServerClient = SupabaseClient<Database>;

export async function persistQualityChecks(input: {
  supabase: SupabaseServerClient;
  traceRunId: string;
  checks: QualityCheckResult[];
  summary: QualitySummary;
}) {
  try {
    const rows = input.checks.map(c => ({
      trace_run_id: input.traceRunId,
      check_name: c.name,
      check_result: c.result,
      detail: c.detail
    }));

    await Promise.all([
      input.supabase.from("ai_trace_quality_checks").insert(rows),
      input.supabase
        .from("ai_trace_runs")
        .update({ quality_summary: input.summary })
        .eq("id", input.traceRunId)
    ]);
  } catch (error) {
    console.error("[quality-checks] Failed to persist quality checks:", error);
  }
}
