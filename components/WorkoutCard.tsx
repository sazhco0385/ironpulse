import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppIcon } from "./AppIcon";
import { GradientCard } from "./GradientCard";
import { useColors } from "@/hooks/useColors";
import type { WorkoutPlan } from "@/context/WorkoutContext";

type Props = {
  plan: WorkoutPlan;
  isActive: boolean;
  onSelect: () => void;
  onStart?: () => void;
  locked?: boolean;
};

export function WorkoutCard({ plan, isActive, onSelect, onStart, locked }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.85} style={locked ? { opacity: 0.65 } : undefined}>
      <GradientCard variant={isActive ? "primary" : "default"} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{plan.name}</Text>
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                <Text style={[styles.activeBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>AKTIV</Text>
              </View>
            )}
            {locked && (
              <View style={[styles.activeBadge, { backgroundColor: colors.mutedForeground + "22", borderColor: colors.mutedForeground + "33" }]}>
                <AppIcon name="zap" size={9} color={colors.primary} />
                <Text style={[styles.activeBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{plan.description}</Text>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <AppIcon name="calendar" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{plan.daysPerWeek}x / Woche</Text>
          </View>
          <View style={styles.metaItem}>
            <AppIcon name="target" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{plan.goal}</Text>
          </View>
          <View style={styles.metaItem}>
            <AppIcon name="bar-chart-2" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{plan.level}</Text>
          </View>
        </View>
        {isActive && onStart && (
          <TouchableOpacity
            onPress={onStart}
            style={[styles.startBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            activeOpacity={0.8}
          >
            <AppIcon name="play" size={15} color={colors.primaryForeground} />
            <Text style={[styles.startBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>Training starten</Text>
          </TouchableOpacity>
        )}
      </GradientCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 18,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  desc: {
    fontSize: 13,
  },
  meta: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  startBtnText: {
    fontSize: 14,
  },
});
