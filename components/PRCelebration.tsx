import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PRRecord } from "@/context/WorkoutContext";

type Props = {
  prs: PRRecord[];
  onDismiss: () => void;
};

function PRCard({ pr, delay }: { pr: PRRecord; delay: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const improvement = Math.round(((pr.newPR - pr.previousPR) / pr.previousPR) * 100);

  return (
    <Animated.View style={[s.prCard, { opacity, transform: [{ scale }] }]}>
      <Text style={s.prEmoji}>🏆</Text>
      <View style={s.prInfo}>
        <Text style={s.prName}>{pr.exerciseName}</Text>
        <Text style={s.prDetail}>
          <Text style={s.prNew}>{pr.newPR} kg</Text>
          <Text style={s.prOld}> (vorher {pr.previousPR} kg)</Text>
        </Text>
      </View>
      <View style={s.prBadge}>
        <Text style={s.prBadgeText}>+{improvement}%</Text>
      </View>
    </Animated.View>
  );
}

export function PRCelebration({ prs, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (prs.length === 0) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(titleScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }),
    ]).start();
  }, [prs.length]);

  if (prs.length === 0) return null;

  return (
    <Modal transparent animationType="none" visible={prs.length > 0} onRequestClose={onDismiss}>
      <Animated.View style={[s.overlay, { opacity: bgOpacity, paddingBottom: insets.bottom + 32, paddingTop: insets.top + 32 }]}>
        <Animated.View style={[s.titleWrap, { transform: [{ scale: titleScale }] }]}>
          <Text style={s.firework}>🎉</Text>
          <Text style={s.title}>Persönlicher Rekord!</Text>
          <Text style={s.subtitle}>
            {prs.length === 1 ? "Du hast einen neuen PR gesetzt!" : `Du hast ${prs.length} neue PRs gesetzt!`}
          </Text>
        </Animated.View>

        <View style={s.cards}>
          {prs.map((pr, i) => (
            <PRCard key={pr.exerciseId} pr={pr} delay={300 + i * 150} />
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={onDismiss} activeOpacity={0.85}>
          <Text style={s.btnText}>Weiter so! 💪</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 24,
  },
  titleWrap: { alignItems: "center", gap: 8 },
  firework: { fontSize: 56 },
  title: { color: "#FFD700", fontFamily: "Inter_700Bold", fontSize: 32, textAlign: "center" },
  subtitle: { color: "#d1d5db", fontFamily: "Inter_400Regular", fontSize: 16, textAlign: "center" },
  cards: { width: "100%", gap: 12 },
  prCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFD70015",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FFD70044",
    padding: 16,
  },
  prEmoji: { fontSize: 28 },
  prInfo: { flex: 1 },
  prName: { color: "#f9fafb", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  prDetail: { marginTop: 2 },
  prNew: { color: "#FFD700", fontFamily: "Inter_700Bold", fontSize: 18 },
  prOld: { color: "#6b7280", fontFamily: "Inter_400Regular", fontSize: 14 },
  prBadge: { backgroundColor: "#22CC6633", borderRadius: 8, borderWidth: 1, borderColor: "#22CC66", paddingHorizontal: 8, paddingVertical: 4 },
  prBadgeText: { color: "#22CC66", fontFamily: "Inter_700Bold", fontSize: 13 },
  btn: { width: "100%", backgroundColor: "#FFD700", borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  btnText: { color: "#0d0d0f", fontFamily: "Inter_700Bold", fontSize: 18 },
});
