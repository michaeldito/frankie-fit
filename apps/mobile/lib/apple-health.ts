import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  ObjectTypeIdentifier,
  QuantitySampleTyped,
  WorkoutProxyTyped,
} from '@kingstinct/react-native-healthkit';

const WORKOUT_TYPE = 'HKWorkoutTypeIdentifier';
const HEART_RATE_TYPE = 'HKQuantityTypeIdentifierHeartRate';

export const APPLE_HEALTH_READ_TYPES = [
  WORKOUT_TYPE,
  HEART_RATE_TYPE,
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierDistanceCycling',
] as const satisfies readonly ObjectTypeIdentifier[];

type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');

export type AppleHealthRuntimeStatus =
  | {
      available: true;
      kind: 'available';
      message: string;
    }
  | {
      available: false;
      kind: 'expo-go' | 'unsupported-platform' | 'unavailable' | 'missing-native-module';
      message: string;
    };

export type HeartRateSummary = {
  averageBpm: number;
  maxBpm: number;
  minBpm: number;
  sampleCount: number;
};

export type AppleWorkoutPreview = {
  activityType: string;
  durationMinutes: number;
  endDate: string;
  heartRate?: HeartRateSummary;
  totalDistance?: string;
  totalEnergyBurned?: string;
  startDate: string;
  uuid: string;
};

export type AppleHealthPreview = {
  workouts: AppleWorkoutPreview[];
};

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

async function loadHealthKitModule(): Promise<HealthKitModule | null> {
  if (Platform.OS !== 'ios' || isExpoGo()) {
    return null;
  }

  try {
    return await import('@kingstinct/react-native-healthkit');
  } catch {
    return null;
  }
}

export async function getAppleHealthRuntimeStatus(): Promise<AppleHealthRuntimeStatus> {
  if (Platform.OS !== 'ios') {
    return {
      available: false,
      kind: 'unsupported-platform',
      message: 'Apple Health is only available on iPhone and iPad.',
    };
  }

  if (isExpoGo()) {
    return {
      available: false,
      kind: 'expo-go',
      message: 'Apple Health needs a Frankie Fit development build. Expo Go cannot load HealthKit.',
    };
  }

  const healthkit = await loadHealthKitModule();

  if (!healthkit) {
    return {
      available: false,
      kind: 'missing-native-module',
      message: 'The HealthKit native module is not available yet. Rebuild the development client.',
    };
  }

  const isAvailable = await healthkit.isHealthDataAvailableAsync();

  return isAvailable
    ? {
        available: true,
        kind: 'available',
        message: 'Apple Health is available on this device.',
      }
    : {
        available: false,
        kind: 'unavailable',
        message: 'Apple Health is not available on this device.',
      };
}

export async function requestAppleHealthReadAccess() {
  const status = await getAppleHealthRuntimeStatus();

  if (!status.available) {
    return {
      granted: false,
      status,
    };
  }

  const healthkit = await loadHealthKitModule();
  const granted = Boolean(await healthkit?.requestAuthorization({ toRead: APPLE_HEALTH_READ_TYPES }));

  return {
    granted,
    status,
  };
}

function formatQuantity(quantity?: { quantity: number; unit: string }) {
  if (!quantity) {
    return undefined;
  }

  const value = Math.round(quantity.quantity * 10) / 10;
  return `${value} ${quantity.unit}`;
}

function summarizeHeartRate(samples: readonly QuantitySampleTyped<typeof HEART_RATE_TYPE>[]): HeartRateSummary | undefined {
  const values = samples.map((sample) => Math.round(sample.quantity)).filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) {
    return undefined;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    averageBpm: Math.round(total / values.length),
    maxBpm: Math.max(...values),
    minBpm: Math.min(...values),
    sampleCount: values.length,
  };
}

async function buildWorkoutPreview(
  healthkit: HealthKitModule,
  workout: WorkoutProxyTyped
): Promise<AppleWorkoutPreview> {
  const heartRateSamples = await healthkit.queryQuantitySamples(HEART_RATE_TYPE, {
    ascending: true,
    filter: {
      workout,
    },
    limit: 500,
    unit: 'count/min',
  });

  return {
    activityType: String(workout.workoutActivityType),
    durationMinutes: Math.round((workout.duration.quantity / 60) * 10) / 10,
    endDate: workout.endDate.toISOString(),
    heartRate: summarizeHeartRate(heartRateSamples),
    startDate: workout.startDate.toISOString(),
    totalDistance: formatQuantity(workout.totalDistance),
    totalEnergyBurned: formatQuantity(workout.totalEnergyBurned),
    uuid: workout.uuid,
  };
}

export async function loadAppleHealthPreview(limit = 5): Promise<AppleHealthPreview> {
  const status = await getAppleHealthRuntimeStatus();

  if (!status.available) {
    return {
      workouts: [],
    };
  }

  const healthkit = await loadHealthKitModule();

  if (!healthkit) {
    return {
      workouts: [],
    };
  }

  const workouts = await healthkit.queryWorkoutSamples({
    ascending: false,
    limit,
  });

  return {
    workouts: await Promise.all(workouts.map((workout) => buildWorkoutPreview(healthkit, workout))),
  };
}
