import type { ReactNode } from "react";
import { saveProfile } from "@/app/app/(core)/profile/actions";
import {
  formatScheduleNotes,
  getAccountLabel,
  getCurrentAppContext,
  getDisplayName
} from "@/lib/profile";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ageRangeOptions = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Prefer not to say"] as const;
const secondaryGoalOptions = [
  "Performance",
  "Body composition",
  "Energy",
  "Stress",
  "General health",
  "Recovery"
] as const;
const movementOptions = [
  "Lifting",
  "Running",
  "Walking",
  "Cycling",
  "Yoga",
  "Mobility",
  "Classes",
  "Sports"
] as const;
const equipmentOptions = [
  "Full gym",
  "Dumbbells",
  "Kettlebells",
  "Resistance bands",
  "Cardio machines",
  "Bodyweight only"
] as const;
const dietPreferenceOptions = [
  "High-protein",
  "Vegetarian",
  "Vegan",
  "Mediterranean",
  "Low-carb",
  "Flexible"
] as const;
const wellnessFocusOptions = [
  "Recovery",
  "Motivation",
  "Stress",
  "Energy",
  "Consistency",
  "Mental clarity"
] as const;
const activityLevelOptions = [
  "Mostly sedentary",
  "Lightly active",
  "Moderately active",
  "Consistently active"
] as const;
const fitnessExperienceOptions = [
  "Beginner",
  "Getting back into it",
  "Intermediate",
  "Experienced"
] as const;
const trainingEnvironmentOptions = ["Gym", "Home", "Outdoors", "Classes", "Mix of environments"] as const;
const targetTrainingDayOptions = ["1", "2", "3", "4", "5", "6", "7"] as const;
const sessionLengthOptions = ["15", "30", "45", "60", "90"] as const;
const energyBaselineOptions = ["Low", "Up and down", "Steady", "Strong"] as const;
const stressBaselineOptions = ["Low", "Moderate", "High", "Very high"] as const;
const coachingStyleOptions = [
  "Gentle and steady",
  "Direct but warm",
  "Motivating",
  "Analytical",
  "Balanced mix"
] as const;
const checkinStyleOptions = ["Quick check-ins", "Weekly reflection", "Both"] as const;

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function yesNo(value: boolean | null | undefined) {
  return value ? "Yes" : "No";
}

