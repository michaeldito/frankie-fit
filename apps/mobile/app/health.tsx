import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton, Screen, ScreenTitle, ScrollCard } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import {
  AppleHealthPreview,
  AppleHealthRuntimeStatus,
  getAppleHealthRuntimeStatus,
  loadAppleHealthPreview,
  requestAppleHealthReadAccess,
} from '@/lib/apple-health';

function StatusPill({ tone, children }: { tone?: 'success' | 'warning'; children: React.ReactNode }) {
  return (
    <View style={[styles.pill, tone === 'success' && styles.pillSuccess, tone === 'warning' && styles.pillWarning]}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

function formatHeartRate(workout: AppleHealthPreview['workouts'][number]) {
  if (!workout.heartRate) {
    return 'Heart-rate samples unavailable for this workout.';
  }

  return `Avg ${workout.heartRate.averageBpm} bpm / Peak ${workout.heartRate.maxBpm} bpm / ${workout.heartRate.sampleCount} samples`;
}

export default function AppleHealthScreen() {
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [preview, setPreview] = useState<AppleHealthPreview | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<AppleHealthRuntimeStatus | null>(null);

  const checkRuntime = useCallback(async () => {
    setError(null);
    const nextStatus = await getAppleHealthRuntimeStatus();
    setRuntimeStatus(nextStatus);
    return nextStatus;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function run() {
        setIsChecking(true);
        const nextStatus = await checkRuntime();
        if (mounted) {
          if (!nextStatus.available) {
            setPreview(null);
          }
          setIsChecking(false);
        }
      }

      run();

      return () => {
        mounted = false;
      };
    }, [checkRuntime])
  );

  async function loadPreview() {
    setError(null);
    const nextPreview = await loadAppleHealthPreview();
    setPreview(nextPreview);
  }

  async function handleConnect() {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await requestAppleHealthReadAccess();
      setRuntimeStatus(result.status);

      if (!result.granted) {
        setError('Apple Health access was not granted. You can update permissions in iOS Settings.');
        return;
      }

      await loadPreview();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Could not connect to Apple Health.');
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const nextStatus = await checkRuntime();
      if (nextStatus.available) {
        await loadPreview();
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not refresh Apple Health preview.');
    } finally {
      setIsRefreshing(false);
    }
  }

  const isAvailable = Boolean(runtimeStatus?.available);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={colors.accentStrong} onRefresh={handleRefresh} />}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.accentStrong} name="chevron-back" size={20} />
          <Text style={styles.backButtonText}>Profile</Text>
        </Pressable>

        <ScreenTitle title="Apple Health" subtitle="Read-only workout and heart-rate import for future Frankie context." />

        <ScrollCard style={styles.heroCard}>
          <Text style={styles.kicker}>Read-only connection</Text>
          <Text style={styles.cardTitle}>Bring workouts into Frankie without writing anything back to Health.</Text>
          <Text style={styles.bodyText}>
            This spike only requests read access. Frankie Fit will not create, edit, or delete Apple Health data.
          </Text>
          <View style={styles.pillWrap}>
            <StatusPill tone="success">No writes</StatusPill>
            <StatusPill>Workouts</StatusPill>
            <StatusPill>Heart rate</StatusPill>
            <StatusPill>Energy</StatusPill>
            <StatusPill>Distance</StatusPill>
          </View>
        </ScrollCard>

        <ScrollCard>
          <Text style={styles.kicker}>Device status</Text>
          {isChecking ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accentStrong} />
              <Text style={styles.bodyText}>Checking HealthKit availability...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardTitle}>{isAvailable ? 'Ready for a development build' : 'Development build needed'}</Text>
              <Text style={styles.bodyText}>
                {runtimeStatus?.message ?? 'Apple Health status has not been checked yet.'}
              </Text>
              {runtimeStatus?.kind === 'expo-go' ? (
                <Text style={styles.noteText}>
                  Build the native app with `pnpm ios:mobile:dev`, then start Metro with `pnpm dev:mobile`.
                </Text>
              ) : null}
            </>
          )}
        </ScrollCard>

        {error ? (
          <ScrollCard style={styles.errorCard}>
            <Text style={styles.bodyText}>{error}</Text>
          </ScrollCard>
        ) : null}

        <PrimaryButton disabled={!isAvailable || isChecking} loading={isConnecting} onPress={handleConnect}>
          Connect Apple Health
        </PrimaryButton>

        <ScrollCard>
          <Text style={styles.kicker}>Recent workout preview</Text>
          <Text style={styles.cardTitle}>What Frankie will be able to see</Text>
          {preview?.workouts.length ? (
            <View style={styles.stack}>
              {preview.workouts.map((workout) => (
                <View key={workout.uuid} style={styles.workoutRow}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowTitle}>{workout.activityType.replace('HKWorkoutActivityType', '')}</Text>
                    <Text style={styles.rowDate}>{formatDateTime(workout.startDate)}</Text>
                  </View>
                  <Text style={styles.rowDetail}>
                    {workout.durationMinutes} min
                    {workout.totalEnergyBurned ? ` / ${workout.totalEnergyBurned}` : ''}
                    {workout.totalDistance ? ` / ${workout.totalDistance}` : ''}
                  </Text>
                  <Text style={styles.rowDetail}>{formatHeartRate(workout)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.bodyText}>
              After permission is granted, the latest workouts and workout heart-rate summaries will appear here.
            </Text>
          )}
        </ScrollCard>

        <ScrollCard>
          <Text style={styles.kicker}>Next</Text>
          <Text style={styles.cardTitle}>Before syncing to Supabase</Text>
          <View style={styles.stack}>
            <Text style={styles.bodyText}>1. Verify the permission prompt on a real development build.</Text>
            <Text style={styles.bodyText}>2. Confirm workout and heart-rate sample shape from Apple Watch data.</Text>
            <Text style={styles.bodyText}>3. Add external workout tables and explicit import/linked-log flow.</Text>
          </View>
        </ScrollCard>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingTop: 12,
  },
  backButtonText: {
    color: colors.accentStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: colors.panelStrong,
  },
  errorCard: {
    borderColor: colors.danger,
  },
  kicker: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  bodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  noteText: {
    color: colors.accentStrong,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
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
  pillSuccess: {
    borderColor: colors.success,
  },
  pillWarning: {
    borderColor: colors.danger,
  },
  pillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stack: {
    gap: 12,
  },
  workoutRow: {
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.backgroundSoft,
    padding: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  rowDate: {
    color: colors.subtle,
    fontSize: 13,
    fontWeight: '700',
  },
  rowDetail: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
