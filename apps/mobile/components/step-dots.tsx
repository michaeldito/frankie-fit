import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { createThemedStyles } from '@/lib/theme';

function StepDot({ currentStep, index }: { currentStep: number; index: number }) {
  const styles = useStyles();
  const isDone = index < currentStep;
  const isActive = index === currentStep;
  const pulse = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 650, toValue: 0.25, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 650, toValue: 0.9, useNativeDriver: true }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [isActive, pulse]);

  return (
    <View style={styles.dotWrap}>
      {isActive ? <Animated.View style={[styles.ring, { opacity: pulse }]} /> : null}
      <View style={[styles.dot, isDone && styles.dotDone, isActive && styles.dotActive]} />
    </View>
  );
}

export function StepDots({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_value, index) => (
        <StepDot currentStep={currentStep} index={index} key={index} />
      ))}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  ring: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotDone: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  dotActive: {
    borderColor: colors.brand,
    backgroundColor: colors.accent,
  },
}));
