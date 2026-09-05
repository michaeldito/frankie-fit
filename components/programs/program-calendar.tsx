"use client";

import Link from "next/link";
import { useMemo } from "react";
import { fromDateKey, getPacificDateKey } from "@frankie-fit/dashboard-core";
import { findProgramWorkout, type ProgramSchedule } from "@frankie-fit/workout-core";

type ProgramCalendarProps = {
  schedule: ProgramSchedule;
  startDate: string | null;
  completedDays: number[];
};

function dayNumberFromStartDate(startDate: string, totalDays: number): number {
  const start = fromDateKey(startDate);
  const today = fromDateKey(getPacificDateKey());
  const diffDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), totalDays);
}

export function ProgramCalendar({ schedule, startDate, completedDays }: ProgramCalendarProps) {
  const currentDay = useMemo(
    () => (startDate ? dayNumberFromStartDate(startDate, schedule.totalDays) : null),
    [startDate, schedule.totalDays]
  );
  const completed = useMemo(() => new Set(completedDays), [completedDays]);

  const weeks = useMemo(() => {
    const byWeek = new Map<number, typeof schedule.days>();

    for (const day of schedule.days) {
      const existing = byWeek.get(day.week) ?? [];
      existing.push(day);
      byWeek.set(day.week, existing);
    }

    return Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0]);
  }, [schedule]);

  const phaseStartWeeks = new Map<number, number>();
  for (const [week, days] of weeks) {
    const phase = days[0].phase;
    if (!phaseStartWeeks.has(phase)) {
      phaseStartWeeks.set(phase, week);
    }
  }

  return (
    <div className="space-y-6">
      {weeks.map(([week, days]) => {
        const phase = days[0].phase;
        const isPhaseStart = phaseStartWeeks.get(phase) === week;

        return (
          <div key={week}>
            {isPhaseStart ? <p className="ff-kicker mb-2">Phase {phase}</p> : null}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--muted)]">Week {week}</p>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-7">
              {days.map((day) => {
                const isToday = currentDay === day.day;
                const isCompleted = completed.has(day.day);
                const isRest = day.workoutSlugs.length === 0;

                return (
                  <div
                    className={`ff-card-soft p-3 text-sm ${isToday ? "ring-2 ring-[color:rgba(96,165,250,0.9)]" : ""} ${
                      isCompleted ? "bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]" : ""
                    }`}
                    key={day.day}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[var(--muted)]">
                        {day.weekday.slice(0, 3)} · Day {day.day}
                      </p>
                      {isCompleted ? <span className="text-xs text-[var(--muted)]">✓</span> : null}
                    </div>
                    <div className="mt-2 space-y-1">
                      {isRest ? (
                        <p className="text-[var(--muted)]">
                          Rest
                          {day.optionalWorkoutSlugs?.length ? (
                            <>
                              {" "}
                              or{" "}
                              {day.optionalWorkoutSlugs.map((slug) => {
                                const workout = findProgramWorkout(slug);
                                return (
                                  <Link
                                    className="underline underline-offset-2"
                                    href={`/app/workouts?workout=${slug}&program=${schedule.slug}&day=${day.day}`}
                                    key={slug}
                                  >
                                    {workout?.name ?? slug}
                                  </Link>
                                );
                              })}
                            </>
                          ) : null}
                        </p>
                      ) : (
                        day.workoutSlugs.map((slug) => {
                          const workout = findProgramWorkout(slug);
                          return (
                            <Link
                              className="block font-medium hover:underline"
                              href={`/app/workouts?workout=${slug}&program=${schedule.slug}&day=${day.day}`}
                              key={slug}
                            >
                              {workout?.name ?? slug}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
