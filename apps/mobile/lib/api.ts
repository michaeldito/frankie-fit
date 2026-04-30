import Constants from 'expo-constants';

import { supabase } from '@/lib/supabase';

type ExpoConstantsWithHost = typeof Constants & {
  expoConfig?: {
    hostUri?: string;
  } | null;
  manifest?: {
    debuggerHost?: string;
  } | null;
  manifest2?: {
    extra?: {
      expoClient?: {
        hostUri?: string;
      };
    };
  } | null;
};

function getExpoHost() {
  const constants = Constants as ExpoConstantsWithHost;
  const hostUri =
    constants.expoConfig?.hostUri ??
    constants.manifest2?.extra?.expoClient?.hostUri ??
    constants.manifest?.debuggerHost;

  return hostUri?.split(':')[0] ?? null;
}

function getDefaultApiBaseUrl() {
  const host = getExpoHost();

  if (host) {
    return `http://${host}:3000`;
  }

  return 'http://localhost:3000';
}

export const frankieApiBaseUrl =
  process.env.EXPO_PUBLIC_FRANKIE_API_BASE_URL || getDefaultApiBaseUrl();

export async function frankieApiFetch<T>(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Log in again so Frankie can verify your session.');
  }

  const response = await fetch(`${frankieApiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const responseText = await response.text();
  const parsed = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) {
    throw new Error(
      typeof parsed.error === 'string' ? parsed.error : 'Frankie could not complete that request.'
    );
  }

  return parsed as T;
}
