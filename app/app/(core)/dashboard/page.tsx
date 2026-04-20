const exerciseRows = [
  { label: "Workouts", value: "4" },
  { label: "Active days", value: "5" },
  { label: "Minutes", value: "210" }
];

const dietRows = [
  { label: "Meals logged", value: "12" },
  { label: "Days with food logs", value: "6" },
  { label: "Goal alignment", value: "Moderate" }
];

const wellnessRows = [
  { label: "Check-ins", value: "5" },
  { label: "Energy", value: "Steady" },
  { label: "Recovery", value: "Slightly down" }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
            Your Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            A simple read on how things are going.
          </h1>
        </div>
        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_84%,black_16%)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Next best step
          </p>
          <p className="mt-2 font-semibold">Log today&apos;s meal</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        {["Exercise", "Diet", "Wellness"].map((tab, index) => (
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              index === 0
                ? "bg-[var(--brand)] text-white shadow-[0_12px_30px_rgba(19,50,48,0.35)]"
                : "border border-[var(--border)] bg-[var(--surface-strong)]"
            }`}
            key={tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {exerciseRows.map((row) => (
              <div
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5"
                key={row.label}
              >
                <p className="text-sm text-[var(--muted)]">{row.label}</p>
                <p className="mt-3 text-3xl font-semibold">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Trend placeholder
            </p>
            <div className="mt-4 grid h-56 grid-cols-7 items-end gap-3">
              {[28, 48, 35, 62, 44, 71, 56].map((height, index) => (
                <div
                  className="rounded-t-2xl bg-[var(--brand)]/85"
                  key={index}
                  style={{ height: `${height * 2}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Frankie&apos;s read
            </p>
            <p className="mt-4 leading-7">
              You are staying active well. The next opportunity is keeping the
              rhythm steady rather than trying to force more volume.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                Diet snapshot
              </p>
              <div className="mt-4 space-y-3">
                {dietRows.map((row) => (
                  <div className="flex items-center justify-between" key={row.label}>
                    <span className="text-sm text-[var(--muted)]">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                Wellness snapshot
              </p>
              <div className="mt-4 space-y-3">
                {wellnessRows.map((row) => (
                  <div className="flex items-center justify-between" key={row.label}>
                    <span className="text-sm text-[var(--muted)]">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
