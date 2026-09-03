import { Suspense } from "react";
import { WorkoutLogger } from "@/components/workouts/workout-logger";
import { getCurrentAppContext } from "@/lib/profile";
import { getRecentWorkoutSessions } from "@/lib/workouts/get-recent-sessions";

export default async function WorkoutsPage() {
  const context = await getCurrentAppContext();
  const recentSessions = await getRecentWorkoutSessions(context);

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="ff-panel-strong p-5 sm:p-6">
        <p className="ff-kicker">Log a session</p>
        <h1 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Workouts</h1>
        <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
          Pick an exercise, add sets as you go, or build a superset or circuit round by round.
          Start from a curated WOD if you want a preset structure.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Suspense fallback={null}>
          <WorkoutLogger />
        </Suspense>

        <section className="ff-panel p-5">
          <p className="ff-kicker">Recent logs</p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Recent sessions</h2>
          <div className="mt-4">
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <article className="ff-card-soft p-4" key={session.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-[var(--muted)]">{session.dateLabel}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{session.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="leading-7 text-[var(--muted)]">
                Your logged sessions will show up here once you save one.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
