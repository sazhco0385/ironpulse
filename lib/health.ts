/**
 * IronPulse Health Integration
 * Android: Health Connect (react-native-health-connect)
 * iOS:     Stub (HealthKit-Support in späterem iOS-Build)
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

// ─── Android: Health Connect ─────────────────────────────────────────────────

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
        exerciseType: 81,
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

// ─── iOS: Stub (HealthKit nicht im Android-Build enthalten) ──────────────────

async function requestIos(): Promise<boolean> {
  return false;
}

async function logWorkoutIos(_workout: HealthWorkout): Promise<boolean> {
  return false;
}

async function logWeightIos(_weightKg: number): Promise<boolean> {
  return false;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS === "android") return initAndroid();
  return false;
}

export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS === "android") return requestAndroid();
  if (Platform.OS === "ios") return requestIos();
  return false;
}

export async function setHealthSyncEnabled(enabled: boolean) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
}

export async function getHealthSyncEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val ? JSON.parse(val) : false;
}

export async function logWorkoutToHealth(workout: HealthWorkout): Promise<boolean> {
  const enabled = await getHealthSyncEnabled();
  if (!enabled) return false;
  if (Platform.OS === "android") return logWorkoutAndroid(workout);
  if (Platform.OS === "ios") return logWorkoutIos(workout);
  return false;
}

export async function logWeightToHealth(weightKg: number): Promise<boolean> {
  const enabled = await getHealthSyncEnabled();
  if (!enabled) return false;
  if (Platform.OS === "android") return logWeightAndroid(weightKg);
  if (Platform.OS === "ios") return logWeightIos(weightKg);
  return false;
}
