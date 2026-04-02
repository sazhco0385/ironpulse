import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { AppIcon } from "./AppIcon";
import { useColors } from "@/hooks/useColors";
import { getExerciseImage } from "@/lib/exerciseImages";

type Props = {
  exerciseId: string;
  exerciseName?: string;
  width: number | "100%";
  height: number;
  borderRadius?: number;
};

export function ExerciseImage({ exerciseId, exerciseName, width, height, borderRadius = 12 }: Props) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  const uri = getExerciseImage(exerciseId, exerciseName);

  const isFullWidth = width === "100%" || width === 0;
  const containerStyle = isFullWidth
    ? { alignSelf: "stretch" as const, height, borderRadius, overflow: "hidden" as const }
    : { width: width as number, height, borderRadius, overflow: "hidden" as const };

  const iconSize = height * 0.35;

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.fallback,
          containerStyle,
          { backgroundColor: colors.secondary },
        ]}
      >
        <AppIcon name="dumbbell" size={iconSize} color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.18)",
  },
});
