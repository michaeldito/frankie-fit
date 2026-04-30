import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LoadingScreen, PrimaryButton, Screen, ScreenTitle, ScrollCard } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type SelectOption = {
  label: string;
  value: string;
};

type ProfileOnboardingRow = {
  activity_level: string | null;
  age_range: string | null;
  available_equipment: string[] | null;
  avoidances: string[] | null;
  coaching_style: string | null;
  current_activities: string[] | null;
  diet_preferences: string[] | null;
  diet_restrictions: string[] | null;
  energy_baseline: string | null;
  fitness_experience: string | null;
  full_name: string | null;
  health_considerations: string[] | null;
  injuries_limitations: string[] | null;
  nutrition_goal: string | null;
  onboarding_completed: boolean | null;
  preferred_activities: string[] | null;
  preferred_checkin_style: string | null;
  preferred_schedule: { notes?: string } | null;
  primary_goal: string | null;
  safety_acknowledged: boolean | null;
  secondary_goals: string[] | null;
  stress_baseline: string | null;
  target_training_days: number | null;
  training_environment: string | null;
  typical_session_length: number | null;
  wellness_checkin_opt_in: boolean | null;
  wellness_support_focus: string[] | null;
};

const secondaryGoalOptions = [
  'Performance',
  'Body composition',
  'Energy',
  'Stress',
  'General health',
  'Recovery',
];

const movementOptions = [
  'Lifting',
  'Running',
  'Walking',
  'Cycling',
  'Yoga',
  'Mobility',
  'Classes',
  'Sports',
];

const equipmentOptions = [
  'Full gym',
  'Dumbbells',
  'Kettlebells',
  'Resistance bands',
  'Cardio machines',
  'Bodyweight only',
];

const dietPreferenceOptions = [
  'High-protein',
  'Vegetarian',
  'Vegan',
  'Mediterranean',
  'Low-carb',
  'Flexible',
];

const wellnessFocusOptions = [
  'Recovery',
  'Motivation',
  'Stress',
  'Energy',
  'Consistency',
  'Mental clarity',
];

const ageRangeOptions = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
  'Prefer not to say',
];

const activityLevelOptions = [
  'Mostly sedentary',
  'Lightly active',
  'Moderately active',
  'Consistently active',
];

const fitnessExperienceOptions = [
  'Beginner',
  'Getting back into it',
  'Intermediate',
  'Experienced',
];

const trainingEnvironmentOptions: SelectOption[] = [
  { label: 'Gym', value: 'Gym' },
  { label: 'Home', value: 'Home' },
  { label: 'Outdoors', value: 'Outdoors' },
  { label: 'Classes', value: 'Classes' },
  { label: 'Mix of environments', value: 'Mix' },
];

const targetTrainingDaysOptions: SelectOption[] = Array.from({ length: 7 }, (_value, index) => {
  const dayCount = index + 1;
  return {
    label: `${dayCount} day${dayCount === 1 ? '' : 's'} per week`,
    value: `${dayCount}`,
  };
});

const typicalSessionLengthOptions: SelectOption[] = [15, 30, 45, 60, 90].map((minutes) => ({
  label: `${minutes} minutes`,
  value: `${minutes}`,
}));

const energyBaselineOptions = ['Low', 'Up and down', 'Steady', 'Strong'];
const stressBaselineOptions = ['Low', 'Moderate', 'High', 'Very high'];

const coachingStyleOptions = [
  'Gentle and steady',
  'Direct but warm',
  'Motivating',
  'Analytical',
  'Balanced mix',
];

const checkinStyleOptions = ['Quick check-ins', 'Weekly reflection', 'Both'];

function normalizeOptions(options: (string | SelectOption)[]): SelectOption[] {
  return options.map((option) =>
    typeof option === 'string'
      ? {
          label: option,
          value: option,
        }
      : option
  );
}

function parseTextList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function formatTextList(value: unknown) {
  return asStringArray(value).join(', ');
}

function getScheduleNotes(value: unknown) {
  if (value && typeof value === 'object' && 'notes' in value) {
    return asString((value as { notes?: unknown }).notes);
  }

  return '';
}

