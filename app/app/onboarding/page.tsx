import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { saveOnboarding } from "@/app/app/onboarding/actions";
import { getCurrentAppContext, getDisplayName } from "@/lib/profile";

type OnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export default async function OnboardingPage({
  searchParams
}: OnboardingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = getSearchParam(resolvedSearchParams.error);
  const context = await getCurrentAppContext();

  if (!context.user) {
    redirect("/login?message=Log%20in%20to%20continue.");
  }

  if (context.schemaReady && context.profile?.onboarding_completed) {
    redirect("/app/chat");
  }

  const displayName = getDisplayName(context.user, context.profile);
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
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
          Onboarding
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Frankie needs a quick read on who {displayName} is and what matters
          most right now.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          I am Frankie. I can help you stay on top of exercise, food, and overall
          wellness without turning everything into a full-time tracking job. This
          first pass should take about three to five minutes.
        </p>
      </header>

      {error ? (
        <div className="rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--accent)_55%,var(--border)_45%)] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface)_88%)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
          {error}
        </div>
      ) : null}

      {!context.schemaReady ? (
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
            Database setup needed
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            The onboarding flow is built, but your Supabase project is missing the
            `profiles` table it saves into.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Run the SQL in
            <span className="font-medium text-[var(--foreground)]">
              {" "}
              `supabase/migrations/20260419173000_initial_schema.sql`
            </span>{" "}
            inside the Supabase SQL Editor, then refresh this page. Once that
            migration is applied, Frankie can save onboarding answers and route new
            users here automatically.
          </p>
        </section>
      ) : (
        <form action={saveOnboarding} className="space-y-6">
          <input defaultValue={displayName} name="fullName" type="hidden" />

          <Section
            description="Enough context to make Frankie useful on day one, without turning this into a giant intake form."
            eyebrow="Goals"
            title="What are you here to improve?"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Age range</span>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={context.profile?.age_range ?? ""}
                  name="ageRange"
                >
                  <option value="">Select an age range</option>
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55-64">55-64</option>
                  <option value="65+">65+</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Primary goal</span>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={context.profile?.primary_goal ?? ""}
                  name="primaryGoal"
                  placeholder="Consistency, endurance, body composition, energy..."
                  required
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
            description="Frankie just needs a realistic read on your current baseline, not a perfect training log."
            eyebrow="Baseline"
            title="Where are you starting from?"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Activity level</span>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={context.profile?.activity_level ?? ""}
                  name="activityLevel"
                  required
                >
                  <option value="">Select your current baseline</option>
                  <option value="Mostly sedentary">Mostly sedentary</option>
                  <option value="Lightly active">Lightly active</option>
                  <option value="Moderately active">Moderately active</option>
                  <option value="Consistently active">Consistently active</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Fitness experience</span>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={context.profile?.fitness_experience ?? ""}
                  name="fitnessExperience"
                  required
                >
                  <option value="">Choose one</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Getting back into it">Getting back into it</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Experienced">Experienced</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Current activities</span>
              <textarea
                className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
                defaultValue={(context.profile?.current_activities ?? []).join(", ")}
                name="currentActivities"
                placeholder="Walking, lifting twice a week, the occasional run..."
              />
            </label>
          </Section>

          <Section
            description="This is where Frankie starts learning what kinds of movement fit your preferences and your setup."
            eyebrow="Movement"
            title="What kinds of training should Frankie lean into?"
          >
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

            <label className="block space-y-2">
              <span className="text-sm font-medium">Training environment</span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                defaultValue={context.profile?.training_environment ?? ""}
                name="trainingEnvironment"
                required
              >
                <option value="">Choose the main environment</option>
                <option value="Gym">Gym</option>
                <option value="Home">Home</option>
                <option value="Outdoors">Outdoors</option>
                <option value="Classes">Classes</option>
                <option value="Mix">Mix of environments</option>
              </select>
            </label>
          </Section>

          <Section
            description="Frankie should plan around your real life, not an idealized week."
            eyebrow="Schedule"
            title="What can your routine realistically support?"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Target training days</span>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={
                    context.profile?.target_training_days?.toString() ?? ""
                  }
                  name="targetTrainingDays"
                >
                  <option value="">Choose a realistic cadence</option>
                  <option value="1">1 day per week</option>
                  <option value="2">2 days per week</option>
                  <option value="3">3 days per week</option>
                  <option value="4">4 days per week</option>
                  <option value="5">5 days per week</option>
                  <option value="6">6 days per week</option>
                  <option value="7">7 days per week</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Typical session length</span>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={
                    context.profile?.typical_session_length?.toString() ?? ""
                  }
                  name="typicalSessionLength"
                >
                  <option value="">Choose what usually fits</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
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
            description="Just enough nutrition and wellness context to make Frankie more relevant without turning this into calorie accounting."
            eyebrow="Food + Wellness"
            title="How should Frankie think about food, stress, and recovery?"
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
                  <option value="Low">Low</option>
                  <option value="Up and down">Up and down</option>
                  <option value="Steady">Steady</option>
                  <option value="Strong">Strong</option>
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
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                  <option value="Very high">Very high</option>
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
                Frankie can check in lightly on energy, stress, mood, and recovery
                along the way.
              </span>
            </label>
          </Section>

          <Section
            description="This is the required safety context. Frankie should know enough to avoid obviously bad guidance."
            eyebrow="Safety + Style"
            title="What should Frankie avoid, and what kind of coaching helps most?"
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Injuries or limitations</span>
                <textarea
                  className="min-h-24 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={(context.profile?.injuries_limitations ?? []).join(", ")}
                  name="injuriesLimitations"
                  placeholder="Knee pain, low back tightness, shoulder mobility..."
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
                  required
                >
                  <option value="">Choose the tone that helps most</option>
                  <option value="Gentle and steady">Gentle and steady</option>
                  <option value="Direct but warm">Direct but warm</option>
                  <option value="Motivating">Motivating</option>
                  <option value="Analytical">Analytical</option>
                  <option value="Balanced mix">Balanced mix</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Check-in style</span>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  defaultValue={context.profile?.preferred_checkin_style ?? ""}
                  name="preferredCheckinStyle"
                  required
                >
                  <option value="">Choose one</option>
                  <option value="Quick check-ins">Quick check-ins</option>
                  <option value="Weekly reflection">Weekly reflection</option>
                  <option value="Both">Both</option>
                </select>
              </label>
            </div>

            <label className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 text-sm leading-6">
              <input
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
                defaultChecked={context.profile?.safety_acknowledged ?? false}
                name="safetyAcknowledged"
                required
                type="checkbox"
              />
              <span>
                Frankie Fit provides wellness guidance and coaching support, not
                medical or clinical care.
              </span>
            </label>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              After this, Frankie will summarize what he learned, suggest a first
              focus for the week, and point you toward one concrete next action.
            </p>
            <button
              className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--brand-strong)]"
              type="submit"
            >
              Finish onboarding
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
