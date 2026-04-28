import type { ReactNode } from "react";
import { getAdminOverviewData, requireAdminContext } from "@/lib/admin";
import { getCurrentAppContext } from "@/lib/profile";

function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="ff-card p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p> : null}
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
  children: ReactNode;
}) {
  return (
    <section className="ff-panel p-5">
      <p className="ff-kicker">{eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AdminOverviewPage() {
  const context = await getCurrentAppContext();
  requireAdminContext(context);
  const overview = await getAdminOverviewData(context);

  return (
    <div className="space-y-6 lg:space-y-7">
      <header className="ff-panel-strong flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="ff-kicker">Admin Overview</p>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-[2.35rem]">
            A privacy-conscious read on tracked product health.
          </h1>
          <p className="max-w-3xl leading-7 text-[var(--muted)]">
            This is the smallest useful founder view for Frankie Fit: broad product signal across
            real, internal, and synthetic accounts first, safe test-account visibility second, and
            no default surveillance of real-user details.
          </p>
        </div>
        <div className="ff-card min-w-[17rem] p-4">
          <p className="ff-kicker">Current mode</p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.02em]">
            Aggregate-first across all tracked accounts
          </p>
        </div>
      </header>

      {!overview.ready ? (
        <section className="ff-panel p-5 sm:p-6">
          <p className="ff-kicker">Admin setup note</p>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
            The admin overview code is built, but the aggregate SQL helpers may not be in your
            Supabase project yet. Run the migration in
            <span className="font-medium text-[var(--foreground)]">
              {" "}
              `supabase/migrations/20260424173000_admin_overview_functions.sql`
            </span>{" "}
            and then refresh this page.
          </p>
          {overview.error ? (
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{overview.error}</p>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metricCards.map((metric) => (
          <MetricCard
            detail={metric.detail}
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <SectionCard eyebrow="Pillar usage" title="Where users are creating signal">
            <div className="grid gap-4 md:grid-cols-3">
              {overview.pillarUsageCards.map((card) => (
                <MetricCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Common requests" title="What users are asking Frankie for">
            {overview.promptThemes.length > 0 ? (
              <div className="space-y-3">
                {overview.promptThemes.map((theme) => (
                  <div className="flex items-center justify-between gap-6" key={theme.theme}>
                    <span className="text-sm text-[var(--muted)]">{theme.theme}</span>
                    <span className="font-medium">{theme.entry_count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="leading-7 text-[var(--muted)]">
                Prompt-theme counts will show up here once the admin SQL helpers are active and
                more message volume accumulates.
              </p>
            )}
          </SectionCard>

          <SectionCard eyebrow="Friction summary" title="Where the product may still be thin">
            {overview.frictionSummary.length > 0 ? (
              <div className="space-y-3">
                {overview.frictionSummary.map((item) => (
                  <article className="ff-card-soft p-4" key={item.label}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-lg font-semibold">{item.entry_count}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="leading-7 text-[var(--muted)]">
                Product friction summaries will appear here once the aggregate admin helpers are
                active.
              </p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard eyebrow="Test accounts" title="Safe accounts available for direct review">
            {overview.testAccounts.length > 0 ? (
              <div className="space-y-3">
                {overview.testAccounts.map((account) => (
                  <article className="ff-card-soft p-4" key={account.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{account.name}</p>
                      <span className="ff-pill text-[0.72rem] uppercase tracking-[0.15em]">
                        {account.accountType}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Onboarding: {account.onboardingCompleted ? "complete" : "incomplete"}
                      {account.primaryGoal ? ` / Goal: ${account.primaryGoal}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="leading-7 text-[var(--muted)]">
                Internal test and synthetic demo accounts will appear here once they exist in the
                project data.
              </p>
            )}
          </SectionCard>

          <SectionCard eyebrow="Product suggestions" title="Signals worth founder review">
            {overview.productSuggestions.length > 0 ? (
              <div className="space-y-3">
                {overview.productSuggestions.map((suggestion) => (
                  <article className="ff-card-soft p-4" key={suggestion.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{suggestion.title}</p>
                      <span className="ff-pill text-[0.72rem] uppercase tracking-[0.15em]">
                        {suggestion.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {suggestion.summary}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="leading-7 text-[var(--muted)]">
                No product suggestions are saved yet. This panel is ready for the founder review
                loop when those start being added.
              </p>
            )}
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
