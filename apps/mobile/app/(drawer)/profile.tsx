import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton, Screen, ScreenTitle, ScrollCard } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import { useAuth } from '@/lib/auth-context';
import {
  AppProfile,
  formatList,
  formatScheduleNotes,
  getAccountLabel,
  getDisplayName,
  loadProfile,
} from '@/lib/profile-data';
import { supabase } from '@/lib/supabase';

const APPLE_HEALTH_ROUTE = '/health' as Parameters<typeof router.push>[0];

function yesNo(value: boolean | null | undefined) {
  return value ? 'Yes' : 'No';
}

function SummaryPill({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ProfileSection({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <ScrollCard>
      <Text style={styles.kicker}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.stack}>{children}</View>
    </ScrollCard>
  );
}

export default function ProfileScreen() {
  const { refreshProfile, session, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const email = session?.user.email ?? 'Signed in';
  const displayName = getDisplayName(session?.user ?? null, profile);
  const accountLabel = getAccountLabel(profile?.role === 'admin' ? 'admin' : profile?.account_type);

  const loadProfileForScreen = useCallback(async () => {
    if (!session) {
      return;
    }

    setError(null);
    const result = await loadProfile(session.user.id);
    setProfile(result.profile);
    setError(result.error);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function run() {
        setIsLoading(true);
        await loadProfileForScreen();
        if (mounted) {
          setIsLoading(false);
        }
      }

      run();

      return () => {
        mounted = false;
      };
    }, [loadProfileForScreen])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadProfileForScreen();
    setIsRefreshing(false);
  }

  async function restartOnboarding() {
    if (!session) {
      return;
    }

    setIsRestarting(true);
    const { error: restartError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: false,
      })
      .eq('id', session.user.id);
    setIsRestarting(false);

    if (restartError) {
      Alert.alert('Could not restart onboarding', restartError.message);
      return;
    }

    await refreshProfile();
    router.replace('/onboarding');
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={colors.accentStrong} onRefresh={handleRefresh} />}>
        <ScreenTitle title="Profile" subtitle="The context Frankie uses to coach you across chat and dashboard." />

        {isLoading && !profile ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentStrong} />
          </View>
        ) : null}

        {error ? (
          <ScrollCard style={styles.errorCard}>
            <Text style={styles.bodyText}>{error}</Text>
          </ScrollCard>
        ) : null}

        <ScrollCard style={styles.summaryCard}>
          <Text style={styles.kicker}>Profile summary</Text>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.pillWrap}>
            <SummaryPill>{accountLabel}</SummaryPill>
            <SummaryPill>Primary goal: {profile?.primary_goal || 'Not set yet'}</SummaryPill>
          </View>
          <Text style={styles.bodyText}>
            {profile?.onboarding_summary ||
              'Frankie will keep this summary updated as your goals and preferences change.'}
          </Text>
        </ScrollCard>

        <ScrollCard>
          <Text style={styles.kicker}>Account details</Text>
          <View style={styles.stack}>
            <DetailRow label="Email" value={email} />
            <DetailRow label="Account type" value={accountLabel} />
            <DetailRow label="Schedule notes" value={formatScheduleNotes(profile)} />
            <DetailRow label="Safety acknowledged" value={yesNo(profile?.safety_acknowledged)} />
          </View>
        </ScrollCard>

        <ProfileSection eyebrow="Goals" title="What Frankie is optimizing around">
          <DetailRow label="Age range" value={profile?.age_range ?? 'Not set yet'} />
          <DetailRow label="Primary goal" value={profile?.primary_goal ?? 'Not set yet'} />
          <DetailRow label="Secondary goals" value={formatList(profile?.secondary_goals)} />
        </ProfileSection>

        <ProfileSection eyebrow="Movement" title="Training baseline and setup">
          <DetailRow label="Activity level" value={profile?.activity_level ?? 'Not set yet'} />
          <DetailRow label="Experience" value={profile?.fitness_experience ?? 'Not set yet'} />
          <DetailRow label="Current activities" value={formatList(profile?.current_activities)} />
          <DetailRow label="Preferred activities" value={formatList(profile?.preferred_activities)} />
          <DetailRow label="Equipment" value={formatList(profile?.available_equipment)} />
          <DetailRow label="Environment" value={profile?.training_environment ?? 'Not set yet'} />
          <DetailRow
            label="Weekly cadence"
            value={profile?.target_training_days ? `${profile.target_training_days} days` : 'Not set yet'}
          />
          <DetailRow
            label="Session length"
            value={profile?.typical_session_length ? `${profile.typical_session_length} minutes` : 'Not set yet'}
          />
        </ProfileSection>

        <ProfileSection eyebrow="Food + Wellness" title="Nutrition, stress, and recovery context">
          <DetailRow label="Diet preferences" value={formatList(profile?.diet_preferences)} />
          <DetailRow label="Nutrition goal" value={profile?.nutrition_goal ?? 'Not set yet'} />
          <DetailRow label="Diet restrictions" value={formatList(profile?.diet_restrictions)} />
          <DetailRow label="Energy baseline" value={profile?.energy_baseline ?? 'Not set yet'} />
          <DetailRow label="Stress baseline" value={profile?.stress_baseline ?? 'Not set yet'} />
          <DetailRow label="Support focus" value={formatList(profile?.wellness_support_focus)} />
          <DetailRow label="Wellness check-ins" value={yesNo(profile?.wellness_checkin_opt_in)} />
        </ProfileSection>

        <ProfileSection eyebrow="Safety + Style" title="Limits and coaching preferences">
          <DetailRow label="Injuries or limitations" value={formatList(profile?.injuries_limitations)} />
          <DetailRow label="Health considerations" value={formatList(profile?.health_considerations)} />
          <DetailRow label="Avoidances" value={formatList(profile?.avoidances)} />
          <DetailRow label="Coaching style" value={profile?.coaching_style ?? 'Not set yet'} />
          <DetailRow label="Check-in style" value={profile?.preferred_checkin_style ?? 'Not set yet'} />
        </ProfileSection>

        <ScrollCard style={styles.healthCard}>
          <Text style={styles.kicker}>Apple Health</Text>
          <Text style={styles.sectionTitle}>Read-only workout import</Text>
          <Text style={styles.bodyText}>
            Connect HealthKit from a development build to preview recent workouts and heart-rate context.
          </Text>
          <Pressable onPress={() => router.push(APPLE_HEALTH_ROUTE)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Open Apple Health setup</Text>
          </Pressable>
        </ScrollCard>

        <Pressable onPress={() => router.push('/onboarding')} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit profile context</Text>
        </Pressable>

        <PrimaryButton loading={isRestarting} onPress={restartOnboarding}>
          Restart onboarding
        </PrimaryButton>
        <PrimaryButton onPress={signOut}>Sign out</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  summaryCard: {
    backgroundColor: colors.panelStrong,
  },
  errorCard: {
    borderColor: colors.danger,
  },
  healthCard: {
    backgroundColor: colors.panelStrong,
  },
  kicker: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  displayName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  bodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  pillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  stack: {
    gap: 12,
  },
  detailRow: {
    gap: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  detailLabel: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  editButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentStrong,
    borderRadius: 14,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: colors.accentStrong,
    fontSize: 16,
    fontWeight: '800',
  },
});
