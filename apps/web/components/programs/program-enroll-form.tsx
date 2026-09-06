"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getPacificDateKey } from "@frankie-fit/dashboard-core";

type ProgramEnrollFormProps = {
  programSlug: string;
  startDate: string | null;
};

export function ProgramEnrollForm({ programSlug, startDate }: ProgramEnrollFormProps) {
  const router = useRouter();
  const [date, setDate] = useState(startDate ?? getPacificDateKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/programs/${programSlug}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: date })
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not start the program.");
      }

      router.refresh();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start the program.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ff-card-soft flex flex-wrap items-end gap-3 p-4">
      <label className="space-y-1.5 text-sm">
        <span className="text-[var(--muted)]">{startDate ? "Restart on" : "Start on"}</span>
        <input className="ff-input" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
      </label>
      <button
        className="ff-button-primary cursor-pointer px-4 py-2.5 text-sm disabled:cursor-not-allowed"
        disabled={saving}
        onClick={handleStart}
        type="button"
      >
        {saving ? "Saving…" : startDate ? "Update start date" : "Start program"}
      </button>
      {error ? <p className="w-full text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
