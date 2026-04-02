import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAthlete } from "@/context/AthleteContext";
import { syncProfile, fetchProfile } from "@/lib/api";
import { logWorkoutToHealth } from "@/lib/health";

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
};

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
};

export type WorkoutExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  notes?: string;
};

export type WorkoutSession = {
  id: string;
  planId: string;
  planName: string;
  dayName: string;
  startedAt: string;
  completedAt?: string;
  exercises: WorkoutExercise[];
  duration?: number;
};

export type PlanDay = {
  id: string;
  name: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    restSeconds: number;
  }[];
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  goal: string;
  level: string;
  days: PlanDay[];
  createdAt: string;
};

export type ExerciseProgress = {
  exerciseId: string;
  exerciseName: string;
  history: {
    date: string;
    maxWeight: number;
    totalVolume: number;
    sets: { weight: number; reps: number }[];
  }[];
  suggestedWeight: number;
  suggestedReps: number;
  progressionRate: number;
};

export type PRRecord = {
  exerciseId: string;
  exerciseName: string;
  newPR: number;
  previousPR: number;
};

type WorkoutContextType = {
  plans: WorkoutPlan[];
  activePlan: WorkoutPlan | null;
  currentSession: WorkoutSession | null;
  sessionHistory: WorkoutSession[];
  exerciseProgress: Record<string, ExerciseProgress>;
  nextDayIdx: number;
  nextDay: PlanDay | null;
  weekNumber: number;
  cycleCount: number;
  isDeloadWeek: boolean;
  lastPRs: PRRecord[];
  clearLastPRs: () => void;
  setActivePlan: (plan: WorkoutPlan) => void;
  startWorkout: (plan: WorkoutPlan, day: PlanDay, checkInFactor?: number) => void;
  updateSet: (exerciseIdx: number, setIdx: number, updates: Partial<WorkoutSet>) => void;
  completeWorkout: () => void;
  addSet: (exerciseIdx: number) => void;
  removeSet: (exerciseIdx: number, setIdx: number) => void;
  addPlan: (plan: WorkoutPlan) => void;
  getProgressionSuggestion: (exerciseId: string) => { weight: number; reps: number };
  resetPlan: () => Promise<void>;
  totalWorkouts: number;
  totalVolumeLiftedKg: number;
  streakDays: number;
};

const WorkoutContext = createContext<WorkoutContextType | null>(null);

