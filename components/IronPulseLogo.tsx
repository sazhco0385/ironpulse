import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "./AppIcon";
import { useColors } from "@/hooks/useColors";

const logoImage = require("../assets/images/ironpulse-logo.png");

type Props = {
  size?: "sm" | "md" | "lg" | "hero";
  imageMode?: boolean;
};

export function IronPulseLogo({ size = "md", imageMode }: Props) {
  const colors = useColors();

  const useImage = imageMode ?? (size === "hero");

  if (useImage) {
    const imgSize = size === "hero" ? 220 : size === "lg" ? 160 : 110;
    return (
      <Image
        source={logoImage}
        style={{ width: imgSize, height: imgSize }}
        resizeMode="contain"
      />
    );
  }

  const iconSize = size === "lg" ? 22 : size === "sm" ? 14 : 18;
  const badgeSize = size === "lg" ? 44 : size === "sm" ? 28 : 36;
  const ironSize = size === "lg" ? 24 : size === "sm" ? 15 : 20;
  const pulseSize = size === "lg" ? 24 : size === "sm" ? 15 : 20;
  const taglineSize = size === "lg" ? 10 : size === "sm" ? 8 : 9;
  const gap = size === "sm" ? 6 : 10;

  return (
    <View style={[styles.row, { gap }]}>
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize * 0.28,
            backgroundColor: colors.primary + "18",
            borderColor: colors.primary + "55",
          },
        ]}
      >
        <AppIcon name="zap" size={iconSize} color={colors.primary} />
      </View>
      <View style={styles.textCol}>
        <View style={styles.nameRow}>
          <Text style={[styles.iron, { fontSize: ironSize, color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            IRON
          </Text>
          <Text style={[styles.pulse, { fontSize: pulseSize, color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            PULSE
          </Text>
        </View>
        {size !== "sm" && (
          <Text
            style={[
              styles.tagline,
              { fontSize: taglineSize, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            MUSCLE BUILDER
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  textCol: {
    gap: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  iron: {
    letterSpacing: 1.5,
  },
  pulse: {
    letterSpacing: 1.5,
  },
  tagline: {
    letterSpacing: 2.5,
  },
});
