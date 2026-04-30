import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { LoadingScreen } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import { useAuth } from '@/lib/auth-context';

export default function TabLayout() {
  const { isLoading, onboardingCompleted, session } = useAuth();

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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.subtle,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.backgroundSoft,
          borderTopColor: colors.border,
          minHeight: 82,
          paddingBottom: 22,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="chatbubble-ellipses" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="pulse" size={size} />,
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
  );
}
