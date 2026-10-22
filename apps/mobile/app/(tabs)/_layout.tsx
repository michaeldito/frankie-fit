import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { FrankieAvatar } from '@/components/frankie';
import { FrankieDayProvider } from '@/components/frankie-day';
import { LoadingScreen } from '@/components/frankie-ui';
import { useAuth } from '@/lib/auth-context';
import { registerForPushNotificationsAsync } from '@/lib/push-notifications';
import { fonts, useTheme } from '@/lib/theme';

export default function TabsLayout() {
  const { isLoading, onboardingCompleted, session } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!session || !onboardingCompleted) {
      return;
    }

    registerForPushNotificationsAsync();

    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/chat');
    });

    return () => subscription.remove();
  }, [session, onboardingCompleted]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <FrankieDayProvider>
      <Tabs
        initialRouteName="chat"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: { color: colors.foreground, fontWeight: '800' },
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          sceneStyle: { backgroundColor: colors.background },
        }}>
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Frankie',
            headerTitle: () => (
              <Text style={{ color: colors.foreground, fontFamily: fonts.frankie, fontSize: 26 }}>Frankie Fit 🐾</Text>
            ),
            tabBarIcon: ({ focused, size }) => (
              <FrankieAvatar mood="happy" size={size + 8} style={focused ? undefined : { opacity: 0.75 }} />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="stats-chart" size={size} />,
          }}
        />
        <Tabs.Screen
          name="workouts"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="barbell" size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person" size={size} />,
          }}
        />
      </Tabs>
    </FrankieDayProvider>
  );
}
