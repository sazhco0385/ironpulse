import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

type Props = {
  progress: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({ progress, color, height = 6, style }: Props) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(Math.min(Math.max(progress, 0), 1), { damping: 20, stiffness: 100 });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { backgroundColor: colors.border, borderRadius: height, height }, style]}>
      <Animated.View style={[styles.fill, animStyle, { backgroundColor: color ?? colors.primary, borderRadius: height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: "100%",
  },
});
