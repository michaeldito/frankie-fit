import type { ReactNode } from "react";
import Link from "next/link";
import { EvalScenarioActions } from "@/components/admin/eval-scenario-actions";
import { TuningNoteForm } from "@/components/admin/tuning-note-form";
import { TuningNotesExportModal } from "@/components/admin/tuning-notes-export-modal";
import {
  EVAL_SCENARIOS,
  getScenarioReplaySteps,
  getScenarioUpdateCount
} from "@/lib/admin-evals";
import {
  resetScenarioUserAction,
  runDailySummariesAction,
  runFullScenarioAction,
  runWeeklySummaryAction
} from "@/app/app/admin/evals/actions";
import { getAdminEvalsData } from "@/lib/admin-evals-data";
import { requireAdminContext } from "@/lib/admin";
import { getCurrentAppContext } from "@/lib/profile";
import type { Json } from "@/types/database";

const TUNING_REVIEW_CHECK_ID = "model_tuning_note";

function SectionCard({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ff-panel p-5">
      <p className="ff-kicker">{eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="mt-4">{children}</div>
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not completed";
  }

  return new Date(value).toLocaleString();
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
  const message =
    typeof resolvedSearchParams?.message === "string" ? resolvedSearchParams.message : "";
  const context = await getCurrentAppContext();
  requireAdminContext(context);
  const evalData = await getAdminEvalsData({
    context,
    selectedRunId
  });
  const totalMessages = EVAL_SCENARIOS.reduce(
    (sum, scenario) => sum + getScenarioUpdateCount(scenario),
    0
  );
  const reviewByItemAndCheck = new Map(
    evalData.reviews.map((review) => [
      `${review.eval_run_item_id}:${review.review_check}`,
      review
    ])
  );

  return (
    <div className="space-y-6 lg:space-y-7">
      <header className="ff-panel-strong flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="ff-kicker">Admin Evals</p>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-[2.35rem]">
            A repeatable lab for making Frankie smarter without guessing.
          </h1>
          <p className="max-w-3xl leading-7 text-[var(--muted)]">
            Start with three controlled benchmark users, replay one week of activity, diet, and
            wellness updates, then inspect the model extraction, sanitizer output, persisted logs,
            and coaching reply in one place.
          </p>
        </div>
        <div className="ff-card min-w-[17rem] p-4">
          <p className="ff-kicker">V1 suite</p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.02em]">
            {EVAL_SCENARIOS.length} scenarios / {totalMessages} user updates
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Seven days, three pillars per day, replayed through Frankie.
          </p>
        </div>
      </header>

      {message ? (
        <section className="ff-panel border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.08)] p-4 text-sm leading-6">
          {message}
        </section>
      ) : null}

      {!evalData.ready ? (
        <section className="ff-panel p-5 sm:p-6">
          <p className="ff-kicker">Eval setup note</p>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
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

      <section className="grid gap-4 xl:grid-cols-3">
        {EVAL_SCENARIOS.map((scenario) => (
          <article className="ff-panel p-5" key={scenario.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="ff-pill text-[0.72rem] uppercase tracking-[0.15em]">
                {scenario.pathLabel}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {getScenarioUpdateCount(scenario)} updates
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{scenario.label}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {scenario.userName} / {scenario.userEmail}
            </p>
            <p className="mt-4 leading-7 text-[var(--muted)]">{scenario.description}</p>

            <div className="mt-5 space-y-3">
              <p className="ff-kicker">Week shape</p>
              {scenario.weeklyShape.map((item) => (
                <p
                  className="ff-card-soft px-4 py-3 text-sm leading-6 text-[var(--muted)]"
                  key={item}
                >
                  {item}
                </p>
              ))}
            </div>

            <EvalScenarioActions
              dailySummariesAction={runDailySummariesAction}
              evalReady={evalData.ready}
              replaySteps={getScenarioReplaySteps(scenario)}
              resetAction={resetScenarioUserAction}
              runFullAction={runFullScenarioAction}
              scenarioId={scenario.id}
              scenarioLabel={scenario.label}
              weeklySummaryAction={runWeeklySummaryAction}
            />
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard eyebrow="Recent runs" title="Replay history">
          {evalData.runs.length > 0 ? (
            <div className="space-y-3">
              {evalData.runs.map((run) => (
                <Link
                  className={`block rounded-[1.15rem] border px-4 py-3 transition ${
                    run.id === evalData.selectedRun?.id
                      ? "border-[rgba(96,165,250,0.42)] bg-[rgba(59,130,246,0.12)]"
                      : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[rgba(96,165,250,0.26)]"
                  }`}
                  href={`/app/admin/evals?run=${run.id}`}
                  key={run.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{run.scenario_id ?? "Eval suite"}</p>
                    <span className="ff-pill text-[0.72rem] uppercase tracking-[0.15em]">
                      {run.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {run.model_name ?? "model not recorded"} /{" "}
                    {run.prompt_version ?? "prompt not recorded"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Started {formatDateTime(run.started_at)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="leading-7 text-[var(--muted)]">
              No eval runs yet. Pick a scenario and run the full replay when you are ready.
            </p>
          )}
        </SectionCard>

        <SectionCard eyebrow="Recent summaries" title="Daily and weekly coaching memory">
          {evalData.summaries.length > 0 ? (
            <div className="space-y-3">
              {evalData.summaries.map((summary) => (
                <article className="ff-card-soft p-4" key={summary.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">
                      {summary.summary_type} / {summary.period_start}
                      {summary.period_end !== summary.period_start
                        ? ` to ${summary.period_end}`
                        : ""}
                    </p>
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {summary.prompt_version ?? "no prompt"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {summary.summary_text}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="leading-7 text-[var(--muted)]">
              Daily and weekly summaries will appear after a summary action runs.
            </p>
          )}
        </SectionCard>
      </section>

      <SectionCard eyebrow="Tuning workbench" title="Selected run items">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Review model behavior, add tuning notes, then export the notes as Markdown when you want
            a grouped fix pass.
          </p>
          <TuningNotesExportModal
            items={evalData.selectedRunItems}
            reviews={evalData.reviews}
            run={evalData.selectedRun}
            tuningReviewCheckId={TUNING_REVIEW_CHECK_ID}
          />
        </div>
        {evalData.selectedRun && evalData.selectedRunItems.length > 0 ? (
          <div className="space-y-4">
            {evalData.selectedRunItems.map((item) => {
              const expected = getJsonObject(item.expected_json);
              const coreFacts = getJsonStringArray(expected.coreFacts);
              const shouldNotInfer = getJsonStringArray(expected.shouldNotInfer);
              const tuningReview = reviewByItemAndCheck.get(
                `${item.id}:${TUNING_REVIEW_CHECK_ID}`
              );

              return (
                <details className="ff-card-soft p-4" key={item.id}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="ff-kicker">
                          Day {item.day_index ?? "?"} / {item.pillar}
                        </p>
                        <p className="mt-2 max-w-3xl font-medium leading-6">
                          {item.input_message}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="ff-pill text-[0.72rem] uppercase tracking-[0.15em]">
                          {item.run_status.replaceAll("_", " ")}
                        </span>
                        {item.trace_id ? (
                          <Link
                            className="ff-pill cursor-pointer text-[0.72rem] uppercase tracking-[0.15em]"
                            href={`/app/admin/debug?trace=${item.trace_id}`}
                          >
                            Trace
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </summary>

                  <div className="mt-5 space-y-5">
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
                </details>
              );
            })}
          </div>
        ) : (
          <p className="leading-7 text-[var(--muted)]">
            Select or create an eval run to inspect model behavior.
          </p>
        )}
      </SectionCard>

      <SectionCard eyebrow="Source of truth" title="Design doc">
        <p className="leading-7 text-[var(--muted)]">
          The eval loop contract, seed shape, review checks, and future data model are captured in
          the design doc so future tuning work has something stable to point at.
        </p>
        <p className="ff-card-soft mt-5 px-4 py-3 text-sm font-medium">
          docs/frankie-eval-loop-design.md
        </p>
      </SectionCard>
    </div>
  );
}
