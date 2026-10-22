import type { ReactNode } from "react";
import { saveProfile } from "@/app/app/(core)/profile/actions";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { ProfileSectionNav } from "@/components/profile/profile-section-nav";
import { PERSONAS } from "@/lib/ai/prompts/personas";
import {
  getInitials,
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

// Multi-select as tap-to-toggle chips: the checkbox stays in the form, the chip is its label.
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
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label className="cursor-pointer" key={option}>
          <input
            className="peer sr-only"
            defaultChecked={selected.includes(option)}
            name={name}
            type="checkbox"
            value={option}
          />
          <span className="inline-flex items-center rounded-full border border-border-strong px-3.5 py-1.5 text-sm text-muted-strong transition hover:border-foreground/40 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}

// A plain on/off row: switch on the left, explanation beside it. No box around it.
function ToggleRow({ name, defaultChecked, children }: { name: string; defaultChecked: boolean; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1 text-sm leading-6">
      <input className="peer sr-only" defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span className="relative mt-0.5 h-5 w-9 flex-none rounded-full bg-surface-contrast transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-surface after:shadow after:transition peer-checked:bg-brand peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-accent" />
      <span className="text-muted-strong">{children}</span>
    </label>
  );
}

const SECTIONS = [
  { id: "account", label: "Account" },
  { id: "goals", label: "Goals" },
  { id: "movement", label: "Movement" },
  { id: "food-wellness", label: "Food and wellness" },
  { id: "coaching", label: "Coaching" }
] as const;

function Section({
  id,
  label,
  question,
  children
}: {
  id: (typeof SECTIONS)[number]["id"];
  label: string;
  question: string;
  children: ReactNode;
}) {
  return (
    <section className="grid scroll-mt-2 gap-x-8 gap-y-4 border-t border-border py-7 md:grid-cols-[11rem_minmax(0,1fr)]" id={id}>
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em]">{label}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted">{question}</p>
      </div>
      <div className="space-y-6">{children}</div>
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid w-full max-w-5xl gap-8 pb-10 pt-1 lg:grid-cols-[11.5rem_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <ProfileSectionNav sections={SECTIONS} />
          </div>

          <div className="min-w-0">
        <div className="flex items-center gap-4 pb-6">
          <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-accent-strong text-lg font-semibold text-accent-foreground">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">{displayName}</h1>
            <p className="truncate text-sm text-muted">
              {accountLabel} · {context.profile?.primary_goal || "No primary goal yet"}
            </p>
          </div>
        </div>

        {saved ? (
          <p className="mb-6 border-l-2 border-brand pl-3 text-sm leading-6" role="status">
            Profile updated. Frankie will use it in chat, Progress, and next steps.
          </p>
        ) : null}

        {error ? (
          <p className="mb-6 border-l-2 border-danger pl-3 text-sm leading-6 text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {!context.schemaReady ? (
          <p className="mb-6 border-l-2 border-border-strong pl-3 text-sm leading-6 text-muted">
            This page becomes editable once the Supabase profile schema is available.
          </p>
        ) : null}

        <form action={saveProfile} id="profile-form">
        <Section id="account" label="Account" question="Who you are to Frankie, and how the app looks.">
          <dl className="divide-y divide-border text-sm">
            {[
              ["Email", email],
              ["Account type", accountLabel],
              ["Schedule", formatScheduleNotes(context.profile)],
              ["Safety acknowledged", yesNo(context.profile?.safety_acknowledged)]
            ].map(([label, value]) => (
              <div className="flex items-start justify-between gap-6 py-2.5 first:pt-0" key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="max-w-[22rem] break-words text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {context.profile?.onboarding_summary ? (
            <div>
              <p className="text-sm font-medium">What Frankie knows about you</p>
              <p className="mt-1.5 text-sm leading-6 text-muted">{context.profile.onboarding_summary}</p>
            </div>
          ) : null}
          <div>
            <p className="text-sm font-medium">Appearance</p>
            <p className="mt-0.5 text-sm text-muted">Cream by day, Midnight by night, or follow your device.</p>
            <ThemeToggle className="mt-3 w-full sm:w-80" />
          </div>
        </Section>

        <Section
          id="goals"
          label="Goals"
          question="What should Frankie optimize around now?"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Display name</span>
              <input
                className="ff-input"
                defaultValue={context.profile?.full_name ?? displayName}
                name="fullName"
                placeholder="How Frankie should address you"
                type="text"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Age range</span>
              <select
                className="ff-select"
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
                className="ff-input"
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
          id="movement"
          label="Movement"
          question="What does your training life actually look like?"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Activity level</span>
              <select
                className="ff-select"
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
                className="ff-select"
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
              className="ff-textarea min-h-24"
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
                className="ff-select"
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
                className="ff-select"
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
                className="ff-select"
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
              className="ff-textarea min-h-24"
              defaultValue={scheduleNotes}
              name="preferredScheduleNotes"
              placeholder="Weekdays are easier, mornings are rough, weekends are flexible..."
            />
          </label>

          <ToggleRow defaultChecked={context.profile?.strict_workout_logging ?? false} name="strictWorkoutLogging">
              For strength workouts, have Frankie draft the full exercise, set, rep, and weight
              breakdown for you to review before it&apos;s saved. Cardio and other activities
              stay logged instantly either way.
            </ToggleRow>
        </Section>

        <Section
          id="food-wellness"
          label="Food and wellness"
          question="How should Frankie think about meals and recovery?"
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
                className="ff-input"
                defaultValue={context.profile?.nutrition_goal ?? ""}
                name="nutritionGoal"
                placeholder="Eat more consistently, simplify meals, recover better..."
                type="text"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Diet restrictions or allergies</span>
              <textarea
                className="ff-textarea min-h-24"
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
                className="ff-select"
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
                className="ff-select"
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

          <ToggleRow defaultChecked={context.profile?.wellness_checkin_opt_in ?? true} name="wellnessCheckinOptIn">
              Frankie can keep checking in lightly on energy, stress, mood, and recovery along
              the way.
            </ToggleRow>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Frankie&apos;s nudges</span>
            <select
              className="ff-select"
              defaultValue={context.profile?.frankie_nudge_level ?? "polite"}
              name="frankieNudgeLevel"
            >
              <option value="polite">Polite: a gentle reminder now and then</option>
              <option value="whiny">Full whine mode: he will ask for that walk</option>
              <option value="off">Off: Frankie keeps his requests to himself</option>
            </select>
            <span className="block text-xs leading-5 text-[var(--muted)]">
              At most two a day, never before 8am or after 9pm.
            </span>
          </label>
        </Section>

        <Section
          id="coaching"
          label="Coaching"
          question="What kind of coaching works best for you now?"
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Injuries or limitations</span>
              <textarea
                className="ff-textarea min-h-24"
                defaultValue={(context.profile?.injuries_limitations ?? []).join(", ")}
                name="injuriesLimitations"
                placeholder="Knee pain, shoulder mobility, low back tightness..."
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Health considerations</span>
              <textarea
                className="ff-textarea min-h-24"
                defaultValue={(context.profile?.health_considerations ?? []).join(", ")}
                name="healthConsiderations"
                placeholder="Anything Frankie should know before making suggestions"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Avoidances</span>
              <textarea
                className="ff-textarea min-h-24"
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
                className="ff-select"
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
              <span className="text-sm font-medium">Coach persona</span>
              <select
                className="ff-select"
                defaultValue={context.profile?.coach_persona ?? ""}
                name="coachPersona"
              >
                <option value="">Default Frankie voice</option>
                {PERSONAS.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Check-in style</span>
              <select
                className="ff-select"
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
        </form>
          </div>
        </div>
      </div>

      <div className="-mx-4 -mb-4 shrink-0 border-t border-border bg-background/95 px-5 py-3 backdrop-blur-xl sm:-mx-5 sm:-mb-4">
        <div className="flex w-full max-w-5xl items-center justify-between gap-4">
          <p className="hidden text-sm text-muted sm:block">Changes apply to chat, Progress, and Frankie&apos;s nudges.</p>
          <button className="ff-button-primary ml-auto px-5 py-2.5 text-sm" form="profile-form" type="submit">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
