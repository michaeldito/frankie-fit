import {
  getCurrentAppContext,
  getDisplayName
} from "@/lib/profile";

type ChatPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const showWelcome = getSearchParam(resolvedSearchParams.welcome) === "1";
  const context = await getCurrentAppContext();
  const displayName = getDisplayName(context.user, context.profile);
  const firstName = displayName.split(" ")[0] ?? "there";
  const primaryGoal = context.profile?.primary_goal;
  const preferredActivities = context.profile?.preferred_activities ?? [];
  const preferredActivityText =
    preferredActivities.length > 0
      ? preferredActivities.slice(0, 2).join(" and ").toLowerCase()
      : "the movement that fits your week";
  const focusLabel = primaryGoal ? `Focus on ${primaryGoal}` : "Focus on recovery + movement";
  const introMessage = context.profile?.onboarding_completed
    ? `Good to see you, ${firstName}. You are here to work on ${primaryGoal?.toLowerCase() ?? "your goals"}, so let us keep today grounded in that.`
    : "Good to see you. Want to log something, check in, or plan today?";
  const followupMessage = context.profile?.onboarding_completed
    ? `Since you enjoy ${preferredActivityText}, you do not need to overthink this. Log what you did, what you ate, or how recovery feels and I will shape the next step from there.`
    : "Nice. That gives us a good base for today. If energy is solid, a light run or mobility session could make sense. If not, recovery is still a good call.";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
            Chat with Frankie
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Log something, ask a question, or let Frankie shape the week.
          </h1>
        </div>
        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_84%,black_16%)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Today
          </p>
          <p className="mt-2 font-semibold">{focusLabel}</p>
        </div>
      </header>

      {!context.schemaReady ? (
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Setup note
          </p>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
            Your auth is working, but the Supabase profile schema has not been
            applied yet. Run the SQL in
            <span className="font-medium text-[var(--foreground)]">
              {" "}
              `supabase/migrations/20260419173000_initial_schema.sql`
            </span>{" "}
            and Frankie will start saving onboarding, profile context, and future
            coaching state.
          </p>
        </section>
      ) : null}

      {showWelcome && context.profile?.onboarding_summary ? (
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Frankie&apos;s first read
          </p>
          <p className="mt-3 leading-7">{context.profile.onboarding_summary}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            A good place to start is simple: log today&apos;s workout, tell Frankie
            what you ate, or give a quick wellness check-in.
          </p>
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-[var(--border)] p-5">
        <div className="space-y-5">
          <article className="max-w-3xl rounded-[1.5rem] bg-[var(--surface-strong)] px-5 py-4">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Frankie
            </p>
            <p className="leading-7">{introMessage}</p>
          </article>

          <article className="ml-auto max-w-2xl rounded-[1.5rem] bg-[var(--brand)] px-5 py-4 text-white">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/70">
              You
            </p>
            <p className="leading-7">
              I lifted yesterday and walked this morning.
            </p>
          </article>

          <article className="max-w-3xl rounded-[1.5rem] bg-[var(--surface-strong)] px-5 py-4">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Frankie
            </p>
            <p className="leading-7">{followupMessage}</p>
          </article>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {["Log workout", "Log meal", "Check in", "Ask for a plan"].map((item) => (
          <button
            className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium transition hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
            key={item}
            type="button"
          >
            {item}
          </button>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-[var(--border)] p-5">
        <label className="block">
          <span className="mb-3 block text-sm font-medium">
            Tell Frankie what you did, ate, or how you are feeling.
          </span>
          <textarea
            className="min-h-32 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
            placeholder={
              primaryGoal
                ? `I want to stay on track with ${primaryGoal.toLowerCase()}, and today looked like...`
                : "I had eggs and fruit for breakfast, and energy feels pretty solid today."
            }
          />
        </label>
        <div className="mt-4 flex justify-end">
          <button
            className="rounded-full bg-[var(--brand)] px-5 py-3 font-medium text-white"
            type="button"
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
