import { notFound } from "next/navigation";
import { ProgramCalendar } from "@/components/programs/program-calendar";
import { ProgramEnrollForm } from "@/components/programs/program-enroll-form";
import { getCurrentAppContext } from "@/lib/profile";
import { getProgramProgress } from "@/lib/programs/get-program-progress";
import { findProgramSchedule } from "@frankie-fit/workout-core";

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const schedule = findProgramSchedule(slug);

  if (!schedule) {
    notFound();
  }

  const context = await getCurrentAppContext();
  const progress = await getProgramProgress(context, slug);

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="ff-panel-strong p-5 sm:p-6">
        <p className="ff-kicker">Program</p>
        <h1 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{schedule.name}</h1>
        <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">{schedule.description}</p>
      </section>

      <ProgramEnrollForm programSlug={schedule.slug} startDate={progress.startDate} />

      <section className="ff-panel p-5 sm:p-6">
        <ProgramCalendar completedDays={progress.completedDays} schedule={schedule} startDate={progress.startDate} />
      </section>
    </div>
  );
}
