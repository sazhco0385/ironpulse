import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { fetchProfile, loginUser, syncProfile } from "@/lib/api";

export type AthleteGoal = "Muskelaufbau" | "Kraft" | "Definition" | "Fitness";
export type AthleteLevel = "Anfänger" | "Intermediate" | "Fortgeschritten";

export type AthleteProfile = {
  name: string;
  email?: string;
  goal: AthleteGoal;
  level: AthleteLevel;
  daysPerWeek: number;
  weightKg: number;
  heightCm: number;
  createdAt: string;
};

export type WeightEntry = {
  date: string;
  weightKg: number;
};

type AthleteContextType = {
  profile: AthleteProfile | null;
  isLoading: boolean;
  restoreFailed: boolean;
  weightHistory: WeightEntry[];
  dbUserId: number | null;
  pendingServerWorkoutData: string | null;
  clearPendingServerWorkoutData: () => void;
  setPendingServerWorkoutData: (data: string | null) => void;
  retryRestore: () => Promise<void>;
  saveProfile: (p: AthleteProfile) => Promise<void>;
  clearProfile: () => Promise<void>;
  addWeightEntry: (weightKg: number) => Promise<void>;
  removeWeightEntry: (date: string) => Promise<void>;
  setDbUserId: (id: number) => Promise<void>;
};

