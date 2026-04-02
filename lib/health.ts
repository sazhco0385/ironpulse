/**
 * IronPulse Health Integration
 * Android: Health Connect (react-native-health-connect)
 * iOS:     Apple HealthKit (react-native-health)
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type HealthWorkout = {
  startTime: Date;
  endTime: Date;
  totalVolumeKg: number;
  totalSets: number;
  planName: string;
  dayName: string;
};

export type HealthStatus = "unavailable" | "not_requested" | "granted" | "denied";

const STORAGE_KEY = "healthSyncEnabled";

// ─── Internal helpers ────────────────────────────────────────────────────────

async function initAndroid(): Promise<boolean> {
  try {
    const {
      initialize,
      getSdkStatus,
      SdkAvailabilityStatus,
    } = await import("react-native-health-connect");
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
    return initialize();
  } catch {
    return false;
  }
}

async function requestAndroid(): Promise<boolean> {
  try {
    const { requestPermission } = await import("react-native-health-connect");
    const granted = await requestPermission([
      { accessType: "write", recordType: "ExerciseSession" },
      { accessType: "write", recordType: "Weight" },
      { accessType: "read",  recordType: "ExerciseSession" },
      { accessType: "read",  recordType: "Weight" },
    ]);
    return granted.length > 0;
  } catch {
    return false;
  }
}

async function logWorkoutAndroid(workout: HealthWorkout): Promise<boolean> {
  try {
    const { insertRecords } = await import("react-native-health-connect");
    await insertRecords([
      {
        recordType: "ExerciseSession",
        startTime: workout.startTime.toISOString(),
        endTime: workout.endTime.toISOString(),
        exerciseType: 81, // STRENGTH_TRAINING
        title: `${workout.planName} – ${workout.dayName}`,
        notes: `${workout.totalSets} Sätze · ${workout.totalVolumeKg.toFixed(0)} kg Volumen`,
      },
    ]);
    return true;
  } catch {
    return false;
  }
}

async function logWeightAndroid(weightKg: number): Promise<boolean> {
  try {
    const { insertRecords } = await import("react-native-health-connect");
    await insertRecords([
      {
        recordType: "Weight",
        weight: { value: weightKg, unit: "kilograms" },
        time: new Date().toISOString(),
      },
    ]);
    return true;
  } catch {
    return false;
  }
}

async function requestIos(): Promise<boolean> {
  return new Promise((resolve) => {
    import("react-native-health")
      .then(({ default: AppleHealthKit, HealthInputOptions }) => {
        const perms = {
          permissions: {
            read: [
              AppleHealthKit.Constants.Permissions.Workout,
              AppleHealthKit.Constants.Permissions.BodyMass,
            ],
            write: [
              AppleHealthKit.Constants.Permissions.Workout,
              AppleHealthKit.Constants.Permissions.BodyMass,
            ],
          },
        };
        AppleHealthKit.initHealthKit(perms, (err: any) => {
          resolve(!err);
        });
      })
      .catch(() => resolve(false));
  });
}

async function logWorkoutIos(workout: HealthWorkout): Promise<boolean> {
  return new Promise((resolve) => {
    import("react-native-health")
      .then(({ default: AppleHealthKit }) => {
        const opts = {
          type: "TraditionalStrengthTraining" as const,
          startDate: workout.startTime.toISOString(),
          endDate: workout.endTime.toISOString(),
          duration: Math.round((workout.endTime.getTime() - workout.startTime.getTime()) / 1000),
          energyBurned: Math.round(workout.totalVolumeKg * 0.1),
          energyBurnedUnit: "calorie" as const,
          distance: 0,
          distanceUnit: "meter" as const,
        };
        AppleHealthKit.saveWorkout(opts, (err: any) => {
          resolve(!err);
        });
      })
      .catch(() => resolve(false));
  });
}

async function logWeightIos(weightKg: number): Promise<boolean> {
  return new Promise((resolve) => {
    import("react-native-health")
      .then(({ default: AppleHealthKit }) => {
        const opts = {
          value: weightKg,
          unit: "gram" as const,
          startDate: new Date().toISOString(),
        };
        AppleHealthKit.saveWeight(
          { ...opts, unit: "gram", value: weightKg * 1000 },
          (err: any) => resolve(!err),
        );
      })
      .catch(() => resolve(false));
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns true when Health Connect / HealthKit is available on this device. */
export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") return initAndroid();
  if (Platform.OS === "ios") {
    try {
      const { default: AppleHealthKit } = await import("react-native-health");
      return !!AppleHealthKit;
    } catch {
      return false;
    }
  }
  return false;
}

/** Asks the user for health permissions. Returns true if at least partially granted. */
export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS === "android") return requestAndroid();
  if (Platform.OS === "ios") return requestIos();
  return false;
}

/** Persist the user's sync preference. */
export async function setHealthSyncEnabled(enabled: boolean) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
}

/** Read the user's sync preference. */
export async function getHealthSyncEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val ? JSON.parse(val) : false;
}

/** Write a completed workout to the health platform. */
export async function logWorkoutToHealth(workout: HealthWorkout): Promise<boolean> {
  const enabled = await getHealthSyncEnabled();
  if (!enabled) return false;
  if (Platform.OS === "android") return logWorkoutAndroid(workout);
  if (Platform.OS === "ios") return logWorkoutIos(workout);
  return false;
}

/** Write a body weight entry to the health platform. */
export async function logWeightToHealth(weightKg: number): Promise<boolean> {
  const enabled = await getHealthSyncEnabled();
  if (!enabled) return false;
  if (Platform.OS === "android") return logWeightAndroid(weightKg);
  if (Platform.OS === "ios") return logWeightIos(weightKg);
  return false;
}
