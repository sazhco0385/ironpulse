import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/AppIcon";
import { useColors } from "@/hooks/useColors";

type PlateSet = { weight: number; count: number; color: string };

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLORS: Record<number, string> = {
  25: "#FF4444",
  20: "#4488FF",
  15: "#FFCC00",
  10: "#22CC66",
  5: "#FFFFFF",
  2.5: "#FF6B35",
  1.25: "#888888",
};

function calcPlates(targetKg: number, barKg: number): PlateSet[] {
  const remaining = (targetKg - barKg) / 2;
  if (remaining <= 0) return [];
  let left = remaining;
  const result: PlateSet[] = [];
  for (const plate of AVAILABLE_PLATES) {
    const count = Math.floor(left / plate);
    if (count > 0) {
      result.push({ weight: plate, count, color: PLATE_COLORS[plate] });
      left = Math.round((left - count * plate) * 100) / 100;
    }
  }
  return result;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  initialWeight?: number;
};

export function PlateCalculator({ visible, onClose, initialWeight }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [targetInput, setTargetInput] = useState(initialWeight ? String(initialWeight) : "");
  const [barInput, setBarInput] = useState("20");

  const targetKg = parseFloat(targetInput) || 0;
  const barKg = parseFloat(barInput) || 20;
  const plates = targetKg >= barKg ? calcPlates(targetKg, barKg) : [];
  const totalWeight = barKg + plates.reduce((s, p) => s + p.weight * p.count * 2, 0);
  const isValid = targetKg >= barKg && plates.length >= 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 24, backgroundColor: "#1a1a1f" }]}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Plattenkalkulator</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <AppIcon name="x" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.row}>
              <View style={s.inputWrap}>
                <Text style={s.label}>Zielgewicht</Text>
                <View style={s.inputBox}>
                  <TextInput
                    style={s.input}
                    value={targetInput}
                    onChangeText={setTargetInput}
                    keyboardType="decimal-pad"
                    placeholder="100"
                    placeholderTextColor="#444"
                    returnKeyType="done"
                  />
                  <Text style={s.unit}>kg</Text>
                </View>
              </View>
              <View style={s.inputWrap}>
                <Text style={s.label}>Stange</Text>
                <View style={s.inputBox}>
                  <TextInput
                    style={s.input}
                    value={barInput}
                    onChangeText={setBarInput}
                    keyboardType="decimal-pad"
                    placeholder="20"
                    placeholderTextColor="#444"
                    returnKeyType="done"
                  />
                  <Text style={s.unit}>kg</Text>
                </View>
              </View>
            </View>

            {targetKg > 0 && targetKg < barKg && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>Zielgewicht muss mindestens {barKg} kg sein</Text>
              </View>
            )}

            {isValid && targetKg > 0 && (
              <>
                <View style={s.resultHeader}>
                  <Text style={s.resultTitle}>Pro Seite auflegen:</Text>
                  <Text style={s.resultTotal}>{totalWeight} kg gesamt</Text>
                </View>

                {plates.length === 0 ? (
                  <View style={s.noPlates}>
                    <Text style={s.noPlatesText}>Nur Stange ({barKg} kg)</Text>
                  </View>
                ) : (
                  <View style={s.platesWrap}>
                    {plates.map((p) => (
                      <View key={p.weight} style={s.plateRow}>
                        <View style={[s.plateBadge, { backgroundColor: p.color + "22", borderColor: p.color }]}>
                          <Text style={[s.plateWeight, { color: p.color }]}>{p.weight} kg</Text>
                        </View>
                        <View style={s.plateBar}>
                          {Array.from({ length: p.count }).map((_, i) => (
                            <View key={i} style={[s.plateSlice, { backgroundColor: p.color }]} />
                          ))}
                        </View>
                        <Text style={s.plateCount}>× {p.count}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={s.visualBar}>
                  <View style={s.barPole} />
                  {[...plates].reverse().map((p, i) =>
                    Array.from({ length: p.count }).map((_, j) => (
                      <View
                        key={`${i}-${j}`}
                        style={[s.plateVisual, {
                          backgroundColor: p.color,
                          height: 32 + p.weight * 1.2,
                          width: 14,
                        }]}
                      />
                    ))
                  )}
                  <View style={[s.barPole, { backgroundColor: "#555" }]}>
                    <Text style={s.barLabel}>{barKg}kg</Text>
                  </View>
                  {plates.map((p, i) =>
                    Array.from({ length: p.count }).map((_, j) => (
                      <View
                        key={`r${i}-${j}`}
                        style={[s.plateVisual, {
                          backgroundColor: p.color,
                          height: 32 + p.weight * 1.2,
                          width: 14,
                        }]}
                      />
                    ))
                  )}
                  <View style={s.barPole} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  handle: { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { color: "#f9fafb", fontFamily: "Inter_700Bold", fontSize: 20 },
  closeBtn: { padding: 4 },
  row: { flexDirection: "row", gap: 12, marginBottom: 20 },
  inputWrap: { flex: 1 },
  label: { color: "#6b7280", fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#0d0d0f", borderRadius: 12, borderWidth: 1, borderColor: "#2a2a35", paddingHorizontal: 14 },
  input: { flex: 1, color: "#f9fafb", fontFamily: "Inter_600SemiBold", fontSize: 22, paddingVertical: 12 },
  unit: { color: "#6b7280", fontFamily: "Inter_400Regular", fontSize: 14 },
  errorBox: { backgroundColor: "#FF444422", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#FF4444", fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  resultTitle: { color: "#f9fafb", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  resultTotal: { color: "#00D4FF", fontFamily: "Inter_700Bold", fontSize: 16 },
  noPlates: { alignItems: "center", padding: 20 },
  noPlatesText: { color: "#6b7280", fontFamily: "Inter_400Regular", fontSize: 15 },
  platesWrap: { gap: 10, marginBottom: 24 },
  plateRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  plateBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, minWidth: 70, alignItems: "center" },
  plateWeight: { fontFamily: "Inter_700Bold", fontSize: 14 },
  plateBar: { flex: 1, flexDirection: "row", gap: 3, flexWrap: "wrap" },
  plateSlice: { width: 18, height: 18, borderRadius: 3 },
  plateCount: { color: "#9ca3af", fontFamily: "Inter_500Medium", fontSize: 14, minWidth: 32, textAlign: "right" },
  visualBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, marginTop: 8, marginBottom: 8, backgroundColor: "#0d0d0f", borderRadius: 12, paddingVertical: 16 },
  barPole: { width: 28, height: 14, backgroundColor: "#888", borderRadius: 2, alignItems: "center", justifyContent: "center" },
  barLabel: { color: "#fff", fontSize: 7, fontFamily: "Inter_700Bold" },
  plateVisual: { borderRadius: 3, alignSelf: "center" },
});
