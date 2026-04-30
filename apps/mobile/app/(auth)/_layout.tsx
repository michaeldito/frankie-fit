import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/components/frankie-ui';
import { useAuth } from '@/lib/auth-context';

export default function AuthLayout() {
  const { isLoading, onboardingCompleted, session } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (session) {
    return <Redirect href={onboardingCompleted ? '/chat' : '/onboarding'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
