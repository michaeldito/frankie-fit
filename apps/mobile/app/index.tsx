import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/frankie-ui';
import { useAuth } from '@/lib/auth-context';

export default function IndexRoute() {
  const { isLoading, onboardingCompleted, session } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={onboardingCompleted ? '/chat' : '/onboarding'} />;
}
