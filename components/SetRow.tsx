import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { AppIcon } from "./AppIcon";
import { useColors } from "@/hooks/useColors";
import type { WorkoutSet } from "@/context/WorkoutContext";

type Props = {
  set: WorkoutSet;
  index: number;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onRemove: () => void;
  onCompleted?: () => void;
};

export function SetRow({ set, index, onUpdate, onRemove, onCompleted }: Props) {
  const colors = useColors();
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const scale = useSharedValue(1);

  useEffect(() => {
    setWeight(set.weight.toString());
    setReps(set.reps.toString());
  }, [set.weight, set.reps]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleComplete = () => {
    const wasCompleted = set.completed;
    scale.value = withSpring(0.94, { damping: 12 }, () => {
      scale.value = withSpring(1);
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onUpdate({
      completed: !wasCompleted,
      weight: parseFloat(weight) || set.weight,
      reps: parseInt(reps) || set.reps,
    });
    if (!wasCompleted && onCompleted) {
      onCompleted();
    }
  };

  const bg = set.completed ? colors.primary + "22" : colors.card;
  const borderColor = set.completed ? colors.primary + "66" : colors.border;

  return (
    <Animated.View style={[animStyle, styles.row, { backgroundColor: bg, borderColor, borderRadius: colors.radius / 1.5 }]}>
      <Text style={[styles.setNum, { color: colors.mutedForeground }]}>{index + 1}</Text>
      <View style={styles.inputs}>
        <View style={[styles.inputWrapper, { borderColor: set.completed ? colors.primary + "44" : colors.border, backgroundColor: colors.input }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
            value={weight}
            onChangeText={setWeight}
            onBlur={() => onUpdate({ weight: parseFloat(weight) || set.weight })}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>kg</Text>
        </View>
        <Text style={[styles.separator, { color: colors.mutedForeground }]}>×</Text>
        <View style={[styles.inputWrapper, { borderColor: set.completed ? colors.primary + "44" : colors.border, backgroundColor: colors.input }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
            value={reps}
            onChangeText={setReps}
            onBlur={() => onUpdate({ reps: parseInt(reps) || set.reps })}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>reps</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleComplete}
        style={[
          styles.checkBtn,
          {
            backgroundColor: set.completed ? colors.primary : "transparent",
            borderColor: set.completed ? colors.primary : colors.border,
          },
        ]}
      >
        {set.completed ? (
          <AppIcon name="check" size={16} color={colors.primaryForeground} />
        ) : (
          <AppIcon name="circle" size={16} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <AppIcon name="trash-2" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    gap: 8,
  },
  setNum: {
    width: 20,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  inputs: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    gap: 2,
  },
  input: {
    fontSize: 16,
    flex: 1,
    textAlign: "center",
    paddingVertical: 2,
    minWidth: 30,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  separator: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    padding: 4,
  },
});
