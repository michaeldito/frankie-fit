import Image from "next/image";
import Link from "next/link";
import {
  EMPTY_STATE_LINES,
  dailyLine,
  frankieMoodFor,
  greetingFor,
  type FrankieMood,
  type Pillar
} from "@frankie-fit/brand-core";
import { getPacificDateKey, getPacificHour } from "@frankie-fit/dashboard-core";
import { FRANKIE_MOOD_ART } from "@/components/frankie/frankie-art";
import { FrankieAvatar } from "@/components/frankie/frankie-avatar";
import { FrankieSays } from "@/components/frankie/frankie-says";
import { FrankieDayInline } from "@/components/frankie-day/frankie-day-inline";
import { PILLAR_STYLES } from "@/components/frankie/pillars";
import {
  getDashboardData,
  type DashboardRecentItem,
  type DashboardTrendPoint,
  type DietDashboardData,
  type ExerciseDashboardData,
  type LifestyleDashboardData,
  type WellnessDashboardData,
  type WellnessTrendPoint
} from "@/lib/dashboard";
import { getCurrentAppContext, getDisplayName } from "@/lib/profile";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type DashboardTabId = "exercise" | "diet" | "lifestyle" | "wellness";

const dashboardTabs: Array<{ id: DashboardTabId & Pillar; label: string }> = [
  { id: "exercise", label: "Exercise" },
  { id: "diet", label: "Diet" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "wellness", label: "Wellness" }
];

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getActiveTab(value: string | undefined): DashboardTabId {
  if (value === "diet" || value === "lifestyle" || value === "wellness") {
    return value;
  }

  return "exercise";
}

const EMPTY_STATE_MOODS: Record<Pillar, FrankieMood> = {
  exercise: "waiting",
  diet: "hungry",
  wellness: "snuggle",
  lifestyle: "stretching"
};

function SummaryCard({ label, value, pillar }: { label: string; value: string; pillar: Pillar }) {
  const { icon: Icon, soft, text } = PILLAR_STYLES[pillar];

  return (
    <div className="ff-card flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${soft} ${text}`}>
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold tracking-[-0.02em]">{value}</p>
        <p className="text-sm text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ff-panel p-4">
      <h2 className="text-base font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EmptyState({
  pillar,
  title,
  body,
  href,
  cta
}: {
  pillar: Pillar;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <section className="ff-panel flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
      <Image
        alt=""
        aria-hidden
        className="h-28 w-28 flex-none object-contain"
        height={112}
        src={FRANKIE_MOOD_ART[EMPTY_STATE_MOODS[pillar]]}
        width={112}
      />
      <div className="min-w-0">
        <p className="ff-kicker">{title}</p>
        <p className="mt-2 font-frankie text-2xl leading-tight text-frankie">{EMPTY_STATE_LINES[pillar]}</p>
        <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">{body}</p>
        <Link className="ff-button-primary mt-4 px-4 py-2 text-sm" href={href}>
          {cta}
        </Link>
      </div>
    </section>
  );
}

function RecentList({
  title,
  items,
  emptyCopy
}: {
  title: string;
  items: DashboardRecentItem[];
  emptyCopy: string;
}) {
  return (
    <SectionCard title={title}>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              className="ff-card-soft p-4"
              key={item.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-[var(--muted)]">{item.dateLabel}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="leading-7 text-[var(--muted)]">{emptyCopy}</p>
      )}
    </SectionCard>
  );
}

