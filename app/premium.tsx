import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppIcon } from "@/components/AppIcon";
import { useColors } from "@/hooks/useColors";
import { createPayPalOrder, capturePayPalOrder, verifyMembership, registerUser, type MembershipPlan } from "@/lib/api";

const PLANS: Array<{
  key: MembershipPlan;
  label: string;
  duration: string;
  priceEur: number;
  pricePerMonth: number;
  badge?: string;
}> = [
  { key: "monthly",     label: "Monatlich",       duration: "1 Monat",   priceEur: 4.99,  pricePerMonth: 4.99 },
  { key: "quarterly",   label: "Vierteljährlich",  duration: "3 Monate",  priceEur: 24.99, pricePerMonth: 8.33,  badge: "Beliebt" },
  { key: "semi_annual", label: "Halbjährlich",     duration: "6 Monate",  priceEur: 44.99, pricePerMonth: 7.50,  badge: "Sparpreis" },
  { key: "annual",      label: "Jährlich",         duration: "12 Monate", priceEur: 79.99, pricePerMonth: 6.67,  badge: "Bestes Angebot" },
];

const PREMIUM_FEATURES = [
  "Automatische Gewichtsprogression",
  "Plan wechseln & anpassen",
  "Detaillierte Übungsanalyse",
  "Coach: Gewichts- & Wdh-Anpassungen",
  "Deload-Wochen-Steuerung",
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function PremiumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>("annual");
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [premiumExpires, setPremiumExpires] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const pendingOrderRef = useRef<{ orderId: string; plan: MembershipPlan; uid: number } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const storedId = await AsyncStorage.getItem("dbUserId");
        const profileJson = await AsyncStorage.getItem("athleteProfile");
        const p = profileJson ? JSON.parse(profileJson) : null;

        if (p?.email) setEmail(p.email);

        let resolvedId: number | null = storedId ? parseInt(storedId, 10) : null;

        if (!resolvedId && p?.name && p?.email) {
          const res = await registerUser(p.name, p.email);
          if (res.userId) {
            resolvedId = res.userId;
            await AsyncStorage.setItem("dbUserId", String(resolvedId));
          }
        }

        setUserId(resolvedId);

        if (resolvedId) {
          const m = await verifyMembership(resolvedId);
          setIsPremium(m.isPremium);
          if (m.isPremium) {
            setPremiumPlan(m.plan ?? null);
            setPremiumExpires(m.expiresAt ?? null);
          }
        }
      } catch {}
      setCheckingStatus(false);
    };
    init();
  }, []);

  const handleLinkAccount = async () => {
    if (!isValidEmail(email.trim())) {
      setEmailError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    setEmailError("");
    setLinking(true);
    Keyboard.dismiss();
    try {
      const profileJson = await AsyncStorage.getItem("athleteProfile");
      const p = profileJson ? JSON.parse(profileJson) : null;
      const name = p?.name ?? "IronPulse Nutzer";
      const res = await registerUser(name, email.trim());
      if (res.userId) {
        await AsyncStorage.setItem("dbUserId", String(res.userId));
        setUserId(res.userId);
        const m = await verifyMembership(res.userId);
        setIsPremium(m.isPremium);
        if (m.isPremium) {
          setPremiumPlan(m.plan ?? null);
          setPremiumExpires(m.expiresAt ?? null);
        }
      } else {
        setEmailError("Konto konnte nicht verknüpft werden. Versuche es erneut.");
      }
    } catch {
      setEmailError("Netzwerkfehler. Bitte prüfe deine Verbindung.");
    } finally {
      setLinking(false);
    }
  };

  const handleBuy = async () => {
    let uid = userId;

    if (!uid) {
      if (!isValidEmail(email.trim())) {
        setEmailError("Bitte zuerst E-Mail verknüpfen.");
        return;
      }
      await handleLinkAccount();
      uid = userId;
      if (!uid) return;
    }

    setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "https://ironpulse.app";
      const returnUrl = Platform.OS === "web"
        ? `${baseUrl}/fitness-app/paypal-return`
        : "ironpulse://paypal-success";
      const cancelUrl = Platform.OS === "web"
        ? `${baseUrl}/fitness-app/paypal-cancel`
        : "ironpulse://paypal-cancel";

      const orderResult = await createPayPalOrder(uid, selectedPlan, returnUrl, cancelUrl);
      if (!orderResult.success || !orderResult.data) {
        Alert.alert("Fehler", orderResult.error ?? "Bestellung fehlgeschlagen.");
        return;
      }

      const { orderId, approveUrl } = orderResult.data;
      pendingOrderRef.current = { orderId, plan: selectedPlan, uid };

      const browserResult = await WebBrowser.openAuthSessionAsync(approveUrl, returnUrl);

      const captureOrder = async () => {
        const ref = pendingOrderRef.current;
        if (!ref) return;
        setLoading(true);
        try {
          const r = await capturePayPalOrder(ref.orderId, ref.uid, ref.plan);
          if (r.success && r.membership) {
            pendingOrderRef.current = null;
            setIsPremium(true);
            setPremiumPlan(r.membership.plan);
            setPremiumExpires(r.membership.expiresAt);
            Alert.alert(
              "Zahlung erfolgreich!",
              "Deine IronPulse Premium-Mitgliedschaft ist jetzt aktiv.",
              [{ text: "Los geht's!", onPress: () => router.back() }],
            );
          } else {
            Alert.alert("Zahlung prüfen", r.error ?? "Zahlung konnte nicht bestätigt werden.");
          }
        } finally {
          setLoading(false);
        }
      };

      if (browserResult.type === "success") {
        const url = (browserResult as unknown as { url?: string }).url ?? "";
        if (!url.includes("cancel")) await captureOrder();
        else Alert.alert("Abgebrochen", "Die Zahlung wurde abgebrochen.");
      } else if (browserResult.type === "opened") {
        Alert.alert(
          "PayPal-Zahlung",
          "Hast du die Zahlung in PayPal abgeschlossen?",
          [
            { text: "Nein", style: "cancel" },
            { text: "Ja, bestätigen", onPress: captureOrder },
          ],
        );
      } else {
        Alert.alert("Abgebrochen", "Die Zahlung wurde abgebrochen.");
      }
    } catch {
      Alert.alert("Fehler", "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanInfo = PLANS.find((p) => p.key === selectedPlan)!;
  const formatPlanLabel = (key: string) => PLANS.find((p) => p.key === key)?.label ?? key;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (checkingStatus) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <AppIcon name="x" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          IronPulse Premium
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isPremium ? (
          <View style={[styles.premiumActive, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
            <View style={[styles.activeIconWrap, { backgroundColor: colors.primary + "22" }]}>
              <AppIcon name="check-circle" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.premiumActiveTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Premium aktiv
            </Text>
            <Text style={[styles.premiumActiveSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {formatPlanLabel(premiumPlan ?? "")} Plan
            </Text>
            {premiumExpires && (
              <Text style={[styles.premiumExpires, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Gültig bis {formatDate(premiumExpires)}
              </Text>
            )}
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={[styles.heroBadge, { backgroundColor: colors.primary + "20" }]}>
                <AppIcon name="zap" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Hol dir das Beste
              </Text>
              <Text style={[styles.heroSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Schalte alle Premium-Features frei und erreiche deine Ziele schneller.
              </Text>
            </View>

            <View style={[styles.featuresBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {PREMIUM_FEATURES.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <View style={[styles.featureCheck, { backgroundColor: colors.primary + "22" }]}>
                    <AppIcon name="check" size={12} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{f}</Text>
                </View>
              ))}
            </View>

            {!userId && (
              <View style={[styles.emailSection, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
                <View style={styles.emailLabelRow}>
                  <AppIcon name="user" size={14} color={colors.primary} />
                  <Text style={[styles.emailLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    Konto verknüpfen
                  </Text>
                </View>
                <Text style={[styles.emailHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Gib deine E-Mail-Adresse ein um fortzufahren.
                </Text>
                <View style={[styles.emailInputRow, { borderColor: emailError ? colors.destructive : email && isValidEmail(email) ? colors.success : colors.border, backgroundColor: colors.secondary }]}>
                  <TextInput
                    style={[styles.emailInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                    placeholder="deine@email.de"
                    placeholderTextColor={colors.mutedForeground}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setEmailError(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLinkAccount}
                  />
                  {email && isValidEmail(email) && (
                    <TouchableOpacity onPress={handleLinkAccount} disabled={linking} style={[styles.linkBtn, { backgroundColor: colors.primary }]}>
                      {linking
                        ? <ActivityIndicator size="small" color="#000" />
                        : <AppIcon name="check" size={16} color="#000" />}
                    </TouchableOpacity>
                  )}
                </View>
                {emailError ? (
                  <Text style={[styles.emailError, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>{emailError}</Text>
                ) : null}
              </View>
            )}

            {userId && (
              <View style={[styles.linkedBadge, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]}>
                <AppIcon name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.linkedText, { color: colors.success, fontFamily: "Inter_400Regular" }]}>
                  Konto verknüpft · Bereit zum Kaufen
                </Text>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
              LAUFZEIT WÄHLEN
            </Text>

            <View style={styles.plansGrid}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.key;
                return (
                  <TouchableOpacity
                    key={plan.key}
                    onPress={() => setSelectedPlan(plan.key)}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: isSelected ? colors.primary + "18" : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {plan.badge && (
                      <View style={[styles.planBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.planBadgeText}>{plan.badge}</Text>
                      </View>
                    )}
                    <Text style={[styles.planLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {plan.label}
                    </Text>
                    <Text style={[styles.planDuration, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {plan.duration}
                    </Text>
                    <Text style={[styles.planPrice, { color: isSelected ? colors.primary : colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      €{plan.priceEur.toFixed(2).replace(".", ",")}
                    </Text>
                    <Text style={[styles.planPerMonth, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      €{plan.pricePerMonth.toFixed(2).replace(".", ",")} / Mo
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.buyBtn, { backgroundColor: colors.primary, opacity: loading || linking ? 0.7 : 1 }]}
              onPress={handleBuy}
              disabled={loading || linking}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <AppIcon name="zap" size={18} color="#000" />
                  <View>
                    <Text style={[styles.buyBtnText, { fontFamily: "Inter_700Bold" }]}>
                      Jetzt kaufen – €{selectedPlanInfo.priceEur.toFixed(2).replace(".", ",")}
                    </Text>
                    <Text style={[styles.buyBtnSub, { fontFamily: "Inter_400Regular" }]}>
                      Sicher bezahlen mit PayPal
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.legal, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Einmalige Zahlung über PayPal. Keine automatische Verlängerung.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  hero: { alignItems: "center", marginBottom: 24 },
  heroBadge: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitle: { fontSize: 26, marginBottom: 8, textAlign: "center" },
  heroSub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  featuresBox: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12, marginBottom: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureCheck: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 14, flex: 1 },
  emailSection: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 10, marginBottom: 16 },
  emailLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  emailLabel: { fontSize: 14 },
  emailHint: { fontSize: 12 },
  emailInputRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1.5, overflow: "hidden" },
  emailInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  linkBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  emailError: { fontSize: 12 },
  linkedBadge: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  linkedText: { fontSize: 13 },
  sectionLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 12 },
  plansGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  planCard: { flex: 1, minWidth: "45%", borderRadius: 14, borderWidth: 2, padding: 14, alignItems: "center", position: "relative", overflow: "hidden" },
  planBadge: { position: "absolute", top: 0, right: 0, borderBottomLeftRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeText: { color: "#000", fontSize: 10, fontFamily: "Inter_700Bold" },
  planLabel: { fontSize: 13, marginTop: 4, textAlign: "center" },
  planDuration: { fontSize: 11, marginBottom: 8, textAlign: "center" },
  planPrice: { fontSize: 22 },
  planPerMonth: { fontSize: 11, marginTop: 2 },
  buyBtn: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 },
  buyBtnText: { color: "#000", fontSize: 16 },
  buyBtnSub: { color: "#00000099", fontSize: 12 },
  legal: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  premiumActive: { borderRadius: 20, borderWidth: 2, padding: 32, alignItems: "center", marginTop: 24, gap: 10 },
  activeIconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  premiumActiveTitle: { fontSize: 24 },
  premiumActiveSub: { fontSize: 16 },
  premiumExpires: { fontSize: 13, marginTop: 4 },
});
