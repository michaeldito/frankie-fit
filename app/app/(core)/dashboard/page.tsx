import Link from "next/link";
import {
  getDashboardData,
  type DashboardRecentItem,
  type DashboardTrendPoint,
  type DietDashboardData,
  type ExerciseDashboardData,
  type WellnessDashboardData,
  type WellnessTrendPoint
} from "@/lib/dashboard";
import { getCurrentAppContext } from "@/lib/profile";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type DashboardTabId = "exercise" | "diet" | "wellness";

const dashboardTabs: Array<{ id: DashboardTabId; label: string }> = [
  { id: "exercise", label: "Exercise" },
  { id: "diet", label: "Diet" },
  { id: "wellness", label: "Wellness" }
];

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getActiveTab(value: string | undefined): DashboardTabId {
  if (value === "diet" || value === "wellness") {
    return value;
  }

  return "exercise";
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ff-card p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ff-panel p-5">
      <p className="ff-kicker">{eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  body,
  href,
  cta
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <SectionCard eyebrow="Getting started" title={title}>
      <p className="max-w-2xl leading-7 text-[var(--muted)]">{body}</p>
      <Link
        className="ff-button-primary mt-5 px-4 py-2 text-sm"
        href={href}
      >
        {cta}
      </Link>
    </SectionCard>
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
    <SectionCard eyebrow="Recent logs" title={title}>
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
    <SectionCard eyebrow="7-day trend" title="Session rhythm">
      <div className="grid h-56 grid-cols-7 items-end gap-3">
        {trend.map((point) => {
          const height = point.value > 0 ? Math.max((point.value / maxValue) * 180, 18) : 10;

          return (
            <div className="flex h-full flex-col items-center justify-end gap-3" key={point.label}>
              <div className="text-xs text-[var(--muted)]">{point.value}</div>
              <div
                className="w-full rounded-t-[1.1rem] bg-[linear-gradient(180deg,rgba(147,197,253,0.98)_0%,rgba(37,99,235,0.98)_100%)] shadow-[0_12px_28px_rgba(29,78,216,0.22)]"
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
    <SectionCard eyebrow="Pattern summary" title={title}>
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
    <SectionCard eyebrow="Frankie's read" title="What stands out right now">
      <p className="leading-7">{body}</p>
    </SectionCard>
  );
}

function WellnessTrend({ trend }: { trend: WellnessTrendPoint[] }) {
  return (
    <SectionCard eyebrow="7-day trend" title="Energy, stress, and recovery">
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
        title="No exercise data yet"
        body={data.insight}
        href="/app/chat"
        cta="Log a workout"
      />
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {data.metrics.map((metric) => (
            <SummaryCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
        <ExerciseTrend trend={data.trend} />
        <RecentList
          emptyCopy="Your recent activity will show up here once you start logging."
          items={data.recent}
          title="Latest activity"
        />
      </div>

      <div className="space-y-4">
        <FrankieInsight body={data.insight} />
        <BreakdownList
          emptyCopy="As activity types show up, Frankie will summarize the mix here."
          items={data.breakdown}
          title="Activity breakdown"
        />
      </div>
    </section>
  );
}

function DietTab({ data }: { data: DietDashboardData }) {
  if (data.empty) {
    return (
      <EmptyState
        title="No diet data yet"
        body={data.insight}
        href="/app/chat"
        cta="Log a meal"
      />
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {data.metrics.map((metric) => (
            <SummaryCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
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

      <div className="space-y-4">
        <FrankieInsight body={data.insight} />
        <SectionCard eyebrow="Use this well" title="What good logging looks like">
          <p className="leading-7 text-[var(--muted)]">
            Keep meal updates simple. Frankie does not need perfect nutrition detail to notice
            useful patterns. A quick note about what you ate is enough.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}

function WellnessTab({ data }: { data: WellnessDashboardData }) {
  if (data.empty) {
    return (
      <EmptyState
        title="No wellness data yet"
        body={data.insight}
        href="/app/chat"
        cta="Log a check-in"
      />
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {data.metrics.map((metric) => (
            <SummaryCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
        <WellnessTrend trend={data.trend} />
        <RecentList
          emptyCopy="Your check-ins will show up here once you start saving them."
          items={data.recent}
          title="Latest check-ins"
        />
      </div>

      <div className="space-y-4">
        <FrankieInsight body={data.insight} />
        <SectionCard eyebrow="Keep it light" title="What to tell Frankie">
          <p className="leading-7 text-[var(--muted)]">
            A good check-in can be short: energy, soreness, mood, stress, or motivation. Frankie
            does not need a perfect journal entry to keep the coaching grounded.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = getActiveTab(getSearchParam(resolvedSearchParams.tab));
  const context = await getCurrentAppContext();
  const dashboardData = await getDashboardData(context);

  return (
    <div className="space-y-6 lg:space-y-7">
      {!dashboardData.ready ? (
        <section className="ff-panel p-5 sm:p-6">
          <p className="ff-kicker">
            Setup note
          </p>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
            Frankie could not load one or more dashboard tables yet. If this is a fresh setup,
            make sure the full Supabase schema migration has been applied.
          </p>
          {dashboardData.error ? (
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{dashboardData.error}</p>
          ) : null}
        </section>
      ) : null}

      <div className="ff-card flex flex-wrap gap-3 p-3">
        {dashboardTabs.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <Link
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[linear-gradient(180deg,rgba(96,165,250,0.98)_0%,rgba(37,99,235,0.98)_100%)] text-white shadow-[0_16px_30px_rgba(29,78,216,0.32)]"
                  : "border border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[color:color-mix(in_srgb,var(--surface-contrast)_70%,black_30%)] hover:text-[var(--foreground)]"
              }`}
              href={`/app/dashboard?tab=${tab.id}`}
              key={tab.id}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {activeTab === "exercise" ? <ExerciseTab data={dashboardData.exercise} /> : null}
      {activeTab === "diet" ? <DietTab data={dashboardData.diet} /> : null}
      {activeTab === "wellness" ? <WellnessTab data={dashboardData.wellness} /> : null}
    </div>
  );
}
