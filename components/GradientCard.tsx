import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "accent" | "primary" | "dark";
  padding?: number;
  delay?: number;
  animate?: boolean;
};

export function GradientCard({ children, style, variant = "default", padding = 16, delay = 0, animate = false }: Props) {
  const colors = useColors();

  const bg =
    variant === "accent"
      ? colors.accent + "22"
      : variant === "primary"
        ? colors.primary + "18"
        : variant === "dark"
          ? "#0a0a12"
          : colors.card;

  const borderColor =
    variant === "accent"
      ? colors.accent + "44"
      : variant === "primary"
        ? colors.primary + "44"
        : colors.border;

  return (
    <Animated.View
      entering={animate ? FadeInDown.delay(delay).duration(400).springify() : undefined}
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor,
          borderRadius: colors.radius,
          padding,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
