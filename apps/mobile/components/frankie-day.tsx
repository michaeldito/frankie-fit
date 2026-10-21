import type { FrankieMood } from '@frankie-fit/brand-core';
import { FRANKIE_ACTIONS, FRANKIE_NEEDS, type FrankieDay, type FrankieNeed } from '@frankie-fit/companion-core';
import * as Haptics from 'expo-haptics';
import { Image, type ImageSource } from 'expo-image';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { FrankieAvatar } from '@/components/frankie';
import { frankieApiFetch } from '@/lib/api';
import { createThemedStyles, fonts } from '@/lib/theme';

type FrankieDayPayload = FrankieDay & { earnedToday: number };
type Reaction = { mood: FrankieMood; line: string; at: number };

const STICKERS: Record<FrankieNeed | 'biscuit', ImageSource> = {
  feed: require('@frankie-fit/brand-core/assets/frankie/stickers/bowl.png'),
  walk: require('@frankie-fit/brand-core/assets/frankie/stickers/paw.png'),
  play: require('@frankie-fit/brand-core/assets/frankie/stickers/ball.png'),
  snuggle: require('@frankie-fit/brand-core/assets/frankie/stickers/zzz.png'),
  biscuit: require('@frankie-fit/brand-core/assets/frankie/stickers/biscuit.png'),
};

const REDEEM_ERRORS: Record<string, string> = {
  already_filled: "Already done today. He's very content.",
  not_enough_biscuits: 'The jar is empty. Tell Frankie what you did today to earn a biscuit.',
};

type FrankieDayContextValue = {
  day: FrankieDayPayload | null;
  reaction: Reaction | null;
  refresh: () => Promise<void>;
  openSheet: () => void;
};

const FrankieDayContext = createContext<FrankieDayContextValue | null>(null);

export function useFrankieDay() {
  const value = useContext(FrankieDayContext);
  if (!value) {
    throw new Error('useFrankieDay must be used inside FrankieDayProvider');
  }
  return value;
}

