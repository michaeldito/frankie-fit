"use client";

import { useState, type FormEvent } from "react";
import type { Database } from "@/types/database";

type EvalReview = Database["public"]["Tables"]["eval_reviews"]["Row"];
type SaveState = "idle" | "saving" | "saved" | "failed";

type TuningNoteFormProps = {
  itemId: string;
  reviewCheck: string;
  review: EvalReview | null;
};

function getStatusLabel(value: EvalReview["status"]) {
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

export function TuningNoteForm({ itemId, reviewCheck, review }: TuningNoteFormProps) {
  const [actualBehavior, setActualBehavior] = useState(review?.actual_behavior ?? "");
  const [expectedBehavior, setExpectedBehavior] = useState(review?.expected_behavior ?? "");
  const [status, setStatus] = useState<EvalReview["status"]>(review?.status ?? "needs_work");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setError(null);

    try {
      const response = await fetch("/api/admin/evals/tuning-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          actualBehavior,
          expectedBehavior,
          itemId,
          reviewCheck,
          status
        })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save tuning note.");
      }

      setSaveState("saved");
      window.setTimeout(() => {
        setSaveState((current) => (current === "saved" ? "idle" : current));
      }, 1800);
    } catch (caughtError) {
      setSaveState("failed");
      setError(caughtError instanceof Error ? caughtError.message : "Could not save tuning note.");
    }
  }

  return (
    <form
      className="mt-5 rounded-[1rem] border border-[var(--border)] p-4"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ff-kicker">Tuning note</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Capture the model or orchestrator issue to fix after this run item.
          </p>
          {review ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Current: {getStatusLabel(review.status)}
            </p>
          ) : null}
        </div>
        <select
          className="ff-input max-w-[12rem] cursor-pointer text-sm"
          onChange={(event) => setStatus(event.target.value as EvalReview["status"])}
          value={status}
        >
          <option value="needs_work">Needs tuning</option>
          <option value="good">Looks good</option>
          <option value="not_applicable">N/A</option>
        </select>
      </div>
      <div className="mt-4 grid gap-3">
        <textarea
          className="ff-input min-h-24 resize-y text-sm"
          onChange={(event) => setActualBehavior(event.target.value)}
          placeholder="Observed problem, e.g. raw model duplicated the activity or sanitizer dropped intensity"
          value={actualBehavior}
        />
        <textarea
          className="ff-input min-h-24 resize-y text-sm"
          onChange={(event) => setExpectedBehavior(event.target.value)}
          placeholder="Desired behavior or proposed fix"
          value={expectedBehavior}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex w-auto cursor-pointer items-center justify-center rounded-md border border-slate-500/45 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-black/15 transition hover:border-slate-300/60 hover:bg-slate-800/95 focus:outline-none focus:ring-2 focus:ring-slate-300/25 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={saveState === "saving"}
          type="submit"
        >
          {saveState === "saving" ? "Saving..." : "Save tuning note"}
        </button>
        {saveState === "saved" ? (
          <p className="text-xs font-medium text-emerald-200">Saved</p>
        ) : null}
        {saveState === "failed" && error ? (
          <p className="text-xs font-medium text-red-200">{error}</p>
        ) : null}
      </div>
    </form>
  );
}
