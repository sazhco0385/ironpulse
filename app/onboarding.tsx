import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, type AppIconName } from "@/components/AppIcon";
import { useAthlete, type AthleteGoal, type AthleteLevel, type AthleteProfile } from "@/context/AthleteContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerUser, loginUser } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const GOALS: { key: AthleteGoal; icon: AppIconName; label: string; desc: string }[] = [
  { key: "Muskelaufbau", icon: "zap", label: "Muskelaufbau", desc: "Masse und Größe aufbauen" },
  { key: "Kraft", icon: "trending-up", label: "Maximalkraft", desc: "Schwerer heben, stärker werden" },
  { key: "Definition", icon: "scissors", label: "Definition", desc: "Fett abbauen, Muskeln zeigen" },
  { key: "Fitness", icon: "activity", label: "Allgemeine Fitness", desc: "Gesünder und fitter werden" },
];

const LEVELS: { key: AthleteLevel; label: string; desc: string; years: string }[] = [
  { key: "Anfänger", label: "Anfänger", desc: "Unter 1 Jahr Erfahrung", years: "< 1 J." },
  { key: "Intermediate", label: "Intermediate", desc: "1–3 Jahre regelmäßiges Training", years: "1–3 J." },
  { key: "Fortgeschritten", label: "Fortgeschritten", desc: "Über 3 Jahre intensives Training", years: "> 3 J." },
];

const DAYS = [3, 4, 5, 6];

const TOTAL_STEPS = 5;