function getMetadataName(value: unknown) {
  if (value && typeof value === 'object' && 'full_name' in value) {
    return asString((value as { full_name?: unknown }).full_name);
  }

  return '';
}

function buildCoachingSummary(input: {
  activityLevel: string | null | undefined;
  coachingStyle: string | null | undefined;
  nutritionGoal: string | null | undefined;
  preferredActivities: string[] | null | undefined;
  primaryGoal: string | null | undefined;
  targetTrainingDays: number | null | undefined;
}) {
  const primaryGoal = input.primaryGoal?.trim() || 'building more consistency';
  const activityLevel = input.activityLevel?.trim() || 'where you are right now';
  const activities =
    input.preferredActivities && input.preferredActivities.length > 0
      ? input.preferredActivities.slice(0, 2).join(' and ')
      : 'whatever movement fits your life';
  const coachingStyle = input.coachingStyle?.trim() || 'balanced';
  const trainingDays =
    input.targetTrainingDays && input.targetTrainingDays > 0
      ? `${input.targetTrainingDays} day${input.targetTrainingDays === 1 ? '' : 's'} per week`
      : 'a realistic weekly rhythm';
  const nutritionGoal = input.nutritionGoal?.trim()
    ? `keep food guidance pointed at ${input.nutritionGoal.toLowerCase()}`
    : 'keep food guidance practical';

  return `You want to focus on ${primaryGoal.toLowerCase()}, you are coming in ${activityLevel.toLowerCase()}, and you enjoy ${activities}. I will coach with a ${coachingStyle.toLowerCase()} tone, build around ${trainingDays}, and ${nutritionGoal}.`;
}

function Section({
  children,
  eyebrow,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <ScrollCard>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </ScrollCard>
  );
}

