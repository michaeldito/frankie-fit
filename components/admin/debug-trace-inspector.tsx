"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { Database, Json } from "@/types/database";

type AiTraceRunRow = Database["public"]["Tables"]["ai_trace_runs"]["Row"];
type InspectorTab = "overview" | "extraction" | "writes" | "context" | "raw";

function formatJson(value: Json | null) {
  return JSON.stringify(value ?? {}, null, 2);
}

function formatTitle(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

function asObject(value: Json | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function asArray(value: Json | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function readStringValue(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function readNumberValue(value: Json | undefined) {
  return typeof value === "number" ? value : null;
}

function renderScalar(value: Json | undefined) {
  if (value === null || value === undefined) {
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

function TabButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={
        active
          ? "ff-button-primary px-3 py-1.5 text-sm"
          : "ff-button-secondary px-3 py-1.5 text-sm"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SurfaceSection({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ff-panel p-4">
      <p className="ff-kicker">{eyebrow}</p>
      <h2 className="mt-2 text-base font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CodeBlock({
  value
}: {
  value: Json | null;
}) {
  return (
    <pre className="ff-scroll max-h-[34rem] overflow-auto whitespace-pre-wrap break-words rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-xs leading-6 text-[var(--muted)]">
      {formatJson(value)}
    </pre>
  );
}

function RawDetails({
  label,
  value,
  defaultOpen = false
}: {
  label: string;
  value: Json | null;
  defaultOpen?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const serializedValue = formatJson(value);

  return (
    <details className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-elevated)]" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[var(--foreground)]">
        {label}
      </summary>
      <div className="border-t border-[var(--border)] p-4">
        <div className="mb-3 flex justify-end">
          <CopyButton
            copied={copied}
            onCopy={async (nextValue) => {
              await navigator.clipboard.writeText(nextValue);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
            value={serializedValue}
          />
        </div>
        <CodeBlock value={value} />
      </div>
    </details>
  );
}

function LabelValueGrid({
  entries
}: {
  entries: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2">
      {entries.map((entry) => (
        <div className="ff-card-soft p-3.5" key={entry.label}>
          <p className="ff-kicker">{entry.label}</p>
          <p className="mt-2 text-sm leading-6">{entry.value}</p>
        </div>
      ))}
    </div>
  );
}

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

function CopyButton({
  value,
  copied,
  onCopy
}: {
  value: string | null;
  copied: boolean;
  onCopy: (value: string) => Promise<void> | void;
}) {
  return (
    <button
      aria-label={copied ? "Copied" : "Copy text"}
      className="ff-button-secondary h-10 w-10 shrink-0 p-0 text-xs"
      disabled={!value}
      onClick={() => {
        if (value) {
          void onCopy(value);
        }
      }}
      title={copied ? "Copied" : "Copy"}
      type="button"
    >
      {copied ? (
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
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
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
          <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function buildProfileEntries(trace: AiTraceRunRow | null) {
  const snapshot = asObject(trace?.profile_snapshot ?? null);

  if (!snapshot) {
    return [];
  }

  return Object.entries(snapshot).map(([key, value]) => ({
    label: formatTitle(key),
    value: renderScalar(value)
  }));
}

function buildContextEntries(trace: AiTraceRunRow | null) {
  const snapshot = asObject(trace?.recent_context_snapshot ?? null);

  if (!snapshot) {
    return [];
  }

  const entries: Array<{ label: string; value: string }> = [];
  const profileSummary = readStringValue(snapshot.profileSummary);
  const recentConversation = readStringValue(snapshot.recentConversation);

  if (profileSummary) {
    entries.push({
      label: "Profile Summary",
      value: profileSummary
    });
  }

  if (recentConversation) {
    entries.push({
      label: "Recent Conversation",
      value: recentConversation
    });
  }

  return entries;
}

function buildExtractionView(trace: AiTraceRunRow | null) {
  const payload = asObject(trace?.extracted_payload ?? null);

  if (!payload) {
    return {
      activityRows: [] as Array<Record<string, string>>,
      dietRows: [] as Array<Record<string, string>>,
      lifestyleRows: [] as Array<Record<string, string>>,
      wellnessEntries: [] as Array<{ label: string; value: string }>,
      rawModelExtraction: null as Json | null
    };
  }

  const activityRows = asArray(payload.activities).map((item) => {
    const source = asObject(item);
    const confidence = readNumberValue(source?.confidence);
    return {
      "Activity Type": renderScalar(source?.activityType),
      Category: renderScalar(source?.activityCategory),
      "Session Count": renderScalar(source?.sessionCount),
      Description: renderScalar(source?.description),
      Duration: source?.durationMinutes ? `${source.durationMinutes} minutes` : "Not recorded",
      Intensity: renderScalar(source?.intensity),
      "Time Reference": renderScalar(source?.timeReferenceText),
      "Logged For": renderScalar(source?.loggedForDate),
      "Time Precision": renderScalar(source?.timePrecision),
      Confidence: confidence !== null ? `${Math.round(confidence * 100)}%` : "Not recorded",
      "Missing Fields": renderScalar(source?.missingFields),
      "Ambiguity Flags": renderScalar(source?.ambiguityFlags)
    };
  });

  const dietRows = asArray(payload.dietEntries).map((item) => {
    const source = asObject(item);
    const confidence = readNumberValue(source?.confidence);

    return {
      Meal: renderScalar(source?.mealType),
      Description: renderScalar(source?.description),
      Confidence: confidence !== null ? `${Math.round(confidence * 100)}%` : "Not recorded",
      "Time Reference": renderScalar(source?.timeReferenceText),
      "Logged For": renderScalar(source?.loggedForDate)
    };
  });

  const lifestyleRows = asArray(payload.lifestyleEntries).map((item) => {
    const source = asObject(item);
    const confidence = readNumberValue(source?.confidence);

    return {
      Category: renderScalar(source?.category),
      Description: renderScalar(source?.description),
      Confidence: confidence !== null ? `${Math.round(confidence * 100)}%` : "Not recorded",
      "Time Reference": renderScalar(source?.timeReferenceText),
      "Logged For": renderScalar(source?.loggedForDate)
    };
  });

  const wellness = asObject(payload.wellnessCheckin ?? null);
  const wellnessEntries = wellness
    ? Object.entries(wellness).map(([key, value]) => ({
        label: formatTitle(key),
        value: renderScalar(value)
      }))
    : [];

  return {
    activityRows,
    dietRows,
    lifestyleRows,
    wellnessEntries,
    rawModelExtraction: payload.rawModelExtraction ?? null
  };
}

function buildWritesEntries(trace: AiTraceRunRow | null) {
  const persisted = asObject(trace?.persisted_log_ids ?? null);
  const results = asObject(trace?.tool_results ?? null);
  const counts = asObject(results?.persistedCounts ?? null);

  return {
    persistedEntries: [
      {
        label: "Activity Log IDs",
        value: renderScalar(persisted?.activityLogIds)
      },
      {
        label: "Diet Log IDs",
        value: renderScalar(persisted?.dietLogIds)
      },
      {
        label: "Lifestyle Log IDs",
        value: renderScalar(persisted?.lifestyleLogIds)
      },
      {
        label: "Wellness Check-In IDs",
        value: renderScalar(persisted?.wellnessCheckinIds)
      }
    ],
    countEntries: counts
      ? Object.entries(counts).map(([key, value]) => ({
          label: formatTitle(key),
          value: renderScalar(value)
        }))
      : []
  };
}

function TableLikeRows({
  rows
}: {
  rows: Array<Record<string, string>>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div className="ff-card-soft p-4" key={index}>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(row).map(([label, value]) => (
              <div key={label}>
                <p className="ff-kicker">{label}</p>
                {label === "Missing Fields" && value !== "None" && value !== "Not recorded" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {value.split(", ").map((field) => (
                      <span
                        className="inline-flex rounded-full border border-[rgba(251,191,36,0.26)] bg-[rgba(251,191,36,0.14)] px-3 py-1 text-sm leading-7 text-[#fde68a]"
                        key={field}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-7">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DebugTraceInspector({
  selectedTrace,
  threadTimeline,
  analysis
}: {
  selectedTrace: AiTraceRunRow | null;
  threadTimeline: AiTraceRunRow[];
  analysis: string;
}) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const profileEntries = useMemo(() => buildProfileEntries(selectedTrace), [selectedTrace]);
  const contextEntries = useMemo(() => buildContextEntries(selectedTrace), [selectedTrace]);
  const extractionView = useMemo(() => buildExtractionView(selectedTrace), [selectedTrace]);
  const writesView = useMemo(() => buildWritesEntries(selectedTrace), [selectedTrace]);

  async function handleCopy(field: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => {
      setCopiedField((current) => (current === field ? null : current));
    }, 1500);
  }

  if (!selectedTrace) {
    return (
      <SurfaceSection eyebrow="Selected trace" title="No trace selected">
        <p className="leading-7 text-[var(--muted)]">
          Select a trace from the left to inspect the full turn.
        </p>
      </SurfaceSection>
    );
  }

  return (
    <div className="space-y-4">
      <SurfaceSection eyebrow="Selected trace" title={selectedTrace.user_display_name ?? "Unknown user"}>
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill
              active={selectedTrace.orchestration_mode === "model"}
              label={selectedTrace.orchestration_mode === "model" ? "model" : "fallback"}
            />
            <StatusPill label={selectedTrace.run_status.replaceAll("_", " ")} />
            {selectedTrace.needs_clarification &&
            selectedTrace.run_status !== "clarification" ? (
              <StatusPill label="clarification" />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === "overview"}
              label="Overview"
              onClick={() => setActiveTab("overview")}
            />
            <TabButton
              active={activeTab === "extraction"}
              label="Extraction"
              onClick={() => setActiveTab("extraction")}
            />
            <TabButton
              active={activeTab === "writes"}
              label="Writes"
              onClick={() => setActiveTab("writes")}
            />
            <TabButton
              active={activeTab === "context"}
              label="Context"
              onClick={() => setActiveTab("context")}
            />
            <TabButton
              active={activeTab === "raw"}
              label="Raw JSON"
              onClick={() => setActiveTab("raw")}
            />
          </div>

          {activeTab === "overview" ? (
            <div className="space-y-4">
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="ff-card-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="ff-kicker">User message</p>
                    <CopyButton
                      copied={copiedField === "user-message"}
                      onCopy={(value) => handleCopy("user-message", value)}
                      value={selectedTrace.raw_user_message}
                    />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {selectedTrace.raw_user_message}
                  </p>
                </div>
                <div className="ff-card-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="ff-kicker">Frankie reply</p>
                    <CopyButton
                      copied={copiedField === "frankie-reply"}
                      onCopy={(value) => handleCopy("frankie-reply", value)}
                      value={selectedTrace.final_reply}
                    />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {selectedTrace.final_reply}
                  </p>
                </div>
              </div>

              <LabelValueGrid
                entries={[
                  {
                    label: "Source",
                    value:
                      selectedTrace.orchestration_mode === "model"
                        ? `Model${selectedTrace.model_name ? ` (${selectedTrace.model_name})` : ""}`
                        : "Rule-based fallback"
                  },
                  {
                    label: "Prompt Version",
                    value: selectedTrace.prompt_version ?? "Not recorded"
                  },
                  {
                    label: "Latency",
                    value: selectedTrace.latency_ms ? `${selectedTrace.latency_ms} ms` : "Not recorded"
                  },
                  {
                    label: "Created",
                    value: new Date(selectedTrace.created_at).toLocaleString()
                  }
                ]}
              />

              <div className="ff-card-soft p-5">
                <p className="ff-kicker">Admin read</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{analysis}</p>
                {selectedTrace.error_message ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    Error: {selectedTrace.error_message}
                  </p>
                ) : null}
              </div>

              <div className="ff-card-soft p-5">
                <p className="ff-kicker">Thread timeline</p>
                <div className="mt-4 space-y-3">
                  {threadTimeline.map((trace) => (
                    <div
                      className={`rounded-[1rem] border px-4 py-3 ${
                        trace.id === selectedTrace.id
                          ? "border-[rgba(96,165,250,0.42)] bg-[rgba(59,130,246,0.12)]"
                          : "border-[var(--border)] bg-[var(--surface-elevated)]"
                      }`}
                      key={trace.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {new Date(trace.created_at).toLocaleString()}
                        </p>
                        <StatusPill
                          active={trace.orchestration_mode === "model"}
                          label={trace.orchestration_mode === "model" ? "model" : "fallback"}
                        />
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                        {trace.raw_user_message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "extraction" ? (
            <div className="space-y-4">
              <SurfaceSection eyebrow="Activity" title="Parsed activity entries">
                {extractionView.activityRows.length > 0 ? (
                  <TableLikeRows rows={extractionView.activityRows} />
                ) : (
                  <p className="leading-7 text-[var(--muted)]">No activity entries were extracted.</p>
                )}
              </SurfaceSection>

              <SurfaceSection eyebrow="Diet" title="Parsed diet entries">
                {extractionView.dietRows.length > 0 ? (
                  <TableLikeRows rows={extractionView.dietRows} />
                ) : (
                  <p className="leading-7 text-[var(--muted)]">No diet entries were extracted.</p>
                )}
              </SurfaceSection>

              <SurfaceSection eyebrow="Lifestyle" title="Parsed lifestyle entries">
                {extractionView.lifestyleRows.length > 0 ? (
                  <TableLikeRows rows={extractionView.lifestyleRows} />
                ) : (
                  <p className="leading-7 text-[var(--muted)]">No lifestyle entries were extracted.</p>
                )}
              </SurfaceSection>

              <SurfaceSection eyebrow="Wellness" title="Parsed wellness signals">
                {extractionView.wellnessEntries.length > 0 ? (
                  <LabelValueGrid entries={extractionView.wellnessEntries} />
                ) : (
                  <p className="leading-7 text-[var(--muted)]">No wellness signals were extracted.</p>
                )}
              </SurfaceSection>

              <RawDetails label="View raw model extraction JSON" value={extractionView.rawModelExtraction} />
              <RawDetails defaultOpen label="View sanitized extraction JSON" value={selectedTrace.extracted_payload} />
            </div>
          ) : null}

          {activeTab === "writes" ? (
            <div className="space-y-4">
              <SurfaceSection eyebrow="Persistence" title="What Frankie wrote">
                <LabelValueGrid entries={writesView.persistedEntries} />
              </SurfaceSection>

              <SurfaceSection eyebrow="Counts" title="Persisted write counts">
                {writesView.countEntries.length > 0 ? (
                  <LabelValueGrid entries={writesView.countEntries} />
                ) : (
                  <p className="leading-7 text-[var(--muted)]">
                    No persisted write counts were recorded for this turn.
                  </p>
                )}
              </SurfaceSection>

              <RawDetails label="View raw tool calls JSON" value={selectedTrace.tool_calls} />
              <RawDetails label="View raw tool results JSON" value={selectedTrace.tool_results} />
            </div>
          ) : null}

          {activeTab === "context" ? (
            <div className="space-y-4">
              <SurfaceSection eyebrow="Context" title="What Frankie had in view">
                {contextEntries.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {contextEntries.map((entry) => (
                      <div className="ff-card-soft p-4" key={entry.label}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="ff-kicker">{entry.label}</p>
                            <p className="mt-3 text-sm leading-7 whitespace-pre-wrap">
                              {entry.value}
                            </p>
                          </div>
                          {entry.label === "Recent Conversation" ? (
                            <CopyButton
                              copied={copiedField === "recent-conversation"}
                              onCopy={(value) => handleCopy("recent-conversation", value)}
                              value={entry.value}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="leading-7 text-[var(--muted)]">
                    No readable context snapshot was recorded for this turn.
                  </p>
                )}
              </SurfaceSection>

              <SurfaceSection eyebrow="Profile" title="What user context was attached">
                {profileEntries.length > 0 ? (
                  <LabelValueGrid entries={profileEntries} />
                ) : (
                  <p className="leading-7 text-[var(--muted)]">
                    No readable profile snapshot was recorded for this turn.
                  </p>
                )}
              </SurfaceSection>

              <RawDetails label="View raw context JSON" value={selectedTrace.recent_context_snapshot} />
              <RawDetails label="View raw profile snapshot JSON" value={selectedTrace.profile_snapshot} />
            </div>
          ) : null}

          {activeTab === "raw" ? (
            <div className="space-y-4">
              <RawDetails defaultOpen label="Raw model extraction JSON" value={extractionView.rawModelExtraction} />
              <RawDetails label="Sanitized extraction JSON" value={selectedTrace.extracted_payload} />
              <RawDetails label="Tool calls JSON" value={selectedTrace.tool_calls} />
              <RawDetails label="Tool results JSON" value={selectedTrace.tool_results} />
              <RawDetails label="Context JSON" value={selectedTrace.recent_context_snapshot} />
              <RawDetails label="Profile snapshot JSON" value={selectedTrace.profile_snapshot} />
            </div>
          ) : null}
        </div>
      </SurfaceSection>
    </div>
  );
}