function ExerciseTrend({ trend }: { trend: DashboardTrendPoint[] }) {
  const maxValue = Math.max(...trend.map((point) => point.value), 1);

  return (
    <SectionCard title="Session rhythm, last 7 days">
      <div className="grid h-56 grid-cols-7 items-end gap-3">
        {trend.map((point) => {
          const height = point.value > 0 ? Math.max((point.value / maxValue) * 180, 18) : 10;

          return (
            <div className="flex h-full flex-col items-center justify-end gap-3" key={point.label}>
              <div className="text-xs text-[var(--muted)]">{point.value}</div>
              <div
                className="w-full rounded-t-[1.1rem] bg-pillar-exercise"
                style={{ height: `${height}px` }}
              />
              <div className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">
                {point.label}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function BreakdownList({
  title,
  items,
  emptyCopy
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  emptyCopy: string;
}) {
  return (
    <SectionCard title={title}>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div className="flex items-center justify-between" key={item.label}>
              <span className="text-sm text-[var(--muted)]">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="leading-7 text-[var(--muted)]">{emptyCopy}</p>
      )}
    </SectionCard>
  );
}

function FrankieInsight({ body }: { body: string }) {
  return (
    <SectionCard title="What stands out right now">
      <div className="flex items-start gap-3">
        <FrankieAvatar mood="focused" size={40} />
        <p className="leading-7">{body}</p>
      </div>
    </SectionCard>
  );
}

function WellnessTrend({ trend }: { trend: WellnessTrendPoint[] }) {
  return (
    <SectionCard title="Energy, stress, and recovery, last 7 days">
      <div className="space-y-3">
        {trend.map((point) => (
          <div
            className="ff-card-soft p-4"
            key={point.label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{point.label}</p>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                <span>Energy {point.energy ? point.energy.toFixed(1) : "-"}</span>
                <span>Stress {point.stress ? point.stress.toFixed(1) : "-"}</span>
                <span>Soreness {point.soreness ? point.soreness.toFixed(1) : "-"}</span>
                <span>Mood {point.mood ? point.mood.toFixed(1) : "-"}</span>
                <span>Motivation {point.motivation ? point.motivation.toFixed(1) : "-"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ExerciseTab({ data }: { data: ExerciseDashboardData }) {
  if (data.empty) {
    return (
      <EmptyState
        pillar="exercise"
        title="No exercise data yet"
        body={data.insight}
        href="/app/chat"
        cta="Log a workout"
      />
    );
  }

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2">
        <FrankieInsight body={data.insight} />
        <SectionCard title="What good logging looks like">
          <p className="leading-7 text-[var(--muted)]">
            A quick note on what you did is enough — Frankie does not need exact reps or a
            perfect number. Duration and intensity help when you have them, but they are
            optional.
          </p>
        </SectionCard>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <SummaryCard key={metric.label} label={metric.label} pillar="exercise" value={metric.value} />
        ))}
      </div>
      <ExerciseTrend trend={data.trend} />
      <div className="grid gap-3 md:grid-cols-2">
        <BreakdownList
          emptyCopy="As activity types show up, Frankie will summarize the mix here."
          items={data.breakdown}
          title="Activity breakdown"
        />
        <RecentList
          emptyCopy="Your recent activity will show up here once you start logging."
          items={data.recent}
          title="Latest activity"
        />
      </div>
    </div>
  );
}

function DietTab({ data }: { data: DietDashboardData }) {
  if (data.empty) {
    return (
      <EmptyState
        pillar="diet"
        title="No diet data yet"
        body={data.insight}
        href="/app/chat"
        cta="Log a meal"
      />
    );
  }

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2">
        <FrankieInsight body={data.insight} />
        <SectionCard title="What good logging looks like">
          <p className="leading-7 text-[var(--muted)]">
            Keep meal updates simple. Frankie does not need perfect nutrition detail to notice
            useful patterns. A quick note about what you ate is enough.
          </p>
        </SectionCard>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <SummaryCard key={metric.label} label={metric.label} pillar="diet" value={metric.value} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <BreakdownList
          emptyCopy="As meals get logged, Frankie will summarize your patterns here."
          items={data.patterns}
          title="What shows up most"
        />
        <RecentList
          emptyCopy="Your latest meals and snacks will show up here."
          items={data.recent}
          title="Latest meals"
        />
      </div>
    </div>
  );
}

function LifestyleTab({ data }: { data: LifestyleDashboardData }) {
  if (data.empty) {
    return (
      <EmptyState
        pillar="lifestyle"
        title="No lifestyle data yet"
        body={data.insight}
        href="/app/chat"
        cta="Log something"
      />
    );
  }

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2">
        <FrankieInsight body={data.insight} />
        <SectionCard title="What good logging looks like">
          <p className="leading-7 text-[var(--muted)]">
            Anything outside a workout or a meal counts — social plans, family time,
            entertainment, travel, or substance use. A quick note is enough.
          </p>
        </SectionCard>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <SummaryCard key={metric.label} label={metric.label} pillar="lifestyle" value={metric.value} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <BreakdownList
          emptyCopy="As lifestyle updates get logged, Frankie will summarize your patterns here."
          items={data.patterns}
          title="What shows up most"
        />
        <RecentList
          emptyCopy="Your latest lifestyle logs will show up here."
          items={data.recent}
          title="Latest lifestyle logs"
        />
      </div>
    </div>
  );
}

function WellnessTab({ data }: { data: WellnessDashboardData }) {
  if (data.empty) {
    return (
      <EmptyState
        pillar="wellness"
        title="No wellness data yet"
        body={data.insight}
        href="/app/chat"
        cta="Log a check-in"
      />
    );
  }

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2">
        <FrankieInsight body={data.insight} />
        <SectionCard title="What to tell Frankie">
          <p className="leading-7 text-[var(--muted)]">
            A good check-in can be short: energy, soreness, mood, stress, or motivation. Frankie
            does not need a perfect journal entry to keep the coaching grounded.
          </p>
        </SectionCard>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <SummaryCard key={metric.label} label={metric.label} pillar="wellness" value={metric.value} />
        ))}
      </div>
      <WellnessTrend trend={data.trend} />
      <div className="grid gap-3 md:grid-cols-2">
        <BreakdownList
          emptyCopy="As check-ins come in, Frankie will summarize which signals show up most here."
          items={data.breakdown}
          title="What you check in on most"
        />
        <RecentList
          emptyCopy="Your check-ins will show up here once you start saving them."
          items={data.recent}
          title="Latest check-ins"
        />
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = getActiveTab(getSearchParam(resolvedSearchParams.tab));
  const context = await getCurrentAppContext();
  const dashboardData = await getDashboardData(context);
  const hour = getPacificHour();
  const firstName = context.user ? getDisplayName(context.user, context.profile).split(" ")[0] : null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-[1.7rem]">
        {greetingFor(hour, firstName)} <span aria-hidden>🐾</span>
      </h2>
      <FrankieSays line={dailyLine(getPacificDateKey())} mood={frankieMoodFor({ hourPacific: hour })}>
        <FrankieDayInline />
      </FrankieSays>

      {!dashboardData.ready ? (
        <section className="ff-panel p-4">
          <p className="ff-kicker">
            Setup note
          </p>
          <p className="mt-2 max-w-3xl leading-7 text-[var(--muted)]">
            Frankie could not load one or more dashboard tables yet. If this is a fresh setup,
            make sure the full Supabase schema migration has been applied.
          </p>
          {dashboardData.error ? (
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{dashboardData.error}</p>
          ) : null}
        </section>
      ) : null}

      <nav aria-label="Pillars" className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-surface-strong p-1 sm:w-fit">
        {dashboardTabs.map((tab) => {
          const active = tab.id === activeTab;
          const { icon: Icon, text } = PILLAR_STYLES[tab.id];

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition sm:flex-none ${
                active ? "bg-surface text-foreground shadow-[var(--shadow-card)]" : "text-muted hover:text-foreground"
              }`}
              href={`/app/dashboard?tab=${tab.id}`}
              key={tab.id}
            >
              <Icon aria-hidden className={`h-4 w-4 ${active ? text : ""}`} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {activeTab === "exercise" ? <ExerciseTab data={dashboardData.exercise} /> : null}
      {activeTab === "diet" ? <DietTab data={dashboardData.diet} /> : null}
      {activeTab === "lifestyle" ? <LifestyleTab data={dashboardData.lifestyle} /> : null}
      {activeTab === "wellness" ? <WellnessTab data={dashboardData.wellness} /> : null}
    </div>
  );
}
