import { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createThemedStyles, spacing, useTheme } from '@/lib/theme';

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  // Tab screens sit between the navigator's header and tab bar, which already handle the insets.
  inTabs?: boolean;
}>;

export function Screen({ children, padded = true, inTabs = false }: ScreenProps) {
  const styles = useStyles();
  return (
    <SafeAreaView
      edges={inTabs ? ['left', 'right'] : undefined}
      style={[styles.screen, padded && styles.screenPadded]}>
      {children}
    </SafeAreaView>
  );
}

export function ScrollCard({ children, style }: PropsWithChildren<ViewProps>) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & {
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  children,
  disabled,
  loading,
  onPress,
}: PropsWithChildren<{
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}>) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}>
      {loading ? <ActivityIndicator color={colors.brandForeground} /> : <Text style={styles.buttonText}>{children}</Text>}
    </Pressable>
  );
}

export function SecondaryLink({
  children,
  onPress,
}: PropsWithChildren<{
  onPress: () => void;
}>) {
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={styles.secondaryLink}>
      <Text style={styles.secondaryLinkText}>{children}</Text>
    </Pressable>
  );
}

export function LoadingScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Screen>
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    </Screen>
  );
}

export function BodyText({ children }: PropsWithChildren) {
  const styles = useStyles();
  return <Text style={styles.body}>{children}</Text>;
}

const useStyles = createThemedStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadded: {
    paddingHorizontal: spacing.screenX,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: 8,
    paddingBottom: 22,
    paddingTop: 18,
  },
  title: {
    color: colors.foreground,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    backgroundColor: colors.surface,
    padding: 18,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surfaceStrong,
    color: colors.foreground,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.brandForeground,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLinkText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
}));
