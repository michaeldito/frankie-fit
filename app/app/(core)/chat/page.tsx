import { WebChatExperience } from "@/components/chat/web-chat-experience";
import { getChatExperience } from "@/lib/chat";
import { getCurrentAppContext, getDisplayName } from "@/lib/profile";

type ChatPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const showWelcome = getSearchParam(resolvedSearchParams.welcome) === "1";
  const error = getSearchParam(resolvedSearchParams.error);
  const context = await getCurrentAppContext();
  const displayName = getDisplayName(context.user, context.profile);
  const firstName = displayName.split(" ")[0] ?? "there";
  const chatExperience = await getChatExperience(context, displayName);
  const primaryGoal = context.profile?.primary_goal ?? null;
  const preferredActivities = context.profile?.preferred_activities ?? [];
  const preferredActivityText =
    preferredActivities.length > 0
      ? preferredActivities.slice(0, 2).join(" and ").toLowerCase()
      : "the movement that fits your week";
  const introMessage = context.profile?.onboarding_completed
    ? `Good to see you, ${firstName}. You are here to work on ${primaryGoal?.toLowerCase() ?? "your goals"}, so let us keep today grounded in that.`
    : "Good to see you. Want to log something, check in, or plan today?";
  const followupMessage = context.profile?.onboarding_completed
    ? `Since you enjoy ${preferredActivityText}, you do not need to overthink this. Log what you did, what you ate, or how recovery feels and I will shape the next step from there.`
    : "A short update is enough. Frankie can work from movement, meals, wellness, or a blend of all three.";
  const assistantCardClass = "ff-card max-w-3xl px-5 py-4 sm:px-6 sm:py-5";
  const userCardClass =
    "ml-auto max-w-2xl rounded-[1.45rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(96,165,250,0.98)_0%,rgba(37,99,235,0.98)_100%)] px-5 py-4 text-white shadow-[0_18px_34px_rgba(29,78,216,0.32)] sm:px-6 sm:py-5";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {!chatExperience.schemaReady ? (
        <section className="ff-panel p-5 sm:p-6">
          <p className="ff-kicker">Setup note</p>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
            Your auth is working, but the Supabase profile schema has not been applied yet. Run
            the SQL in
            <span className="font-medium text-[var(--foreground)]">
              {" "}
              `supabase/migrations/20260419173000_initial_schema.sql`
            </span>{" "}
            and Frankie will start saving onboarding, profile context, and future coaching state.
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--accent)_55%,var(--border)_45%)] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface)_88%)] px-5 py-4 text-sm leading-6 text-[var(--foreground)] shadow-[var(--shadow-card)]">
          {error}
        </section>
      ) : null}

      {showWelcome && context.profile?.onboarding_summary ? (
        <section className="ff-card px-5 py-4 sm:px-6">
          <p className="ff-kicker">First read</p>
          <p className="mt-3 max-w-4xl leading-7">{context.profile.onboarding_summary}</p>
        </section>
      ) : null}

      <section className="ff-panel min-h-0 flex flex-1 flex-col overflow-hidden">
        <WebChatExperience
          assistantCardClass={assistantCardClass}
          followupMessage={followupMessage}
          initialMessages={chatExperience.messages}
          initialPersona={context.profile?.coach_persona ?? null}
          introMessage={introMessage}
          schemaReady={chatExperience.schemaReady}
          userCardClass={userCardClass}
        />
      </section>
    </div>
  );
}
