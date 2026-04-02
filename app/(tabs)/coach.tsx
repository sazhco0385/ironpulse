import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { AppIcon } from "@/components/AppIcon";
import { ExerciseImage } from "@/components/ExerciseImage";
import { GradientCard } from "@/components/GradientCard";
import { PremiumLockSheet } from "@/components/PremiumLockSheet";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/hooks/usePremium";
import { analyzeExercise, isCompound, RATING_COLORS, RATING_ICONS, type CoachAdvice, type CoachRating } from "@/lib/coach";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

type AIResult = {
  headline: string;
  rating: CoachRating;
  feedback: string;
  technique_tip: string;
  next_weight: number;
  next_reps: number;
  motivation: string;
};

type EnrichedCoaching = {
  exerciseId: string;
  exerciseName: string;
  localAdvice: CoachAdvice;
  ai: AIResult | null;
  loading: boolean;
  error: boolean;
  targetReps: number;
  targetWeight: number;
};

async function fetchAICoaching(
  exercise: string,
  sets: Array<{ weight: number; reps: number; targetReps: number }>,
  isComp: boolean,
  lastWeight: number,
  targetReps: number,
): Promise<AIResult> {
  const res = await fetch(`${BASE_URL}/api/coach/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      exercise,
      sets,
      isCompound: isComp,
      lastWeight,
      targetReps,
    }),
  });
  if (!res.ok) throw new Error("AI request failed");
  return res.json() as Promise<AIResult>;
}

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessionHistory, exerciseProgress } = useWorkout();
  const { isPremium } = usePremium();
  const [lockSheet, setLockSheet] = useState(false);
  const [coachingList, setCoachingList] = useState<EnrichedCoaching[]>([]);
  const [aiMotivation, setAiMotivation] = useState<string | null>(null);
  const prevSessionId = useRef<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = isWeb ? 0 : 60;
  const bottomPad = isWeb ? 34 : insets.bottom + TAB_BAR_HEIGHT;

  const lastSession = sessionHistory[0] ?? null;
  const sessionId = lastSession?.startedAt ?? null;

  const loadCoaching = useCallback(async () => {
    if (!lastSession || !isPremium) return;

    const initialList: EnrichedCoaching[] = lastSession.exercises.map((ex) => {
      const done = ex.sets.filter((s) => s.completed);
      const localAdvice = analyzeExercise(
        ex.exerciseName,
        done.map((s) => ({ weight: s.weight, reps: s.reps })),
        ex.targetReps,
        ex.targetWeight,
      );
      return {
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        localAdvice,
        ai: null,
        loading: true,
        error: false,
        targetReps: ex.targetReps,
        targetWeight: ex.targetWeight,
      };
    });
    setCoachingList(initialList);

    lastSession.exercises.forEach(async (ex, idx) => {
      const done = ex.sets.filter((s) => s.completed);
      const comp = isCompound(ex.exerciseName);
      try {
        const ai = await fetchAICoaching(
          ex.exerciseName,
          done.map((s) => ({ weight: s.weight, reps: s.reps, targetReps: ex.targetReps })),
          comp,
          ex.targetWeight,
          ex.targetReps,
        );
        setCoachingList((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], ai, loading: false };
          return next;
        });
        if (idx === 0 && ai.motivation) {
          setAiMotivation(ai.motivation);
        }
      } catch {
        setCoachingList((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], loading: false, error: true };
          return next;
        });
      }
    });
  }, [lastSession, isPremium]);

  useEffect(() => {
    if (sessionId !== prevSessionId.current) {
      prevSessionId.current = sessionId;
      setAiMotivation(null);
      loadCoaching();
    }
  }, [sessionId, loadCoaching]);

  useEffect(() => {
    if (isPremium && coachingList.length === 0 && lastSession) {
      loadCoaching();
    }
  }, [isPremium]);

  const overallRating = React.useMemo(() => {
    if (coachingList.length === 0) return null;
    const ratings: Record<CoachRating, number> = { excellent: 3, good: 2, ok: 1, struggling: 0 };
    const rlist = coachingList.map((c) =>
      c.ai ? (c.ai.rating in ratings ? ratings[c.ai.rating as CoachRating] : 2) : ratings[c.localAdvice.rating]
    );
    const avg = rlist.reduce((s, v) => s + v, 0) / rlist.length;
    if (avg >= 2.5) return { label: "Ausgezeichnetes Training!", color: colors.success, icon: "zap" };
    if (avg >= 1.8) return { label: "Solides Training", color: colors.primary, icon: "thumbs-up" };
    if (avg >= 1.0) return { label: "Weiter dran bleiben", color: colors.warning, icon: "target" };
    return { label: "Anpassungen nötig", color: colors.destructive, icon: "alert-circle" };
  }, [coachingList, colors]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.coachBadge, { backgroundColor: colors.primary + "20" }]}>
            <AppIcon name="user-check" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              KI-Coach
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Persönliche KI-Trainingsanalyse
            </Text>
          </View>
        </View>
        <View style={[styles.aiBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
          <AppIcon name="zap" size={11} color={colors.primary} />
          <Text style={[styles.aiBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>GPT</Text>
        </View>
      </View>

      {!isPremium ? (
        <View style={styles.lockWrap}>
          <GradientCard variant="primary" style={styles.lockCard}>
            <View style={[styles.lockIcon, { backgroundColor: colors.primary + "22" }]}>
              <AppIcon name="user-check" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.lockTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              KI-Coach – Premium Feature
            </Text>
            <Text style={[styles.lockDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Dein persönlicher KI-Trainer analysiert jede Übung und gibt dir individuelle Empfehlungen — powered by ChatGPT.
            </Text>
            <View style={styles.lockFeatures}>
              {[
                "KI-Analyse nach jedem Training (ChatGPT)",
                "Personalisierte Gewichts-Empfehlungen",
                "Technik-Tipps für jede Übung",
                "Motivationscoaching vom Profi-KI",
              ].map((f) => (
                <View key={f} style={styles.lockFeatureRow}>
                  <AppIcon name="check" size={13} color={colors.primary} />
                  <Text style={[styles.lockFeatureText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.lockBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/premium")}
              activeOpacity={0.85}
            >
              <AppIcon name="zap" size={16} color="#000" />
              <Text style={[styles.lockBtnText, { fontFamily: "Inter_700Bold" }]}>KI-Coach freischalten</Text>
            </TouchableOpacity>
          </GradientCard>
        </View>
      ) : !lastSession ? (
        <View style={styles.emptyWrap}>
          <AppIcon name="user-check" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Noch kein Training absolviert
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Absolviere dein erstes Training — danach analysiert dein persönlicher KI-Coach jede Übung.
          </Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={() => router.push("/(tabs)/")}
          >
            <Text style={[styles.startBtnText, { fontFamily: "Inter_700Bold" }]}>Training starten</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {overallRating && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <GradientCard variant="primary" style={styles.scoreCard}>
                <View style={styles.scoreRow}>
                  <View style={[styles.scoreIcon, { backgroundColor: overallRating.color + "22" }]}>
                    <AppIcon name={overallRating.icon as any} size={26} color={overallRating.color} />
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={[styles.scoreLabel, { color: overallRating.color, fontFamily: "Inter_700Bold" }]}>
                      {overallRating.label}
                    </Text>
                    <Text style={[styles.scoreSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {lastSession.dayName} · {lastSession.exercises.length} Übungen
                    </Text>
                    {aiMotivation && (
                      <Text style={[styles.scoreMotivation, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                        "{aiMotivation}"
                      </Text>
                    )}
                  </View>
                </View>
              </GradientCard>
            </Animated.View>
          )}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
            KI-ANALYSE – LETZTES TRAINING
          </Text>

          {coachingList.map((item, i) => {
            const effectiveRating: CoachRating = item.ai
              ? (["excellent", "good", "ok", "struggling"].includes(item.ai.rating)
                  ? item.ai.rating
                  : item.localAdvice.rating)
              : item.localAdvice.rating;
            const rc = RATING_COLORS[effectiveRating];

            const headline = item.ai?.headline ?? item.localAdvice.headline;
            const feedback = item.ai?.feedback ?? item.localAdvice.detail;
            const tip = item.ai?.technique_tip ?? item.localAdvice.tip;
            const nextWeight = item.ai?.next_weight ?? item.localAdvice.nextWeight;
            const nextReps = item.ai?.next_reps ?? item.localAdvice.nextReps;

            return (
              <Animated.View key={item.exerciseId + i} entering={FadeInDown.delay(i * 60).duration(350)}>
                <GradientCard style={styles.coachCard}>
                  <View style={styles.coachBanner}>
                    <ExerciseImage
                      exerciseId={item.exerciseId}
                      exerciseName={item.exerciseName}
                      width={0}
                      height={140}
                      borderRadius={10}
                    />
                    <View style={[styles.coachBannerOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
                      <View style={[styles.ratingPill, { backgroundColor: rc.bg, borderColor: rc.border }]}>
                        <AppIcon name={RATING_ICONS[effectiveRating] as any} size={12} color={rc.text} />
                        <Text style={[styles.ratingPillText, { color: rc.text, fontFamily: "Inter_700Bold" }]}>
                          {effectiveRating === "excellent" ? "Ausgezeichnet" : effectiveRating === "good" ? "Gut" : effectiveRating === "ok" ? "OK" : "Schwer"}
                        </Text>
                      </View>
                      <Text style={[styles.coachBannerName, { fontFamily: "Inter_700Bold" }]}>
                        {item.exerciseName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.coachCardHeader}>
                    <View style={styles.coachCardMeta}>
                      <Text style={[styles.coachExName, { color: colors.foreground, fontFamily: "Inter_600SemiBold", display: "none" }]}>
                        {item.exerciseName}
                      </Text>
                      {item.loading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                            KI analysiert…
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.aiHeadlineRow}>
                          {item.ai && !item.error && (
                            <View style={[styles.aiChip, { backgroundColor: colors.primary + "18" }]}>
                              <AppIcon name="zap" size={9} color={colors.primary} />
                              <Text style={[styles.aiChipText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>KI</Text>
                            </View>
                          )}
                          <Text style={[styles.coachHeadline, { color: rc.text, fontFamily: "Inter_700Bold" }]}>
                            {headline}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!item.loading && (
                    <>
                      <Text style={[styles.coachDetail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {feedback}
                      </Text>

                      <View style={[styles.nextTargets, { backgroundColor: rc.bg, borderColor: rc.border }]}>
                        <View style={styles.targetCol}>
                          <Text style={[styles.targetLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Nächstes Training</Text>
                          <Text style={[styles.targetVal, { color: rc.text, fontFamily: "Inter_700Bold" }]}>
                            {nextWeight} kg
                          </Text>
                          <Text style={[styles.targetSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Gewicht</Text>
                        </View>
                        <View style={[styles.targetDivider, { backgroundColor: rc.border }]} />
                        <View style={styles.targetCol}>
                          <Text style={[styles.targetLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>&nbsp;</Text>
                          <Text style={[styles.targetVal, { color: rc.text, fontFamily: "Inter_700Bold" }]}>
                            {nextReps} Wdh
                          </Text>
                          <Text style={[styles.targetSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Wiederholungen</Text>
                        </View>
                      </View>

                      {tip ? (
                        <View style={[styles.tipRow, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
                          <AppIcon name="lightbulb" size={13} color={colors.warning} />
                          <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                            {tip}
                          </Text>
                        </View>
                      ) : null}
                    </>
                  )}

                  {item.loading && (
                    <View style={[styles.skeletonRow, { backgroundColor: colors.secondary }]} />
                  )}
                </GradientCard>
              </Animated.View>
            );
          })}

          <TouchableOpacity
            style={[styles.reanalyzeBtn, { borderColor: colors.primary + "40", borderRadius: colors.radius }]}
            onPress={loadCoaching}
            activeOpacity={0.75}
          >
            <AppIcon name="refresh-cw" size={14} color={colors.primary} />
            <Text style={[styles.reanalyzeTxt, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Neu analysieren
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <PremiumLockSheet
        visible={lockSheet}
        onClose={() => setLockSheet(false)}
        featureName="KI-Coach"
        featureDesc="Lass ChatGPT jede deiner Übungen analysieren und bekomme personalisierte Empfehlungen."
      />
      <AnimatedBackground />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  coachBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22 },
  headerSub: { fontSize: 12, marginTop: 1 },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  aiBadgeText: { fontSize: 11 },
  scroll: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 11, letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  scoreCard: { gap: 0 },
  scoreRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  scoreIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  scoreInfo: { flex: 1, gap: 4 },
  scoreLabel: { fontSize: 17 },
  scoreSub: { fontSize: 13 },
  scoreMotivation: { fontSize: 13, fontStyle: "italic", marginTop: 4, lineHeight: 18 },
  coachCard: { gap: 10, padding: 0, overflow: "hidden" },
  coachBanner: { position: "relative", height: 140, marginHorizontal: 0, marginTop: 0, borderRadius: 10, overflow: "hidden" },
  coachBannerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 12, gap: 6, borderRadius: 10 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  ratingPillText: { fontSize: 11 },
  coachBannerName: { fontSize: 18, color: "#fff" },
  coachCardHeader: { paddingHorizontal: 12, paddingTop: 4 },
  coachCardMeta: { gap: 4 },
  coachExName: { fontSize: 15 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  loadingText: { fontSize: 12 },
  aiHeadlineRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  aiChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  aiChipText: { fontSize: 9 },
  coachHeadline: { fontSize: 13 },
  coachDetail: { fontSize: 13, lineHeight: 20, paddingHorizontal: 12 },
  nextTargets: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden", marginHorizontal: 12 },
  targetCol: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 2 },
  targetLabel: { fontSize: 10 },
  targetVal: { fontSize: 20 },
  targetSub: { fontSize: 10 },
  targetDivider: { width: 1, marginVertical: 8 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, marginHorizontal: 12, marginBottom: 4 },
  tipText: { fontSize: 12, flex: 1, lineHeight: 17 },
  skeletonRow: { height: 16, borderRadius: 8, marginTop: 4, marginHorizontal: 12 },
  reanalyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderWidth: 1, marginTop: 4 },
  reanalyzeTxt: { fontSize: 14 },
  lockWrap: { flex: 1, padding: 20, justifyContent: "center" },
  lockCard: { alignItems: "center", gap: 14, paddingVertical: 30 },
  lockIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  lockTitle: { fontSize: 20, textAlign: "center" },
  lockDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  lockFeatures: { alignSelf: "stretch", gap: 8 },
  lockFeatureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  lockFeatureText: { fontSize: 14, flex: 1 },
  lockBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  lockBtnText: { color: "#000", fontSize: 15 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyTitle: { fontSize: 18, textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  startBtn: { paddingHorizontal: 28, paddingVertical: 13, marginTop: 8 },
  startBtnText: { color: "#000", fontSize: 15 },
});
