import { router } from "expo-router";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppIcon } from "@/components/AppIcon";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  featureDesc: string;
}

const BENEFITS = [
  "Automatische Gewichtsprogression",
  "Plan wechseln & anpassen",
  "Detaillierte Übungsanalyse",
  "Trainingsassistent mit Empfehlungen",
  "Deload-Wochen-Steuerung",
];

export function PremiumLockSheet({ visible, onClose, featureName, featureDesc }: Props) {
  const colors = useColors();

  const handleUpgrade = () => {
    onClose();
    setTimeout(() => router.push("/premium"), 200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
            <AppIcon name="zap" size={28} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Premium-Feature
          </Text>
          <Text style={[styles.featureName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            {featureName}
          </Text>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {featureDesc}
          </Text>

          <View style={[styles.benefitsCard, { backgroundColor: colors.secondary, borderRadius: 12 }]}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <View style={[styles.checkCircle, { backgroundColor: colors.primary + "22" }]}>
                  <AppIcon name="check" size={11} color={colors.primary} />
                </View>
                <Text style={[styles.benefitText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{b}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.price, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Ab <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>€9,99 / Monat</Text>
          </Text>

          <TouchableOpacity
            onPress={handleUpgrade}
            style={[styles.upgradeBtn, { backgroundColor: colors.primary, borderRadius: 12 }]}
            activeOpacity={0.85}
          >
            <AppIcon name="zap" size={16} color="#000" />
            <Text style={[styles.upgradeBtnText, { fontFamily: "Inter_700Bold" }]}>Jetzt upgraden</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.laterBtn} activeOpacity={0.7}>
            <Text style={[styles.laterText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Vielleicht später
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "flex-end",
    alignItems: "stretch",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 28,
    paddingBottom: 40,
    gap: 12,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 13, letterSpacing: 0.8, opacity: 0.6 },
  featureName: { fontSize: 22, textAlign: "center" },
  desc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  benefitsCard: { width: "100%", padding: 16, gap: 10, marginVertical: 4 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  benefitText: { fontSize: 13 },
  price: { fontSize: 13 },
  upgradeBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 4,
  },
  upgradeBtnText: { fontSize: 16, color: "#000" },
  laterBtn: { paddingVertical: 8 },
  laterText: { fontSize: 14 },
});
