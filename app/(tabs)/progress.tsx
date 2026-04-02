import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { AppIcon } from "@/components/AppIcon";
import { GradientCard } from "@/components/GradientCard";
import { MiniProgressChart } from "@/components/MiniProgressChart";
import { MuscleHeatmap, buildMuscleData } from "@/components/MuscleHeatmap";
import { PremiumLockSheet } from "@/components/PremiumLockSheet";
import { ProgressBar } from "@/components/ProgressBar";
import { StatBadge } from "@/components/StatBadge";
import { useAthlete } from "@/context/AthleteContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/hooks/usePremium";

function formatVolume(kg: number): { value: string; unit: string } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(1), unit: "t" };
  return { value: Math.round(kg).toString(), unit: "kg" };
}

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, weightHistory, addWeightEntry, removeWeightEntry } = useAthlete();
  const { sessionHistory, exerciseProgress, totalWorkouts, totalVolumeLiftedKg, streakDays } = useWorkout();
  const { isPremium } = usePremium();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [lockSheet, setLockSheet] = useState(false);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = isWeb ? 0 : 60;
  const bottomPad = isWeb ? 34 : insets.bottom + TAB_BAR_HEIGHT;

  const exerciseKeys = Object.keys(exerciseProgress);
  const weekSessions = sessionHistory.filter((s) => {
    const d = new Date(s.completedAt ?? s.startedAt);
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) < 7;
  }).length;

  const volumeByDay = (() => {
    const map: Record<string, number> = {};
    sessionHistory.slice(0, 14).forEach((s) => {
      const d = new Date(s.completedAt ?? s.startedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
      const vol = s.exercises.reduce((t, e) => t + e.sets.filter((set) => set.completed).reduce((ts, set) => ts + set.weight * set.reps, 0), 0);
      map[d] = (map[d] ?? 0) + vol;
    });
    return Object.entries(map).reverse().map(([date, value]) => ({ date, value }));
  })();

  const weightChartData = weightHistory
    .slice(0, 20)
    .reverse()
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      value: e.weightKg,
    }));

  const handleAddWeight = async () => {
    const val = parseFloat(weightInput.replace(",", "."));
    if (!val || val < 20 || val > 400) return;
    await addWeightEntry(val);
    setWeightInput("");
    setShowWeightInput(false);
    Keyboard.dismiss();
  };

  const handleRemoveWeight = (date: string) => {
    if (Platform.OS === "web") {
      removeWeightEntry(date);
    } else {
      Alert.alert("Eintrag löschen?", "Diesen Gewichtseintrag entfernen?", [
        { text: "Abbrechen", style: "cancel" },
        { text: "Löschen", style: "destructive", onPress: () => removeWeightEntry(date) },
      ]);
    }
  };

  const volFormatted = formatVolume(totalVolumeLiftedKg);
  const muscleData = buildMuscleData(exerciseProgress);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    <ScrollView
      style={styles.scrollFill}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad + 120 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.Text
        entering={FadeInDown.duration(400)}
        style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
      >
        Fortschritt
      </Animated.Text>

      <View style={styles.statsRow}>
        <StatBadge label="Gesamt" value={totalWorkouts} color={colors.primary} delay={0} />
        <StatBadge label="Diese Woche" value={weekSessions} color={colors.accent} delay={80} />
        <StatBadge label="Streak" value={streakDays} unit="d" color={colors.success} delay={160} />
      </View>

      <GradientCard variant="primary" style={styles.volumeCard} animate delay={50}>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Gesamtvolumen</Text>
        <Text style={[styles.bigNumber, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          {volFormatted.value}
          <Text style={[styles.bigUnit, { color: colors.mutedForeground }]}> {volFormatted.unit}</Text>
        </Text>
        <MiniProgressChart data={volumeByDay} unit="kg" color={colors.primary} height={50} />
      </GradientCard>

      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Muskel-Erholung
        </Text>
        <GradientCard animate delay={90}>
          <MuscleHeatmap muscles={muscleData} />
          <View style={styles.heatmapLegend}>
            {[
              { label: "Bereit", color: "#22CC66" },
              { label: "Erholt", color: "#00D4FF" },
              { label: "Erholt sich", color: "#FF6B35" },
              { label: "Schmerzhaft", color: "#CC2244" },
              { label: "Untrainiert", color: "#444466" },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </GradientCard>
      </Animated.View>

      {profile && (profile.weightKg > 0 || profile.heightCm > 0) && (
        <View style={styles.section}>
          <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Körperdaten
          </Animated.Text>
          <GradientCard style={styles.bodyRow} animate delay={120}>
            {profile.weightKg > 0 && (
              <View style={styles.bodyItem}>
                <View style={[styles.bodyIcon, { backgroundColor: colors.accent + "22" }]}>
                  <AppIcon name="activity" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.bodyValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {profile.weightKg}<Text style={[styles.bodyUnit, { color: colors.mutedForeground }]}> kg</Text>
                </Text>
                <Text style={[styles.bodyLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Gewicht</Text>
              </View>
            )}
            {profile.heightCm > 0 && (
              <View style={styles.bodyItem}>
                <View style={[styles.bodyIcon, { backgroundColor: colors.purple + "22" }]}>
                  <AppIcon name="maximize-2" size={16} color={colors.purple} />
                </View>
                <Text style={[styles.bodyValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {profile.heightCm}<Text style={[styles.bodyUnit, { color: colors.mutedForeground }]}> cm</Text>
                </Text>
                <Text style={[styles.bodyLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Größe</Text>
              </View>
            )}
            {profile.weightKg > 0 && profile.heightCm > 0 && (
              <View style={styles.bodyItem}>
                <View style={[styles.bodyIcon, { backgroundColor: colors.success + "22" }]}>
                  <AppIcon name="user" size={16} color={colors.success} />
                </View>
                <Text style={[styles.bodyValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {(profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)}
                </Text>
                <Text style={[styles.bodyLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>BMI</Text>
              </View>
            )}
          </GradientCard>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Animated.Text entering={FadeInDown.delay(100).duration(400)} style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Körpergewicht
          </Animated.Text>
          <TouchableOpacity
            onPress={() => setShowWeightInput((v) => !v)}
            style={[styles.addBtn, { backgroundColor: showWeightInput ? colors.primary : colors.secondary, borderRadius: 20 }]}
          >
            <AppIcon name={showWeightInput ? "x" : "plus"} size={16} color={showWeightInput ? colors.primaryForeground : colors.foreground} />
          </TouchableOpacity>
        </View>

        {showWeightInput && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.weightInputCard, { backgroundColor: colors.card, borderColor: colors.primary + "66", borderRadius: colors.radius }]}>
            <Text style={[styles.weightInputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Aktuelles Gewicht eintragen</Text>
            <View style={styles.weightInputRow}>
              <TextInput
                style={[styles.weightInput, { color: colors.foreground, fontFamily: "Inter_700Bold", borderColor: colors.border, borderRadius: 10, backgroundColor: colors.secondary }]}
                placeholder={profile?.weightKg ? profile.weightKg.toString() : "75"}
                placeholderTextColor={colors.mutedForeground}
                value={weightInput}
                onChangeText={(v) => setWeightInput(v.replace(",", "."))}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAddWeight}
                autoFocus
              />
              <Text style={[styles.weightUnit, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>kg</Text>
              <TouchableOpacity
                onPress={handleAddWeight}
                disabled={!weightInput}
                style={[styles.weightSaveBtn, { backgroundColor: weightInput ? colors.primary : colors.secondary, borderRadius: 10 }]}
              >
                <AppIcon name="check" size={18} color={weightInput ? colors.primaryForeground : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {weightChartData.length >= 2 && (
          <GradientCard animate delay={80}>
            <MiniProgressChart data={weightChartData} unit="kg" color={colors.accent} height={60} />
          </GradientCard>
        )}

        {weightHistory.length > 0 && (
          <Animated.View layout={Layout.springify()} style={styles.weightList}>
            {weightHistory.slice(0, 8).map((entry, i) => (
              <Animated.View
                key={entry.date}
                entering={FadeInRight.delay(i * 40).duration(300)}
                layout={Layout.springify()}
                style={[styles.weightEntry, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              >
                <View style={[styles.weightEntryDot, { backgroundColor: colors.accent + "33" }]}>
                  <AppIcon name="activity" size={12} color={colors.accent} />
                </View>
                <Text style={[styles.weightEntryVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {entry.weightKg} kg
                </Text>
                <Text style={[styles.weightEntryDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {new Date(entry.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveWeight(entry.date)} style={styles.weightDeleteBtn}>
                  <AppIcon name="trash-2" size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {weightHistory.length === 0 && (
          <GradientCard style={styles.weightEmpty} animate delay={100}>
            <AppIcon name="activity" size={28} color={colors.mutedForeground} />
            <Text style={[styles.weightEmptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Trage dein Gewicht täglich ein, um deinen Fortschritt zu sehen.
            </Text>
          </GradientCard>
        )}
      </View>

      {exerciseKeys.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Animated.Text entering={FadeInDown.delay(120).duration(400)} style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Übungsfortschritt
            </Animated.Text>
            {!isPremium && (
              <View style={[styles.proBadge, { backgroundColor: colors.primary + "22" }]}>
                <AppIcon name="zap" size={10} color={colors.primary} />
                <Text style={[styles.proBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>PRO</Text>
              </View>
            )}
          </View>

          {isPremium ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.exerciseTabs}>
                {exerciseKeys.map((key, i) => (
                  <Animated.View key={key} entering={FadeInRight.delay(i * 30).duration(300)}>
                    <TouchableOpacity
                      onPress={() => setSelectedExercise(selectedExercise === key ? null : key)}
                      style={[
                        styles.exerciseTab,
                        {
                          backgroundColor: selectedExercise === key ? colors.primary + "22" : colors.secondary,
                          borderColor: selectedExercise === key ? colors.primary + "66" : colors.border,
                          borderRadius: colors.radius / 2,
                        },
                      ]}
                    >
                      <Text style={[styles.exerciseTabText, { color: selectedExercise === key ? colors.primary : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                        {exerciseProgress[key].exerciseName}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>

              {exerciseKeys.map((key, i) => {
                if (selectedExercise && selectedExercise !== key) return null;
                const prog = exerciseProgress[key];
                const chartData = prog.history.map((h) => ({ date: h.date, value: h.maxWeight }));
                const firstWeight = prog.history[0]?.maxWeight ?? 0;
                const lastWeight = prog.history[prog.history.length - 1]?.maxWeight ?? 0;
                const improvement = firstWeight > 0 ? ((lastWeight - firstWeight) / firstWeight) * 100 : 0;
                return (
                  <GradientCard key={key} style={styles.exerciseCard} animate delay={i * 60}>
                    <View style={styles.exerciseHeader}>
                      <Text style={[styles.exerciseName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{prog.exerciseName}</Text>
                      <View style={[styles.improvBadge, { backgroundColor: improvement >= 0 ? colors.success + "22" : colors.destructive + "22", borderRadius: 6 }]}>
                        <AppIcon name={improvement >= 0 ? "trending-up" : "trending-down"} size={12} color={improvement >= 0 ? colors.success : colors.destructive} />
                        <Text style={[styles.improvText, { color: improvement >= 0 ? colors.success : colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
                          {Math.abs(improvement).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.exerciseMetaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Nächstes Training: {prog.suggestedWeight} kg × {prog.suggestedReps} Wdh
                    </Text>
                    <MiniProgressChart data={chartData} unit="kg" color={colors.accent} height={55} />
                    <View style={styles.progressRow}>
                      <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Fortschritt</Text>
                      <ProgressBar progress={Math.min(Math.abs(improvement) / 50, 1)} color={colors.accent} />
                    </View>
                  </GradientCard>
                );
              })}
            </>
          ) : (
            <TouchableOpacity onPress={() => setLockSheet(true)} activeOpacity={0.85}>
              <GradientCard style={styles.lockedCard} animate delay={80}>
                <View style={[styles.lockIconWrap, { backgroundColor: colors.primary + "22" }]}>
                  <AppIcon name="zap" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.lockedTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Übungsfortschritt & Coach
                </Text>
                <Text style={[styles.lockedDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Sieh wie deine Gewichte über Zeit wachsen und erhalte Gewichts- & Wdh-Empfehlungen vom Coach — exklusiv für Premium-Mitglieder.
                </Text>
                <View style={[styles.lockedBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
                  <AppIcon name="zap" size={13} color={colors.primary} />
                  <Text style={[styles.lockedBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Premium freischalten</Text>
                </View>
              </GradientCard>
            </TouchableOpacity>
          )}
        </View>
      )}

      <PremiumLockSheet
        visible={lockSheet}
        onClose={() => setLockSheet(false)}
        featureName="Übungsfortschritt & Coach"
        featureDesc="Detaillierte Fortschrittsanalyse pro Übung, personalisierte Gewichts- und Wdh-Empfehlungen vom Coach."
      />

      {sessionHistory.length > 0 && (
        <View style={styles.section}>
          <Animated.Text entering={FadeInDown.delay(140).duration(400)} style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Trainingshistorie
          </Animated.Text>
          {sessionHistory.slice(0, 10).map((s, i) => {
            const vol = s.exercises.reduce(
              (t, e) => t + e.sets.filter((set) => set.completed).reduce((ts, set) => ts + set.weight * set.reps, 0),
              0,
            );
            return (
              <GradientCard key={s.id} style={styles.historyItem} animate delay={i * 40}>
                <View style={styles.historyRow}>
                  <View style={[styles.historyIcon, { backgroundColor: colors.primary + "22" }]}>
                    <AppIcon name="check-circle" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{s.dayName}</Text>
                    <Text style={[styles.historyMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {new Date(s.completedAt ?? s.startedAt).toLocaleDateString("de-DE")}
                      {s.duration ? ` · ${s.duration} Min` : ""}
                    </Text>
                  </View>
                  <Text style={[styles.historyVol, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {formatVolume(vol).value} {formatVolume(vol).unit}
                  </Text>
                </View>
              </GradientCard>
            );
          })}
        </View>
      )}

      {exerciseKeys.length === 0 && sessionHistory.length === 0 && (
        <GradientCard style={styles.emptyCard} animate delay={200}>
          <AppIcon name="bar-chart-2" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Noch keine Daten</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Absolviere dein erstes Training, um Fortschritte zu sehen.
          </Text>
        </GradientCard>
      )}
    </ScrollView>
      <AnimatedBackground />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollFill: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 30, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  volumeCard: { marginBottom: 24, gap: 8 },
  cardLabel: { fontSize: 12 },
  bigNumber: { fontSize: 40 },
  bigUnit: { fontSize: 18 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16 },
  addBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  bodyRow: { flexDirection: "row", justifyContent: "space-around" },
  bodyItem: { alignItems: "center", gap: 6 },
  bodyIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bodyValue: { fontSize: 22 },
  bodyUnit: { fontSize: 14 },
  bodyLabel: { fontSize: 11 },
  weightInputCard: { padding: 16, borderWidth: 1.5, gap: 10, marginBottom: 10 },
  weightInputLabel: { fontSize: 13 },
  weightInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  weightInput: { flex: 1, fontSize: 28, textAlign: "center", paddingVertical: 10, borderWidth: 1, paddingHorizontal: 12 },
  weightUnit: { fontSize: 18 },
  weightSaveBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  weightList: { gap: 8, marginTop: 10 },
  weightEntry: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderWidth: 1 },
  weightEntryDot: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  weightEntryVal: { fontSize: 16, flex: 1 },
  weightEntryDate: { fontSize: 12 },
  weightDeleteBtn: { padding: 4 },
  weightEmpty: { alignItems: "center", gap: 10, paddingVertical: 24 },
  weightEmptyText: { fontSize: 13, textAlign: "center" },
  tabsScroll: { marginBottom: 12 },
  exerciseTabs: { flexDirection: "row", gap: 6, paddingRight: 16 },
  exerciseTab: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  exerciseTabText: { fontSize: 12 },
  exerciseCard: { marginBottom: 10, gap: 10 },
  exerciseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exerciseName: { fontSize: 15 },
  improvBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2 },
  improvText: { fontSize: 11 },
  exerciseMetaText: { fontSize: 12 },
  progressRow: { gap: 6 },
  progressLabel: { fontSize: 11 },
  proBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  proBadgeText: { fontSize: 9, letterSpacing: 0.8 },
  lockedCard: { alignItems: "center", gap: 12, paddingVertical: 28 },
  heatmapLegend: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
  lockIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  lockedTitle: { fontSize: 15, textAlign: "center" },
  lockedDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  lockedBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  lockedBtnText: { fontSize: 13 },
  historyItem: { marginBottom: 8 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14 },
  historyMeta: { fontSize: 12, marginTop: 1 },
  historyVol: { fontSize: 14 },
  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 16 },
  emptyDesc: { fontSize: 13, textAlign: "center" },
});
