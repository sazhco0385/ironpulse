import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, type AppIconName } from "@/components/AppIcon";
import { useAthlete, type AthleteGoal, type AthleteLevel } from "@/context/AthleteContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import {
  getHealthSyncEnabled,
  isHealthAvailable,
  requestHealthPermissions,
  setHealthSyncEnabled,
} from "@/lib/health";

const GOALS: { key: AthleteGoal; icon: AppIconName; label: string }[] = [
  { key: "Muskelaufbau", icon: "zap", label: "Muskelaufbau" },
  { key: "Kraft", icon: "trending-up", label: "Maximalkraft" },
  { key: "Definition", icon: "scissors", label: "Definition" },
  { key: "Fitness", icon: "activity", label: "Allgemeine Fitness" },
];

const LEVELS: { key: AthleteLevel; label: string }[] = [
  { key: "Anfänger", label: "Anfänger" },
  { key: "Intermediate", label: "Intermediate" },
  { key: "Fortgeschritten", label: "Fortgeschritten" },
];

const DAYS = [3, 4, 5, 6];

function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
      {title.toUpperCase()}
    </Text>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile, clearProfile } = useAthlete();
  const { weekNumber, cycleCount, totalWorkouts, activePlan, resetPlan } = useWorkout();
  const isWeb = Platform.OS === "web";

  const topPad = isWeb ? 16 : insets.top + 8;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [name, setName] = useState(profile?.name ?? "");
  const [goal, setGoal] = useState<AthleteGoal>(profile?.goal ?? "Muskelaufbau");
  const [level, setLevel] = useState<AthleteLevel>(profile?.level ?? "Intermediate");
  const [weightKg, setWeightKg] = useState(profile?.weightKg ? String(profile.weightKg) : "");
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : "");
  const [days, setDays] = useState<number>(profile?.daysPerWeek ?? 4);
  const [saved, setSaved] = useState(false);

  const [healthAvailable, setHealthAvailable] = useState(false);
  const [healthEnabled, setHealthEnabled] = useState(false);
  const [healthConnecting, setHealthConnecting] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    isHealthAvailable().then(setHealthAvailable);
    getHealthSyncEnabled().then(setHealthEnabled);
  }, []);

  const tap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!profile) return;
    tap();
    Keyboard.dismiss();
    await saveProfile({
      ...profile,
      name: name.trim() || profile.name,
      goal,
      level,
      daysPerWeek: days,
      weightKg: parseFloat(weightKg) || profile.weightKg,
      heightCm: parseFloat(heightCm) || profile.heightCm,
    });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetPlan = () => {
    const doReset = async () => {
      await resetPlan();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

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

  const handleHealthToggle = async (value: boolean) => {
    tap();
    if (value) {
      setHealthConnecting(true);
      const granted = await requestHealthPermissions();
      setHealthConnecting(false);
      if (!granted) {
        Alert.alert(
          Platform.OS === "ios" ? "Apple Health" : "Health Connect",
          "Bitte erlaube den Zugriff in den Systemeinstellungen um die Synchronisation zu aktivieren.",
          [{ text: "OK" }],
        );
        return;
      }
    }
    await setHealthSyncEnabled(value);
    setHealthEnabled(value);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteAccount = () => {
    const doDelete = async () => {
      await clearProfile();
      router.replace("/onboarding");
    };

    if (Platform.OS === "web") {
      if (window.confirm("Profil löschen?\n\nAlle Daten werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.")) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Profil löschen",
        "Alle deine Daten werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Löschen", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  if (!profile) return null;

  const bmi = profile.weightKg && profile.heightCm
    ? profile.weightKg / Math.pow(profile.heightCm / 100, 2)
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="chevron-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Einstellungen
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: saved ? colors.success + "22" : colors.primary + "22", borderRadius: 8 }]}
          activeOpacity={0.8}
        >
          {saved ? (
            <AppIcon name="check" size={16} color={colors.success} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Speichern
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Summary */}
          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.avatarInitial, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{profile.name}</Text>
              <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {profile.level} · {totalWorkouts} Einheiten
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
              <Text style={[styles.statPillText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>W{weekNumber}</Text>
              <Text style={[styles.statPillSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Woche</Text>
            </View>
          </View>

          {/* Name */}
          <SectionHeader title="Persönliches" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.fieldRow}>
              <AppIcon name="user" size={16} color={colors.mutedForeground} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Name</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_600SemiBold", borderRadius: colors.radius / 2 }]}
              value={name}
              onChangeText={setName}
              placeholder="Dein Name"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Goal */}
          <SectionHeader title="Trainingsziel" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.chipRow}>
              {GOALS.map((g) => {
                const sel = goal === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => { setGoal(g.key); tap(); }}
                    style={[styles.chip, { backgroundColor: sel ? colors.accent + "22" : colors.secondary, borderColor: sel ? colors.accent : "transparent", borderRadius: 8 }]}
                    activeOpacity={0.8}
                  >
                    <AppIcon name={g.icon} size={13} color={sel ? colors.accent : colors.mutedForeground} />
                    <Text style={[styles.chipText, { color: sel ? colors.accent : colors.mutedForeground, fontFamily: sel ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Level */}
          <SectionHeader title="Trainingslevel" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, gap: 8 }]}>
            {LEVELS.map((l) => {
              const sel = level === l.key;
              return (
                <TouchableOpacity
                  key={l.key}
                  onPress={() => { setLevel(l.key); tap(); }}
                  style={[styles.levelRow, { backgroundColor: sel ? colors.purple + "18" : colors.secondary, borderColor: sel ? colors.purple : "transparent", borderRadius: 8 }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.levelDot, { backgroundColor: sel ? colors.purple : colors.border }]} />
                  <Text style={[styles.levelText, { color: sel ? colors.purple : colors.foreground, fontFamily: sel ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                    {l.label}
                  </Text>
                  {sel && <AppIcon name="check" size={14} color={colors.purple} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Body */}
          <SectionHeader title="Körpermaße" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.bodyRow}>
              <View style={styles.bodyField}>
                <Text style={[styles.bodyLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Gewicht (kg)</Text>
                <TextInput
                  style={[styles.bodyInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_700Bold", borderRadius: colors.radius / 2 }]}
                  value={weightKg}
                  onChangeText={(v) => setWeightKg(v.replace(",", "."))}
                  keyboardType="decimal-pad"
                  placeholder="75"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={styles.bodyField}>
                <Text style={[styles.bodyLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Größe (cm)</Text>
                <TextInput
                  style={[styles.bodyInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_700Bold", borderRadius: colors.radius / 2 }]}
                  value={heightCm}
                  onChangeText={(v) => setHeightCm(v.replace(",", "."))}
                  keyboardType="number-pad"
                  placeholder="180"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
            {bmi && (
              <View style={[styles.bmiRow, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
                <AppIcon name="activity" size={14} color={colors.primary} />
                <Text style={[styles.bmiText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  BMI: <Text style={[{ color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{bmi.toFixed(1)}</Text>
                  {"  "}
                  {bmi < 18.5 ? "Untergewicht" : bmi < 25 ? "Normalgewicht" : bmi < 30 ? "Übergewicht" : "Adipositas"}
                </Text>
              </View>
            )}
          </View>

          {/* Days per week */}
          <SectionHeader title="Trainingstage pro Woche" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.daysRow}>
              {DAYS.map((d) => {
                const sel = days === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => { setDays(d); tap(); }}
                    style={[styles.dayBtn, { backgroundColor: sel ? colors.primary + "22" : colors.secondary, borderColor: sel ? colors.primary : "transparent", borderRadius: 8 }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayNum, { color: sel ? colors.primary : colors.foreground, fontFamily: "Inter_700Bold" }]}>{d}</Text>
                    <Text style={[styles.dayLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Tage</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Plan info */}
          {activePlan && (
            <>
              <SectionHeader title="Aktives Programm" colors={colors} />
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, gap: 12 }]}>
                <View style={styles.planInfoRow}>
                  <AppIcon name="list" size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{activePlan.name}</Text>
                    <Text style={[styles.planSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Woche {weekNumber} · Zyklus {cycleCount + 1}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleResetPlan}
                  style={[styles.resetBtn, { backgroundColor: colors.warning + "18", borderColor: colors.warning + "44", borderRadius: 8 }]}
                  activeOpacity={0.8}
                >
                  <AppIcon name="refresh-cw" size={16} color={colors.warning} />
                  <Text style={[styles.resetBtnText, { color: colors.warning, fontFamily: "Inter_600SemiBold" }]}>
                    Plan zurücksetzen (auf Woche 1, Tag 1)
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Premium */}
          <SectionHeader title="Mitgliedschaft" colors={colors} />
          <TouchableOpacity
            onPress={() => router.push("/premium")}
            style={[styles.card, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "50", borderRadius: colors.radius, flexDirection: "row", alignItems: "center", gap: 14 }]}
            activeOpacity={0.8}
          >
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primary + "30", alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="zap" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 15 }}>IronPulse Premium</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 }}>Alle Features freischalten · ab €9,99</Text>
            </View>
            <AppIcon name="arrow-right" size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* Health Integration */}
          {Platform.OS !== "web" && (
            <>
              <SectionHeader title="Gesundheit" colors={colors} />
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: (healthEnabled ? "#34C759" : colors.muted) + "33", alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name="heart" size={18} color={healthEnabled ? "#34C759" : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                      {Platform.OS === "ios" ? "Apple Health" : "Google Health Connect"}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                      {healthAvailable
                        ? (healthEnabled ? "Trainings werden synchronisiert" : "Synchronisation deaktiviert")
                        : "Nicht verfügbar auf diesem Gerät"}
                    </Text>
                  </View>
                  {healthAvailable && (
                    <Switch
                      value={healthEnabled}
                      onValueChange={handleHealthToggle}
                      disabled={healthConnecting}
                      trackColor={{ false: colors.muted, true: "#34C75966" }}
                      thumbColor={healthEnabled ? "#34C759" : colors.mutedForeground}
                    />
                  )}
                </View>
                {healthEnabled && (
                  <View style={{ backgroundColor: "#34C75911", borderRadius: 8, padding: 10, marginTop: 4 }}>
                    <Text style={{ color: "#34C759", fontFamily: "Inter_400Regular", fontSize: 12 }}>
                      Jedes abgeschlossene Training wird automatisch in {Platform.OS === "ios" ? "Apple Health" : "Health Connect"} eingetragen.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Danger zone */}
          <SectionHeader title="Gefahrenzone" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.destructive + "44", borderRadius: colors.radius }]}>
            <Text style={[styles.dangerDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Löscht dein Profil und alle gespeicherten Daten dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={[styles.deleteBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44", borderRadius: 8 }]}
              activeOpacity={0.8}
            >
              <AppIcon name="trash-2" size={16} color={colors.destructive} />
              <Text style={[styles.deleteBtnText, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
                Profil und Daten löschen
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, fontSize: 18, textAlign: "center" },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 7, minWidth: 80, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 14 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 0 },
  sectionHeader: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginTop: 20, paddingLeft: 4 },
  card: { borderWidth: 1, padding: 16, gap: 12, marginBottom: 2 },
  profileCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 16, gap: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 22 },
  profileName: { fontSize: 17 },
  profileSub: { fontSize: 13, marginTop: 2 },
  statPill: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 8 },
  statPillText: { fontSize: 18 },
  statPillSub: { fontSize: 10 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  fieldLabel: { fontSize: 13 },
  fieldInput: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5 },
  chipText: { fontSize: 13 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5 },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  levelText: { flex: 1, fontSize: 15 },
  bodyRow: { flexDirection: "row", gap: 12 },
  bodyField: { flex: 1, gap: 6 },
  bodyLabel: { fontSize: 12 },
  bodyInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 20, textAlign: "center" },
  bmiRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  bmiText: { fontSize: 14 },
  daysRow: { flexDirection: "row", gap: 10 },
  dayBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderWidth: 1.5, gap: 2 },
  dayNum: { fontSize: 24 },
  dayLabel: { fontSize: 11 },
  planInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  planName: { fontSize: 15 },
  planSub: { fontSize: 13, marginTop: 2 },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderWidth: 1 },
  resetBtnText: { fontSize: 14, flex: 1 },
  dangerDesc: { fontSize: 13, lineHeight: 19 },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderWidth: 1 },
  deleteBtnText: { fontSize: 14 },
});
