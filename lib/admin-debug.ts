import type { CurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type AiTraceRunRow = Database["public"]["Tables"]["ai_trace_runs"]["Row"];

export type AdminDebugData = {
  ready: boolean;
  error: string | null;
  traces: AiTraceRunRow[];
  selectedTrace: AiTraceRunRow | null;
  threadTimeline: AiTraceRunRow[];
};

function isMissingTraceTable(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return message.includes("public.ai_trace_runs");
}

function buildEmptyDebugData(error: string | null): AdminDebugData {
  return {
    ready: false,
    error,
    traces: [],
    selectedTrace: null,
    threadTimeline: []
  };
}

function matchesQuery(trace: AiTraceRunRow, query: string) {
  const haystack = [
    trace.user_email,
    trace.user_display_name,
    trace.thread_title,
    trace.raw_user_message,
    trace.final_reply,
    trace.fallback_reason,
    trace.error_message
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export async function getAdminDebugData(input: {
  context: CurrentAppContext;
  query?: string | null;
  traceId?: string | null;
}): Promise<AdminDebugData> {
  if (!input.context.schemaReady || !input.context.user || input.context.profile?.role !== "admin") {
    return buildEmptyDebugData(input.context.error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_trace_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error && isMissingTraceTable(error.message)) {
    return buildEmptyDebugData(error.message);
  }

  const traces = data ?? [];
  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
  const filteredTraces = normalizedQuery
    ? traces.filter((trace) => matchesQuery(trace, normalizedQuery))
    : traces;
  const selectedTrace =
    filteredTraces.find((trace) => trace.id === input.traceId) ??
    traces.find((trace) => trace.id === input.traceId) ??
    filteredTraces[0] ??
    null;
  const threadTimeline = selectedTrace
    ? traces
        .filter((trace) => trace.thread_id === selectedTrace.thread_id)
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
        .slice(-20)
    : [];

  return {
    ready: true,
    error: error?.message ?? null,
    traces: filteredTraces,
    selectedTrace,
    threadTimeline
  };
}

export function getTracePayloadValue(
  payload: Json,
  key: string
): Json | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return (payload as Record<string, Json | undefined>)[key] ?? null;
}

export function getTraceAnalysis(trace: AiTraceRunRow | null) {
  if (!trace) {
    return "Select a trace to inspect how Frankie handled that turn.";
  }

  if (trace.run_status === "clarification") {
    return "Frankie treated this turn as ambiguous enough to stop and ask a clarifying question instead of writing logs.";
  }

  if (trace.error_stage) {
    return `This turn failed after Frankie generated a reply. The failure happened during ${trace.error_stage.replaceAll("_", " ")}.`;
  }

  if (trace.orchestration_mode === "rule_based_fallback") {
    return trace.fallback_reason
      ? `The rule-based fallback handled this turn because the model path did not complete cleanly: ${trace.fallback_reason}`
      : "The rule-based fallback handled this turn instead of the model path.";
  }

  if (trace.used_model) {
    return "The model path completed normally. If the result still felt wrong, the likely issue is extraction quality or coaching wording rather than a route-level failure.";
  }

  return "This trace completed, but Frankie did not use the model path for it.";
}