function CheckboxGrid({
  name,
  options,
  selected
}: {
  name: string;
  options: readonly string[];
  selected: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm"
          key={option}
        >
          <input
            className="h-4 w-4 accent-[var(--brand)]"
            defaultChecked={selected.includes(option)}
            name={name}
            type="checkbox"
            value={option}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = getSearchParam(resolvedSearchParams.error);
  const saved = getSearchParam(resolvedSearchParams.saved) === "1";
  const context = await getCurrentAppContext();
  const displayName = getDisplayName(context.user, context.profile);
  const accountLabel = getAccountLabel(
    context.profile?.role === "admin" ? "admin" : context.profile?.account_type
  );
  const email = context.user?.email ?? "No email available";
  const selectedSecondaryGoals = context.profile?.secondary_goals ?? [];
  const selectedPreferredActivities = context.profile?.preferred_activities ?? [];
  const selectedEquipment = context.profile?.available_equipment ?? [];
  const selectedDietPreferences = context.profile?.diet_preferences ?? [];
  const selectedWellnessFocus = context.profile?.wellness_support_focus ?? [];
  const scheduleNotes =
    typeof context.profile?.preferred_schedule?.notes === "string"
      ? context.profile.preferred_schedule.notes
      : "";

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Profile</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          The context Frankie uses to coach you.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          Update the important pieces of your goals, routine, and coaching preferences without
          redoing onboarding from scratch.
        </p>
      </header>

      {saved ? (
        <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--brand)_55%,var(--border)_45%)] bg-[color:color-mix(in_srgb,var(--brand)_14%,var(--surface)_86%)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
          Your profile is updated. Frankie will use this new context in chat, the dashboard, and
          the next-step guidance.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--accent)_55%,var(--border)_45%)] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface)_88%)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
          {error}
        </div>
      ) : null}

      {!context.schemaReady ? (
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Database setup needed
          </p>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
            This page becomes editable once the Supabase profile schema is available. Right now
            auth is live, but the `profiles` table is still missing in the connected project.
          </p>
        </section>
      ) : null}

      <form action={saveProfile} className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Profile summary
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">{displayName}</span>
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
                Primary goal: {context.profile?.primary_goal || "Not set yet"}
              </span>
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">{accountLabel}</span>
            </div>
            {context.profile?.onboarding_summary ? (
              <p className="mt-4 leading-7 text-[var(--muted)]">{context.profile.onboarding_summary}</p>
            ) : (
              <p className="mt-4 leading-7 text-[var(--muted)]">
                Frankie will keep this summary updated as your goals and preferences change.
              </p>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Account details
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-6">
                <span className="text-sm text-[var(--muted)]">Email</span>
                <span className="max-w-[18rem] break-all text-right font-medium">{email}</span>
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

        <Section
          description="Keep the goal and cadence current so Frankie is coaching the version of your life you are actually living."
          eyebrow="Goals"
          title="What should Frankie optimize around now?"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Display name</span>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.full_name ?? displayName}
                name="fullName"
                placeholder="How Frankie should address you"
                type="text"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Age range</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.age_range ?? ""}
                name="ageRange"
              >
                <option value="">Select an age range</option>
                {ageRangeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Primary goal</span>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.primary_goal ?? ""}
                name="primaryGoal"
                placeholder="Consistency, endurance, strength, recovery..."
                type="text"
              />
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Secondary goals</p>
            <CheckboxGrid
              name="secondaryGoals"
              options={secondaryGoalOptions}
              selected={selectedSecondaryGoals}
            />
          </div>
        </Section>

        <Section
          description="This tells Frankie what kind of movement fits your baseline, preferences, and setup right now."
          eyebrow="Movement"
          title="What does your training life actually look like?"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Activity level</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.activity_level ?? ""}
                name="activityLevel"
              >
                <option value="">Select your current baseline</option>
                {activityLevelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Fitness experience</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.fitness_experience ?? ""}
                name="fitnessExperience"
              >
                <option value="">Choose one</option>
                {fitnessExperienceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Current activities</span>
            <textarea
              className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
              defaultValue={(context.profile?.current_activities ?? []).join(", ")}
              name="currentActivities"
              placeholder="Walking, lifting twice a week, weekend cycling..."
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-medium">Preferred activities</p>
            <CheckboxGrid
              name="preferredActivities"
              options={movementOptions}
              selected={selectedPreferredActivities}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Available equipment</p>
            <CheckboxGrid
              name="availableEquipment"
              options={equipmentOptions}
              selected={selectedEquipment}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Training environment</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.training_environment ?? ""}
                name="trainingEnvironment"
              >
                <option value="">Choose the main environment</option>
                {trainingEnvironmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Target training days</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.target_training_days?.toString() ?? ""}
                name="targetTrainingDays"
              >
                <option value="">Choose a realistic cadence</option>
                {targetTrainingDayOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} day{option === "1" ? "" : "s"} per week
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Typical session length</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.typical_session_length?.toString() ?? ""}
                name="typicalSessionLength"
              >
                <option value="">Choose what usually fits</option>
                {sessionLengthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} minutes
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Schedule notes</span>
            <textarea
              className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
              defaultValue={scheduleNotes}
              name="preferredScheduleNotes"
              placeholder="Weekdays are easier, mornings are rough, weekends are flexible..."
            />
          </label>
        </Section>

        <Section
          description="This keeps Frankie grounded in how food, recovery, and overall strain are actually showing up for you."
          eyebrow="Food + Wellness"
          title="How should Frankie think about meals and recovery?"
        >
          <div className="space-y-3">
            <p className="text-sm font-medium">Diet preferences</p>
            <CheckboxGrid
              name="dietPreferences"
              options={dietPreferenceOptions}
              selected={selectedDietPreferences}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nutrition goal</span>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.nutrition_goal ?? ""}
                name="nutritionGoal"
                placeholder="Eat more consistently, simplify meals, recover better..."
                type="text"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Diet restrictions or allergies</span>
              <textarea
                className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
                defaultValue={(context.profile?.diet_restrictions ?? []).join(", ")}
                name="dietRestrictions"
                placeholder="Comma or line-separated is fine"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Energy baseline</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.energy_baseline ?? ""}
                name="energyBaseline"
              >
                <option value="">How has energy felt lately?</option>
                {energyBaselineOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Stress baseline</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.stress_baseline ?? ""}
                name="stressBaseline"
              >
                <option value="">How has stress felt lately?</option>
                {stressBaselineOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Wellness support focus</p>
            <CheckboxGrid
              name="wellnessSupportFocus"
              options={wellnessFocusOptions}
              selected={selectedWellnessFocus}
            />
          </div>

          <label className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 text-sm leading-6">
            <input
              className="mt-1 h-4 w-4 accent-[var(--brand)]"
              defaultChecked={context.profile?.wellness_checkin_opt_in ?? true}
              name="wellnessCheckinOptIn"
              type="checkbox"
            />
            <span>
              Frankie can keep checking in lightly on energy, stress, mood, and recovery along
              the way.
            </span>
          </label>
        </Section>

        <Section
          description="This is where you tune how Frankie sounds, what he should avoid, and what kind of support actually helps."
          eyebrow="Coaching + safety"
          title="What kind of coaching works best for you now?"
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Injuries or limitations</span>
              <textarea
                className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
                defaultValue={(context.profile?.injuries_limitations ?? []).join(", ")}
                name="injuriesLimitations"
                placeholder="Knee pain, shoulder mobility, low back tightness..."
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Health considerations</span>
              <textarea
                className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
                defaultValue={(context.profile?.health_considerations ?? []).join(", ")}
                name="healthConsiderations"
                placeholder="Anything Frankie should know before making suggestions"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Avoidances</span>
              <textarea
                className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
                defaultValue={(context.profile?.avoidances ?? []).join(", ")}
                name="avoidances"
                placeholder="Exercises, coaching language, food guidance, or patterns to avoid"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Coaching style</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.coaching_style ?? ""}
                name="coachingStyle"
              >
                <option value="">Choose the tone that helps most</option>
                {coachingStyleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Check-in style</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.preferred_checkin_style ?? ""}
                name="preferredCheckinStyle"
              >
                <option value="">Choose one</option>
                {checkinStyleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Section>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Saving here updates the coaching context Frankie uses across chat, dashboard summaries,
            and the app shell. This is the practical v1 editor, not a full settings maze.
          </p>
          <button
            className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--brand-strong)]"
            type="submit"
          >
            Save profile changes
          </button>
        </div>
      </form>
    </div>
  );
}
