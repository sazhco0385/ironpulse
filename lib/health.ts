/**
 * IronPulse Health Integration – Stub
 * Health-Tracking wird in einem späteren Update mit nativer Integration nachgerüstet.
 */

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

export async function isHealthAvailable(): Promise<boolean> {
  return false;
}

export async function requestHealthPermissions(): Promise<boolean> {
  return false;
}

export async function setHealthSyncEnabled(enabled: boolean) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
}

export async function getHealthSyncEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val ? JSON.parse(val) : false;
}

export async function logWorkoutToHealth(_workout: HealthWorkout): Promise<boolean> {
  return false;
}

export async function logWeightToHealth(_weightKg: number): Promise<boolean> {
  return false;
}
