"use client";

const DEFAULT_SINGLE_VALUES: Record<string, string> = {
  ageRange: "25-34",
  primaryGoal: "General fitness",
  activityLevel: "Moderately active",
  fitnessExperience: "Intermediate",
  trainingEnvironment: "Home",
  targetTrainingDays: "3",
  typicalSessionLength: "45",
  energyBaseline: "Steady",
  stressBaseline: "Moderate",
  coachingStyle: "Balanced mix",
  preferredCheckinStyle: "Quick check-ins"
};

const DEFAULT_CHECKBOX_GROUPS: Record<string, string[]> = {
  secondaryGoals: ["General health"],
  preferredActivities: ["Lifting"],
  availableEquipment: ["Bodyweight only"],
  dietPreferences: [],
  wellnessSupportFocus: []
};

function applyDefaults(form: HTMLFormElement) {
  for (const [name, value] of Object.entries(DEFAULT_SINGLE_VALUES)) {
    const field = form.elements.namedItem(name);

    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
      field.value = value;
    }
  }

  for (const [name, values] of Object.entries(DEFAULT_CHECKBOX_GROUPS)) {
    form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((checkbox) => {
      checkbox.checked = values.includes(checkbox.value);
    });
  }

  const safety = form.elements.namedItem("safetyAcknowledged");
  if (safety instanceof HTMLInputElement) {
    safety.checked = true;
  }

  const wellnessCheckin = form.elements.namedItem("wellnessCheckinOptIn");
  if (wellnessCheckin instanceof HTMLInputElement) {
    wellnessCheckin.checked = true;
  }
}

export function DefaultProfileToggle() {
  return (
    <label className="flex items-center gap-3 rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--brand)_55%,var(--border)_45%)] bg-[color:color-mix(in_srgb,var(--brand)_10%,var(--surface-strong)_90%)] px-4 py-3 text-sm">
      <input
        className="h-4 w-4 accent-[var(--brand)]"
        onChange={(event) => {
          const form = event.target.form;
          if (!form) return;

          const sections = form.querySelector<HTMLElement>("#onboarding-sections");

          if (event.target.checked) {
            applyDefaults(form);
            sections?.classList.add("hidden");
          } else {
            sections?.classList.remove("hidden");
          }
        }}
        type="checkbox"
      />
      <span>
        <span className="font-medium">Default</span> — fill in a basic profile
        automatically so you can submit right away.
      </span>
    </label>
  );
}
