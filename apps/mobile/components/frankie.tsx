import { FRANKIE_MOOD_LABELS, thinkingLine, type FrankieMood } from '@frankie-fit/brand-core';
import { Image, type ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { createThemedStyles, fonts } from '@/lib/theme';

const MOOD_ART: Record<FrankieMood, ImageSource> = {
  happy: require('@frankie-fit/brand-core/assets/frankie/happy.png'),
  focused: require('@frankie-fit/brand-core/assets/frankie/focused.png'),
  stretching: require('@frankie-fit/brand-core/assets/frankie/stretching.png'),
  waiting: require('@frankie-fit/brand-core/assets/frankie/waiting.png'),
  hungry: require('@frankie-fit/brand-core/assets/frankie/hungry.png'),
  running: require('@frankie-fit/brand-core/assets/frankie/running.png'),
  bikeRide: require('@frankie-fit/brand-core/assets/frankie/bike-ride.png'),
  snuggle: require('@frankie-fit/brand-core/assets/frankie/snuggle.png'),
};

export const FRANKIE_PORTRAIT: ImageSource = require('@frankie-fit/brand-core/assets/frankie/portrait.png');

export function FrankieAvatar({
  mood = 'happy',
  size = 40,
  style,
}: {
  mood?: FrankieMood;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image
        accessibilityLabel={`Frankie (${FRANKIE_MOOD_LABELS[mood].toLowerCase()})`}
        contentFit="contain"
        source={MOOD_ART[mood]}
        style={{ width: size * 0.88, height: size * 0.88 }}
        transition={180}
      />
    </View>
  );
}

export function FrankieSays({ line, mood = 'happy', kicker = 'Frankie says' }: { line: string; mood?: FrankieMood; kicker?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.says}>
      <Image contentFit="contain" source={MOOD_ART[mood]} style={styles.saysArt} transition={180} />
      <View style={styles.saysCopy}>
        <Text style={styles.saysKicker}>{kicker.toUpperCase()}</Text>
        <Text style={styles.saysLine}>&ldquo;{line}&rdquo;</Text>
      </View>
    </View>
  );
}

export function FrankieThinking() {
  const styles = useStyles();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((current) => current + 1), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <View accessibilityLiveRegion="polite" style={styles.thinking}>
      <FrankieAvatar mood="focused" size={36} />
      <Text style={styles.thinkingText}>{thinkingLine(step)}</Text>
    </View>
  );
}

export function FrankieEmptyState({ mood, line, body }: { mood: FrankieMood; line: string; body?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <Image contentFit="contain" source={MOOD_ART[mood]} style={styles.emptyArt} />
      <Text style={styles.emptyLine}>{line}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.frankieSoft,
    borderWidth: 2,
    borderColor: colors.frankie,
  },
  says: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.frankieSoft,
  },
  saysArt: {
    width: 76,
    height: 76,
  },
  saysCopy: {
    flex: 1,
  },
  saysKicker: {
    color: colors.frankie,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  saysLine: {
    marginTop: 4,
    color: colors.foreground,
    fontFamily: fonts.frankie,
    fontSize: 24,
    lineHeight: 28,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  thinkingText: {
    color: colors.frankie,
    fontFamily: fonts.frankie,
    fontSize: 19,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  emptyArt: {
    width: 104,
    height: 104,
  },
  emptyLine: {
    color: colors.frankie,
    fontFamily: fonts.frankie,
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
}));
