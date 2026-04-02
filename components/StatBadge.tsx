import React from "react";
import { StyleSheet, Text, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  style?: ViewStyle;
  delay?: number;
};

export function StatBadge({ label, value, unit, color, style, delay = 0 }: Props) {
  const colors = useColors();
  const accentColor = color ?? colors.primary;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify().damping(14)}
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
        style,
      ]}
    >
      <Text style={[styles.value, { color: accentColor, fontFamily: "Inter_700Bold" }]}>
        {value}
        {unit && <Text style={[styles.unit, { color: accentColor + "99" }]}> {unit}</Text>}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
  },
  value: {
    fontSize: 24,
  },
  unit: {
    fontSize: 13,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
});
