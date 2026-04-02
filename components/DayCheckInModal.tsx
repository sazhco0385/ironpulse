import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CheckInData = {
  sleep: number;
  energy: number;
  soreness: number;
  factor: number;
};

type Question = {
  key: keyof Omit<CheckInData, "factor">;
  label: string;
  emoji: string[];
  labels: string[];
};

const QUESTIONS: Question[] = [
  {
    key: "sleep",
    label: "Wie hast du geschlafen?",
    emoji: ["😴", "😟", "😐", "😊", "🌟"],
    labels: ["Sehr schlecht", "Schlecht", "OK", "Gut", "Top"],
  },
  {
    key: "energy",
    label: "Dein Energielevel heute?",
    emoji: ["🪫", "😩", "😐", "💪", "⚡"],
    labels: ["Erschöpft", "Müde", "OK", "Energiegeladen", "Auf 100%"],
  },
  {
    key: "soreness",
    label: "Muskelkater oder Schmerzen?",
    emoji: ["🔥", "😣", "😐", "😌", "✅"],
    labels: ["Starke Schmerzen", "Schmerzhaft", "Leicht", "Kaum", "Keinen"],
  },
];

function calcFactor(sleep: number, energy: number, soreness: number): number {
  const score = (sleep + energy + soreness) / 15;
  if (score >= 0.85) return 1.05;
  if (score >= 0.70) return 1.0;
  if (score >= 0.55) return 0.95;
  if (score >= 0.40) return 0.90;
  return 0.85;
}

function getRecommendation(factor: number): { text: string; color: string } {
  if (factor >= 1.05) return { text: "Perfekte Bedingungen — gib heute alles!", color: "#00D4FF" };
  if (factor >= 1.0) return { text: "Guter Tag zum Trainieren, volle Leistung!", color: "#22CC66" };
  if (factor >= 0.95) return { text: "Leicht reduziertes Gewicht — schone dich etwas.", color: "#FFCC00" };
  if (factor >= 0.90) return { text: "Nehme heute 10% weniger Gewicht.", color: "#FF6B35" };
  return { text: "Regenerationstag? Wenn du trainierst, stark reduzieren.", color: "#FF4444" };
}

type Props = {
  visible: boolean;
  onConfirm: (data: CheckInData) => void;
  onSkip: () => void;
};

export function DayCheckInModal({ visible, onConfirm, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ sleep: 0, energy: 0, soreness: 0 });

  const q = QUESTIONS[step];
  const allAnswered = step >= QUESTIONS.length;
  const factor = calcFactor(answers.sleep || 3, answers.energy || 3, answers.soreness || 3);
  const rec = getRecommendation(factor);

  const handleSelect = (val: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...answers, [q.key]: val };
    setAnswers(updated);
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 200);
    } else {
      setTimeout(() => setStep(QUESTIONS.length), 200);
    }
  };

  const handleConfirm = () => {
    const f = calcFactor(answers.sleep || 3, answers.energy || 3, answers.soreness || 3);
    onConfirm({ ...answers, factor: f });
    setStep(0);
    setAnswers({ sleep: 0, energy: 0, soreness: 0 });
  };

  const handleClose = () => {
    setStep(0);
    setAnswers({ sleep: 0, energy: 0, soreness: 0 });
    onSkip();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={handleClose} activeOpacity={1} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={s.handle} />

          <View style={s.progressRow}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[s.dot, step > i ? s.dotDone : step === i ? s.dotActive : s.dotInactive]}
              />
            ))}
          </View>

          {!allAnswered ? (
            <Animated.View entering={FadeInUp.duration(250)} key={step}>
              <Text style={s.title}>{q.label}</Text>
              <View style={s.optionsRow}>
                {q.emoji.map((em, i) => {
                  const val = i + 1;
                  const sel = answers[q.key] === val;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.option, sel && s.optionSel]}
                      onPress={() => handleSelect(val)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.optionEmoji}>{em}</Text>
                      <Text style={[s.optionLabel, sel && s.optionLabelSel]}>{q.labels[i]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(300)} style={s.summary}>
              <Text style={s.summaryEmoji}>
                {factor >= 1.05 ? "🔥" : factor >= 1.0 ? "💪" : factor >= 0.95 ? "👍" : factor >= 0.90 ? "⚠️" : "😴"}
              </Text>
              <Text style={s.summaryTitle}>KI-Coach Empfehlung</Text>
              <Text style={[s.summaryText, { color: rec.color }]}>{rec.text}</Text>

              {factor !== 1.0 && (
                <View style={[s.adjustBadge, { backgroundColor: rec.color + "20", borderColor: rec.color }]}>
                  <Text style={[s.adjustText, { color: rec.color }]}>
                    Gewichte {factor > 1 ? "+" : ""}{Math.round((factor - 1) * 100)}%
                  </Text>
                </View>
              )}

              <TouchableOpacity style={s.startBtn} onPress={handleConfirm} activeOpacity={0.85}>
                <Text style={s.startBtnText}>Training starten</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.skipLink} onPress={handleClose} activeOpacity={0.7}>
                <Text style={s.skipLinkText}>Ohne Anpassung starten</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: { backgroundColor: "#1a1a1f", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  handle: { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  progressRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 24 },
  dot: { width: 32, height: 4, borderRadius: 2 },
  dotDone: { backgroundColor: "#00D4FF" },
  dotActive: { backgroundColor: "#00D4FF88" },
  dotInactive: { backgroundColor: "#333" },
  title: { color: "#f9fafb", fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center", marginBottom: 28 },
  optionsRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  option: { flex: 1, alignItems: "center", backgroundColor: "#0d0d0f", borderRadius: 14, borderWidth: 1.5, borderColor: "#2a2a35", paddingVertical: 14, gap: 6 },
  optionSel: { borderColor: "#00D4FF", backgroundColor: "#00D4FF15" },
  optionEmoji: { fontSize: 24 },
  optionLabel: { color: "#6b7280", fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  optionLabelSel: { color: "#00D4FF" },
  summary: { alignItems: "center", gap: 12 },
  summaryEmoji: { fontSize: 48, marginBottom: 4 },
  summaryTitle: { color: "#9ca3af", fontFamily: "Inter_500Medium", fontSize: 14 },
  summaryText: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  adjustBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  adjustText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  startBtn: { marginTop: 12, width: "100%", backgroundColor: "#00D4FF", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  startBtnText: { color: "#0d0d0f", fontFamily: "Inter_700Bold", fontSize: 17 },
  skipLink: { padding: 10 },
  skipLinkText: { color: "#6b7280", fontFamily: "Inter_400Regular", fontSize: 13, textDecorationLine: "underline" },
});