const AthleteContext = createContext<AthleteContextType | null>(null);

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") return;
  try { await SecureStore.setItemAsync(key, value); } catch {}
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") return;
  try { await SecureStore.deleteItemAsync(key); } catch {}
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000,
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      return result;
    } catch {
      if (i < retries - 1) await sleep(delayMs * (i + 1));
    }
  }
  return null;
}

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [dbUserId, setDbUserIdState] = useState<number | null>(null);
  const [pendingServerWorkoutData, setPendingServerWorkoutData] = useState<string | null>(null);
  const clearPendingServerWorkoutData = useCallback(() => setPendingServerWorkoutData(null), []);

  const attemptRestore = useCallback(async (): Promise<boolean> => {
    try {
      const [profileJson, historyJson, userIdStr] = await Promise.all([
        AsyncStorage.getItem("athleteProfile"),
        AsyncStorage.getItem("weightHistory"),
        AsyncStorage.getItem("dbUserId"),
      ]);

      const storedUserId = userIdStr ? parseInt(userIdStr, 10) : null;
      if (storedUserId) setDbUserIdState(storedUserId);

      if (profileJson) {
        setProfile(JSON.parse(profileJson));
        if (historyJson) setWeightHistory(JSON.parse(historyJson));
        // If profile exists locally but workout data might be missing (e.g. after
        // fresh install / AsyncStorage wipe scenario), silently recover from server.
        if (storedUserId) {
          const [localSessions, localProgress] = await Promise.all([
            AsyncStorage.getItem("sessionHistory"),
            AsyncStorage.getItem("exerciseProgress"),
          ]);
          const noLocalWorkout =
            (!localSessions || JSON.parse(localSessions).length === 0) &&
            (!localProgress || Object.keys(JSON.parse(localProgress)).length === 0);
          if (noLocalWorkout) {
            fetchProfile(storedUserId)
              .then((result) => {
                if (result?.success && result.workoutData) {
                  setPendingServerWorkoutData(result.workoutData);
                }
              })
              .catch(() => {});
          }
        }
        return true;
      }

      if (storedUserId) {
        const result = await withRetry(() => fetchProfile(storedUserId), 3, 1500);
        if (result?.success && result.profileData) {
          const restored = JSON.parse(result.profileData) as AthleteProfile;
          setProfile(restored);
          await AsyncStorage.setItem("athleteProfile", result.profileData);
          if (historyJson) setWeightHistory(JSON.parse(historyJson));
          if (result.workoutData) setPendingServerWorkoutData(result.workoutData);
          return true;
        }
        return false;
      }

      const secureEmail = await secureGet("userEmail");
      const secureUserId = await secureGet("dbUserId");

      if (secureEmail) {
        const loginResult = await withRetry(() => loginUser(secureEmail), 3, 1500);
        if (loginResult?.success && loginResult.userId) {
          const uid = loginResult.userId;
          setDbUserIdState(uid);
          await AsyncStorage.setItem("dbUserId", String(uid));
          if (loginResult.profileData) {
            const restored = JSON.parse(loginResult.profileData) as AthleteProfile;
            setProfile(restored);
            await AsyncStorage.setItem("athleteProfile", loginResult.profileData);
          }
          if (loginResult.workoutData) setPendingServerWorkoutData(loginResult.workoutData);
          return true;
        }
        return false;
      }

      if (secureUserId) {
        const uid = parseInt(secureUserId, 10);
        const result = await withRetry(() => fetchProfile(uid), 3, 1500);
        if (result?.success && result.profileData) {
          setDbUserIdState(uid);
          await AsyncStorage.setItem("dbUserId", secureUserId);
          const restored = JSON.parse(result.profileData) as AthleteProfile;
          setProfile(restored);
          await AsyncStorage.setItem("athleteProfile", result.profileData);
          if (result.workoutData) setPendingServerWorkoutData(result.workoutData);
          return true;
        }
        return false;
      }
    } catch {}
    return false;
  }, []);

  const hasStoredIdentity = useCallback(async () => {
    const [asyncId, secureEmail, secureId] = await Promise.all([
      AsyncStorage.getItem("dbUserId"),
      secureGet("userEmail"),
      secureGet("dbUserId"),
    ]);
    return !!(asyncId || secureEmail || secureId);
  }, []);

  useEffect(() => {
    (async () => {
      const success = await attemptRestore();
      if (!success) {
        const hasIdentity = await hasStoredIdentity();
        if (hasIdentity) {
          setRestoreFailed(true);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const retryRestore = useCallback(async () => {
    setIsLoading(true);
    setRestoreFailed(false);
    const success = await attemptRestore();
    if (!success) {
      const hasIdentity = await hasStoredIdentity();
      if (hasIdentity) setRestoreFailed(true);
    }
    setIsLoading(false);
  }, [attemptRestore, hasStoredIdentity]);

  const setDbUserId = useCallback(async (id: number) => {
    setDbUserIdState(id);
    await AsyncStorage.setItem("dbUserId", String(id));
    await secureSet("dbUserId", String(id));
  }, []);

  const saveProfile = useCallback(async (p: AthleteProfile) => {
    setProfile(p);
    setRestoreFailed(false);
    const json = JSON.stringify(p);
    await AsyncStorage.setItem("athleteProfile", json);
    if (p.email) await secureSet("userEmail", p.email);
    const userIdStr = await AsyncStorage.getItem("dbUserId");
    const uid = userIdStr ? parseInt(userIdStr, 10) : null;
    if (uid) syncProfile(uid, json).catch(() => {});
  }, []);

  const clearProfile = useCallback(async () => {
    setProfile(null);
    setDbUserIdState(null);
    setRestoreFailed(false);
    await Promise.all([
      AsyncStorage.removeItem("athleteProfile"),
      AsyncStorage.removeItem("dbUserId"),
      AsyncStorage.removeItem("weightHistory"),
      AsyncStorage.removeItem("sessionHistory"),
      AsyncStorage.removeItem("exerciseProgress"),
      AsyncStorage.removeItem("activePlan"),
      AsyncStorage.removeItem("customPlans"),
      AsyncStorage.removeItem("nextDayIdx"),
      AsyncStorage.removeItem("weekNumber"),
      AsyncStorage.removeItem("cycleCount"),
      AsyncStorage.removeItem("currentSession"),
      AsyncStorage.removeItem("__serverWorkoutData__"),
      secureDelete("userEmail"),
      secureDelete("dbUserId"),
    ]);
  }, []);

  const addWeightEntry = useCallback(async (weightKg: number) => {
    const entry: WeightEntry = { date: new Date().toISOString(), weightKg };
    setWeightHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 60);
      AsyncStorage.setItem("weightHistory", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeWeightEntry = useCallback(async (date: string) => {
    setWeightHistory((prev) => {
      const updated = prev.filter((e) => e.date !== date);
      AsyncStorage.setItem("weightHistory", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AthleteContext.Provider
      value={{
        profile, isLoading, restoreFailed, weightHistory, dbUserId,
        pendingServerWorkoutData, clearPendingServerWorkoutData, setPendingServerWorkoutData,
        retryRestore, saveProfile, clearProfile,
        addWeightEntry, removeWeightEntry, setDbUserId,
      }}
    >
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthlete() {
  const ctx = useContext(AthleteContext);
  if (!ctx) throw new Error("useAthlete must be inside AthleteProvider");
  return ctx;
}
