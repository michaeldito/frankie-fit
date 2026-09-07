import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { colors } from '@/constants/frankie-theme';
import { AuthProvider } from '@/lib/auth-context';

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider
          value={{
            dark: true,
            colors: {
              primary: colors.accentStrong,
              background: colors.background,
              card: colors.backgroundSoft,
              text: colors.text,
              border: colors.border,
              notification: colors.accent,
            },
            fonts: {
              regular: {
                fontFamily: 'System',
                fontWeight: '400',
              },
              medium: {
                fontFamily: 'System',
                fontWeight: '500',
              },
              bold: {
                fontFamily: 'System',
                fontWeight: '700',
              },
              heavy: {
                fontFamily: 'System',
                fontWeight: '800',
              },
            },
          }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="health" />
            <Stack.Screen name="(drawer)" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
