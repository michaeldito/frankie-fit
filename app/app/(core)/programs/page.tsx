import Link from "next/link";
import { programSchedules } from "@/packages/workout-core";

export default function ProgramsPage() {
  return (
    <div className="space-y-6 lg:space-y-7">
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
