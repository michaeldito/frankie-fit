import Link from "next/link";
import { DebugTraceInspector } from "@/components/admin/debug-trace-inspector";
import { getAdminDebugData, getTraceAnalysis } from "@/lib/admin-debug";
import { requireAdminContext } from "@/lib/admin";
import { getCurrentAppContext } from "@/lib/profile";
import type { Database } from "@/types/database";

type AiTraceRunRow = Database["public"]["Tables"]["ai_trace_runs"]["Row"];

function StatusPill({
  label,
  active = false
}: {
  label: string;
  active?: boolean;
}) {
  const normalizedLabel = label.toLowerCase();
  const statusTone = normalizedLabel.includes("clarification")
    ? "border-[rgba(251,191,36,0.26)] bg-[rgba(251,191,36,0.14)] text-[#fde68a]"
    : normalizedLabel.includes("completed")
      ? "border-[rgba(74,222,128,0.24)] bg-[rgba(74,222,128,0.14)] text-[#bbf7d0]"
      : normalizedLabel.includes("failed") || normalizedLabel.includes("error")
        ? "border-[rgba(248,113,113,0.24)] bg-[rgba(248,113,113,0.14)] text-[#fecaca]"
        : active
          ? "bg-[rgba(59,130,246,0.18)] text-[var(--foreground)]"
          : "";

  return (
    <span
      className={`ff-pill text-[0.72rem] uppercase tracking-[0.15em] ${statusTone}`}
    >
      {label}
    </span>
  );
}

function TraceLink({
  trace,
  active,
  query
}: {
  trace: AiTraceRunRow;
  active: boolean;
  query: string;
}) {
  const href = query
    ? `/app/admin/debug?query=${encodeURIComponent(query)}&trace=${trace.id}`
    : `/app/admin/debug?trace=${trace.id}`;

  return (
    <Link
      className={`block rounded-[0.65rem] border px-3 py-2.5 transition ${
        active
          ? "border-[rgba(96,165,250,0.42)] bg-[rgba(59,130,246,0.12)]"
          : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[rgba(96,165,250,0.26)]"
      }`}
      href={href}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium tracking-[-0.01em]">
          {trace.user_display_name ?? trace.user_email ?? "Unknown user"}
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusPill
            active={trace.orchestration_mode === "model"}
            label={trace.orchestration_mode === "model" ? "model" : "fallback"}
          />
          <StatusPill label={trace.run_status.replaceAll("_", " ")} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
        {trace.raw_user_message}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
        {new Date(trace.created_at).toLocaleString()}
      </p>
    </Link>
  );
}

export default async function AdminDebugPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query =
    typeof resolvedSearchParams?.query === "string" ? resolvedSearchParams.query : "";
  const traceId =
    typeof resolvedSearchParams?.trace === "string" ? resolvedSearchParams.trace : null;
  const context = await getCurrentAppContext();
  requireAdminContext(context);
  const debugData = await getAdminDebugData({
    context,
    query,
    traceId
  });
  const selectedTrace = debugData.selectedTrace;

  return (
    <div className="space-y-4">
      {!debugData.ready ? (
        <section className="ff-panel p-4">
          <p className="ff-kicker">Debug setup note</p>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
            The admin debug UI is built, but the trace table may not exist in Supabase yet. Run
            the migration in
            <span className="font-medium text-[var(--foreground)]">
              {" "}
              `supabase/migrations/20260505120000_ai_trace_runs.sql`
            </span>{" "}
            and then refresh this page.
          </p>
          {debugData.error ? (
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{debugData.error}</p>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-[0.82fr_1.38fr]">
        <div className="ff-panel p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="ff-kicker">Search traces</p>
              <form className="mt-2 flex gap-2" method="get">
                <input
                  className="ff-input flex-1"
                  defaultValue={query}
                  name="query"
                  placeholder="Search by email, name, or message"
                  type="text"
                />
                <button
                  aria-label="Search traces"
                  className="ff-button-primary h-9 w-9 shrink-0 p-0 text-sm"
                  title="Search traces"
                  type="submit"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                Showing {debugData.traces.length} recent traces
              </p>
              {query ? (
                <Link className="text-sm text-[var(--brand-300)] hover:text-white" href="/app/admin/debug">
                  Clear
                </Link>
              ) : null}
            </div>

            <div className="space-y-2">
              {debugData.traces.length > 0 ? (
                debugData.traces.map((trace) => (
                  <TraceLink
                    active={trace.id === selectedTrace?.id}
                    key={trace.id}
                    query={query}
                    trace={trace}
                  />
                ))
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  No traces matched that search yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <DebugTraceInspector
          analysis={getTraceAnalysis(selectedTrace)}
          selectedTrace={selectedTrace}
          threadTimeline={debugData.threadTimeline}
        />
      </section>
    </div>
  );
}
