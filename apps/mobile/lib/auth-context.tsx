import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  isLoading: boolean;
  onboardingCompleted: boolean;
  refreshProfile: () => Promise<void>;
  session: Session | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    setOnboardingCompleted(false);

    if (!nextSession) {
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', nextSession.user.id)
      .maybeSingle();

    if (error) {
      setOnboardingCompleted(false);
      return;
    }

    setOnboardingCompleted(Boolean(data?.onboarding_completed));
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return;
      }

      setIsLoading(true);
      setSession(data.session);
      await loadProfile(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setIsLoading(true);
      setSession(nextSession);
      await loadProfile(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      onboardingCompleted,
      refreshProfile,
      session,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [isLoading, onboardingCompleted, refreshProfile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
