import { pillarColor, type Pillar } from '@frankie-fit/brand-core';
import { Text, View } from 'react-native';

import { createThemedStyles, useTheme } from '@/lib/theme';
// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see
// apps/mobile/app/(tabs)/chat.tsx and packages/dashboard-core/dashboard.ts for the same
// known IOU and its rationale.
import { formatLoggedDate } from '../../../apps/web/components/chat/logged-entry-format';

type LoggedEntry = {
  id: string | null;
  loggedForDate: string | null;
};

export function LoggedEntryCard<T extends LoggedEntry>({
  entries,
  formatDetail,
  formatTitle,
  kicker,
  pillar,
}: {
  entries: T[];
  formatDetail: (entry: T) => string | null;
  formatTitle: (entry: T) => string;
  kicker: string;
  pillar: Pillar;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const accent = pillarColor(colors, pillar);

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.stack}>
      {entries.map((entry, index) => {
        const detail = formatDetail(entry);

        return (
          <View key={entry.id ?? index} style={[styles.card, { borderLeftColor: accent }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
              {entry.loggedForDate ? (
                <Text style={styles.date}>{formatLoggedDate(entry.loggedForDate)}</Text>
              ) : null}
            </View>
            <Text style={styles.title}>{formatTitle(entry)}</Text>
            {detail ? <Text style={styles.detail}>{detail}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  stack: {
    gap: 8,
  },
  card: {
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '86%',
    borderLeftWidth: 3,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  date: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '800',
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
}));