function LogoHero({ primaryColor }: { primaryColor: string }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    pulse(ring1, 0);
    pulse(ring2, 600);
    pulse(ring3, 1200);
  }, []);

  const ringStyle = (anim: Animated.Value, base: number) => ({
    position: "absolute" as const,
    width: base,
    height: base,
    borderRadius: base / 2,
    borderWidth: 1.5,
    borderColor: primaryColor,
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
  });

  return (
    <View style={heroStyles.wrap}>
      <Animated.View style={ringStyle(ring3, 220)} />
      <Animated.View style={ringStyle(ring2, 200)} />
      <Animated.View style={ringStyle(ring1, 180)} />
      <View style={[heroStyles.circle, { borderColor: primaryColor + "88" }]}>
        <View style={[heroStyles.innerCircle, { backgroundColor: "#0d0d0f" }]}>
          <Image
            source={require("../assets/images/ironpulse-logo.png")}
            style={heroStyles.img}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", height: 240, marginBottom: 8 },
  circle: { width: 168, height: 168, borderRadius: 84, borderWidth: 2, padding: 3, shadowColor: "#00D4FF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 12 },
  innerCircle: { flex: 1, borderRadius: 82, overflow: "hidden" },
  img: { width: "100%", height: "100%" },
});

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveProfile, profile, setDbUserId } = useAthlete();
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (profile) {
      router.replace("/(tabs)");
    }
  }, [profile]);

  const topPad = isWeb ? 24 : insets.top + 8;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [goal, setGoal] = useState<AthleteGoal | null>(null);
  const [level, setLevel] = useState<AthleteLevel | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [days, setDays] = useState<number>(4);

  const [loginMode, setLoginMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setLoginError("Bitte eine gültige E-Mail eingeben");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");
    const result = await loginUser(loginEmail.trim());
    if (!result.success || !result.userId) {
      setLoginError(result.error ?? "Kein Account mit dieser E-Mail gefunden");
      setIsLoggingIn(false);
      return;
    }
    await setDbUserId(result.userId);
    if (result.profileData) {
      try {
        const restoredProfile = JSON.parse(result.profileData) as AthleteProfile;
        if (result.workoutData) {
          await AsyncStorage.setItem("__serverWorkoutData__", result.workoutData);
        }
        await saveProfile(restoredProfile);
        router.replace("/(tabs)");
        return;
      } catch {}
    }
    setLoginError("Account gefunden, aber kein gespeichertes Profil. Bitte neu registrieren.");
    setIsLoggingIn(false);
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const tap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goNext = () => {
    tap();
    Keyboard.dismiss();
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    tap();
    setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    if (!goal || !level) return;
    setIsSending(true);
    const p: AthleteProfile = {
      name: name.trim() || "Athlet",
      email: email.trim(),
      goal,
      level,
      daysPerWeek: days,
      weightKg: parseFloat(weightKg) || 0,
      heightCm: parseFloat(heightCm) || 0,
      createdAt: new Date().toISOString(),
    };
    const profileJson = JSON.stringify(p);
    await saveProfile(p);
    if (email.trim() && isValidEmail(email.trim())) {
      registerUser(p.name, email.trim(), profileJson)
        .then(async (result) => {
          if (result.userId) {
            await setDbUserId(result.userId);
          }
        })
        .catch(() => {});
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSending(false);
    router.replace("/(tabs)");
  };

  const canProceed = [
    name.trim().length > 0 && email.trim().length > 0 && isValidEmail(email.trim()),
    goal !== null,
    level !== null,
    weightKg.trim().length > 0 && heightCm.trim().length > 0,
    true,
  ][step];

  const summaryRows: { icon: AppIconName; color: string; val: string }[] = [
    { icon: "user", color: colors.primary, val: name.trim() || "Athlet" },
    { icon: "target", color: colors.accent, val: goal ?? "—" },
    { icon: "bar-chart-2", color: colors.purple, val: level ?? "—" },
    { icon: "activity", color: colors.accent, val: `${weightKg} kg · ${heightCm} cm` },
    { icon: "calendar", color: colors.success, val: `${days}× pro Woche` },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, { backgroundColor: i <= step ? colors.primary : colors.border }]}
            />
          ))}
        </View>
        {step > 0 && (
          <TouchableOpacity onPress={goBack} style={[styles.backBtn, { backgroundColor: colors.secondary, borderRadius: 20 }]}>
            <AppIcon name="chevron-left" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && loginMode && (
            <View style={styles.stepWrap}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
                <AppIcon name="log-in" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Willkommen zurück
              </Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Gib deine E-Mail-Adresse ein, um dein Profil und deinen Trainingsfortschritt wiederherzustellen.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  E-Mail-Adresse
                </Text>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: loginError ? colors.destructive : loginEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail) ? colors.success : colors.border, backgroundColor: colors.card, fontFamily: "Inter_600SemiBold", borderRadius: colors.radius }]}
                  placeholder="deine@email.de"
                  placeholderTextColor={colors.mutedForeground}
                  value={loginEmail}
                  onChangeText={(v) => { setLoginEmail(v); setLoginError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  autoFocus
                />
                {loginError.length > 0 && (
                  <Text style={[styles.inputError, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
                    {loginError}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: isLoggingIn ? 0.6 : 1 }]}
                onPress={handleLogin}
                disabled={isLoggingIn}
                activeOpacity={0.8}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={{ color: "#000", fontFamily: "Inter_700Bold", fontSize: 16 }}>Anmelden & Wiederherstellen</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setLoginMode(false); setLoginError(""); setLoginEmail(""); }} style={{ marginTop: 16, alignItems: "center" }}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                  Zurück zur Registrierung
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {step === 0 && !loginMode && (
            <View style={styles.stepWrap}>
              <LogoHero primaryColor={colors.primary} />
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Willkommen bei{"\n"}
                <Text style={{ color: colors.primary }}>IronPulse</Text>
              </Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Erstelle dein kostenloses Konto und starte deine Transformation.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  Name
                </Text>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: name ? colors.primary : colors.border, backgroundColor: colors.card, fontFamily: "Inter_600SemiBold", borderRadius: colors.radius }]}
                  placeholder="Dein Name oder Spitzname"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  E-Mail-Adresse
                </Text>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: email && !isValidEmail(email) ? colors.destructive : email && isValidEmail(email) ? colors.success : colors.border, backgroundColor: colors.card, fontFamily: "Inter_600SemiBold", borderRadius: colors.radius }]}
                  placeholder="deine@email.de"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setEmailError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => canProceed && goNext()}
                />
                {email.length > 0 && !isValidEmail(email) && (
                  <Text style={[styles.inputError, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
                    Bitte eine gültige E-Mail-Adresse eingeben
                  </Text>
                )}
                {email.length > 0 && isValidEmail(email) && (
                  <View style={styles.inputSuccess}>
                    <AppIcon name="check-circle" size={13} color={colors.success} />
                    <Text style={[styles.inputSuccessText, { color: colors.success, fontFamily: "Inter_400Regular" }]}>
                      Du erhältst eine Willkommens-E-Mail
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.privacyNote, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <AppIcon name="shield" size={14} color={colors.mutedForeground} />
                <Text style={[styles.privacyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Dein Profil und Trainingsfortschritt werden sicher auf dem Server gesichert, damit du sie nie verlierst.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => { setLoginMode(true); setLoginError(""); setLoginEmail(""); }}
                style={{ marginTop: 20, alignItems: "center", padding: 12 }}
              >
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                  Bereits registriert? Anmelden & wiederherstellen
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepWrap}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accent + "22" }]}>
                <AppIcon name="target" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Was ist dein Ziel?
              </Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Wähle dein primäres Trainingsziel.
              </Text>
              <View style={styles.optionsList}>
                {GOALS.map((g) => {
                  const selected = goal === g.key;
                  return (
                    <TouchableOpacity
                      key={g.key}
                      onPress={() => { setGoal(g.key); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                      style={[styles.optionCard, { backgroundColor: selected ? colors.accent + "1A" : colors.card, borderColor: selected ? colors.accent : colors.border, borderRadius: colors.radius }]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionIcon, { backgroundColor: selected ? colors.accent + "33" : colors.secondary }]}>
                        <AppIcon name={g.icon} size={20} color={selected ? colors.accent : colors.mutedForeground} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{g.label}</Text>
                        <Text style={[styles.optionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{g.desc}</Text>
                      </View>
                      {selected && (
                        <View style={[styles.checkDot, { backgroundColor: colors.accent }]}>
                          <AppIcon name="check" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepWrap}>
              <View style={[styles.iconCircle, { backgroundColor: colors.purple + "22" }]}>
                <AppIcon name="bar-chart-2" size={32} color={colors.purple} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Dein Trainingslevel?
              </Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Wie lange trainierst du schon?
              </Text>
              <View style={styles.optionsList}>
                {LEVELS.map((l) => {
                  const selected = level === l.key;
                  return (
                    <TouchableOpacity
                      key={l.key}
                      onPress={() => { setLevel(l.key); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                      style={[styles.levelCard, { backgroundColor: selected ? colors.purple + "1A" : colors.card, borderColor: selected ? colors.purple : colors.border, borderRadius: colors.radius }]}
                      activeOpacity={0.8}
                    >
                      {selected && <View style={[styles.levelBar, { backgroundColor: colors.purple }]} />}
                      <View style={{ flex: 1, paddingLeft: selected ? 10 : 0 }}>
                        <Text style={[styles.optionLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{l.label}</Text>
                        <Text style={[styles.optionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{l.desc}</Text>
                      </View>
                      <View style={[styles.yearsBadge, { backgroundColor: selected ? colors.purple + "33" : colors.secondary, borderRadius: 8 }]}>
                        <Text style={[styles.yearsText, { color: selected ? colors.purple : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>{l.years}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepWrap}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accent + "22" }]}>
                <AppIcon name="sliders" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Körpermaße
              </Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Deine Maße helfen dabei, den Fortschritt besser zu tracken.
              </Text>

              <View style={styles.measureRow}>
                <View style={[styles.measureCard, { backgroundColor: colors.card, borderColor: weightKg ? colors.primary : colors.border, borderRadius: colors.radius }]}>
                  <View style={[styles.measureIcon, { backgroundColor: colors.primary + "22" }]}>
                    <AppIcon name="activity" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.measureLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Gewicht</Text>
                  <View style={styles.measureInputRow}>
                    <TextInput
                      style={[styles.measureInput, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
                      placeholder="75"
                      placeholderTextColor={colors.mutedForeground}
                      value={weightKg}
                      onChangeText={(v) => setWeightKg(v.replace(",", "."))}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                    <Text style={[styles.measureUnit, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>kg</Text>
                  </View>
                </View>

                <View style={[styles.measureCard, { backgroundColor: colors.card, borderColor: heightCm ? colors.primary : colors.border, borderRadius: colors.radius }]}>
                  <View style={[styles.measureIcon, { backgroundColor: colors.primary + "22" }]}>
                    <AppIcon name="maximize-2" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.measureLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Körpergröße</Text>
                  <View style={styles.measureInputRow}>
                    <TextInput
                      style={[styles.measureInput, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
                      placeholder="180"
                      placeholderTextColor={colors.mutedForeground}
                      value={heightCm}
                      onChangeText={(v) => setHeightCm(v.replace(",", "."))}
                      keyboardType="number-pad"
                      returnKeyType="done"
                    />
                    <Text style={[styles.measureUnit, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>cm</Text>
                  </View>
                </View>
              </View>

              {weightKg && heightCm && (
                (() => {
                  const bmi = parseFloat(weightKg) / Math.pow(parseFloat(heightCm) / 100, 2);
                  const bmiLabel = bmi < 18.5 ? "Untergewicht" : bmi < 25 ? "Normalgewicht" : bmi < 30 ? "Übergewicht" : "Adipositas";
                  const bmiColor = bmi < 18.5 ? colors.warning : bmi < 25 ? colors.success : bmi < 30 ? colors.warning : colors.destructive;
                  return (
                    <View style={[styles.bmiCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                      <Text style={[styles.bmiLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>BMI</Text>
                      <View style={styles.bmiRow}>
                        <Text style={[styles.bmiValue, { color: bmiColor, fontFamily: "Inter_700Bold" }]}>
                          {bmi.toFixed(1)}
                        </Text>
                        <View style={[styles.bmiBadge, { backgroundColor: bmiColor + "22", borderRadius: 6 }]}>
                          <Text style={[styles.bmiBadgeText, { color: bmiColor, fontFamily: "Inter_600SemiBold" }]}>{bmiLabel}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()
              )}
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepWrap}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + "22" }]}>
                <AppIcon name="calendar" size={32} color={colors.success} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Wie oft pro Woche?
              </Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Wie viele Tage pro Woche möchtest du trainieren?
              </Text>
              <View style={styles.daysGrid}>
                {DAYS.map((d) => {
                  const selected = days === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => { setDays(d); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                      style={[styles.dayCard, { backgroundColor: selected ? colors.success + "1A" : colors.card, borderColor: selected ? colors.success : colors.border, borderRadius: colors.radius }]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dayNumber, { color: selected ? colors.success : colors.foreground, fontFamily: "Inter_700Bold" }]}>{d}</Text>
                      <Text style={[styles.dayLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Tage</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Text style={[styles.summaryTitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Dein Profil</Text>
                {summaryRows.map((row, i) => (
                  <View key={i} style={styles.summaryRow}>
                    <AppIcon name={row.icon} size={14} color={row.color} />
                    <Text style={[styles.summaryText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {!loginMode && <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={step < TOTAL_STEPS - 1 ? goNext : handleFinish}
            disabled={!canProceed}
            style={[styles.nextBtn, { backgroundColor: canProceed ? colors.primary : colors.secondary, borderRadius: colors.radius }]}
            activeOpacity={0.85}
          >
            {step < TOTAL_STEPS - 1 ? (
              <>
                <Text style={[styles.nextBtnText, { color: canProceed ? colors.primaryForeground : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                  Weiter
                </Text>
                <AppIcon name="arrow-right" size={18} color={canProceed ? colors.primaryForeground : colors.mutedForeground} />
              </>
            ) : isSending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <AppIcon name="check-circle" size={18} color={colors.primaryForeground} />
                <Text style={[styles.nextBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                  Konto erstellen
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  progressRow: { flexDirection: "row", gap: 6, height: 3 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },
  backBtn: { position: "absolute", left: 16, bottom: -4, width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 24, gap: 0 },
  stepWrap: { gap: 16, paddingTop: 8 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 28, lineHeight: 34 },
  stepDesc: { fontSize: 15, lineHeight: 22 },
  nameInput: { borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 14, fontSize: 20, marginTop: 4 },
  optionsList: { gap: 10 },
  optionCard: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1.5, gap: 12 },
  optionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  optionLabel: { fontSize: 16 },
  optionDesc: { fontSize: 13, marginTop: 2 },
  checkDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  levelCard: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1.5, gap: 4, overflow: "hidden", position: "relative" },
  levelBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  yearsBadge: { paddingHorizontal: 10, paddingVertical: 5 },
  yearsText: { fontSize: 12 },
  measureRow: { flexDirection: "row", gap: 12 },
  measureCard: { flex: 1, padding: 16, borderWidth: 1.5, gap: 8, alignItems: "center" },
  measureIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  measureLabel: { fontSize: 12 },
  measureInputRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  measureInput: { fontSize: 32, minWidth: 60, textAlign: "center" },
  measureUnit: { fontSize: 16 },
  bmiCard: { padding: 16, borderWidth: 1, gap: 6 },
  bmiLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  bmiRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bmiValue: { fontSize: 32 },
  bmiBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  bmiBadgeText: { fontSize: 13 },
  daysGrid: { flexDirection: "row", gap: 10 },
  dayCard: { flex: 1, paddingVertical: 20, alignItems: "center", justifyContent: "center", borderWidth: 1.5, gap: 4 },
  dayNumber: { fontSize: 32 },
  dayLabel: { fontSize: 12 },
  summaryCard: { padding: 16, borderWidth: 1, gap: 10, marginTop: 4 },
  summaryTitle: { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryText: { fontSize: 15 },
  loginBtn: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  nextBtnText: { fontSize: 17 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, paddingLeft: 2 },
  inputError: { fontSize: 12, paddingLeft: 2, marginTop: 4 },
  inputSuccess: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 2, marginTop: 4 },
  inputSuccessText: { fontSize: 12 },
  privacyNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderWidth: 1, marginTop: 4 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
