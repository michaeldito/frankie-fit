import { sendChatMessage } from "@/app/app/(core)/chat/actions";
import { ChatTranscript } from "@/components/chat/chat-transcript";
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
  const primaryGoal = context.profile?.primary_goal;
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
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="ff-kicker">Conversation</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-[2rem]">
            Good to see you, {firstName}.
          </h2>
          <p className="max-w-3xl leading-7 text-[var(--muted)]">
            Stay loose with the wording. Frankie can now read activity, meals, and wellness from
            the same update without forcing you into tidy inputs.
          </p>
        </div>
      </section>

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
        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ff-kicker">Live chat</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Log what happened, what you ate, how you feel, or ask Frankie to help shape the
                next step.
              </p>
            </div>
            <span className="ff-pill">Thread memory active</span>
          </div>
        </div>

        <ChatTranscript
          assistantCardClass={assistantCardClass}
          followupMessage={followupMessage}
          introMessage={introMessage}
          messages={chatExperience.messages}
          userCardClass={userCardClass}
        />

        <form action={sendChatMessage} className="border-t border-[var(--border)] px-5 py-4 sm:px-6">
          <label className="block">
            <span className="mb-3 block text-sm font-semibold tracking-[-0.01em]">
              Tell Frankie what you did, ate, or how you are feeling.
            </span>
            <textarea
              className="ff-textarea min-h-32"
              name="message"
              placeholder={
                primaryGoal
                  ? `I want to stay on track with ${primaryGoal.toLowerCase()}, and today looked like...`
                  : "I had eggs and fruit for breakfast, walked for an hour, and motivation feels a little low."
              }
              required
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
              Say it however you would normally say it. Frankie is meant to handle the messy
              version now.
            </p>
            <button className="ff-button-primary px-5 py-3 text-sm" type="submit">
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