function Field({
  label,
  multiline,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        returnKeyType={multiline ? 'default' : 'next'}
        style={[styles.input, multiline && styles.textarea]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

function SingleSelect({
  label,
  onChange,
  options,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  required?: boolean;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.choiceWrap}>
        {normalizeOptions(options).map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(selected && !required ? '' : option.value)}
              style={[styles.choice, selected && styles.choiceSelected]}>
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MultiSelect({
  label,
  onChange,
  options,
  values,
}: {
  label: string;
  onChange: (value: string[]) => void;
  options: string[];
  values: string[];
}) {
  function toggle(option: string) {
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option]);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceWrap}>
        {options.map((option) => {
          const selected = values.includes(option);

          return (
            <Pressable
              key={option}
              onPress={() => toggle(option)}
              style={[styles.choice, selected && styles.choiceSelected]}>
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={[styles.toggle, value && styles.toggleSelected]}>
      <View style={[styles.checkbox, value && styles.checkboxSelected]}>
        {value ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.toggleText}>{label}</Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { refreshProfile, session } = useAuth();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState('');
  const [fitnessExperience, setFitnessExperience] = useState('');
  const [currentActivities, setCurrentActivities] = useState('');
  const [preferredActivities, setPreferredActivities] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [trainingEnvironment, setTrainingEnvironment] = useState('');
  const [targetTrainingDays, setTargetTrainingDays] = useState('');
  const [typicalSessionLength, setTypicalSessionLength] = useState('');
  const [preferredScheduleNotes, setPreferredScheduleNotes] = useState('');
  const [dietPreferences, setDietPreferences] = useState<string[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState('');
  const [dietRestrictions, setDietRestrictions] = useState('');
  const [energyBaseline, setEnergyBaseline] = useState('');
  const [stressBaseline, setStressBaseline] = useState('');
  const [wellnessSupportFocus, setWellnessSupportFocus] = useState<string[]>([]);
  const [wellnessCheckinOptIn, setWellnessCheckinOptIn] = useState(true);
  const [injuriesLimitations, setInjuriesLimitations] = useState('');
  const [healthConsiderations, setHealthConsiderations] = useState('');
  const [avoidances, setAvoidances] = useState('');
  const [coachingStyle, setCoachingStyle] = useState('');
  const [preferredCheckinStyle, setPreferredCheckinStyle] = useState('');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [isProfileEdit, setIsProfileEdit] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!session) {
        return;
      }

      setIsLoadingProfile(true);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          [
            'full_name',
            'age_range',
            'primary_goal',
            'secondary_goals',
            'activity_level',
            'fitness_experience',
            'current_activities',
            'preferred_activities',
            'available_equipment',
            'training_environment',
            'target_training_days',
            'typical_session_length',
            'preferred_schedule',
            'diet_preferences',
            'diet_restrictions',
            'nutrition_goal',
            'energy_baseline',
            'stress_baseline',
            'wellness_support_focus',
            'wellness_checkin_opt_in',
            'injuries_limitations',
            'health_considerations',
            'avoidances',
            'coaching_style',
            'preferred_checkin_style',
            'safety_acknowledged',
            'onboarding_completed',
          ].join(', ')
        )
        .eq('id', session.user.id)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (error) {
        Alert.alert('Could not load onboarding', error.message);
      }

      const profile = data as ProfileOnboardingRow | null;

      setFullName(
        asString(profile?.full_name) ||
          getMetadataName(session.user.user_metadata) ||
          session.user.email?.split('@')[0] ||
          ''
      );
      setAgeRange(asString(profile?.age_range));
      setPrimaryGoal(asString(profile?.primary_goal));
      setSecondaryGoals(asStringArray(profile?.secondary_goals));
      setActivityLevel(asString(profile?.activity_level));
      setFitnessExperience(asString(profile?.fitness_experience));
      setCurrentActivities(formatTextList(profile?.current_activities));
      setPreferredActivities(asStringArray(profile?.preferred_activities));
      setAvailableEquipment(asStringArray(profile?.available_equipment));
      setTrainingEnvironment(asString(profile?.training_environment));
      setTargetTrainingDays(profile?.target_training_days ? String(profile.target_training_days) : '');
      setTypicalSessionLength(profile?.typical_session_length ? String(profile.typical_session_length) : '');
      setPreferredScheduleNotes(getScheduleNotes(profile?.preferred_schedule));
      setDietPreferences(asStringArray(profile?.diet_preferences));
      setDietRestrictions(formatTextList(profile?.diet_restrictions));
      setNutritionGoal(asString(profile?.nutrition_goal));
      setEnergyBaseline(asString(profile?.energy_baseline));
      setStressBaseline(asString(profile?.stress_baseline));
      setWellnessSupportFocus(asStringArray(profile?.wellness_support_focus));
      setWellnessCheckinOptIn(profile?.wellness_checkin_opt_in !== false);
      setInjuriesLimitations(formatTextList(profile?.injuries_limitations));
      setHealthConsiderations(formatTextList(profile?.health_considerations));
      setAvoidances(formatTextList(profile?.avoidances));
      setCoachingStyle(asString(profile?.coaching_style));
      setPreferredCheckinStyle(asString(profile?.preferred_checkin_style));
      setSafetyAcknowledged(Boolean(profile?.safety_acknowledged));
      setIsProfileEdit(Boolean(profile?.onboarding_completed));
      setIsLoadingProfile(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session]);

  const isReady = useMemo(
    () =>
      Boolean(
        primaryGoal &&
          activityLevel &&
          fitnessExperience &&
          trainingEnvironment &&
          coachingStyle &&
          preferredCheckinStyle &&
          safetyAcknowledged
      ),
    [
      activityLevel,
      coachingStyle,
      fitnessExperience,
      preferredCheckinStyle,
      primaryGoal,
      safetyAcknowledged,
      trainingEnvironment,
    ]
  );

  if (!session) {
    return <Redirect href="/login" />;
  }

  async function handleFinishSetup() {
    if (!session || !isReady) {
      Alert.alert(
        'A little more context',
        'Fill out the required onboarding questions and acknowledge the wellness note.'
      );
      return;
    }

    const parsedTargetTrainingDays = targetTrainingDays ? Number.parseInt(targetTrainingDays, 10) : null;
    const parsedTypicalSessionLength = typicalSessionLength
      ? Number.parseInt(typicalSessionLength, 10)
      : null;

    setIsSubmitting(true);
    const { error } = await supabase.from('profiles').upsert(
      {
        id: session.user.id,
        full_name: fullName || null,
        age_range: ageRange || null,
        primary_goal: primaryGoal,
        secondary_goals: secondaryGoals,
        activity_level: activityLevel,
        fitness_experience: fitnessExperience,
        current_activities: parseTextList(currentActivities),
        preferred_activities: preferredActivities,
        available_equipment: availableEquipment,
        training_environment: trainingEnvironment,
        target_training_days: parsedTargetTrainingDays,
        typical_session_length: parsedTypicalSessionLength,
        preferred_schedule: preferredScheduleNotes ? { notes: preferredScheduleNotes } : {},
        diet_preferences: dietPreferences,
        diet_restrictions: parseTextList(dietRestrictions),
        nutrition_goal: nutritionGoal || null,
        energy_baseline: energyBaseline || null,
        stress_baseline: stressBaseline || null,
        wellness_support_focus: wellnessSupportFocus,
        wellness_checkin_opt_in: wellnessCheckinOptIn,
        injuries_limitations: parseTextList(injuriesLimitations),
        health_considerations: parseTextList(healthConsiderations),
        avoidances: parseTextList(avoidances),
        coaching_style: coachingStyle,
        preferred_checkin_style: preferredCheckinStyle,
        safety_acknowledged: true,
        onboarding_completed: true,
        onboarding_summary: buildCoachingSummary({
          primaryGoal,
          activityLevel,
          preferredActivities,
          coachingStyle,
          targetTrainingDays: parsedTargetTrainingDays,
          nutritionGoal,
        }),
      },
      {
        onConflict: 'id',
      }
    );
    setIsSubmitting(false);

    if (error) {
      Alert.alert(isProfileEdit ? 'Could not save profile' : 'Could not finish onboarding', error.message);
      return;
    }

    await refreshProfile();
    router.replace(isProfileEdit ? '/profile' : '/chat');
  }

  if (isLoadingProfile) {
    return <LoadingScreen />;
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        keyboardVerticalOffset={12}
        style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled">
          <ScreenTitle
            title={isProfileEdit ? 'Edit profile' : 'Set up Frankie'}
            subtitle={
              isProfileEdit
                ? 'Save the context Frankie uses across chat and dashboard.'
                : 'Give Frankie a quick read on what matters most right now.'
            }
          />

          <Section
            eyebrow="Goals"
            subtitle="Enough context to make Frankie useful on day one."
            title="What are you here to improve?">
            <SingleSelect label="Age range" onChange={setAgeRange} options={ageRangeOptions} value={ageRange} />
            <Field
              label="Primary goal *"
              onChangeText={setPrimaryGoal}
              placeholder="Consistency, endurance, body composition, energy..."
              value={primaryGoal}
            />
            <MultiSelect
              label="Secondary goals"
              onChange={setSecondaryGoals}
              options={secondaryGoalOptions}
              values={secondaryGoals}
            />
          </Section>

          <Section
            eyebrow="Baseline"
            subtitle="A realistic read on your current activity level."
            title="Where are you starting from?">
            <SingleSelect
              label="Activity level"
              onChange={setActivityLevel}
              options={activityLevelOptions}
              required
              value={activityLevel}
            />
            <SingleSelect
              label="Fitness experience"
              onChange={setFitnessExperience}
              options={fitnessExperienceOptions}
              required
              value={fitnessExperience}
            />
            <Field
              label="Current activities"
              multiline
              onChangeText={setCurrentActivities}
              placeholder="Walking, lifting twice a week, the occasional run..."
              value={currentActivities}
            />
          </Section>

          <Section
            eyebrow="Movement"
            subtitle="The kinds of training Frankie should lean into."
            title="What fits your preferences and setup?">
            <MultiSelect
              label="Preferred activities"
              onChange={setPreferredActivities}
              options={movementOptions}
              values={preferredActivities}
            />
            <MultiSelect
              label="Available equipment"
              onChange={setAvailableEquipment}
              options={equipmentOptions}
              values={availableEquipment}
            />
            <SingleSelect
              label="Training environment"
              onChange={setTrainingEnvironment}
              options={trainingEnvironmentOptions}
              required
              value={trainingEnvironment}
            />
          </Section>

          <Section
            eyebrow="Schedule"
            subtitle="Frankie should plan around your real week."
            title="What can your routine support?">
            <SingleSelect
              label="Target training days"
              onChange={setTargetTrainingDays}
              options={targetTrainingDaysOptions}
              value={targetTrainingDays}
            />
            <SingleSelect
              label="Typical session length"
              onChange={setTypicalSessionLength}
              options={typicalSessionLengthOptions}
              value={typicalSessionLength}
            />
            <Field
              label="Schedule notes"
              multiline
              onChangeText={setPreferredScheduleNotes}
              placeholder="Weekdays are easier, mornings are rough, weekends are flexible..."
              value={preferredScheduleNotes}
            />
          </Section>

          <Section
            eyebrow="Food + Wellness"
            subtitle="Nutrition and recovery context without calorie accounting."
            title="How should Frankie think about food, stress, and recovery?">
            <MultiSelect
              label="Diet preferences"
              onChange={setDietPreferences}
              options={dietPreferenceOptions}
              values={dietPreferences}
            />
            <Field
              label="Nutrition goal"
              onChangeText={setNutritionGoal}
              placeholder="Eat more consistently, simplify meals, recover better..."
              value={nutritionGoal}
            />
            <Field
              label="Diet restrictions or allergies"
              multiline
              onChangeText={setDietRestrictions}
              placeholder="Comma or line-separated is fine"
              value={dietRestrictions}
            />
            <SingleSelect
              label="Energy baseline"
              onChange={setEnergyBaseline}
              options={energyBaselineOptions}
              value={energyBaseline}
            />
            <SingleSelect
              label="Stress baseline"
              onChange={setStressBaseline}
              options={stressBaselineOptions}
              value={stressBaseline}
            />
            <MultiSelect
              label="Wellness support focus"
              onChange={setWellnessSupportFocus}
              options={wellnessFocusOptions}
              values={wellnessSupportFocus}
            />
            <ToggleRow
              label="Frankie can check in lightly on energy, stress, mood, and recovery along the way."
              onChange={setWellnessCheckinOptIn}
              value={wellnessCheckinOptIn}
            />
          </Section>

          <Section
            eyebrow="Safety + Style"
            subtitle="The required safety context and the tone that helps most."
            title="What should Frankie avoid?">
            <Field
              label="Injuries or limitations"
              multiline
              onChangeText={setInjuriesLimitations}
              placeholder="Knee pain, low back tightness, shoulder mobility..."
              value={injuriesLimitations}
            />
            <Field
              label="Health considerations"
              multiline
              onChangeText={setHealthConsiderations}
              placeholder="Anything Frankie should know before making suggestions"
              value={healthConsiderations}
            />
            <Field
              label="Avoidances"
              multiline
              onChangeText={setAvoidances}
              placeholder="Exercises, coaching language, food guidance, or patterns to avoid"
              value={avoidances}
            />
            <SingleSelect
              label="Coaching style"
              onChange={setCoachingStyle}
              options={coachingStyleOptions}
              required
              value={coachingStyle}
            />
            <SingleSelect
              label="Check-in style"
              onChange={setPreferredCheckinStyle}
              options={checkinStyleOptions}
              required
              value={preferredCheckinStyle}
            />
            <ToggleRow
              label="Frankie Fit provides wellness guidance and coaching support, not medical or clinical care."
              onChange={setSafetyAcknowledged}
              value={safetyAcknowledged}
            />
          </Section>

          <PrimaryButton disabled={!isReady} loading={isSubmitting} onPress={handleFinishSetup}>
            {isProfileEdit ? 'Save profile changes' : 'Finish onboarding'}
          </PrimaryButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  eyebrow: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionBody: {
    gap: 18,
    paddingTop: 6,
  },
  field: {
    gap: 10,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  required: {
    color: colors.accentStrong,
  },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.backgroundSoft,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  textarea: {
    minHeight: 102,
    paddingTop: 13,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  choiceSelected: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentStrong,
  },
  choiceText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: colors.background,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.backgroundSoft,
    padding: 15,
  },
  toggleSelected: {
    borderColor: colors.accentStrong,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 7,
  },
  checkboxSelected: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentStrong,
  },
  checkmark: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '900',
  },
  toggleText: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