const DEFAULT_PLANS: WorkoutPlan[] = [
  {
    id: "ppl-split",
    name: "Push / Pull / Legs",
    description: "Klassisches 6-Tage Split für maximalen Muskelaufbau",
    daysPerWeek: 6,
    goal: "Muskelaufbau",
    level: "Intermediate",
    createdAt: new Date().toISOString(),
    days: [
      {
        id: "push-a",
        name: "Push",
        exercises: [
          { exerciseId: "bench-press", exerciseName: "Bankdrücken", sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: "incline-press", exerciseName: "Schrägbankdrücken", sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: "ohp", exerciseName: "Schulterdrücken", sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: "lateral-raise", exerciseName: "Seitheben", sets: 4, reps: 15, restSeconds: 60 },
          { exerciseId: "tricep-pushdown", exerciseName: "Trizepsstrecken", sets: 3, reps: 12, restSeconds: 60 },
        ],
      },
      {
        id: "pull-a",
        name: "Pull",
        exercises: [
          { exerciseId: "deadlift", exerciseName: "Kreuzheben", sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: "pullup", exerciseName: "Klimmzüge", sets: 3, reps: 8, restSeconds: 120 },
          { exerciseId: "cable-row", exerciseName: "Kabelzug Rudern", sets: 3, reps: 12, restSeconds: 90 },
          { exerciseId: "face-pull", exerciseName: "Face Pull", sets: 3, reps: 15, restSeconds: 60 },
          { exerciseId: "bicep-curl", exerciseName: "Bizeps Curl", sets: 3, reps: 12, restSeconds: 60 },
        ],
      },
      {
        id: "legs-a",
        name: "Beine",
        exercises: [
          { exerciseId: "squat", exerciseName: "Kniebeuge", sets: 4, reps: 8, restSeconds: 180 },
          { exerciseId: "leg-press", exerciseName: "Beinpresse", sets: 3, reps: 12, restSeconds: 120 },
          { exerciseId: "leg-curl", exerciseName: "Beinbeuger", sets: 3, reps: 12, restSeconds: 90 },
          { exerciseId: "calf-raise", exerciseName: "Wadenheben", sets: 4, reps: 15, restSeconds: 60 },
          { exerciseId: "leg-ext", exerciseName: "Beinstrecker", sets: 3, reps: 15, restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "ppl-4day",
    name: "Push / Pull / Legs (4 Tage)",
    description: "Klassischer PPL auf 4 Tage aufgeteilt – ideal für Berufstätige",
    daysPerWeek: 4,
    goal: "Muskelaufbau",
    level: "Intermediate",
    createdAt: new Date().toISOString(),
    days: [
      {
        id: "ppl4-push",
        name: "Push – Brust & Schulter",
        exercises: [
          { exerciseId: "bench-press", exerciseName: "Bankdrücken", sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: "incline-press", exerciseName: "Schrägbankdrücken", sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: "ohp", exerciseName: "Schulterdrücken", sets: 3, reps: 10, restSeconds: 90 },
          { exerciseId: "lateral-raise", exerciseName: "Seitheben", sets: 4, reps: 15, restSeconds: 60 },
          { exerciseId: "tricep-pushdown", exerciseName: "Trizepsstrecken", sets: 3, reps: 12, restSeconds: 60 },
        ],
      },
      {
        id: "ppl4-pull",
        name: "Pull – Rücken & Bizeps",
        exercises: [
          { exerciseId: "deadlift", exerciseName: "Kreuzheben", sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: "pullup", exerciseName: "Klimmzüge", sets: 3, reps: 8, restSeconds: 120 },
          { exerciseId: "cable-row", exerciseName: "Kabelzug Rudern", sets: 3, reps: 12, restSeconds: 90 },
          { exerciseId: "face-pull", exerciseName: "Face Pull", sets: 3, reps: 15, restSeconds: 60 },
          { exerciseId: "bicep-curl", exerciseName: "Bizeps Curl", sets: 3, reps: 12, restSeconds: 60 },
        ],
      },
      {
        id: "ppl4-legs",
        name: "Beine",
        exercises: [
          { exerciseId: "squat", exerciseName: "Kniebeuge", sets: 4, reps: 8, restSeconds: 180 },
          { exerciseId: "leg-press", exerciseName: "Beinpresse", sets: 3, reps: 12, restSeconds: 120 },
          { exerciseId: "leg-curl", exerciseName: "Beinbeuger", sets: 3, reps: 12, restSeconds: 90 },
          { exerciseId: "calf-raise", exerciseName: "Wadenheben", sets: 4, reps: 15, restSeconds: 60 },
        ],
      },
      {
        id: "ppl4-arms",
        name: "Arme & Schultern",
        exercises: [
          { exerciseId: "incline-curl", exerciseName: "Schrägbank Curl", sets: 3, reps: 12, restSeconds: 75 },
          { exerciseId: "hammer-curl", exerciseName: "Hammer Curl", sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: "overhead-ext", exerciseName: "Trizeps Überkopf", sets: 3, reps: 12, restSeconds: 60 },
          { exerciseId: "lateral-raise", exerciseName: "Seitheben", sets: 4, reps: 15, restSeconds: 60 },
          { exerciseId: "front-raise", exerciseName: "Frontheben", sets: 3, reps: 15, restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    description: "4-Tage Upper/Lower Split für Kraft und Muskelaufbau",
    daysPerWeek: 4,
    goal: "Kraft & Masse",
    level: "Beginner",
    createdAt: new Date().toISOString(),
    days: [
      {
        id: "upper-a",
        name: "Oberkörper",
        exercises: [
          { exerciseId: "bench-press", exerciseName: "Bankdrücken", sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: "pullup", exerciseName: "Klimmzüge", sets: 4, reps: 8, restSeconds: 120 },
          { exerciseId: "ohp", exerciseName: "Schulterdrücken", sets: 3, reps: 8, restSeconds: 120 },
          { exerciseId: "cable-row", exerciseName: "Kabelzug Rudern", sets: 3, reps: 10, restSeconds: 90 },
        ],
      },
      {
        id: "lower-a",
        name: "Unterkörper",
        exercises: [
          { exerciseId: "squat", exerciseName: "Kniebeuge", sets: 4, reps: 6, restSeconds: 180 },
          { exerciseId: "deadlift", exerciseName: "Kreuzheben", sets: 3, reps: 5, restSeconds: 180 },
          { exerciseId: "leg-press", exerciseName: "Beinpresse", sets: 3, reps: 12, restSeconds: 120 },
          { exerciseId: "leg-curl", exerciseName: "Beinbeuger", sets: 3, reps: 12, restSeconds: 90 },
        ],
      },
    ],
  },
];

function calcSuggestedWeight(history: ExerciseProgress["history"]): { weight: number; reps: number } {
  if (history.length === 0) return { weight: 20, reps: 10 };
  const recent = history.slice(-3);
  const avgWeight = recent.reduce((s, h) => s + h.maxWeight, 0) / recent.length;
  const lastEntry = history[history.length - 1];

  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const improved = lastEntry.maxWeight >= prev.maxWeight && lastEntry.totalVolume >= prev.totalVolume;
    if (improved) {
      return { weight: Math.round((avgWeight + 2.5) * 2) / 2, reps: 8 };
    }
  }
  return { weight: Math.round(avgWeight * 2) / 2, reps: 10 };
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const { pendingServerWorkoutData, clearPendingServerWorkoutData } = useAthlete();
  const [plans, setPlans] = useState<WorkoutPlan[]>(DEFAULT_PLANS);
  const [activePlan, setActivePlanState] = useState<WorkoutPlan | null>(null);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<WorkoutSession[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, ExerciseProgress>>({});
  const [nextDayIdx, setNextDayIdx] = useState(0);
  const [weekNumber, setWeekNumber] = useState(1);
  const [cycleCount, setCycleCount] = useState(0);
  const [lastPRs, setLastPRs] = useState<PRRecord[]>([]);
  const clearLastPRs = useCallback(() => setLastPRs([]), []);

  // Guard: prevents currentSession effect and AppState sync from running before
  // the initial AsyncStorage load completes (avoids overwriting data with empty state)
  const initialLoadDone = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [historyJson, progressJson, activePlanJson, plansJson, nextDayJson, weekJson, cycleJson, currentSessionJson] = await Promise.all([
          AsyncStorage.getItem("sessionHistory"),
          AsyncStorage.getItem("exerciseProgress"),
          AsyncStorage.getItem("activePlan"),
          AsyncStorage.getItem("customPlans"),
          AsyncStorage.getItem("nextDayIdx"),
          AsyncStorage.getItem("weekNumber"),
          AsyncStorage.getItem("cycleCount"),
          AsyncStorage.getItem("currentSession"),
        ]);

        const localHistory: WorkoutSession[] = historyJson ? JSON.parse(historyJson) : [];
        const localProgress: Record<string, ExerciseProgress> = progressJson ? JSON.parse(progressJson) : {};
        const localActivePlan: WorkoutPlan | null = activePlanJson ? JSON.parse(activePlanJson) : null;
        const localNextDay: number = nextDayJson ? JSON.parse(nextDayJson) : 0;
        const localWeek: number = weekJson ? JSON.parse(weekJson) : 1;
        const localCycle: number = cycleJson ? JSON.parse(cycleJson) : 0;

        if (localHistory.length > 0) setSessionHistory(localHistory);
        if (Object.keys(localProgress).length > 0) setExerciseProgress(localProgress);
        if (localActivePlan) setActivePlanState(localActivePlan);
        if (nextDayJson) setNextDayIdx(localNextDay);
        if (weekJson) setWeekNumber(localWeek);
        if (cycleJson) setCycleCount(localCycle);
        if (currentSessionJson) setCurrentSession(JSON.parse(currentSessionJson));
        if (plansJson) {
          const custom = JSON.parse(plansJson) as WorkoutPlan[];
          setPlans((prev) => [...prev, ...custom.filter((c) => !prev.find((p) => p.id === c.id))]);
        }

        const hasLocalData = localHistory.length > 0 || Object.keys(localProgress).length > 0;
        const userIdStr = await AsyncStorage.getItem("dbUserId");

        if (hasLocalData) {
          // IMMEDIATE BACKUP: Sync local data to server right away to protect against crashes.
          if (userIdStr) {
            const uid = parseInt(userIdStr, 10);
            const snapshot = {
              sessionHistory: localHistory,
              exerciseProgress: localProgress,
              activePlanId: localActivePlan?.id ?? null,
              nextDayIdx: localNextDay,
              weekNumber: localWeek,
              cycleCount: localCycle,
            };
            syncProfile(uid, undefined, JSON.stringify(snapshot)).catch(() => {});
          }
        } else if (userIdStr) {
          // NO LOCAL DATA: AsyncStorage was wiped (app update, device reset, etc.)
          // → Recover workout data directly from server before anything else runs.
          try {
            const uid = parseInt(userIdStr, 10);
            const result = await fetchProfile(uid);
            if (result.success && result.workoutData) {
              const sd = JSON.parse(result.workoutData);
              if (Array.isArray(sd.sessionHistory) && sd.sessionHistory.length > 0) {
                setSessionHistory(sd.sessionHistory);
                await AsyncStorage.setItem("sessionHistory", JSON.stringify(sd.sessionHistory));
              }
              if (sd.exerciseProgress && Object.keys(sd.exerciseProgress).length > 0) {
                setExerciseProgress(sd.exerciseProgress);
                await AsyncStorage.setItem("exerciseProgress", JSON.stringify(sd.exerciseProgress));
              }
              if (sd.nextDayIdx !== undefined) {
                setNextDayIdx(sd.nextDayIdx);
                await AsyncStorage.setItem("nextDayIdx", JSON.stringify(sd.nextDayIdx));
              }
              if (sd.weekNumber !== undefined) {
                setWeekNumber(sd.weekNumber);
                await AsyncStorage.setItem("weekNumber", JSON.stringify(sd.weekNumber));
              }
              if (sd.cycleCount !== undefined) {
                setCycleCount(sd.cycleCount);
                await AsyncStorage.setItem("cycleCount", JSON.stringify(sd.cycleCount));
              }
              if (sd.activePlan) {
                setActivePlanState(sd.activePlan);
                await AsyncStorage.setItem("activePlan", JSON.stringify(sd.activePlan));
              } else if (sd.activePlanId && !localActivePlan) {
                const found = DEFAULT_PLANS.find((p) => p.id === sd.activePlanId);
                if (found) {
                  setActivePlanState(found);
                  await AsyncStorage.setItem("activePlan", JSON.stringify(found));
                }
              }
            }
          } catch {}
        }
      } catch {}
      // Mark load as complete — only now can other effects safely write/save
      initialLoadDone.current = true;
    })();
  }, []);

  useEffect(() => {
    // Only persist currentSession changes AFTER the initial load.
    // Without this guard, the very first render (currentSession = null)
    // would delete any in-progress session saved from a previous run.
    if (!initialLoadDone.current) return;
    if (currentSession) {
      AsyncStorage.setItem("currentSession", JSON.stringify(currentSession));
    } else {
      AsyncStorage.removeItem("currentSession");
    }
  }, [currentSession]);

  useEffect(() => {
    if (!pendingServerWorkoutData) return;
    (async () => {
      try {
        const serverData = JSON.parse(pendingServerWorkoutData);

        // SAFE MERGE: Server data only fills gaps — never overwrites newer local data.
        // For sessionHistory: keep the version with more entries.
        if (serverData.sessionHistory && Array.isArray(serverData.sessionHistory)) {
          const localJson = await AsyncStorage.getItem("sessionHistory");
          const localHistory: WorkoutSession[] = localJson ? JSON.parse(localJson) : [];
          if (serverData.sessionHistory.length > localHistory.length) {
            // Server has more sessions — merge so we don't lose either side
            const merged = [...serverData.sessionHistory];
            for (const s of localHistory) {
              if (!merged.find((m) => m.id === s.id)) merged.push(s);
            }
            merged.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
            setSessionHistory(merged);
            await AsyncStorage.setItem("sessionHistory", JSON.stringify(merged));
          } else if (localHistory.length === 0 && serverData.sessionHistory.length > 0) {
            setSessionHistory(serverData.sessionHistory);
            await AsyncStorage.setItem("sessionHistory", JSON.stringify(serverData.sessionHistory));
          }
          // else: local has more data → keep local, ignore server
        }

        // For exerciseProgress: merge per-exercise, keeping the one with more history
        if (serverData.exerciseProgress && typeof serverData.exerciseProgress === "object") {
          const localJson = await AsyncStorage.getItem("exerciseProgress");
          const localProgress: Record<string, ExerciseProgress> = localJson ? JSON.parse(localJson) : {};
          const hasLocalData = Object.keys(localProgress).length > 0;
          const hasServerData = Object.keys(serverData.exerciseProgress).length > 0;

          if (!hasLocalData && hasServerData) {
            // No local data at all — use server data
            setExerciseProgress(serverData.exerciseProgress);
            await AsyncStorage.setItem("exerciseProgress", JSON.stringify(serverData.exerciseProgress));
          } else if (hasLocalData && hasServerData) {
            // Merge: for each exercise take the version with more history
            const merged = { ...localProgress };
            for (const [id, serverEp] of Object.entries(serverData.exerciseProgress as Record<string, ExerciseProgress>)) {
              const localEp = localProgress[id];
              if (!localEp || serverEp.history.length > localEp.history.length) {
                merged[id] = serverEp;
              }
            }
            setExerciseProgress(merged);
            await AsyncStorage.setItem("exerciseProgress", JSON.stringify(merged));
          }
          // else: server has no data → keep local
        }

        // For counters: only apply if local values are still at defaults (1/0/0)
        const localWeekJson = await AsyncStorage.getItem("weekNumber");
        const localNextDayJson = await AsyncStorage.getItem("nextDayIdx");
        const localCycleJson = await AsyncStorage.getItem("cycleCount");
        const localWeek = localWeekJson ? JSON.parse(localWeekJson) : 1;
        const localNextDay = localNextDayJson ? JSON.parse(localNextDayJson) : 0;
        const localCycle = localCycleJson ? JSON.parse(localCycleJson) : 0;

        if (serverData.nextDayIdx !== undefined && localNextDay === 0 && serverData.nextDayIdx > 0) {
          setNextDayIdx(serverData.nextDayIdx);
          await AsyncStorage.setItem("nextDayIdx", JSON.stringify(serverData.nextDayIdx));
        }
        if (serverData.weekNumber !== undefined && localWeek <= 1 && serverData.weekNumber > 1) {
          setWeekNumber(serverData.weekNumber);
          await AsyncStorage.setItem("weekNumber", JSON.stringify(serverData.weekNumber));
        }
        if (serverData.cycleCount !== undefined && localCycle === 0 && serverData.cycleCount > 0) {
          setCycleCount(serverData.cycleCount);
          await AsyncStorage.setItem("cycleCount", JSON.stringify(serverData.cycleCount));
        }

        if (serverData.customPlans) {
          const custom = serverData.customPlans as WorkoutPlan[];
          setPlans((prev) => [...prev, ...custom.filter((c) => !prev.find((p) => p.id === c.id))]);
          await AsyncStorage.setItem("customPlans", JSON.stringify(custom));
        }
        if (serverData.activePlanId) {
          const localActivePlanJson = await AsyncStorage.getItem("activePlan");
          if (!localActivePlanJson) {
            const allPlans = [...DEFAULT_PLANS, ...(serverData.customPlans ?? [])];
            const found = allPlans.find((p) => p.id === serverData.activePlanId);
            if (found) {
              setActivePlanState(found);
              await AsyncStorage.setItem("activePlan", JSON.stringify(found));
            }
          }
        }
      } catch {}
      clearPendingServerWorkoutData();
    })();
  }, [pendingServerWorkoutData, clearPendingServerWorkoutData]);

  const latestWorkoutRef = useRef<{
    sessionHistory: WorkoutSession[];
    exerciseProgress: Record<string, ExerciseProgress>;
    activePlan: WorkoutPlan | null;
    nextDayIdx: number;
    cycleCount: number;
    weekNumber: number;
  } | null>(null);

  useEffect(() => {
    latestWorkoutRef.current = { sessionHistory, exerciseProgress, activePlan, nextDayIdx, cycleCount, weekNumber };
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        // CRITICAL: Only sync after the initial load is done.
        // If we sync while loading (state is still empty), we'd overwrite
        // the user's actual data on the server with empty arrays.
        if (!initialLoadDone.current) return;
        try {
          const userIdStr = await AsyncStorage.getItem("dbUserId");
          if (!userIdStr || !latestWorkoutRef.current) return;
          // Also guard: don't save if all data is still at defaults
          const d = latestWorkoutRef.current;
          const hasData = d.sessionHistory.length > 0 || Object.keys(d.exerciseProgress).length > 0;
          if (!hasData) return;
          const uid = parseInt(userIdStr, 10);
          const workoutSnapshot = {
            sessionHistory: d.sessionHistory,
            exerciseProgress: d.exerciseProgress,
            activePlan: d.activePlan,          // full object for recovery
            activePlanId: d.activePlan?.id ?? null,
            nextDayIdx: d.nextDayIdx,
            cycleCount: d.cycleCount,
            weekNumber: d.weekNumber,
          };
          syncProfile(uid, undefined, JSON.stringify(workoutSnapshot)).catch(() => {});
        } catch {}
      }
    });
    return () => subscription.remove();
  }, []);

  const setActivePlan = useCallback((plan: WorkoutPlan) => {
    setActivePlanState(plan);
    setNextDayIdx(0);
    setWeekNumber(1);
    setCycleCount(0);
    AsyncStorage.setItem("activePlan", JSON.stringify(plan));
    AsyncStorage.setItem("nextDayIdx", "0");
    AsyncStorage.setItem("weekNumber", "1");
    AsyncStorage.setItem("cycleCount", "0");
  }, []);

  const startWorkout = useCallback(
    (plan: WorkoutPlan, day: PlanDay, checkInFactor: number = 1.0) => {
      const currentIsDeload = weekNumber > 0 && weekNumber % 5 === 0;
      const completedDeloads = Math.floor((weekNumber - 1) / 5);
      const progressionBonus = completedDeloads * 0.05;

      const session: WorkoutSession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        planId: plan.id,
        planName: plan.name,
        dayName: currentIsDeload ? `${day.name} – Deload` : day.name,
        startedAt: new Date().toISOString(),
        exercises: day.exercises.map((e) => {
          const suggestion = calcSuggestedWeight(exerciseProgress[e.exerciseId]?.history ?? []);
          let targetWeight = Math.round((suggestion.weight * (1 + progressionBonus) * checkInFactor) * 2) / 2;
          let targetSets = e.sets;
          if (currentIsDeload) {
            targetWeight = Math.round((suggestion.weight * 0.6 * checkInFactor) * 2) / 2;
            targetSets = Math.min(3, e.sets);
          }
          return {
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            targetSets,
            targetReps: e.reps,
            targetWeight,
            sets: Array.from({ length: targetSets }, (_, i) => ({
              id: `${i}-${Date.now()}`,
              weight: targetWeight,
              reps: e.reps,
              completed: false,
            })),
          };
        }),
      };
      setCurrentSession(session);
    },
    [exerciseProgress, weekNumber],
  );

  const updateSet = useCallback((exerciseIdx: number, setIdx: number, updates: Partial<WorkoutSet>) => {
    setCurrentSession((prev) => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const sets = [...exercises[exerciseIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...updates };
      exercises[exerciseIdx] = { ...exercises[exerciseIdx], sets };
      return { ...prev, exercises };
    });
  }, []);

  const addSet = useCallback((exerciseIdx: number) => {
    setCurrentSession((prev) => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = exercises[exerciseIdx];
      const lastSet = ex.sets[ex.sets.length - 1] ?? { weight: ex.targetWeight, reps: ex.targetReps };
      exercises[exerciseIdx] = {
        ...ex,
        sets: [
          ...ex.sets,
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            weight: lastSet.weight,
            reps: lastSet.reps,
            completed: false,
          },
        ],
      };
      return { ...prev, exercises };
    });
  }, []);

  const removeSet = useCallback((exerciseIdx: number, setIdx: number) => {
    setCurrentSession((prev) => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const sets = exercises[exerciseIdx].sets.filter((_, i) => i !== setIdx);
      exercises[exerciseIdx] = { ...exercises[exerciseIdx], sets };
      return { ...prev, exercises };
    });
  }, []);

  const completeWorkout = useCallback(() => {
    if (!currentSession) return;

    // Auto-mark any sets with weight > 0 as completed so volume is never 0
    const finalizedExercises = currentSession.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.weight > 0 ? { ...s, completed: true } : s)),
    }));

    const completed: WorkoutSession = {
      ...currentSession,
      exercises: finalizedExercises,
      completedAt: new Date().toISOString(),
      duration: Math.round((Date.now() - new Date(currentSession.startedAt).getTime()) / 60000),
    };

    const newHistory = [completed, ...sessionHistory];
    setSessionHistory(newHistory);
    AsyncStorage.setItem("sessionHistory", JSON.stringify(newHistory));

    const newProgress = { ...exerciseProgress };
    const newPRs: PRRecord[] = [];
    for (const ex of completed.exercises) {
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;
      const maxWeight = Math.max(...completedSets.map((s) => s.weight));
      const totalVolume = completedSets.reduce((s, set) => s + set.weight * set.reps, 0);
      const prev = newProgress[ex.exerciseId] ?? {
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        history: [],
        suggestedWeight: ex.targetWeight,
        suggestedReps: ex.targetReps,
        progressionRate: 0,
      };
      const previousPR = prev.history.length > 0 ? Math.max(...prev.history.map((h) => h.maxWeight)) : 0;
      if (previousPR > 0 && maxWeight > previousPR) {
        newPRs.push({ exerciseId: ex.exerciseId, exerciseName: ex.exerciseName, newPR: maxWeight, previousPR });
      }
      const history = [
        ...prev.history,
        {
          date: completed.completedAt!,
          maxWeight,
          totalVolume,
          sets: completedSets.map((s) => ({ weight: s.weight, reps: s.reps })),
        },
      ].slice(-20);
      const suggestion = calcSuggestedWeight(history);
      newProgress[ex.exerciseId] = {
        ...prev,
        history,
        suggestedWeight: suggestion.weight,
        suggestedReps: suggestion.reps,
        progressionRate: history.length >= 2 ? ((history[history.length - 1].maxWeight - history[0].maxWeight) / history[0].maxWeight) * 100 : 0,
      };
    }
    setExerciseProgress(newProgress);
    AsyncStorage.setItem("exerciseProgress", JSON.stringify(newProgress));
    if (newPRs.length > 0) setLastPRs(newPRs);

    // ── Sync to health platform (silent, best-effort) ──────────────────────
    logWorkoutToHealth({
      startTime: new Date(completed.startedAt),
      endTime: new Date(completed.completedAt!),
      totalVolumeKg: completed.exercises.reduce(
        (t, ex) => t + ex.sets.filter((s) => s.completed).reduce((ts, s) => ts + s.weight * s.reps, 0),
        0,
      ),
      totalSets: completed.exercises.reduce((t, ex) => t + ex.sets.filter((s) => s.completed).length, 0),
      planName: completed.planName,
      dayName: completed.dayName,
    }).catch(() => {});

    (async () => {
      try {
        const userIdStr = await AsyncStorage.getItem("dbUserId");
        if (userIdStr) {
          const uid = parseInt(userIdStr, 10);
          const [plansJson, nextDayStr, weekStr, cycleStr] = await Promise.all([
            AsyncStorage.getItem("customPlans"),
            AsyncStorage.getItem("nextDayIdx"),
            AsyncStorage.getItem("weekNumber"),
            AsyncStorage.getItem("cycleCount"),
          ]);
          const workoutSnapshot = {
            sessionHistory: newHistory,
            exerciseProgress: newProgress,
            activePlan: activePlan,          // full object so recovery can restore it
            activePlanId: activePlan?.id ?? null,
            nextDayIdx: nextDayStr ? JSON.parse(nextDayStr) : 0,
            weekNumber: weekStr ? JSON.parse(weekStr) : 1,
            cycleCount: cycleStr ? JSON.parse(cycleStr) : 0,
            customPlans: plansJson ? JSON.parse(plansJson) : [],
          };
          syncProfile(uid, undefined, JSON.stringify(workoutSnapshot)).catch(() => {});
        }
      } catch {}
    })();

    setCurrentSession((prev) => {
      if (!prev) return null;
      const plan = activePlan;
      if (plan) {
        const newIdx = (nextDayIdx + 1) % plan.days.length;
        setNextDayIdx(newIdx);
        AsyncStorage.setItem("nextDayIdx", JSON.stringify(newIdx));
        if (newIdx === 0) {
          const newCycle = cycleCount + 1;
          const newWeek = weekNumber + 1;
          setCycleCount(newCycle);
          setWeekNumber(newWeek);
          AsyncStorage.setItem("cycleCount", JSON.stringify(newCycle));
          AsyncStorage.setItem("weekNumber", JSON.stringify(newWeek));
        }
      }
      return null;
    });
  }, [currentSession, sessionHistory, exerciseProgress, activePlan, nextDayIdx, cycleCount, weekNumber]);

  const addPlan = useCallback(
    (plan: WorkoutPlan) => {
      const newPlans = [...plans, plan];
      setPlans(newPlans);
      const custom = newPlans.filter((p) => !DEFAULT_PLANS.find((d) => d.id === p.id));
      AsyncStorage.setItem("customPlans", JSON.stringify(custom));
    },
    [plans],
  );

  const getProgressionSuggestion = useCallback(
    (exerciseId: string) => {
      const prog = exerciseProgress[exerciseId];
      if (!prog) return { weight: 20, reps: 10 };
      return { weight: prog.suggestedWeight, reps: prog.suggestedReps };
    },
    [exerciseProgress],
  );

  const resetPlan = useCallback(async () => {
    setNextDayIdx(0);
    setWeekNumber(1);
    setCycleCount(0);
    setExerciseProgress({});
    setSessionHistory([]);
    await Promise.all([
      AsyncStorage.setItem("nextDayIdx", JSON.stringify(0)),
      AsyncStorage.setItem("weekNumber", JSON.stringify(1)),
      AsyncStorage.setItem("cycleCount", JSON.stringify(0)),
      AsyncStorage.removeItem("exerciseProgress"),
      AsyncStorage.removeItem("sessionHistory"),
    ]);
  }, []);

  const totalWorkouts = sessionHistory.length;
  const totalVolumeLiftedKg = sessionHistory.reduce(
    (total, session) =>
      total +
      session.exercises.reduce(
        (eTotal, ex) =>
          eTotal +
          ex.sets.filter((s) => s.completed).reduce((sTotal, s) => sTotal + s.weight * s.reps, 0),
        0,
      ),
    0,
  );

  const streakDays = (() => {
    if (sessionHistory.length === 0) return 0;
    const dates = sessionHistory
      .map((s) => new Date(s.completedAt ?? s.startedAt).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
      .reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (dates[i] === expected.toDateString()) streak++;
      else break;
    }
    return streak;
  })();

  const nextDay = activePlan ? activePlan.days[nextDayIdx % activePlan.days.length] ?? null : null;
  const isDeloadWeek = weekNumber > 0 && weekNumber % 5 === 0;

  return (
    <WorkoutContext.Provider
      value={{
        plans,
        activePlan,
        currentSession,
        sessionHistory,
        exerciseProgress,
        nextDayIdx,
        nextDay,
        weekNumber,
        cycleCount,
        isDeloadWeek,
        lastPRs,
        clearLastPRs,
        setActivePlan,
        startWorkout,
        updateSet,
        completeWorkout,
        addSet,
        removeSet,
        addPlan,
        getProgressionSuggestion,
        resetPlan,
        totalWorkouts,
        totalVolumeLiftedKg,
        streakDays,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be inside WorkoutProvider");
  return ctx;
}
