import Link from "next/link";
import { programSchedules } from "@/packages/workout-core";

export default function ProgramsPage() {
  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="ff-panel-strong p-5 sm:p-6">
        <p className="ff-kicker">Programs</p>
        <h1 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Programs</h1>
        <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
          Follow a structured program day by day, and log straight from the calendar.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {programSchedules.map((schedule) => (
          <Link className="ff-card-soft block p-4 transition hover:bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]" href={`/app/programs/${schedule.slug}`} key={schedule.slug}>
            <p className="font-medium">{schedule.name}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{schedule.description}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{schedule.totalDays} days</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
