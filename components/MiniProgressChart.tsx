import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type DataPoint = { date: string; value: number };

type Props = {
  data: DataPoint[];
  label?: string;
  unit?: string;
  color?: string;
  height?: number;
};

export function MiniProgressChart({ data, label, unit = "kg", color, height = 60 }: Props) {
  const colors = useColors();
  const accentColor = color ?? colors.primary;

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Noch keine Daten</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const barWidth = Math.max(4, Math.floor(100 / data.length) - 2);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>}
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const normalizedHeight = ((d.value - min) / range) * (height - 4) + 4;
          const isLast = i === data.length - 1;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: normalizedHeight,
                  width: barWidth,
                  backgroundColor: isLast ? accentColor : accentColor + "55",
                  borderRadius: 3,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{data.length} Sessions</Text>
        <Text style={[styles.footerValue, { color: accentColor }]}>
          {max} {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {},
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  footerValue: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
