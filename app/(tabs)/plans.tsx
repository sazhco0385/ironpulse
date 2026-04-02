import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/AppIcon";
import { PremiumLockSheet } from "@/components/PremiumLockSheet";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/hooks/usePremium";

export default function PlansScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plans, activePlan, setActivePlan, startWorkout, weekNumber, nextDayIdx, cycleCount, resetPlan } = useWorkout();
  const { isPremium } = usePremium();
  const [lockSheet, setLockSheet] = useState(false);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = isWeb ? 0 : 60;
  const bottomPad = isWeb ? 34 : insets.bottom + TAB_BAR_HEIGHT;

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (!isPremium && activePlan && activePlan.id !== plan.id) {
      setLockSheet(true);
      return;
    }
    setActivePlan(plan);
  };

  const handleResetPlan = () => {
    const doReset = () => resetPlan();
    if (Platform.OS === "web") {
      if (window.confirm("Plan zurücksetzen?\n\nWoche, Tageszähler, Trainingshistorie und alle Gewichtsfortschritte werden auf 0 zurückgesetzt.")) {
        doReset();
      }
    } else {
      Alert.alert(
        "Plan zurücksetzen",
        "Woche, Tageszähler, Trainingshistorie und alle Gewichtsfortschritte werden vollständig auf 0 zurückgesetzt. Diese Aktion kann nicht rückgängig gemacht werden.",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Zurücksetzen", style: "destructive", onPress: doReset },
        ],
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Programme</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {plans.length} verfügbar
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={[styles.settingsBtn, { backgroundColor: colors.secondary, borderRadius: 10 }]}
          activeOpacity={0.75}
        >
          <AppIcon name="sliders" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {activePlan && (
        <View style={[styles.activeInfo, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.activeInfoTop}>
            <View style={[styles.activeIcon, { backgroundColor: colors.primary + "22" }]}>
              <AppIcon name="zap" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Aktives Programm
              </Text>
              <Text style={[styles.activeName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {activePlan.name}
              </Text>
            </View>
            <View style={[styles.weekBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
              <Text style={[styles.weekLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Woche</Text>
              <Text style={[styles.weekNum, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{weekNumber}</Text>
            </View>
          </View>

          <View style={styles.activeInfoStats}>
            <View style={[styles.statChip, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
              <AppIcon name="calendar" size={13} color={colors.mutedForeground} />
              <Text style={[styles.statChipText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Tag {nextDayIdx + 1} / {activePlan.days.length}
              </Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
              <AppIcon name="refresh-cw" size={13} color={colors.mutedForeground} />
              <Text style={[styles.statChipText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Zyklus {cycleCount + 1}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResetPlan}
            style={[styles.resetBtn, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "44", borderRadius: 8 }]}
            activeOpacity={0.8}
          >
            <AppIcon name="refresh-cw" size={15} color={colors.warning} />
            <Text style={[styles.resetBtnText, { color: colors.warning, fontFamily: "Inter_600SemiBold" }]}>
              Plan zurücksetzen (Woche 1, Tag 1)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {plans.map((plan) => (
        <WorkoutCard
          key={plan.id}
          plan={plan}
          isActive={activePlan?.id === plan.id}
          onSelect={() => handleSelectPlan(plan)}
          onStart={
            plan.days[0]
              ? () => {
                  if (activePlan?.id !== plan.id) {
                    handleSelectPlan(plan);
                    if (!isPremium && activePlan) return;
                  }
                  startWorkout(plan, plan.days[0]);
                  router.push("/workout");
                }
              : undefined
          }
          locked={!isPremium && !!activePlan && activePlan.id !== plan.id}
        />
      ))}

      <TouchableOpacity
        onPress={() => !isPremium && setLockSheet(true)}
        activeOpacity={isPremium ? 1 : 0.8}
        style={[styles.infoCard, { backgroundColor: isPremium ? colors.card : colors.primary + "10", borderColor: isPremium ? colors.border : colors.primary + "44", borderRadius: colors.radius }]}
      >
        <AppIcon name={isPremium ? "info" : "zap"} size={16} color={colors.primary} />
        <View style={styles.infoText}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.infoTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Automatische Progression</Text>
            {!isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.premiumBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.infoDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {isPremium
              ? "Die App passt Gewichte und Wiederholungen automatisch an deinen Fortschritt an. Nach jedem Training werden deine Daten analysiert und optimale Lasten für das nächste Training vorgeschlagen."
              : "Premium-Feature: Gewichte und Wiederholungen werden nach jedem Training automatisch optimiert. Tippe hier um Premium freizuschalten."}
          </Text>
        </View>
      </TouchableOpacity>

      <PremiumLockSheet
        visible={lockSheet}
        onClose={() => setLockSheet(false)}
        featureName="Plan Anpassung"
        featureDesc="Wechsle und passe deine Trainingspläne jederzeit an, um dein Training optimal zu gestalten."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 30, marginBottom: 2 },
  sub: { fontSize: 13 },
  settingsBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", marginTop: 4 },
  activeInfo: { borderWidth: 1, padding: 14, gap: 12, marginBottom: 12 },
  activeInfoTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  activeIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activeLabel: { fontSize: 11 },
  activeName: { fontSize: 15, marginTop: 1 },
  weekBadge: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  weekLabel: { fontSize: 9, letterSpacing: 1 },
  weekNum: { fontSize: 18, lineHeight: 22 },
  activeInfoStats: { flexDirection: "row", gap: 8 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  statChipText: { fontSize: 13 },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderWidth: 1 },
  resetBtnText: { fontSize: 13 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderWidth: 1, marginTop: 8 },
  infoText: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 14 },
  infoDesc: { fontSize: 12, lineHeight: 18 },
  premiumBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  premiumBadgeText: { fontSize: 9, letterSpacing: 0.8 },
});
