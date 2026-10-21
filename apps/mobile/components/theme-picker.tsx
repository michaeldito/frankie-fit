import { Pressable, Text, View } from 'react-native';

import { createThemedStyles, useTheme, type ThemePreference } from '@/lib/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemePicker() {
  const { preference, setPreference } = useTheme();
  const styles = useStyles();

  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => setPreference(option.value)}
            style={[styles.option, selected && styles.optionSelected]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 14,
    backgroundColor: colors.surfaceStrong,
    padding: 4,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 9,
  },
  optionSelected: {
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  labelSelected: {
    color: colors.foreground,
  },
}));
