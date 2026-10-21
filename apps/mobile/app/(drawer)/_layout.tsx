import Ionicons from '@expo/vector-icons/Ionicons';
import { Drawer } from 'expo-router/drawer';
import { Redirect, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { AppDrawerContent } from '@/components/app-drawer-content';
import { LoadingScreen } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import { useAuth } from '@/lib/auth-context';
import { registerForPushNotificationsAsync } from '@/lib/push-notifications';

export default function DrawerLayout() {
  const { isLoading, onboardingCompleted, session } = useAuth();

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
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.backgroundSoft },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitle: 'Frankie Fit',
        headerTitleStyle: { color: colors.accentStrong, fontWeight: '800' },
        drawerType: 'front',
        drawerStyle: { backgroundColor: colors.backgroundSoft, width: 260 },
        overlayColor: 'rgba(3,10,22,0.55)',
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Drawer.Screen
        name="chat"
        options={{
          title: 'Chat',
          drawerIcon: ({ color, size }) => (
            <Ionicons color={color} name="chatbubble-ellipses" size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <Ionicons color={color} name="pulse" size={size} />,
        }}
      />
      <Drawer.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          drawerIcon: ({ color, size }) => <Ionicons color={color} name="barbell" size={size} />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => <Ionicons color={color} name="person" size={size} />,
        }}
      />
    </Drawer>
  );
}
