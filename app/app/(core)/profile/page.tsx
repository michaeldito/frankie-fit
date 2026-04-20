import {
  formatList,
  formatScheduleNotes,
  getAccountLabel,
  getCurrentAppContext,
  getDisplayName
} from "@/lib/profile";

function formatTrainingDays(days: number | null | undefined) {
  if (!days) {
    return "Not set yet";
  }

  return `${days} day${days === 1 ? "" : "s"} per week`;
}

function formatSessionLength(minutes: number | null | undefined) {
  if (!minutes) {
    return "Not set yet";
  }

  return `${minutes} minutes`;
}

function yesNo(value: boolean | null | undefined) {
  return value ? "Yes" : "No";
}

export default async function ProfilePage() {
  const context = await getCurrentAppContext();
  const displayName = getDisplayName(context.user, context.profile);
  const accountLabel = getAccountLabel(
    context.profile?.role === "admin" ? "admin" : context.profile?.account_type
  );
  const email = context.user?.email ?? "No email available";

  const sections = context.profile
    ? [
        {
          title: "Goals",
          items: [
            ["Age range", context.profile.age_range || "Not set yet"],
            ["Primary goal", context.profile.primary_goal || "Not set yet"],
            ["Secondary goals", formatList(context.profile.secondary_goals)],
            [
              "Weekly training target",
              formatTrainingDays(context.profile.target_training_days)
            ],
            [
              "Typical session length",
              formatSessionLength(context.profile.typical_session_length)
            ]
          ]
        },
        {
          title: "Movement profile",
          items: [
            ["Activity level", context.profile.activity_level || "Not set yet"],
            [
              "Fitness experience",
              context.profile.fitness_experience || "Not set yet"
            ],
            [
              "Current activities",
              formatList(context.profile.current_activities)
            ],
            [
              "Preferred activities",
              formatList(context.profile.preferred_activities)
            ],
            [
              "Available equipment",
              formatList(context.profile.available_equipment)
            ],
            [
              "Training environment",
              context.profile.training_environment || "Not set yet"
            ]
          ]
        },
        {
          title: "Diet + wellness",
          items: [
            [
              "Diet preferences",
              formatList(context.profile.diet_preferences)
            ],
            [
              "Diet restrictions",
              formatList(context.profile.diet_restrictions)
            ],
            [
              "Nutrition goal",
              context.profile.nutrition_goal || "Not set yet"
            ],
            ["Energy baseline", context.profile.energy_baseline || "Not set yet"],
            ["Stress baseline", context.profile.stress_baseline || "Not set yet"],
            [
              "Wellness focus",
              formatList(context.profile.wellness_support_focus)
            ]
          ]
        },
        {
          title: "Coaching + safety",
          items: [
            ["Coaching style", context.profile.coaching_style || "Not set yet"],
            [
              "Check-in style",
              context.profile.preferred_checkin_style || "Not set yet"
            ],
            [
              "Wellness check-ins",
              yesNo(context.profile.wellness_checkin_opt_in)
            ],
            [
              "Injuries or limitations",
              formatList(context.profile.injuries_limitations)
            ],
            [
              "Health considerations",
              formatList(context.profile.health_considerations)
            ],
            ["Avoidances", formatList(context.profile.avoidances)]
          ]
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
          Profile
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Your coaching context and preferences.
        </h1>
      </header>

      {!context.schemaReady ? (
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Database setup needed
          </p>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
            This page will become your saved coaching profile once the Supabase
            migration is applied. Right now auth is live, but the `profiles` table
            is still missing in the connected project.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Profile summary
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
              {displayName}
            </span>
            <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
              Primary goal: {context.profile?.primary_goal || "Not set yet"}
            </span>
            <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
              {accountLabel}
            </span>
          </div>
          {context.profile?.onboarding_summary ? (
            <p className="mt-4 leading-7 text-[var(--muted)]">
              {context.profile.onboarding_summary}
            </p>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Account details
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start justify-between gap-6">
              <span className="text-sm text-[var(--muted)]">Email</span>
              <span className="max-w-[18rem] break-all text-right font-medium">
                {email}
              </span>
            </div>
            <div className="flex items-start justify-between gap-6">
              <span className="text-sm text-[var(--muted)]">Account type</span>
              <span className="text-right font-medium">{accountLabel}</span>
            </div>
            <div className="flex items-start justify-between gap-6">
              <span className="text-sm text-[var(--muted)]">Schedule notes</span>
              <span className="max-w-[18rem] text-right font-medium">
                {formatScheduleNotes(context.profile)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-6">
              <span className="text-sm text-[var(--muted)]">Safety acknowledged</span>
              <span className="text-right font-medium">
                {yesNo(context.profile?.safety_acknowledged)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {sections.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <div
              className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5"
              key={section.title}
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.items.map(([label, value]) => (
                  <div className="flex items-start justify-between gap-6" key={label}>
                    <span className="text-sm text-[var(--muted)]">{label}</span>
                    <span className="max-w-[16rem] text-right font-medium">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <div className="flex justify-end">
        <button
          className="rounded-full bg-[var(--brand)] px-5 py-3 font-medium text-white"
          type="button"
        >
          Update profile settings
        </button>
      </div>
    </div>
  );
}