// If the biscuit ledger isn't reachable, `day` stays null and the bar and sheet hide themselves.
export function FrankieDayProvider({ children }: PropsWithChildren) {
  const [day, setDay] = useState<FrankieDayPayload | null>(null);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [redeeming, setRedeeming] = useState<FrankieNeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await frankieApiFetch<{ day: FrankieDayPayload | null }>('/api/mobile/frankie/day');
      setDay(response.day);
    } catch {
      // Keep the last known day.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    frankieApiFetch<{ day: FrankieDayPayload | null }>('/api/mobile/frankie/day')
      .then((response) => {
        if (!cancelled) setDay(response.day);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const showReaction = useCallback((mood: FrankieMood, line: string) => {
    const at = Date.now();
    setReaction({ mood, line, at });
    setTimeout(() => setReaction((current) => (current?.at === at ? null : current)), 6000);
  }, []);

  const redeem = useCallback(
    async (need: FrankieNeed) => {
      setError(null);
      setRedeeming(need);
      try {
        const response = await frankieApiFetch<{ day: FrankieDayPayload }>('/api/mobile/frankie/redeem', {
          method: 'POST',
          body: JSON.stringify({ kind: need }),
        });
        setDay(response.day);
        showReaction(FRANKIE_ACTIONS[need].moodAfter, FRANKIE_ACTIONS[need].reaction);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (redeemError) {
        const message = redeemError instanceof Error ? redeemError.message : '';
        setError(REDEEM_ERRORS[message] ?? "Couldn't reach Frankie. Try again?");
      } finally {
        setRedeeming(null);
      }
    },
    [showReaction]
  );

  const value = useMemo(
    () => ({ day, reaction, refresh, openSheet: () => setSheetOpen(true) }),
    [day, reaction, refresh]
  );

  return (
    <FrankieDayContext.Provider value={value}>
      {children}
      {day ? (
        <FrankieDaySheet
          day={day}
          error={error}
          onBellyRub={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showReaction('happy', '*happy wiggle* …again?');
          }}
          onClose={() => setSheetOpen(false)}
          onRedeem={redeem}
          reaction={reaction}
          redeeming={redeeming}
          visible={sheetOpen}
        />
      ) : null}
    </FrankieDayContext.Provider>
  );
}

export function BiscuitCount({ count }: { count: number }) {
  const styles = useStyles();
  return (
    <View style={styles.jar}>
      <Image contentFit="contain" source={STICKERS.biscuit} style={styles.jarIcon} />
      <Text style={styles.jarText}>{count}</Text>
    </View>
  );
}

export function FrankieDayBar() {
  const { day, reaction, openSheet } = useFrankieDay();
  const styles = useStyles();

  if (!day) return null;

  return (
    <Pressable accessibilityLabel="Open Frankie's Day" onPress={openSheet} style={styles.bar}>
      <FrankieAvatar mood={reaction?.mood ?? day.mood} size={32} />
      <Text numberOfLines={1} style={styles.barLine}>
        {reaction?.line ?? day.line}
      </Text>
      <View style={styles.barNeeds}>
        {FRANKIE_NEEDS.map((need) => (
          <Image
            contentFit="contain"
            key={need}
            source={STICKERS[need]}
            style={[styles.barNeed, day.needs[need] === 'wanting' && styles.barNeedWanting]}
          />
        ))}
      </View>
      <BiscuitCount count={day.balance} />
    </Pressable>
  );
}

function FrankieDaySheet({
  day,
  error,
  onBellyRub,
  onClose,
  onRedeem,
  reaction,
  redeeming,
  visible,
}: {
  day: FrankieDayPayload;
  error: string | null;
  onBellyRub: () => void;
  onClose: () => void;
  onRedeem: (need: FrankieNeed) => void;
  reaction: Reaction | null;
  redeeming: FrankieNeed | null;
  visible: boolean;
}) {
  const styles = useStyles();

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{"Frankie's Day"}</Text>
          <BiscuitCount count={day.balance} />
        </View>

        <Pressable accessibilityLabel="Give Frankie a belly rub" onPress={onBellyRub} style={styles.hero}>
          <FrankieAvatar mood={reaction?.mood ?? day.mood} size={140} />
          <Text style={styles.heroLine}>{reaction?.line ?? day.line}</Text>
          {day.goodBoyDay ? <Text style={styles.goodBoy}>👑 Good Boy Day!</Text> : null}
          {day.careStreak > 1 ? <Text style={styles.streak}>🔥 {day.careStreak}-day care streak</Text> : null}
        </Pressable>

        <View style={styles.actions}>
          {FRANKIE_NEEDS.map((need) => {
            const action = FRANKIE_ACTIONS[need];
            const filled = day.needs[need] === 'filled';
            return (
              <Pressable
                disabled={filled || redeeming !== null}
                key={need}
                onPress={() => onRedeem(need)}
                style={[
                  styles.action,
                  filled && styles.actionFilled,
                  !filled && day.canAfford[need] && styles.actionReady,
                  redeeming === need && styles.actionBusy,
                ]}>
                <Image contentFit="contain" source={STICKERS[need]} style={styles.actionIcon} />
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionMeta}>{filled ? `${action.needLabel} today ✓` : `${action.cost} 🦴`}</Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.explainer}>
          {'"Every time you tell me what you did, I earn a biscuit. You spend them on me. Obviously."'}
        </Text>
        <Text style={styles.rules}>
          +1 🦴 for the first log in each area today, +1 bonus when you log all four. Tap Frankie for a free belly rub.
        </Text>

        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  jar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.frankieSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  jarIcon: { width: 16, height: 16 },
  jarText: { color: colors.foreground, fontSize: 13, fontWeight: '800' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  barLine: { flex: 1, color: colors.frankie, fontFamily: fonts.frankie, fontSize: 17 },
  barNeeds: { flexDirection: 'row', gap: 3 },
  barNeed: { width: 16, height: 16 },
  barNeedWanting: { opacity: 0.3 },
  sheet: { flex: 1, gap: 16, backgroundColor: colors.background, padding: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { color: colors.foreground, fontFamily: fonts.frankie, fontSize: 32 },
  hero: { alignItems: 'center', gap: 8 },
  heroLine: {
    color: colors.frankie,
    fontFamily: fonts.frankie,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  goodBoy: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.celebrate,
    color: colors.celebrateForeground,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  streak: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: {
    width: '48%',
    gap: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    opacity: 0.7,
    padding: 12,
  },
  actionReady: { borderColor: colors.frankie, backgroundColor: colors.frankieSoft, opacity: 1 },
  actionFilled: { borderColor: colors.success, opacity: 1 },
  actionBusy: { opacity: 0.5 },
  actionIcon: { width: 26, height: 26 },
  actionLabel: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  actionMeta: { color: colors.muted, fontSize: 12 },
  error: { color: colors.danger, fontSize: 14 },
  explainer: { color: colors.frankie, fontFamily: fonts.frankie, fontSize: 18, textAlign: 'center' },
  rules: { color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  close: {
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.brand,
    marginTop: 'auto',
    paddingVertical: 14,
  },
  closeText: { color: colors.brandForeground, fontSize: 16, fontWeight: '800' },
}));
