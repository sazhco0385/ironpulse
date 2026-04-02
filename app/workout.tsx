import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/AppIcon";
import { ExerciseImage } from "@/components/ExerciseImage";
import { GradientCard } from "@/components/GradientCard";
import { PlateCalculator } from "@/components/PlateCalculator";
import { PRCelebration } from "@/components/PRCelebration";
import { PremiumLockSheet } from "@/components/PremiumLockSheet";
import { ProgressBar } from "@/components/ProgressBar";
import { RestTimer } from "@/components/RestTimer";
import { SetRow } from "@/components/SetRow";
import { useWorkout, type WorkoutExercise } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/hooks/usePremium";
import { useVoiceLogger } from "@/hooks/useVoiceLogger";
import { analyzeExercise, RATING_COLORS, RATING_ICONS } from "@/lib/coach";

function LiveCoachCard({ ex }: { ex: WorkoutExercise }) {
  const colors = useColors();
  const done = ex.sets.filter((s) => s.completed);
  if (done.length === 0) return null;

  const advice = analyzeExercise(
    ex.exerciseName,
    done.map((s) => ({ weight: s.weight, reps: s.reps })),
    ex.targetReps,
    ex.targetWeight,
  );
  const rc = RATING_COLORS[advice.rating];

  return (
    <View style={[styles.coachCard, { backgroundColor: rc.bg, borderColor: rc.border }]}>
      <View style={styles.coachRow}>
        <View style={[styles.coachIconWrap, { backgroundColor: rc.border }]}>
          <AppIcon name={RATING_ICONS[advice.rating] as any} size={12} color={rc.text} />
        </View>
        <View style={styles.coachTextWrap}>
          <Text style={[styles.coachTitle, { color: rc.text, fontFamily: "Inter_700Bold" }]}>
            Coach: {advice.headline}
          </Text>
          <Text style={[styles.coachDetail, { color: rc.text + "CC", fontFamily: "Inter_400Regular" }]}>
            {advice.detail}
          </Text>
        </View>
      </View>
      <View style={[styles.coachTargets, { borderTopColor: rc.border }]}>
        <View style={styles.coachTarget}>
          <Text style={[styles.coachTargetVal, { color: rc.text, fontFamily: "Inter_700Bold" }]}>
            {advice.nextWeight} kg
          </Text>
          <Text style={[styles.coachTargetLabel, { color: rc.text + "99", fontFamily: "Inter_400Regular" }]}>
            Nächstes Gewicht
          </Text>
        </View>
        <View style={[styles.coachTargetDivider, { backgroundColor: rc.border }]} />
        <View style={styles.coachTarget}>
          <Text style={[styles.coachTargetVal, { color: rc.text, fontFamily: "Inter_700Bold" }]}>
            {advice.nextReps} Wdh
          </Text>
          <Text style={[styles.coachTargetLabel, { color: rc.text + "99", fontFamily: "Inter_400Regular" }]}>
            Nächste Wdh
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function WorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentSession, updateSet, completeWorkout, addSet, removeSet, lastPRs, clearLastPRs, exerciseProgress } = useWorkout();
  const { isPremium } = usePremium();
  const voice = useVoiceLogger();
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [activeVoiceEx, setActiveVoiceEx] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [lockSheet, setLockSheet] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | undefined>(undefined);
  const [showPRs, setShowPRs] = useState(false);
  const [summarySession, setSummarySession] = useState<typeof currentSession | null>(null);
  const [summaryElapsed, setSummaryElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const bottomPad = isWeb ? 34 : insets.bottom;

  useEffect(() => {
    if (lastPRs.length > 0) setShowPRs(true);
  }, [lastPRs]);

  const [timerTriggers, setTimerTriggers] = useState<Record<number, number>>({});
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentSession) return;
    startRef.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [!!currentSession]);

  useEffect(() => {
    if (!currentSession || confirmFinish) return;
    const ex = currentSession.exercises[expandedIdx];
    if (!ex || ex.sets.length === 0) return;
    const allDone = ex.sets.every((s) => s.completed);
    if (!allDone) return;
    const nextIdx = expandedIdx + 1;
    if (nextIdx >= currentSession.exercises.length) return;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      setExpandedIdx(nextIdx);
    }, 1500);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [currentSession?.exercises, expandedIdx, confirmFinish]);

  if (!currentSession) {
    // Show summary screen if a session was just completed
    if (summarySession) {
      const totalVol = summarySession.exercises.reduce(
        (t, ex) => t + ex.sets.filter((s) => s.completed).reduce((ts, s) => ts + s.weight * s.reps, 0),
        0,
      );
      const completedExercises = summarySession.exercises.filter((ex) => ex.sets.some((s) => s.completed));
      const totalCompletedSets = summarySession.exercises.reduce((t, ex) => t + ex.sets.filter((s) => s.completed).length, 0);
      const mins = Math.floor(summaryElapsed / 60);
      const secs = summaryElapsed % 60;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView
            contentContainerStyle={[styles.summaryContent, { paddingTop: topPad, paddingBottom: 60 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Trophy header */}
            <View style={styles.summaryHero}>
              <Text style={styles.summaryTrophy}>🏆</Text>
              <Text style={[styles.summaryTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Training abgeschlossen!
              </Text>
              <Text style={[styles.summarySubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {summarySession.dayName}
              </Text>
            </View>

            {/* Stats row */}
            <View style={[styles.summaryStatsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryStatItem}>
                <AppIcon name="clock" size={18} color={colors.primary} />
                <Text style={[styles.summaryStatVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {mins}:{secs.toString().padStart(2, "0")}
                </Text>
                <Text style={[styles.summaryStatLabel, { color: colors.mutedForeground }]}>Dauer</Text>
              </View>
              <View style={[styles.summaryStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryStatItem}>
                <AppIcon name="layers" size={18} color={colors.accent} />
                <Text style={[styles.summaryStatVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {totalCompletedSets}
                </Text>
                <Text style={[styles.summaryStatLabel, { color: colors.mutedForeground }]}>Sätze</Text>
              </View>
              <View style={[styles.summaryStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryStatItem}>
                <AppIcon name="trending-up" size={18} color={colors.success} />
                <Text style={[styles.summaryStatVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {totalVol >= 1000 ? `${(totalVol / 1000).toFixed(1)}t` : `${Math.round(totalVol)} kg`}
                </Text>
                <Text style={[styles.summaryStatLabel, { color: colors.mutedForeground }]}>Volumen</Text>
              </View>
            </View>

            {/* PR Badge if applicable */}
            {lastPRs.length > 0 && (
              <View style={[styles.prBanner, { backgroundColor: "#FFD70022", borderColor: "#FFD700" }]}>
                <Text style={styles.prBannerEmoji}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prBannerTitle, { color: "#FFD700", fontFamily: "Inter_700Bold" }]}>
                    {lastPRs.length === 1 ? "Neuer persönlicher Rekord!" : `${lastPRs.length} neue Rekorde!`}
                  </Text>
                  {lastPRs.map((pr) => (
                    <Text key={pr.exerciseId} style={[styles.prBannerSub, { color: colors.mutedForeground }]}>
                      {pr.exerciseName}: {pr.previousPR} → {pr.newPR} kg
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Exercise list */}
            <Text style={[styles.summarySection, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Übersicht
            </Text>
            {completedExercises.map((ex, i) => {
              const completedSets = ex.sets.filter((s) => s.completed);
              const maxWeight = completedSets.length > 0 ? Math.max(...completedSets.map((s) => s.weight)) : 0;
              const totalExVol = completedSets.reduce((t, s) => t + s.weight * s.reps, 0);
              return (
                <View key={i} style={[styles.summaryExRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.summaryExDot, { backgroundColor: colors.primary + "33" }]}>
                    <AppIcon name="check" size={12} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryExName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {ex.exerciseName}
                    </Text>
                    <Text style={[styles.summaryExMeta, { color: colors.mutedForeground }]}>
                      {completedSets.length} Sätze · max. {maxWeight} kg · {Math.round(totalExVol)} kg Volumen
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Back button */}
            <TouchableOpacity
              onPress={() => {
                setSummarySession(null);
                clearLastPRs();
                router.back();
              }}
              style={[styles.summaryBackBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              activeOpacity={0.85}
            >
              <AppIcon name="home" size={16} color={colors.primaryForeground} />
              <Text style={[styles.summaryBackText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                Zur Startseite
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={[styles.noSession, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <AppIcon name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text style={[styles.noSessionText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Kein aktives Training</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Text style={[styles.backBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>Zurück</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalSets = currentSession.exercises.reduce((t, e) => t + e.sets.length, 0);
  const completedSets = currentSession.exercises.reduce((t, e) => t + e.sets.filter((s) => s.completed).length, 0);
  const progress = totalSets > 0 ? completedSets / totalSets : 0;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const handleSetCompleted = (exIdx: number) => {
    setTimerTriggers((prev) => ({ ...prev, [exIdx]: (prev[exIdx] ?? 0) + 1 }));
    if (!confirmFinish) setExpandedIdx(exIdx);
  };

  const handleFinish = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmFinish(true);
  };

  const doFinish = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Capture session BEFORE completeWorkout() clears it
    setSummarySession(currentSession);
    setSummaryElapsed(elapsed);
    completeWorkout();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIconBtn}>
            <AppIcon name="chevron-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
              {currentSession.dayName}
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {mins}:{secs.toString().padStart(2, "0")} · {completedSets}/{totalSets} Sätze
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => {
                const ex = currentSession.exercises[expandedIdx];
                setPlateCalcWeight(ex?.targetWeight ?? undefined);
                setShowPlateCalc(true);
              }}
              style={[styles.calcBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 14 }}>🏋️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFinish}
              style={[styles.finishBtn, { backgroundColor: progress === 1 ? colors.success : colors.primary, borderRadius: 8 }]}
            >
              <AppIcon name={progress === 1 ? "check-circle" : "flag"} size={14} color={colors.primaryForeground} />
              <Text style={[styles.finishBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>Fertig</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ProgressBar progress={progress} color={progress === 1 ? colors.success : colors.primary} height={4} style={{ marginTop: 10, marginBottom: 2 }} />
      </View>

      {confirmFinish && (
        <View style={[styles.confirmBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.confirmContent}>
            <Text style={[styles.confirmTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Training beenden?
            </Text>
            <Text style={[styles.confirmSub, { color: colors.mutedForeground }]}>
              {completedSets} von {totalSets} Sätze abgeschlossen
            </Text>
          </View>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              onPress={() => setConfirmFinish(false)}
              style={[styles.confirmCancelBtn, { borderColor: colors.border, borderRadius: 8 }]}
            >
              <Text style={[styles.confirmCancelText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Weiter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={doFinish}
              style={[styles.confirmOkBtn, { backgroundColor: colors.success, borderRadius: 8 }]}
            >
              <AppIcon name="check" size={14} color="#000" />
              <Text style={[styles.confirmOkText, { color: "#000", fontFamily: "Inter_700Bold" }]}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentSession.exercises.map((ex, exIdx) => {
          const exCompleted = ex.sets.filter((s) => s.completed).length;
          const exProgress = ex.sets.length > 0 ? exCompleted / ex.sets.length : 0;
          const isExpanded = expandedIdx === exIdx;
          const isAllDone = exCompleted === ex.sets.length && ex.sets.length > 0;

          return (
            <GradientCard key={exIdx} variant={isAllDone ? "primary" : "default"} style={styles.exerciseCard}>
              <TouchableOpacity onPress={() => setExpandedIdx(isExpanded ? -1 : exIdx)} activeOpacity={0.8}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exImgWrap}>
                    <ExerciseImage
                      exerciseId={ex.exerciseId}
                      exerciseName={ex.exerciseName}
                      width={52}
                      height={52}
                      borderRadius={10}
                    />
                    {isAllDone && (
                      <View style={[styles.exDoneBadge, { backgroundColor: colors.primary }]}>
                        <AppIcon name="check" size={10} color="#000" />
                      </View>
                    )}
                    {!isAllDone && (
                      <View style={[styles.exNumBadge, { backgroundColor: colors.background + "CC" }]}>
                        <Text style={[styles.exNum, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>{exIdx + 1}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.exerciseMeta}>
                    <Text style={[styles.exerciseName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{ex.exerciseName}</Text>
                    <Text style={[styles.exerciseSub, { color: colors.mutedForeground }]}>
                      {exCompleted}/{ex.sets.length} Sätze · Ziel: {ex.targetWeight}kg × {ex.targetReps}
                    </Text>
                  </View>
                  <AppIcon name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </View>
                <ProgressBar progress={exProgress} color={isAllDone ? colors.primary : colors.accent} height={3} style={{ marginTop: 8 }} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.setsList}>
                  <View style={styles.setsHeader}>
                    <Text style={[styles.setsHeaderText, { color: colors.mutedForeground }]}>Satz</Text>
                    <Text style={[styles.setsHeaderText, { color: colors.mutedForeground }]}>Gewicht · Wdh</Text>
                    <View style={{ width: 80 }} />
                  </View>
                  {ex.sets.map((set, setIdx) => (
                    <SetRow
                      key={set.id}
                      set={set}
                      index={setIdx}
                      onUpdate={(updates) => updateSet(exIdx, setIdx, updates)}
                      onRemove={() => removeSet(exIdx, setIdx)}
                      onCompleted={() => handleSetCompleted(exIdx)}
                    />
                  ))}
                  {isPremium ? (
                    <TouchableOpacity
                      onPress={() => addSet(exIdx)}
                      style={[styles.addSetBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
                    >
                      <AppIcon name="plus" size={16} color={colors.primary} />
                      <Text style={[styles.addSetText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Satz hinzufügen</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setLockSheet(true)}
                      style={[styles.addSetBtn, { borderColor: colors.primary + "44", borderRadius: colors.radius, backgroundColor: colors.primary + "0A" }]}
                    >
                      <AppIcon name="zap" size={14} color={colors.primary} />
                      <Text style={[styles.addSetText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Satz hinzufügen · PRO</Text>
                    </TouchableOpacity>
                  )}

                  {!isWeb && (
                    <View style={styles.voiceRow}>
                      <TouchableOpacity
                        onPress={async () => {
                          if (voice.isRecording && activeVoiceEx === exIdx) {
                            const result = await voice.stopAndTranscribe();
                            if (result) {
                              const nextSet = ex.sets.findIndex((s) => !s.completed);
                              if (nextSet !== -1) {
                                const updates: any = {};
                                if (result.reps !== undefined) updates.reps = result.reps;
                                if (result.weight !== undefined) updates.weight = result.weight;
                                if (Object.keys(updates).length > 0) updateSet(exIdx, nextSet, updates);
                              }
                            }
                            setActiveVoiceEx(null);
                          } else {
                            setActiveVoiceEx(exIdx);
                            await voice.startRecording();
                          }
                        }}
                        style={[styles.voiceBtn, {
                          backgroundColor: voice.isRecording && activeVoiceEx === exIdx ? "#FF4444" : colors.card,
                          borderColor: voice.isRecording && activeVoiceEx === exIdx ? "#FF444444" : colors.border,
                        }]}
                        disabled={voice.isProcessing}
                        activeOpacity={0.8}
                      >
                        {voice.isProcessing && activeVoiceEx === exIdx ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <AppIcon
                            name={voice.isRecording && activeVoiceEx === exIdx ? "mic-off" : "mic"}
                            size={14}
                            color={voice.isRecording && activeVoiceEx === exIdx ? "#FF4444" : colors.mutedForeground}
                          />
                        )}
                        <Text style={[styles.voiceBtnText, {
                          color: voice.isRecording && activeVoiceEx === exIdx ? "#FF4444" : colors.mutedForeground,
                          fontFamily: "Inter_500Medium",
                        }]}>
                          {voice.isProcessing && activeVoiceEx === exIdx
                            ? "Verarbeite..."
                            : voice.isRecording && activeVoiceEx === exIdx
                            ? "Tippe zum Stoppen"
                            : "Spracheingabe"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.timerSection}>
                    <View style={styles.timerSectionLabelRow}>
                      <AppIcon name="clock" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.timerSectionLabel, { color: colors.mutedForeground }]}>Pause</Text>
                    </View>
                    <RestTimer
                      defaultSeconds={90}
                      autoStartTrigger={timerTriggers[exIdx] ?? 0}
                    />
                    {isPremium && <LiveCoachCard ex={ex} />}
                  </View>
                </View>
              )}
            </GradientCard>
          );
        })}
      </ScrollView>

      <PremiumLockSheet
        visible={lockSheet}
        onClose={() => setLockSheet(false)}
        featureName="Coach"
        featureDesc="Füge beliebig viele Sätze hinzu, erhalte Live-Coach-Feedback nach jedem Satz und nutze die vollständige Trainingsanalyse."
      />

      <PlateCalculator
        visible={showPlateCalc}
        onClose={() => setShowPlateCalc(false)}
        initialWeight={plateCalcWeight}
      />

      <PRCelebration
        prs={showPRs ? lastPRs : []}
        onDismiss={() => {
          setShowPRs(false);
          clearLastPRs();
          router.back();
          setTimeout(() => router.navigate("/(tabs)/coach"), 200);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  backIconBtn: { padding: 2 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17 },
  headerSub: { fontSize: 12, marginTop: 1 },
  finishBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8 },
  finishBtnText: { fontSize: 13 },
  confirmBanner: { padding: 14, borderBottomWidth: 1, gap: 10 },
  confirmContent: { gap: 2 },
  confirmTitle: { fontSize: 15 },
  confirmSub: { fontSize: 13 },
  confirmBtns: { flexDirection: "row", gap: 8 },
  confirmCancelBtn: { flex: 1, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  confirmCancelText: { fontSize: 13 },
  confirmOkBtn: { flex: 1, flexDirection: "row", paddingVertical: 10, alignItems: "center", justifyContent: "center", gap: 6 },
  confirmOkText: { fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  exerciseCard: {},
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  exImgWrap: { position: "relative", width: 52, height: 52 },
  exDoneBadge: { position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  exNumBadge: { position: "absolute", top: 2, left: 2, minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  exNum: { fontSize: 11 },
  exerciseMeta: { flex: 1 },
  exerciseName: { fontSize: 15 },
  exerciseSub: { fontSize: 12, marginTop: 1 },
  setsList: { marginTop: 14, gap: 8 },
  setsHeader: { flexDirection: "row", paddingHorizontal: 4, marginBottom: 2 },
  setsHeaderText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addSetText: { fontSize: 13 },
  timerSection: { gap: 8 },
  timerSectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timerSectionLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  coachCard: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  coachRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10 },
  coachIconWrap: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center", marginTop: 1 },
  coachTextWrap: { flex: 1, gap: 3 },
  coachTitle: { fontSize: 12 },
  coachDetail: { fontSize: 11, lineHeight: 16 },
  coachTargets: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 8 },
  coachTarget: { flex: 1, alignItems: "center", gap: 2 },
  coachTargetVal: { fontSize: 16 },
  coachTargetLabel: { fontSize: 10 },
  coachTargetDivider: { width: 1, marginVertical: 4 },
  noSession: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  noSessionText: { fontSize: 18 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  backBtnText: { fontSize: 14 },
  calcBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  voiceRow: { marginTop: 2, marginBottom: 2 },
  voiceBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  voiceBtnText: { fontSize: 13 },
  // Summary screen
  summaryContent: { paddingHorizontal: 20, gap: 16 },
  summaryHero: { alignItems: "center", paddingVertical: 24, gap: 8 },
  summaryTrophy: { fontSize: 72, lineHeight: 84 },
  summaryTitle: { fontSize: 26, textAlign: "center" },
  summarySubtitle: { fontSize: 15, textAlign: "center" },
  summaryStatsRow: { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  summaryStatItem: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  summaryStatVal: { fontSize: 22 },
  summaryStatLabel: { fontSize: 11 },
  summaryStatDivider: { width: 1, marginVertical: 12 },
  prBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  prBannerEmoji: { fontSize: 22 },
  prBannerTitle: { fontSize: 15 },
  prBannerSub: { fontSize: 12, marginTop: 2 },
  summarySection: { fontSize: 16, marginTop: 4 },
  summaryExRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  summaryExDot: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryExName: { fontSize: 14 },
  summaryExMeta: { fontSize: 12, marginTop: 2 },
  summaryBackBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, marginTop: 8 },
  summaryBackText: { fontSize: 16 },
});
