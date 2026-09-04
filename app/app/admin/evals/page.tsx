import type { ReactNode } from "react";
import Link from "next/link";
import { CoachingMemoryGrid } from "@/components/admin/coaching-memory-grid";
import { EvalScenarioActions } from "@/components/admin/eval-scenario-actions";
import { TuningNoteForm } from "@/components/admin/tuning-note-form";
import { TuningNotesExportModal } from "@/components/admin/tuning-notes-export-modal";
import {
  EVAL_SCENARIOS,
  getScenarioDailySummarySteps,
  getScenarioReplaySteps,
  getScenarioUpdateCount,
  TUNING_REVIEW_CHECK_ID
} from "@/lib/admin-evals";
import { resetScenarioUserAction } from "@/app/app/admin/evals/actions";
import { getAdminEvalsData, type RunItemStatusCounts } from "@/lib/admin-evals-data";
import { requireAdminContext } from "@/lib/admin";
import { getCurrentAppContext } from "@/lib/profile";
import type { Database, Json } from "@/types/database";

type EvalReviewRow = Database["public"]["Tables"]["eval_reviews"]["Row"];

function SectionCard({
  eyebrow,
  title,
  children
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="ff-panel p-4">
      {eyebrow ? <p className="ff-kicker">{eyebrow}</p> : null}
      {title ? (
        <h2 className={`${eyebrow ? "mt-2" : ""} text-base font-semibold tracking-[-0.02em]`}>
          {title}
        </h2>
      ) : null}
      <div className={title || eyebrow ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

function getJsonObject(value: Json | null | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

function getOptionalJsonObject(value: Json | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function getJsonObjectArray(value: Json | undefined) {
  return Array.isArray(value)
    ? value
        .map((item) => getOptionalJsonObject(item))
        .filter((item): item is Record<string, Json | undefined> => Boolean(item))
    : [];
}

function getJsonStringArray(value: Json | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function renderScalar(value: Json | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => String(item)).join(", ") : "None";
  }

  return JSON.stringify(value);
}

function formatConfidence(value: Json | undefined) {
  if (typeof value !== "number") {
    return "Not recorded";
  }

  return `${Math.round((value <= 1 ? value * 100 : value))}%`;
}

function formatJson(value: Json | null | undefined) {
  return JSON.stringify(value ?? {}, null, 2);
}

function getPersistedCount(actual: Record<string, Json | undefined>, key: string) {
  const persistedIds = getJsonObject(actual.persistedLogIds);
  const values = persistedIds[key];

  return Array.isArray(values) ? values.length : 0;
}

function getPersistenceStatus(extractedCount: number, persistedCount: number) {
  if (persistedCount > 0) {
    return "persisted";
  }

  return extractedCount > 0 ? "not_persisted" : "none";
}

function getRawModelExtraction(actual: Record<string, Json | undefined>) {
  const metadata = getOptionalJsonObject(actual.metadata);

  return metadata?.rawModelExtraction ?? null;
}

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "?";
}

const PERSONA_HUES = [217, 262, 172, 12, 292, 42, 152];

function getPersonaHue(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return PERSONA_HUES[hash % PERSONA_HUES.length];
}

function PersonaAvatar({ name, size }: { name: string; size: "sm" | "lg" }) {
  const hue = getPersonaHue(name);
  const dimension = size === "lg" ? "h-14 w-14 text-lg" : "h-8 w-8 text-xs";

  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full font-semibold ${dimension}`}
      style={{
        backgroundColor: `hsl(${hue} 42% 24%)`,
        color: `hsl(${hue} 85% 86%)`
      }}
    >
      {getInitials(name)}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not completed";
  }

  return new Date(value).toLocaleString();
}

type StatusTone = "good" | "warn" | "bad";

const STATUS_TONE_CLASSNAME: Record<StatusTone, string> = {
  good: "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
  warn: "border-amber-300/30 bg-amber-400/12 text-amber-100",
  bad: "border-rose-300/30 bg-rose-400/12 text-rose-100"
};

const STATUS_TONE_DOT: Record<StatusTone, string> = {
  good: "bg-emerald-300",
  warn: "bg-amber-300",
  bad: "bg-rose-300"
};

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_TONE_CLASSNAME[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_TONE_DOT[tone]}`} />
      {label}
    </span>
  );
}

function getRunStatusTone(status: string): StatusTone {
  if (status === "completed") {
    return "good";
  }

  return status === "running" ? "warn" : "bad";
}

function getItemStatusInfo(runStatus: string, reviewStatus?: EvalReviewRow["status"]) {
  if (reviewStatus === "needs_work") {
    return { tone: "warn" as const, label: "Needs review" };
  }

  if (runStatus === "completed") {
    return { tone: "good" as const, label: "Persisted" };
  }

  if (runStatus === "clarification") {
    return { tone: "warn" as const, label: "Needs review" };
  }

  return { tone: "bad" as const, label: "Error" };
}

function ItemBar({ counts }: { counts: RunItemStatusCounts | undefined }) {
  if (!counts || counts.total === 0) {
    return <span className="text-xs text-[var(--muted)]">No items</span>;
  }

  const ticks: StatusTone[] = [
    ...Array<StatusTone>(counts.good).fill("good"),
    ...Array<StatusTone>(counts.warn).fill("warn"),
    ...Array<StatusTone>(counts.bad).fill("bad")
  ];

  return (
    <span
      className="flex flex-wrap items-center gap-[2px]"
      title={`${counts.good} persisted, ${counts.warn} need review, ${counts.bad} errors`}
    >
      {ticks.map((tone, index) => (
        <span className={`h-3.5 w-[5px] rounded-[2px] ${STATUS_TONE_DOT[tone]}`} key={index} />
      ))}
    </span>
  );
}

function AttentionPill({
  children,
  tone = "amber"
}: {
  children: ReactNode;
  tone?: "amber" | "slate";
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-300/30 bg-amber-400/12 text-amber-100"
      : "border-slate-400/25 bg-slate-500/10 text-slate-200";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassName}`}>
      {children}
    </span>
  );
}

function PersistenceChip({
  label,
  status
}: {
  label: string;
  status: "persisted" | "not_persisted" | "none";
}) {
  const tone =
    status === "persisted"
      ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100"
      : status === "not_persisted"
        ? "border-amber-300/30 bg-amber-400/12 text-amber-100"
        : "border-slate-400/25 bg-slate-500/10 text-slate-300";
  const statusLabel =
    status === "persisted"
      ? "Persisted"
      : status === "not_persisted"
        ? "Not persisted"
        : "No structured extraction";

  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tone}`}>
      {label}: {statusLabel}
    </span>
  );
}

function ValueTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[0.85rem] border border-[var(--border)] bg-[rgba(15,23,42,0.2)] px-3 py-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function ActivityExtractionCard({
  activity,
  index
}: {
  activity: Record<string, Json | undefined>;
  index: number;
}) {
  const missingFields = getJsonStringArray(activity.missingFields);
  const ambiguityFlags = getJsonStringArray(activity.ambiguityFlags);
  const duration =
    typeof activity.durationMinutes === "number"
      ? `${activity.durationMinutes} minutes`
      : renderScalar(activity.durationMinutes);

  return (
    <article className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ff-kicker">Activity {index + 1}</p>
          <h4 className="mt-2 text-base font-semibold tracking-[-0.02em]">
            {renderScalar(activity.activityType)}
          </h4>
        </div>
        <AttentionPill tone="slate">{formatConfidence(activity.confidence)} confidence</AttentionPill>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ValueTile label="Category" value={renderScalar(activity.activityCategory)} />
        <ValueTile label="Duration" value={duration} />
        <ValueTile label="Intensity" value={renderScalar(activity.intensity)} />
        <ValueTile label="Logged for" value={renderScalar(activity.loggedForDate)} />
        <ValueTile label="Time reference" value={renderScalar(activity.timeReferenceText)} />
        <ValueTile label="Time precision" value={renderScalar(activity.timePrecision)} />
        <ValueTile label="Details" value={renderScalar(activity.description)} />
      </div>

      {missingFields.length > 0 || ambiguityFlags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {missingFields.map((field) => (
            <AttentionPill key={`missing-${field}`}>Missing: {field}</AttentionPill>
          ))}
          {ambiguityFlags.map((flag) => (
            <AttentionPill key={`ambiguity-${flag}`}>Ambiguous: {flag}</AttentionPill>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function DietExtractionCard({
  entry,
  index
}: {
  entry: Record<string, Json | undefined>;
  index: number;
}) {
  return (
    <article className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ff-kicker">Diet {index + 1}</p>
          <h4 className="mt-2 text-base font-semibold tracking-[-0.02em]">
            {renderScalar(entry.description)}
          </h4>
        </div>
        <AttentionPill tone="slate">{formatConfidence(entry.confidence)} confidence</AttentionPill>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ValueTile label="Meal" value={renderScalar(entry.mealType)} />
        <ValueTile label="Logged for" value={renderScalar(entry.loggedForDate)} />
        <ValueTile label="Time reference" value={renderScalar(entry.timeReferenceText)} />
      </div>
    </article>
  );
}

function WellnessExtractionCard({
  wellness
}: {
  wellness: Record<string, Json | undefined>;
}) {
  return (
    <article className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ff-kicker">Wellness check-in</p>
          <h4 className="mt-2 text-base font-semibold tracking-[-0.02em]">
            {renderScalar(wellness.loggedForDate)}
          </h4>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ValueTile label="Energy" value={renderScalar(wellness.energyScore)} />
        <ValueTile label="Mood" value={renderScalar(wellness.moodScore)} />
        <ValueTile label="Motivation" value={renderScalar(wellness.motivationScore)} />
        <ValueTile label="Soreness" value={renderScalar(wellness.sorenessScore)} />
        <ValueTile label="Stress" value={renderScalar(wellness.stressScore)} />
        <ValueTile label="Signals" value={renderScalar(wellness.detectedSignals)} />
      </div>

      {wellness.notes ? (
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{renderScalar(wellness.notes)}</p>
      ) : null}
    </article>
  );
}

function EmptyExtraction({ label }: { label: string }) {
  return (
    <p className="rounded-[1rem] border border-[var(--border)] bg-[rgba(15,23,42,0.18)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
      No {label} extracted.
    </p>
  );
}

function ActualExtractionSummary({ actualJson }: { actualJson: Json }) {
  const actual = getJsonObject(actualJson);
  const rawModelExtraction = getRawModelExtraction(actual);
  const rawModelExtractionObject = getOptionalJsonObject(rawModelExtraction);
  const rawActivities = getJsonObjectArray(rawModelExtractionObject?.activities);
  const rawDietEntries = getJsonObjectArray(rawModelExtractionObject?.dietEntries);
  const rawWellness = getOptionalJsonObject(rawModelExtractionObject?.wellness);
  const activities = getJsonObjectArray(actual.activities);
  const dietEntries = getJsonObjectArray(actual.dietEntries);
  const wellness = getOptionalJsonObject(actual.wellnessCheckin);
  const activityStatus = getPersistenceStatus(
    activities.length,
    getPersistedCount(actual, "activityLogIds")
  );
  const dietStatus = getPersistenceStatus(dietEntries.length, getPersistedCount(actual, "dietLogIds"));
  const wellnessStatus = getPersistenceStatus(
    wellness ? 1 : 0,
    getPersistedCount(actual, "wellnessCheckinIds")
  );
  const hasAnyExtraction = activities.length > 0 || dietEntries.length > 0 || Boolean(wellness);

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="ff-kicker">Actual extraction</p>
        <div className="flex flex-wrap gap-2">
          <AttentionPill tone="slate">
            Structured data: {renderScalar(actual.shouldPersistStructuredData)}
          </AttentionPill>
          <PersistenceChip label="Activity" status={activityStatus} />
          <PersistenceChip label="Diet" status={dietStatus} />
          <PersistenceChip label="Wellness" status={wellnessStatus} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ValueTile label="Raw model activities" value={rawActivities.length} />
        <ValueTile label="Raw model diet entries" value={rawDietEntries.length} />
        <ValueTile
          label="Raw model wellness"
          value={rawWellness?.present === true ? "Present" : "Not present"}
        />
      </div>

      {hasAnyExtraction ? null : (
        <p className="rounded-[1rem] border border-[var(--border)] bg-[rgba(15,23,42,0.18)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
          No structured extraction recorded for this turn.
        </p>
      )}

      <div className="grid gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Activity
          </p>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <ActivityExtractionCard
                  activity={activity}
                  index={index}
                  key={`activity-${index}`}
                />
              ))
            ) : (
              <EmptyExtraction label="activity" />
            )}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Diet
          </p>
          <div className="space-y-3">
            {dietEntries.length > 0 ? (
              dietEntries.map((entry, index) => (
                <DietExtractionCard entry={entry} index={index} key={`diet-${index}`} />
              ))
            ) : (
              <EmptyExtraction label="diet" />
            )}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Wellness
          </p>
          {wellness ? <WellnessExtractionCard wellness={wellness} /> : <EmptyExtraction label="wellness check-in" />}
        </div>
      </div>

      <details className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
          Raw model extraction JSON
        </summary>
        <pre className="ff-scroll max-h-[24rem] overflow-auto whitespace-pre-wrap break-words border-t border-[var(--border)] p-4 text-xs leading-6 text-[var(--muted)]">
          {formatJson(rawModelExtraction)}
        </pre>
      </details>

      <details className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
          Sanitized actual JSON
        </summary>
        <pre className="ff-scroll max-h-[24rem] overflow-auto whitespace-pre-wrap break-words border-t border-[var(--border)] p-4 text-xs leading-6 text-[var(--muted)]">
          {formatJson(actualJson)}
        </pre>
      </details>
    </div>
  );
}

export default async function AdminEvalsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedRunId =
    typeof resolvedSearchParams?.run === "string" ? resolvedSearchParams.run : null;
  const activeTab = resolvedSearchParams?.tab === "memory" ? "memory" : "runs";
  const selectedScenarioId =
    typeof resolvedSearchParams?.scenario === "string" ? resolvedSearchParams.scenario : null;
  const selectedScenario =
    EVAL_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) ??
    EVAL_SCENARIOS[0] ??
    null;
  const message =
    typeof resolvedSearchParams?.message === "string" ? resolvedSearchParams.message : "";
  const context = await getCurrentAppContext();
  requireAdminContext(context);
  const evalData = await getAdminEvalsData({
    context,
    selectedRunId
  });
  const reviewByItemAndCheck = new Map(
    evalData.reviews.map((review) => [
      `${review.eval_run_item_id}:${review.review_check}`,
      review
    ])
  );
  const runStats = evalData.runs.reduce(
    (totals, run) => {
      const counts = evalData.runItemStatusCounts[run.id];

      return {
        items: totals.items + (counts?.total ?? 0),
        flagged: totals.flagged + (counts?.warn ?? 0),
        failedRuns: totals.failedRuns + (run.status === "failed" ? 1 : 0)
      };
    },
    { items: 0, flagged: 0, failedRuns: 0 }
  );

  return (
    <div className="space-y-4">
      {!evalData.ready ? (
        <section className="ff-panel p-4">
          <p className="ff-kicker">Eval setup note</p>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
            The eval UI is built, but the eval tables may not exist in Supabase yet. Run the
            migration in
            <span className="font-medium text-[var(--foreground)]">
              {" "}
              `supabase/migrations/20260506120000_eval_runs_and_coach_summaries.sql`
            </span>{" "}
            and then refresh this page.
          </p>
          {evalData.error ? (
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{evalData.error}</p>
          ) : null}
        </section>
      ) : null}

      <section>
        <p className="ff-kicker">Benchmark personas</p>
        <h2 className="mt-1 text-base font-semibold tracking-[-0.02em]">Choose a test persona</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {EVAL_SCENARIOS.map((scenario) => {
            const isActive = scenario.id === selectedScenario?.id;

            return (
              <Link
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition ${
                  isActive
                    ? "border-[rgba(147,197,253,0.5)] bg-[rgba(147,197,253,0.1)]"
                    : "border-[var(--border)] bg-transparent hover:border-[rgba(147,197,253,0.28)] hover:bg-[var(--surface-elevated)]"
                }`}
                href={`/app/admin/evals?scenario=${scenario.id}`}
                key={scenario.id}
              >
                <PersonaAvatar name={scenario.userName} size="sm" />
                <span>
                  <span className="block text-sm font-medium leading-tight">
                    {scenario.userName}
                  </span>
                  <span className="block text-[0.62rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                    {scenario.pathLabel}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {selectedScenario ? (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <PersonaAvatar name={selectedScenario.userName} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">
                    {selectedScenario.userName}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    {selectedScenario.label} &middot; {selectedScenario.userEmail}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="ff-pill text-[0.68rem] uppercase tracking-[0.14em]">
                  {selectedScenario.pathLabel}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {getScenarioUpdateCount(selectedScenario)} updates
                </span>
              </div>
            </div>

            <p className="mt-3 max-w-[46rem] leading-7 text-[var(--muted)]">
              {selectedScenario.description}
            </p>

            <div className="mt-4">
              <p className="ff-kicker">Week shape</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {selectedScenario.weeklyShape.map((item) => (
                  <li className="flex items-start gap-2 text-sm leading-6 text-[var(--muted)]" key={item}>
                    <span
                      className="mt-[0.5rem] h-1.5 w-1.5 flex-none rounded-full"
                      style={{ backgroundColor: `hsl(${getPersonaHue(selectedScenario.userName)} 70% 68%)` }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 border-t border-[var(--border)] pt-3.5">
              <EvalScenarioActions
                dailySummarySteps={getScenarioDailySummarySteps(selectedScenario)}
                evalReady={evalData.ready}
                message={selectedScenarioId === selectedScenario.id ? message : ""}
                replaySteps={getScenarioReplaySteps(selectedScenario)}
                resetAction={resetScenarioUserAction}
                scenarioId={selectedScenario.id}
                scenarioLabel={selectedScenario.label}
              />
            </div>
          </div>
        ) : null}
      </section>

      <nav className="flex gap-1 border-b border-[var(--border)]">
        <Link
          className={`-mb-px rounded-t-[0.5rem] border border-b-0 px-3 py-2 text-sm font-semibold transition ${
            activeTab === "runs"
              ? "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          href="/app/admin/evals?tab=runs"
        >
          Eval runs <span className="text-xs text-[var(--muted)]">{evalData.runs.length}</span>
        </Link>
        <Link
          className={`-mb-px rounded-t-[0.5rem] border border-b-0 px-3 py-2 text-sm font-semibold transition ${
            activeTab === "memory"
              ? "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          href="/app/admin/evals?tab=memory"
        >
          Coaching memory{" "}
          <span className="text-xs text-[var(--muted)]">{evalData.summaries.length}</span>
        </Link>
      </nav>

      {activeTab === "runs" ? (
        <>
          <section className="grid gap-2.5 sm:grid-cols-4">
            <div className="ff-card-soft px-3.5 py-2.5">
              <p className="ff-kicker">Runs listed</p>
              <p className="mt-1 text-lg font-semibold">{evalData.runs.length}</p>
            </div>
            <div className="ff-card-soft px-3.5 py-2.5">
              <p className="ff-kicker">Items reviewed</p>
              <p className="mt-1 text-lg font-semibold">{runStats.items}</p>
            </div>
            <div className="ff-card-soft px-3.5 py-2.5">
              <p className="ff-kicker">Flagged for tuning</p>
              <p className="mt-1 text-lg font-semibold text-amber-200">{runStats.flagged}</p>
            </div>
            <div className="ff-card-soft px-3.5 py-2.5">
              <p className="ff-kicker">Failed runs</p>
              <p className="mt-1 text-lg font-semibold text-rose-200">{runStats.failedRuns}</p>
            </div>
          </section>

          <SectionCard eyebrow="Replay history" title="Eval runs">
            {evalData.runs.length === 0 ? (
              <p className="leading-7 text-[var(--muted)]">
                No eval runs yet. Pick a scenario above and run the full replay when you are ready.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[42rem]">
                  <div className="grid grid-cols-[1.8fr_0.9fr_1.1fr_1fr_1.2fr_1.75rem] gap-3 border-b border-[var(--border)] px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                    <span>Scenario</span>
                    <span>Status</span>
                    <span>Model / prompt</span>
                    <span>Started</span>
                    <span>Items</span>
                    <span aria-hidden="true" />
                  </div>

                  {evalData.runs.map((run) => {
                    const scenario = EVAL_SCENARIOS.find((entry) => entry.id === run.scenario_id);
                    const isSelected = run.id === evalData.selectedRun?.id;
                    const toggleHref = isSelected
                      ? "/app/admin/evals?tab=runs"
                      : `/app/admin/evals?tab=runs&run=${run.id}`;

                    return (
                      <div key={run.id}>
                        <div
                          className={`grid grid-cols-[1.8fr_0.9fr_1.1fr_1fr_1.2fr_1.75rem] items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-sm transition hover:bg-[rgba(147,197,253,0.06)] ${
                            isSelected ? "bg-[rgba(147,197,253,0.08)]" : ""
                          }`}
                        >
                          <Link className="contents" href={toggleHref}>
                            <span>
                              <span className="block font-medium">
                                {scenario?.label ?? run.scenario_id ?? "Eval suite"}
                              </span>
                              {scenario ? (
                                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                                  {scenario.userName} &middot; {scenario.userEmail}
                                </span>
                              ) : null}
                            </span>
                            <span>
                              <StatusPill label={run.status} tone={getRunStatusTone(run.status)} />
                            </span>
                            <span className="text-xs leading-5 text-[var(--muted)]">
                              {run.model_name ?? "model not recorded"}
                              <br />
                              {run.prompt_version ?? "prompt not recorded"}
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              {formatDateTime(run.started_at)}
                            </span>
                            <ItemBar counts={evalData.runItemStatusCounts[run.id]} />
                          </Link>
                          <Link
                            aria-label={isSelected ? "Collapse run details" : "Expand run details"}
                            className="flex h-7 w-7 items-center justify-center justify-self-end rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[rgba(147,197,253,0.4)] hover:text-[var(--foreground)]"
                            href={toggleHref}
                          >
                            <svg
                              className={`transition-transform ${isSelected ? "rotate-90" : ""}`}
                              fill="none"
                              height="14"
                              viewBox="0 0 16 16"
                              width="14"
                            >
                              <path
                                d="M6 3l5 5-5 5"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.6"
                              />
                            </svg>
                          </Link>
                        </div>

                        {isSelected ? (
                          <div className="border-b border-[var(--border)] bg-[rgba(9,15,36,0.2)] px-3 py-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="ff-kicker">
                                {evalData.selectedRunItems.length} item
                                {evalData.selectedRunItems.length === 1 ? "" : "s"}
                                {(() => {
                                  const counts = evalData.runItemStatusCounts[run.id];
                                  return counts
                                    ? ` · ${counts.good} persisted · ${counts.warn} flagged`
                                    : "";
                                })()}
                              </p>
                              <TuningNotesExportModal
                                items={evalData.selectedRunItems}
                                reviews={evalData.reviews}
                                run={evalData.selectedRun}
                                tuningReviewCheckId={TUNING_REVIEW_CHECK_ID}
                              />
                            </div>

                            {evalData.selectedRunItems.length === 0 ? (
                              <p className="leading-7 text-[var(--muted)]">
                                No items recorded for this run yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {evalData.selectedRunItems.map((item) => {
                                  const expected = getJsonObject(item.expected_json);
                                  const coreFacts = getJsonStringArray(expected.coreFacts);
                                  const shouldNotInfer = getJsonStringArray(expected.shouldNotInfer);
                                  const tuningReview = reviewByItemAndCheck.get(
                                    `${item.id}:${TUNING_REVIEW_CHECK_ID}`
                                  );
                                  const itemStatus = getItemStatusInfo(
                                    item.run_status,
                                    tuningReview?.status
                                  );

                                  return (
                                    <details className="rounded-[0.85rem] border border-[var(--border)] bg-[var(--surface-elevated)]" key={item.id}>
                                      <summary className="grid cursor-pointer list-none grid-cols-[5rem_1fr_auto_auto] items-center gap-3 px-3 py-2.5 text-sm">
                                        <span className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                                          Day {item.day_index ?? "?"} &middot; {item.pillar}
                                        </span>
                                        <span className="truncate leading-5">{item.input_message}</span>
                                        <StatusPill label={itemStatus.label} tone={itemStatus.tone} />
                                        {item.trace_id ? (
                                          <Link
                                            className="ff-pill cursor-pointer text-[0.68rem] uppercase tracking-[0.12em]"
                                            href={`/app/admin/debug?trace=${item.trace_id}`}
                                          >
                                            Trace
                                          </Link>
                                        ) : (
                                          <span />
                                        )}
                                      </summary>

                                      <div className="border-t border-[var(--border)] p-4">
                                        <div className="space-y-5">
                                          <div>
                                            <p className="ff-kicker">Expected</p>
                                            <div className="mt-3 space-y-2">
                                              {coreFacts.map((fact) => (
                                                <p
                                                  className="rounded-[1rem] border border-[var(--border)] px-3 py-2 text-xs leading-5 text-[var(--muted)]"
                                                  key={fact}
                                                >
                                                  {fact}
                                                </p>
                                              ))}
                                            </div>
                                            {shouldNotInfer.length > 0 ? (
                                              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                                                Should not infer: {shouldNotInfer.join(", ")}
                                              </p>
                                            ) : null}
                                          </div>

                                          <ActualExtractionSummary actualJson={item.actual_json} />

                                          <div>
                                            <p className="ff-kicker">Frankie reply</p>
                                            <p className="mt-3 rounded-[1rem] border border-[var(--border)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                                              {item.assistant_reply ?? item.error_message ?? "No reply recorded."}
                                            </p>
                                          </div>
                                        </div>

                                        <TuningNoteForm
                                          itemId={item.id}
                                          review={tuningReview ?? null}
                                          reviewCheck={TUNING_REVIEW_CHECK_ID}
                                        />
                                      </div>
                                    </details>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard>
          <CoachingMemoryGrid summaries={evalData.summaries} />
        </SectionCard>
      )}

    </div>
  );
}
