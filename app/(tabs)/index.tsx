import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { AppIcon } from "@/components/AppIcon";
import { DayCheckInModal, type CheckInData } from "@/components/DayCheckInModal";
import { GradientCard } from "@/components/GradientCard";
import { IronPulseLogo } from "@/components/IronPulseLogo";
import { StatBadge } from "@/components/StatBadge";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useAthlete } from "@/context/AthleteContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAthlete();
  const {
    activePlan,
    plans,
    setActivePlan,
    startWorkout,
    currentSession,
    sessionHistory,
    totalWorkouts,
    totalVolumeLiftedKg,
    streakDays,
    nextDay,
    nextDayIdx,
    weekNumber,
    isDeloadWeek,
    exerciseProgress,
  } = useWorkout();

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ plan: any; day: any } | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = isWeb ? 0 : 60;
  const bottomPad = isWeb ? 34 : insets.bottom + TAB_BAR_HEIGHT;

  const recentSession = sessionHistory[0];

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.03, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const triggerStartWorkout = (plan: any, day: any) => {
    setPendingPlan({ plan, day });
    setShowCheckIn(true);
  };

  const handleCheckInConfirm = (data: CheckInData) => {
    setShowCheckIn(false);
    if (!pendingPlan) return;
    startWorkout(pendingPlan.plan, pendingPlan.day, data.factor);
    setPendingPlan(null);
    router.push("/workout");
  };

  const handleCheckInSkip = () => {
    setShowCheckIn(false);
    if (!pendingPlan) return;
    startWorkout(pendingPlan.plan, pendingPlan.day, 1.0);
    setPendingPlan(null);
    router.push("/workout");
  };

  const handleStartNextDay = () => {
    if (!activePlan || !nextDay) return;
    triggerStartWorkout(activePlan, nextDay);
  };

  const prRadarExercises = Object.values(exerciseProgress)
    .filter((ep) => {
      if (ep.history.length < 2) return false;
      const allTimePR = Math.max(...ep.history.map((h) => h.maxWeight));
      const gap = (allTimePR - ep.suggestedWeight) / allTimePR;
      return gap >= 0 && gap <= 0.07;
    })
    .slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    <ScrollView
      style={styles.scrollFill}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(500)} style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <IronPulseLogo size="md" />
          <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Hallo, {profile?.name ?? "Athlet"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.weekBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
            <Text style={[styles.weekLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Woche</Text>
            <Text style={[styles.weekNum, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{weekNumber}</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.accent + "22", borderColor: colors.accent + "44" }]}>
            <AppIcon name="zap" size={14} color={colors.accent} />
            <Text style={[styles.streakText, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{streakDays}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[styles.settingsBtn, { backgroundColor: colors.secondary, borderRadius: 10 }]}
            activeOpacity={0.75}
          >
            <AppIcon name="sliders" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {currentSession && (
        <Animated.View entering={FadeInDown.delay(30).duration(400)}>
          <TouchableOpacity
            onPress={() => router.push("/workout")}
            activeOpacity={0.85}
          >
            <GradientCard variant="primary" style={styles.resumeBanner}>
              <View style={styles.deloadRow}>
                <View style={[styles.deloadIcon, { backgroundColor: colors.primary + "33" }]}>
                  <AppIcon name="play-circle" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deloadTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    Training läuft — fortsetzen
                  </Text>
                  <Text style={[styles.deloadSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {currentSession.dayName} · {currentSession.exercises.reduce((t, e) => t + e.sets.filter(s => s.completed).length, 0)}/{currentSession.exercises.reduce((t, e) => t + e.sets.length, 0)} Sätze
                  </Text>
                </View>
                <AppIcon name="chevron-right" size={18} color={colors.primary} />
              </View>
            </GradientCard>
          </TouchableOpacity>
        </Animated.View>
      )}

      {isDeloadWeek && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <GradientCard variant="accent" style={styles.deloadBanner}>
            <View style={styles.deloadRow}>
              <View style={[styles.deloadIcon, { backgroundColor: colors.accent + "33" }]}>
                <AppIcon name="refresh-cw" size={18} color={colors.accent} />
              </View>
              <View style={styles.deloadText}>
                <Text style={[styles.deloadTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                  Deload Woche aktiv
                </Text>
                <Text style={[styles.deloadSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  60% Gewicht · max. 3 Sätze · Regeneration
                </Text>
              </View>
            </View>
          </GradientCard>
        </Animated.View>
      )}

      <View style={styles.statsRow}>
        <StatBadge label="Trainings" value={totalWorkouts} color={colors.primary} delay={0} />
        <StatBadge label="Volumen" value={formatVolume(totalVolumeLiftedKg)} unit="kg" color={colors.accent} delay={80} />
        <StatBadge label="Streak" value={streakDays} unit="Tage" color={colors.success} delay={160} />
      </View>

      {activePlan && nextDay ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Nächstes Training
            </Text>
            <View style={[styles.dayBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.dayBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Tag {nextDayIdx + 1} / {activePlan.days.length}
              </Text>
            </View>
          </View>
          <GradientCard variant="primary" style={styles.nextDayCard}>
            <View style={styles.nextDayHeader}>
              <View style={[styles.nextDayIcon, { backgroundColor: colors.primary }]}>
                <AppIcon name="activity" size={20} color={colors.primaryForeground} />
              </View>
              <View style={styles.nextDayInfo}>
                <Text style={[styles.nextDayTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {nextDay.name}
                </Text>
                <Text style={[styles.nextDayPlan, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {activePlan.name}
                </Text>
              </View>
            </View>

            <View style={styles.exercisesPreview}>
              {nextDay.exercises.slice(0, 4).map((ex, i) => (
                <View key={i} style={styles.exercisePreviewRow}>
                  <View style={[styles.exDot, { backgroundColor: colors.primary + "66" }]} />
                  <Text style={[styles.exPreviewName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {ex.exerciseName}
                  </Text>
                  <Text style={[styles.exPreviewSets, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {ex.sets}×{ex.reps}
                  </Text>
                </View>
              ))}
              {nextDay.exercises.length > 4 && (
                <Text style={[styles.moreExercises, { color: colors.mutedForeground }]}>
                  +{nextDay.exercises.length - 4} weitere Übungen
                </Text>
              )}
            </View>

            <View style={styles.weekProgress}>
              {[1, 2, 3, 4, 5].map((w) => {
                const isDeload = w === 5;
                const isCurrent = weekNumber % 5 === (w % 5) || (weekNumber % 5 === 0 && w === 5);
                const isDone = w < (weekNumber % 5 === 0 ? 5 : weekNumber % 5);
                return (
                  <View
                    key={w}
                    style={[
                      styles.weekDot,
                      {
                        backgroundColor: isCurrent
                          ? isDeload ? colors.accent : colors.primary
                          : isDone ? colors.success + "66" : colors.border,
                        width: isCurrent ? 28 : 10,
                        borderRadius: 5,
                      },
                    ]}
                  >
                    {isCurrent && (
                      <Text style={[styles.weekDotText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                        {isDeload ? "D" : `W${w}`}
                      </Text>
                    )}
                  </View>
                );
              })}
              <Text style={[styles.weekProgressLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {isDeloadWeek ? "Deload Woche" : `Woche ${weekNumber % 5 === 0 ? 4 : weekNumber % 5} / 4`}
              </Text>
            </View>

            <Animated.View style={pulseStyle}>
              <TouchableOpacity
                onPress={handleStartNextDay}
                style={[styles.startBtn, { backgroundColor: isDeloadWeek ? colors.accent : colors.primary, borderRadius: colors.radius }]}
                activeOpacity={0.85}
              >
                <AppIcon name="play" size={16} color={colors.primaryForeground} />
                <Text style={[styles.startBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                  {isDeloadWeek ? "Deload starten" : "Jetzt starten"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.allDaysRow}>
              {activePlan.days.map((day, i) => (
                <TouchableOpacity
                  key={day.id}
                  onPress={() => triggerStartWorkout(activePlan, day)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: i === nextDayIdx ? colors.primary + "22" : colors.secondary,
                      borderColor: i === nextDayIdx ? colors.primary : colors.border,
                      borderRadius: 8,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      {
                        color: i === nextDayIdx ? colors.primary : colors.mutedForeground,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {day.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GradientCard>
        </View>
      ) : (
        !activePlan && (
          <View style={styles.section}>
            <GradientCard variant="accent" style={styles.emptyCard}>
              <AppIcon name="target" size={36} color={colors.accent} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Kein aktives Programm
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Wähle ein Trainingsprogramm aus und leg los!
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/plans")}
                style={[styles.emptyBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
              >
                <Text style={[styles.emptyBtnText, { color: colors.accentForeground, fontFamily: "Inter_700Bold" }]}>
                  Programm wählen
                </Text>
              </TouchableOpacity>
            </GradientCard>
          </View>
        )
      )}

      {prRadarExercises.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              🎯 PR-Radar
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Du bist nah am Rekord
            </Text>
          </View>
          <GradientCard variant="primary">
            <View style={{ gap: 10 }}>
              {prRadarExercises.map((ep) => {
                const allTimePR = Math.max(...ep.history.map((h) => h.maxWeight));
                const gapKg = Math.round((allTimePR - ep.suggestedWeight) * 2) / 2;
                const gapPct = Math.round(((allTimePR - ep.suggestedWeight) / allTimePR) * 100);
                return (
                  <View key={ep.exerciseId} style={styles.prRadarRow}>
                    <View style={styles.prRadarLeft}>
                      <Text style={{ fontSize: 18 }}>🏆</Text>
                      <View>
                        <Text style={[styles.prRadarName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                          {ep.exerciseName}
                        </Text>
                        <Text style={[styles.prRadarSub, { color: colors.mutedForeground }]}>
                          PR: {allTimePR} kg · Nächstes Ziel: {ep.suggestedWeight} kg
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.prGapBadge, { backgroundColor: gapKg === 0 ? "#22CC6622" : colors.primary + "22", borderColor: gapKg === 0 ? "#22CC66" : colors.primary }]}>
                      <Text style={[styles.prGapText, { color: gapKg === 0 ? "#22CC66" : colors.primary, fontFamily: "Inter_700Bold" }]}>
                        {gapKg === 0 ? "Heute!" : `-${gapKg} kg`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </GradientCard>
        </Animated.View>
      )}

      {recentSession && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Letztes Training
          </Text>
          <GradientCard>
            <View style={styles.sessionRow}>
              <View style={[styles.sessionIcon, { backgroundColor: colors.purple + "22" }]}>
                <AppIcon name="clock" size={16} color={colors.purple} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {recentSession.dayName}
                </Text>
                <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
                  {recentSession.duration ? `${recentSession.duration} Min · ` : ""}
                  {recentSession.exercises.length} Übungen ·{" "}
                  {new Date(recentSession.completedAt ?? recentSession.startedAt).toLocaleDateString("de-DE")}
                </Text>
              </View>
              <View style={[styles.volumeBadge, { backgroundColor: colors.purple + "22" }]}>
                <Text style={[styles.volumeText, { color: colors.purple }]}>
                  {Math.round(
                    recentSession.exercises.reduce(
                      (t, e) => t + e.sets.filter((s) => s.completed).reduce((ts, s) => ts + s.weight * s.reps, 0),
                      0,
                    ),
                  )}{" "}
                  kg
                </Text>
              </View>
            </View>
          </GradientCard>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Alle Programme ({plans.length})
        </Text>
        {plans.slice(0, 3).map((plan) => (
          <WorkoutCard
            key={plan.id}
            plan={plan}
            isActive={activePlan?.id === plan.id}
            onSelect={() => setActivePlan(plan)}
            onStart={
              activePlan?.id === plan.id && nextDay
                ? () => triggerStartWorkout(plan, nextDay)
                : undefined
            }
          />
        ))}
      </View>
    </ScrollView>
      <AnimatedBackground />
      <DayCheckInModal
        visible={showCheckIn}
        onConfirm={handleCheckInConfirm}
        onSkip={handleCheckInSkip}
        onClose={handleCheckInSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollFill: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerLeft: { gap: 8 },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  greeting: { fontSize: 13 },
  title: { fontSize: 30 },
  weekBadge: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, gap: 0 },
  weekLabel: { fontSize: 9, letterSpacing: 1 },
  weekNum: { fontSize: 20, lineHeight: 24 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  streakText: { fontSize: 16 },
  settingsBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  resumeBanner: { marginBottom: 12 },
  deloadBanner: { marginBottom: 16 },
  deloadRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  deloadIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  deloadText: { flex: 1, gap: 2 },
  deloadTitle: { fontSize: 15 },
  deloadSub: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16 },
  dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dayBadgeText: { fontSize: 12 },
  nextDayCard: { gap: 16 },
  nextDayHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  nextDayIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nextDayInfo: { flex: 1 },
  nextDayTitle: { fontSize: 20 },
  nextDayPlan: { fontSize: 13, marginTop: 2 },
  exercisesPreview: { gap: 8, paddingVertical: 4 },
  exercisePreviewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  exDot: { width: 6, height: 6, borderRadius: 3 },
  exPreviewName: { flex: 1, fontSize: 14 },
  exPreviewSets: { fontSize: 13 },
  moreExercises: { fontSize: 12, marginTop: 2, marginLeft: 14 },
  weekProgress: { flexDirection: "row", alignItems: "center", gap: 5 },
  weekDot: { height: 10, alignItems: "center", justifyContent: "center" },
  weekDotText: { fontSize: 8 },
  weekProgressLabel: { fontSize: 11, marginLeft: 4 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  startBtnText: { fontSize: 16 },
  allDaysRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  dayChipText: { fontSize: 12 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sessionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 14 },
  sessionMeta: { fontSize: 12, marginTop: 2 },
  volumeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  volumeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyTitle: { fontSize: 18 },
  emptyDesc: { fontSize: 13, textAlign: "center" },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  emptyBtnText: { fontSize: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 10 },
  sectionSub: { fontSize: 12 },
  prRadarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  prRadarLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  prRadarName: { fontSize: 14 },
  prRadarSub: { fontSize: 12, marginTop: 1 },
  prGapBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  prGapText: { fontSize: 13 },
});
