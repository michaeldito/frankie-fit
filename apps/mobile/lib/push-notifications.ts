import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { frankieApiFetch } from '@/lib/api';

/**
 * Registers this device for Expo push notifications and hands the token to the backend.
 * No-ops (rather than throwing) on a simulator/emulator, in Expo Go (remote push was removed
 * from Expo Go in SDK 53+, so `getExpoPushTokenAsync` throws there), when the user denies
 * permission, or when the app has no EAS project id configured yet (`eas init` not yet run) —
 * push is a best-effort enhancement on top of in-app notifications, not a hard requirement.
 */
export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

    await frankieApiFetch('/api/mobile/push-token', {
      body: JSON.stringify({ devicePlatform: Platform.OS, expoPushToken }),
      method: 'POST',
    });
  } catch {
    // Best-effort registration (e.g. running in Expo Go, or the backend is unreachable);
    // a failure here shouldn't block app usage.
  }
}
