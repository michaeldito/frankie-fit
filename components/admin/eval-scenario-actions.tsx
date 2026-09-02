"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { EvalReplayStep } from "@/lib/admin-evals";

type ServerFormAction = (formData: FormData) => void | Promise<void>;
type ReplayStatus = "idle" | "starting" | "running" | "completed" | "failed";

type EvalScenarioActionsProps = {
  dailySummariesAction: ServerFormAction;
  evalReady: boolean;
  replaySteps: EvalReplayStep[];
  resetAction: ServerFormAction;
  runFullAction: ServerFormAction;
  scenarioId: string;
  scenarioLabel: string;
  weeklySummaryAction: ServerFormAction;
};

type StartReplayResponse = {
  error?: string;
  runId: string;
  steps: EvalReplayStep[];
  threadId: string;
};

type StepReplayResponse = {
  elapsedMs?: number;
  error?: string | null;
  ok: boolean;
};

function formatStepLabel(step: EvalReplayStep | undefined) {
  if (!step) {
    return "Preparing replay";
  }

  return `${step.dayLabel} ${step.pillar}`;
}

function formatEta(ms: number | null) {
  if (!ms || !Number.isFinite(ms) || ms <= 0) {
    return "Estimating...";
  }

  const totalSeconds = Math.max(1, Math.round(ms / 1000));

  if (totalSeconds < 60) {
    return `about ${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return seconds > 0 ? `about ${minutes}m ${seconds}s` : `about ${minutes}m`;
}

function ActionButton({
  children,
  disabled = false,
  type = "submit",
  onClick
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      className={`inline-flex w-auto justify-self-start rounded-md border border-slate-500/45 bg-slate-900/80 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-black/15 transition hover:border-slate-300/60 hover:bg-slate-800/95 focus:outline-none focus:ring-2 focus:ring-slate-300/25 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-slate-500/45 disabled:hover:bg-slate-900/80 ${
        disabled ? "" : "cursor-pointer"
      }`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

function SubmitButton({
  children,
  disabled = false,
  pendingLabel
}: {
  children: ReactNode;
  disabled?: boolean;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <ActionButton disabled={disabled || pending}>{pending ? pendingLabel : children}</ActionButton>
  );
}

function ReplayBullet({
  index,
  activeStep,
  completedSteps,
  failedStep
}: {
  activeStep: number | null;
  completedSteps: number;
  failedStep: number | null;
  index: number;
}) {
  const isFailed = failedStep === index;
  const isComplete = index < completedSteps && !isFailed;
  const isActive = activeStep === index && !isFailed;

  return (
    <span
      aria-label={`Replay step ${index + 1}`}
      className={`h-3 w-3 rounded-full border transition ${
        isFailed
          ? "border-[rgba(248,113,113,0.8)] bg-[rgba(248,113,113,0.72)]"
          : isComplete
            ? "border-[rgba(96,165,250,0.95)] bg-[rgba(96,165,250,0.95)]"
            : isActive
              ? "animate-pulse border-[rgba(147,197,253,0.95)] bg-[rgba(59,130,246,0.32)] ring-4 ring-[rgba(59,130,246,0.18)]"
              : "border-[rgba(191,219,254,0.22)] bg-transparent"
      }`}
    />
  );
}

export function EvalScenarioActions({
  dailySummariesAction,
  evalReady,
  replaySteps,
  resetAction,
  runFullAction,
  scenarioId,
  scenarioLabel,
  weeklySummaryAction
}: EvalScenarioActionsProps) {
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [durations, setDurations] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<number | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<ReplayStatus>("idle");
  const [steps, setSteps] = useState<EvalReplayStep[]>(replaySteps);
  const isRunning = status === "starting" || status === "running";
  const shouldShowProgress = status !== "idle";
  const averageDuration = useMemo(() => {
    if (durations.length === 0) {
      return null;
    }

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }, [durations]);
  const remainingSteps = Math.max(steps.length - completedSteps, 0);
  const etaText = formatEta(averageDuration ? averageDuration * remainingSteps : null);
  const currentStep = activeStep === null ? undefined : steps[activeStep];
  const completionPercent =
    steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  async function finishReplay(input: {
    errorMessage?: string | null;
    nextStatus: "completed" | "failed";
    replayRunId: string;
  }) {
    await fetch("/api/admin/evals/replay/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        errorMessage: input.errorMessage ?? null,
        runId: input.replayRunId,
        status: input.nextStatus
      })
    });
  }

  async function handleReplay() {
    if (!evalReady || isRunning) {
      return;
    }

    setActiveStep(0);
    setCompletedSteps(0);
    setDurations([]);
    setError(null);
    setFailedStep(null);
    setRunId(null);
    setStatus("starting");
    setSteps(replaySteps);

    let activeRunId: string | null = null;

    try {
      const startResponse = await fetch("/api/admin/evals/replay/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ scenarioId })
      });
      const startData = (await startResponse.json()) as StartReplayResponse;

      if (!startResponse.ok) {
        throw new Error(startData.error ?? "Could not start replay.");
      }

      activeRunId = startData.runId;
      setRunId(startData.runId);
      setSteps(startData.steps);
      setStatus("running");

      for (const step of startData.steps) {
        setActiveStep(step.stepIndex);

        const stepResponse = await fetch("/api/admin/evals/replay/step", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            runId: startData.runId,
            scenarioId,
            stepIndex: step.stepIndex,
            threadId: startData.threadId
          })
        });
        const stepData = (await stepResponse.json()) as StepReplayResponse;

        if (!stepResponse.ok || !stepData.ok) {
          const message = stepData.error ?? "Replay step failed.";
          setError(message);
          setFailedStep(step.stepIndex);
          setStatus("failed");
          await finishReplay({
            replayRunId: startData.runId,
            nextStatus: "failed",
            errorMessage: message
          });
          return;
        }

        setCompletedSteps(step.stepIndex + 1);
        setDurations((current) => [...current, stepData.elapsedMs ?? 0]);
      }

      setActiveStep(null);
      setStatus("completed");
      await finishReplay({
        replayRunId: startData.runId,
        nextStatus: "completed"
      });
      router.push(`/app/admin/evals?run=${startData.runId}`);
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Replay failed unexpectedly.";
      setError(message);
      setFailedStep(activeStep);
      setStatus("failed");

      if (activeRunId) {
        await finishReplay({
          replayRunId: activeRunId,
          nextStatus: "failed",
          errorMessage: message
        }).catch(() => null);
      }
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={runFullAction}>
          <input name="scenarioId" type="hidden" value={scenarioId} />
          <SubmitButton
            disabled={!evalReady || isRunning}
            pendingLabel="Working — resetting, replaying, and summarizing (can take a minute or two)..."
          >
            Reset, replay, summarize
          </SubmitButton>
        </form>
        <form action={resetAction}>
          <input name="scenarioId" type="hidden" value={scenarioId} />
          <SubmitButton disabled={!evalReady || isRunning} pendingLabel="Working — clearing test data...">
            Reset test data
          </SubmitButton>
        </form>
        <ActionButton disabled={!evalReady || isRunning} onClick={handleReplay} type="button">
          {isRunning ? "Running..." : "Replay messages"}
        </ActionButton>
        <form action={dailySummariesAction}>
          <input name="scenarioId" type="hidden" value={scenarioId} />
          <SubmitButton
            disabled={!evalReady || isRunning}
            pendingLabel="Working — generating daily summaries..."
          >
            Daily summaries
          </SubmitButton>
        </form>
        <form action={weeklySummaryAction}>
          <input name="scenarioId" type="hidden" value={scenarioId} />
          <SubmitButton
            disabled={!evalReady || isRunning}
            pendingLabel="Working — generating weekly summary..."
          >
            Weekly summary
          </SubmitButton>
        </form>
        <button
          aria-label="What do these actions do?"
          className="flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-full border border-[var(--border-strong)] font-serif text-xs font-bold italic text-[var(--muted)] transition hover:border-[rgba(147,197,253,0.6)] hover:text-[var(--foreground)]"
          onClick={() => setShowInfo(true)}
          type="button"
        >
          i
        </button>
      </div>

      {showInfo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="ff-panel w-full max-w-md p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ff-kicker">Persona actions</p>
                <h3 className="mt-1 text-base font-semibold">What each button does</h3>
              </div>
              <button
                aria-label="Close"
                className="ff-button-secondary h-7 w-7 shrink-0 cursor-pointer p-0 text-xs"
                onClick={() => setShowInfo(false)}
                type="button"
              >
                x
              </button>
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <div>
                <dt className="text-sm font-semibold">Reset, replay, summarize</dt>
                <dd className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Runs the full pipeline in one click: clears this persona&apos;s data, replays
                  the whole week of messages through Frankie, then generates daily and weekly
                  summaries. Use this for a clean end-to-end benchmark run.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold">Reset test data</dt>
                <dd className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Deletes this persona&apos;s logged activity, diet, and wellness entries plus
                  prior eval runs, so you can replay from a clean slate without affecting other
                  personas.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold">Replay messages</dt>
                <dd className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Sends the persona&apos;s scripted week of messages to Frankie one at a time,
                  with live step-by-step progress below. Use this alone when you just want to
                  watch the replay without resetting or summarizing.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold">Daily summaries</dt>
                <dd className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Generates a short coaching summary for each day already logged for this
                  persona.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold">Weekly summary</dt>
                <dd className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Generates one coaching summary covering the persona&apos;s full logged week.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      {shouldShowProgress ? (
        <div
          aria-live="polite"
          className="mt-3 rounded-[1.2rem] border border-[var(--border)] bg-[rgba(15,23,42,0.2)] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {status === "completed"
                  ? "Replay complete"
                  : status === "failed"
                    ? "Replay stopped"
                    : `Replaying ${scenarioLabel.toLowerCase()}`}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Message {completedSteps} of {steps.length}
                {status === "running" || status === "starting"
                  ? ` / Current: ${formatStepLabel(currentStep)}`
                  : ""}
              </p>
            </div>
            <span className="ff-pill text-[0.72rem] uppercase tracking-[0.15em]">
              {completionPercent}%
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map((step, index) => (
              <ReplayBullet
                activeStep={activeStep}
                completedSteps={completedSteps}
                failedStep={failedStep}
                index={index}
                key={`${step.pillar}-${step.dayIndex}-${index}`}
              />
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            Estimated remaining:{" "}
            {status === "completed" ? "complete" : status === "failed" ? "stopped" : etaText}
          </p>

          {error ? (
            <div className="mt-3 rounded-[1rem] border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.12)] px-3 py-2 text-sm leading-6 text-[#fecaca]">
              {error}
              {runId ? (
                <a className="ml-2 underline" href={`/app/admin/evals?run=${runId}`}>
                  Open partial run
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
