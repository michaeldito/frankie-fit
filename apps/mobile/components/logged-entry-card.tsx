import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/frankie-theme';
// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see
// apps/mobile/app/(drawer)/chat.tsx and packages/dashboard-core/dashboard.ts for the same
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
}: {
  entries: T[];
  formatDetail: (entry: T) => string | null;
  formatTitle: (entry: T) => string;
  kicker: string;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.stack}>
      {entries.map((entry, index) => {
        const detail = formatDetail(entry);

        return (
          <View key={entry.id ?? index} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.kicker}>{kicker}</Text>
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

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
  card: {
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '86%',
    borderLeftWidth: 3,
    borderLeftColor: colors.accentStrong,
    borderRadius: 14,
    backgroundColor: colors.panel,
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
    color: colors.accentStrong,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  date: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
