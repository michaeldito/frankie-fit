import { CaveatBrush_400Regular, useFonts } from '@expo-google-fonts/caveat-brush';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider } from '@/lib/auth-context';
import { FrankieThemeProvider, useTheme } from '@/lib/theme';

export const unstable_settings = {
  anchor: '(auth)',
};

SplashScreen.preventAutoHideAsync();

function ThemedNavigation() {
  const { theme, colors } = useTheme();
  const dark = theme.name === 'dark';

  return (
    <ThemeProvider
      value={{
        dark,
        colors: {
          primary: colors.brand,
          background: colors.background,
          card: colors.surface,
          text: colors.foreground,
          border: colors.border,
          notification: colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="health" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Fall through on a font error too: Frankie's lines just render in the system font.
  const [fontsLoaded, fontError] = useFonts({ CaveatBrush_400Regular });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FrankieThemeProvider>
          <ThemedNavigation />
        </FrankieThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
