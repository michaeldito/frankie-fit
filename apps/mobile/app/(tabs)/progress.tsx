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

import { Screen, ScreenTitle, ScrollCard } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import {
  DashboardRecentItem,
  DashboardTrendPoint,
  DietDashboardData,
  ExerciseDashboardData,
  getDashboardData,
  WellnessDashboardData,
  WellnessTrendPoint,
} from '@/lib/dashboard-data';
import { useAuth } from '@/lib/auth-context';
import { loadProfile } from '@/lib/profile-data';

type DashboardTabId = 'exercise' | 'diet' | 'wellness';

const dashboardTabs: { id: DashboardTabId; label: string }[] = [
  { id: 'exercise', label: 'Exercise' },
  { id: 'diet', label: 'Diet' },
  { id: 'wellness', label: 'Wellness' },
];

type DashboardState = Awaited<ReturnType<typeof getDashboardData>>;

function SegmentedTabs({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
}) {
  return (
    <View style={styles.segmented}>
      {dashboardTabs.map((tab) => {
        const selected = tab.id === activeTab;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricGrid({ metrics }: { metrics: { label: string; value: string }[] }) {
  return (
    <View style={styles.metricGrid}>
      {metrics.map((metric) => (
        <ScrollCard key={metric.label} style={styles.metricCard}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={styles.metricValue}>{metric.value}</Text>
        </ScrollCard>
      ))}
    </View>
  );
}

function InsightCard({ body }: { body: string }) {
  return (
    <ScrollCard style={styles.highlightCard}>
      <Text style={styles.kicker}>{"Frankie's read"}</Text>
      <Text style={styles.cardTitle}>What stands out right now</Text>
      <Text style={styles.bodyText}>{body}</Text>
    </ScrollCard>
  );
}

function EmptyCard({ body, title }: { body: string; title: string }) {
  return (
    <ScrollCard>
      <Text style={styles.kicker}>Getting started</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.bodyText}>{body}</Text>
      <Pressable onPress={() => router.push('/chat')} style={styles.inlineButton}>
        <Text style={styles.inlineButtonText}>Open chat</Text>
      </Pressable>
    </ScrollCard>
  );
}

function RecentList({
  emptyCopy,
  items,
  title,
}: {
  emptyCopy: string;
  items: DashboardRecentItem[];
  title: string;
}) {
  return (
    <ScrollCard>
      <Text style={styles.kicker}>Recent logs</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.length > 0 ? (
        <View style={styles.stack}>
          {items.map((item) => (
            <View key={item.id} style={styles.softRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDate}>{item.dateLabel}</Text>
              </View>
              <Text style={styles.rowDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.bodyText}>{emptyCopy}</Text>
      )}
    </ScrollCard>
  );
}

function BreakdownList({
  emptyCopy,
  items,
  title,
}: {
  emptyCopy: string;
  items: { label: string; value: number }[];
  title: string;
}) {
  return (
    <ScrollCard>
      <Text style={styles.kicker}>Pattern summary</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.length > 0 ? (
        <View style={styles.stack}>
          {items.map((item) => (
            <View key={item.label} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <Text style={styles.breakdownValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.bodyText}>{emptyCopy}</Text>
      )}
    </ScrollCard>
  );
}

function ActivityTrend({ trend }: { trend: DashboardTrendPoint[] }) {
  const maxValue = Math.max(...trend.map((point) => point.value), 1);

  return (
    <ScrollCard>
      <Text style={styles.kicker}>7-day trend</Text>
      <Text style={styles.cardTitle}>Session rhythm</Text>
      <View style={styles.barChart}>
        {trend.map((point) => (
          <View key={point.label} style={styles.barColumn}>
            <Text style={styles.barValue}>{point.value}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: point.value > 0 ? Math.max((point.value / maxValue) * 118, 14) : 8,
                },
              ]}
            />
            <Text style={styles.barLabel}>{point.label}</Text>
          </View>
        ))}
      </View>
    </ScrollCard>
  );
}

function WellnessTrend({ trend }: { trend: WellnessTrendPoint[] }) {
  return (
    <ScrollCard>
      <Text style={styles.kicker}>7-day trend</Text>
      <Text style={styles.cardTitle}>Energy, stress, and recovery</Text>
      <View style={styles.stack}>
        {trend.map((point) => (
          <View key={point.label} style={styles.softRow}>
            <Text style={styles.rowTitle}>{point.label}</Text>
            <Text style={styles.rowDetail}>
              Energy {point.energy ? point.energy.toFixed(1) : '-'} / Stress{' '}
              {point.stress ? point.stress.toFixed(1) : '-'} / Soreness{' '}
              {point.soreness ? point.soreness.toFixed(1) : '-'} / Motivation{' '}
              {point.motivation ? point.motivation.toFixed(1) : '-'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollCard>
  );
}

function ExerciseTab({ data }: { data: ExerciseDashboardData }) {
  if (data.empty) {
    return <EmptyCard body={data.insight} title="No exercise data yet" />;
  }

  return (
    <View style={styles.stack}>
      <MetricGrid metrics={data.metrics} />
      <InsightCard body={data.insight} />
      <ActivityTrend trend={data.trend} />
      <RecentList emptyCopy="Your recent activity will show up here once you start logging." items={data.recent} title="Latest activity" />
      <BreakdownList emptyCopy="As activity types show up, Frankie will summarize the mix here." items={data.breakdown} title="Activity breakdown" />
    </View>
  );
}

function DietTab({ data }: { data: DietDashboardData }) {
  if (data.empty) {
    return <EmptyCard body={data.insight} title="No diet data yet" />;
  }

  return (
    <View style={styles.stack}>
      <MetricGrid metrics={data.metrics} />
      <InsightCard body={data.insight} />
      <RecentList emptyCopy="Meals logged through chat will show up here." items={data.recent} title="Latest meals" />
      <BreakdownList emptyCopy="Meal patterns will appear once there is enough data." items={data.patterns} title="Meal pattern" />
    </View>
  );
}

function WellnessTab({ data }: { data: WellnessDashboardData }) {
  if (data.empty) {
    return <EmptyCard body={data.insight} title="No wellness data yet" />;
  }

  return (
    <View style={styles.stack}>
      <MetricGrid metrics={data.metrics} />
      <InsightCard body={data.insight} />
      <WellnessTrend trend={data.trend} />
      <RecentList emptyCopy="Check-ins logged through chat will show up here." items={data.recent} title="Latest check-ins" />
    </View>
  );
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTabId>('exercise');
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!session) {
      return;
    }

    setError(null);
    const profileResult = await loadProfile(session.user.id);

    if (profileResult.error) {
      setError(profileResult.error);
    }

    const nextDashboard = await getDashboardData(session.user.id, profileResult.profile);
    setDashboard(nextDashboard);
    setError(nextDashboard.error ?? profileResult.error);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function run() {
        setIsLoading(true);
        await loadDashboard();
        if (mounted) {
          setIsLoading(false);
        }
      }

      run();

      return () => {
        mounted = false;
      };
    }, [loadDashboard])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  }

  const activeData =
    activeTab === 'diet' ? dashboard?.diet : activeTab === 'wellness' ? dashboard?.wellness : dashboard?.exercise;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={colors.accentStrong} onRefresh={handleRefresh} />}>
        <ScreenTitle title="Dashboard" subtitle="Exercise, diet, and wellness from the same logs Frankie uses on web." />

        {error ? (
          <ScrollCard style={styles.errorCard}>
            <Text style={styles.bodyText}>{error}</Text>
          </ScrollCard>
        ) : null}

        {dashboard ? (
          <ScrollCard style={styles.nextStepCard}>
            <Text style={styles.kicker}>Next best step</Text>
            <Text style={styles.nextStepTitle}>{dashboard.nextStep.title}</Text>
            <Text style={styles.bodyText}>{dashboard.nextStep.description}</Text>
            <Pressable onPress={() => router.push('/chat')} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>{dashboard.nextStep.ctaLabel}</Text>
            </Pressable>
          </ScrollCard>
        ) : null}

        <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} />

        {isLoading && !dashboard ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentStrong} />
          </View>
        ) : null}

        {dashboard && activeData ? (
          activeTab === 'diet' ? (
            <DietTab data={dashboard.diet} />
          ) : activeTab === 'wellness' ? (
            <WellnessTab data={dashboard.wellness} />
          ) : (
            <ExerciseTab data={dashboard.exercise} />
          )
        ) : null}
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
  segmented: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.backgroundSoft,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 12,
  },
  segmentSelected: {
    backgroundColor: colors.accentStrong,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  segmentTextSelected: {
    color: colors.background,
  },
  nextStepCard: {
    backgroundColor: colors.panelStrong,
  },
  highlightCard: {
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
  nextStepTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  bodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colors.accentStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minHeight: 96,
    padding: 14,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  stack: {
    gap: 12,
  },
  softRow: {
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
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownLabel: {
    color: colors.muted,
    fontSize: 15,
  },
  breakdownValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    minHeight: 170,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
  },
  barValue: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '800',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: colors.accentStrong,
  },
  barLabel: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
});
