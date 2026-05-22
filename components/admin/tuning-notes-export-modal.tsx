"use client";

import { useMemo, useState } from "react";
import type { Database, Json } from "@/types/database";

type EvalRun = Database["public"]["Tables"]["eval_runs"]["Row"];
type EvalRunItem = Database["public"]["Tables"]["eval_run_items"]["Row"];
type EvalReview = Database["public"]["Tables"]["eval_reviews"]["Row"];

type TuningNotesExportModalProps = {
  run: EvalRun | null;
  items: EvalRunItem[];
  reviews: EvalReview[];
  tuningReviewCheckId: string;
};

function formatJson(value: Json | null | undefined) {
  return JSON.stringify(value ?? {}, null, 2);
}

function getJsonObject(value: Json | null | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

function getJsonObjectArray(value: Json | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, Json | undefined> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item)
  );
}

function getOptionalJsonObject(value: Json | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function getPersistedCount(actual: Record<string, Json | undefined>, key: string) {
  const persistedIds = getJsonObject(actual.persistedLogIds);
  const values = persistedIds[key];

  return Array.isArray(values) ? values.length : 0;
}

function formatStatus(value: EvalReview["status"]) {
  switch (value) {
    case "good":
      return "Looks good";
    case "needs_work":
      return "Needs tuning";
    case "not_applicable":
      return "N/A";
    default:
      return value;
  }
}

function buildExportMarkdown(input: {
  run: EvalRun | null;
  items: EvalRunItem[];
  tuningReviews: EvalReview[];
}) {
  if (!input.run) {
    return "# Frankie Tuning Notes Export\n\nNo eval run selected.";
  }

  const reviewsByItemId = new Map(
    input.tuningReviews.map((review) => [review.eval_run_item_id, review])
  );
  const notedItems = input.items.filter((item) => reviewsByItemId.has(item.id));
  const lines = [
    "# Frankie Tuning Notes Export",
    "",
    `Run: ${input.run.scenario_id ?? input.run.suite_id}`,
    `Run ID: ${input.run.id}`,
    `Status: ${input.run.status}`,
    `Model: ${input.run.model_name ?? "Not recorded"}`,
    `Prompt version: ${input.run.prompt_version ?? "Not recorded"}`,
    `Started: ${input.run.started_at}`,
    `Completed: ${input.run.completed_at ?? "Not completed"}`,
    "",
    `Tuning notes: ${notedItems.length}`,
    ""
  ];

  if (notedItems.length === 0) {
    lines.push("No saved tuning notes for this selected run.");
    return lines.join("\n");
  }

  notedItems.forEach((item, index) => {
    const review = reviewsByItemId.get(item.id);
    const actual = getJsonObject(item.actual_json);
    const rawModelExtraction = getOptionalJsonObject(actual.metadata)?.rawModelExtraction ?? null;
    const rawModel = getOptionalJsonObject(rawModelExtraction);
    const activities = getJsonObjectArray(actual.activities);
    const dietEntries = getJsonObjectArray(actual.dietEntries);
    const wellness = getOptionalJsonObject(actual.wellnessCheckin);
    const rawActivities = getJsonObjectArray(rawModel?.activities);
    const rawDietEntries = getJsonObjectArray(rawModel?.dietEntries);

    lines.push(
      `## ${index + 1}. Day ${item.day_index ?? "?"} / ${item.pillar}`,
      "",
      `Item ID: ${item.id}`,
      `Trace: ${item.trace_id ? `/app/admin/debug?trace=${item.trace_id}` : "Not recorded"}`,
      `Run status: ${item.run_status}`,
      `Review status: ${review ? formatStatus(review.status) : "Not reviewed"}`,
      "",
      "### Input",
      item.input_message,
      "",
      "### Observed Problem",
      review?.actual_behavior?.trim() || "Not recorded.",
      "",
      "### Desired Behavior",
      review?.expected_behavior?.trim() || "Not recorded.",
      "",
      "### Extraction Summary",
      `- Raw model activities: ${rawActivities.length}`,
      `- Sanitized activities: ${activities.length}`,
      `- Persisted activity logs: ${getPersistedCount(actual, "activityLogIds")}`,
      `- Raw model diet entries: ${rawDietEntries.length}`,
      `- Sanitized diet entries: ${dietEntries.length}`,
      `- Persisted diet logs: ${getPersistedCount(actual, "dietLogIds")}`,
      `- Sanitized wellness check-in: ${wellness ? "Yes" : "No"}`,
      `- Persisted wellness check-ins: ${getPersistedCount(actual, "wellnessCheckinIds")}`,
      "",
      "### Frankie Reply",
      item.assistant_reply || item.error_message || "No reply recorded.",
      "",
      "### Sanitized Actual JSON",
      "```json",
      formatJson(item.actual_json),
      "```",
      ""
    );
  });

  return lines.join("\n");
}

export function TuningNotesExportModal({
  run,
  items,
  reviews,
  tuningReviewCheckId
}: TuningNotesExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const tuningReviews = useMemo(
    () => reviews.filter((review) => review.review_check === tuningReviewCheckId),
    [reviews, tuningReviewCheckId]
  );
  const markdown = useMemo(
    () => buildExportMarkdown({ run, items, tuningReviews }),
    [items, run, tuningReviews]
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        className="inline-flex w-auto cursor-pointer items-center justify-center rounded-md border border-slate-500/45 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-black/15 transition hover:border-slate-300/60 hover:bg-slate-800/95 focus:outline-none focus:ring-2 focus:ring-slate-300/25 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={!run}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Export tuning notes
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <section
            className="ff-panel-strong flex max-h-[88vh] w-full max-w-5xl flex-col p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="ff-kicker">Markdown export</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                  Tuning notes for selected run
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Copy this into a chat or doc when you want a mass review of model tuning issues.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="inline-flex w-auto cursor-pointer items-center justify-center rounded-md border border-slate-500/45 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-black/15 transition hover:border-slate-300/60 hover:bg-slate-800/95 focus:outline-none focus:ring-2 focus:ring-slate-300/25"
                  onClick={handleCopy}
                  type="button"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  aria-label="Close export modal"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-500/45 bg-slate-900/80 text-sm font-semibold text-white shadow-sm shadow-black/15 transition hover:border-slate-300/60 hover:bg-slate-800/95 focus:outline-none focus:ring-2 focus:ring-slate-300/25"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  X
                </button>
              </div>
            </div>

            <textarea
              className="ff-input ff-scroll mt-4 min-h-[28rem] flex-1 resize-none font-mono text-xs leading-6"
              readOnly
              value={markdown}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
