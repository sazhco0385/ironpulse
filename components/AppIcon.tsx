import React from "react";
import { Text, View } from "react-native";

export type AppIconName =
  | "zap"
  | "refresh-cw"
  | "activity"
  | "play"
  | "target"
  | "clock"
  | "home"
  | "list"
  | "trending-up"
  | "trending-down"
  | "calendar"
  | "bar-chart-2"
  | "info"
  | "check"
  | "check-circle"
  | "x"
  | "plus"
  | "circle"
  | "trash-2"
  | "alert-circle"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "chevron-down"
  | "flag"
  | "maximize-2"
  | "user"
  | "user-check"
  | "edit-3"
  | "scissors"
  | "sliders"
  | "arrow-right"
  | "arrow-down-circle"
  | "thumbs-up"
  | "lightbulb"
  | "dumbbell"
  | "log-in"
  | "shield"
  | "play-circle"
  | "mic"
  | "mic-off"
  | "award"
  | "star"
  | "volume-2"
  | "battery-charging"
  | "cpu"
  | "layers";

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 16, color = "#fff" }: Props) {
  const s = size;

  switch (name) {
    case "zap":
      return <Text style={{ fontSize: s * 0.9, color, lineHeight: s * 1.15, includeFontPadding: false }}>⚡</Text>;

    case "play":
      return <Text style={{ fontSize: s * 0.78, color, lineHeight: s * 1.15, includeFontPadding: false }}>▶</Text>;

    case "check":
      return <Text style={{ fontSize: s * 0.9, color, lineHeight: s * 1.15, includeFontPadding: false }}>✓</Text>;

    case "x":
      return <Text style={{ fontSize: s * 0.85, color, lineHeight: s * 1.15, includeFontPadding: false }}>✕</Text>;

    case "plus":
      return <Text style={{ fontSize: s, color, lineHeight: s * 1.15, includeFontPadding: false, fontWeight: "300" }}>+</Text>;

    case "flag":
      return <Text style={{ fontSize: s * 0.85, color, lineHeight: s * 1.15, includeFontPadding: false }}>⚑</Text>;

    case "edit-3":
      return <Text style={{ fontSize: s * 0.85, color, lineHeight: s * 1.15, includeFontPadding: false }}>✎</Text>;

    case "thumbs-up":
      return <Text style={{ fontSize: s * 0.9, color, lineHeight: s * 1.15, includeFontPadding: false }}>👍</Text>;

    case "lightbulb":
      return <Text style={{ fontSize: s * 0.88, color, lineHeight: s * 1.15, includeFontPadding: false }}>💡</Text>;

    case "chevron-left":
      return <Text style={{ fontSize: s * 1.3, color, lineHeight: s * 1.15, includeFontPadding: false, marginTop: -2 }}>‹</Text>;

    case "chevron-right":
      return <Text style={{ fontSize: s * 1.3, color, lineHeight: s * 1.15, includeFontPadding: false, marginTop: -2 }}>›</Text>;

    case "trending-up":
      return (
        <View style={{ width: s, height: s, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: s * 0.9, color, lineHeight: s, includeFontPadding: false }}>↗</Text>
        </View>
      );

    case "trending-down":
      return (
        <View style={{ width: s, height: s, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: s * 0.9, color, lineHeight: s, includeFontPadding: false }}>↘</Text>
        </View>
      );

    case "maximize-2":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: s * 0.85, color, lineHeight: s, includeFontPadding: false }}>↕</Text>
        </View>
      );

    case "arrow-right":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
          <View style={{ flex: 1, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: s * 0.35, height: s * 0.35, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: color, transform: [{ rotate: "45deg" }], marginLeft: -s * 0.18 }} />
        </View>
      );

    case "chevron-up":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.5, height: s * 0.5, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: color, transform: [{ rotate: "-45deg" }], marginTop: s * 0.12 }} />
        </View>
      );

    case "chevron-down":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.5, height: s * 0.5, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color, transform: [{ rotate: "45deg" }], marginBottom: s * 0.12 }} />
        </View>
      );

    case "circle":
      return <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color }} />;

    case "check-circle":
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: color + "33", borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: s * 0.6, color, lineHeight: s * 0.75, includeFontPadding: false }}>✓</Text>
        </View>
      );

    case "alert-circle":
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: s * 0.6, color, lineHeight: s * 0.75, fontWeight: "700", includeFontPadding: false }}>!</Text>
        </View>
      );

    case "arrow-down-circle":
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: s * 0.65, color, lineHeight: s * 0.75, includeFontPadding: false }}>↓</Text>
        </View>
      );

    case "info":
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: s * 0.6, color, lineHeight: s * 0.75, fontWeight: "700", includeFontPadding: false }}>i</Text>
        </View>
      );

    case "clock":
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 1.5, height: s * 0.28, backgroundColor: color, bottom: s * 0.5 - 0.75, left: s * 0.5 - 0.75 }} />
          <View style={{ position: "absolute", width: s * 0.22, height: 1.5, backgroundColor: color, left: s * 0.5 - 0.75, top: s * 0.5 - 0.75 }} />
        </View>
      );

    case "target":
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.36, height: s * 0.36, borderRadius: s * 0.18, backgroundColor: color }} />
        </View>
      );

    case "calendar":
      return (
        <View style={{ width: s, height: s * 0.9, borderRadius: 2, borderWidth: 1.5, borderColor: color, overflow: "hidden" }}>
          <View style={{ height: s * 0.28, backgroundColor: color + "55" }} />
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", padding: 1.5, gap: 1 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: (s - 7) / 2 - 0.5, height: (s * 0.62 - 4) / 2 - 0.5, backgroundColor: color + "44", borderRadius: 1 }} />
            ))}
          </View>
        </View>
      );

    case "bar-chart-2":
      return (
        <View style={{ width: s, height: s, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
          <View style={{ flex: 1, height: s * 0.5, backgroundColor: color + "99", borderRadius: 1 }} />
          <View style={{ flex: 1, height: s * 0.85, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ flex: 1, height: s * 0.65, backgroundColor: color + "cc", borderRadius: 1 }} />
        </View>
      );

    case "activity":
      return (
        <View style={{ width: s, height: s, justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: s * 0.7, height: 2, backgroundColor: "transparent", flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, height: 1.5, backgroundColor: color + "88" }} />
            <View style={{ width: 2, height: s * 0.45, backgroundColor: color, marginHorizontal: 1 }} />
            <View style={{ width: 3, height: s * 0.7, backgroundColor: color, marginHorizontal: 1 }} />
            <View style={{ width: 2, height: s * 0.35, backgroundColor: color, marginHorizontal: 1 }} />
            <View style={{ flex: 1, height: 1.5, backgroundColor: color + "88" }} />
          </View>
        </View>
      );

    case "refresh-cw":
      return (
        <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, borderRightColor: "transparent", alignItems: "flex-end", justifyContent: "flex-start" }}>
          <View style={{ width: 0, height: 0, borderLeftWidth: s * 0.2, borderRightWidth: 0, borderBottomWidth: s * 0.2, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color, marginRight: -s * 0.05, marginTop: -s * 0.03 }} />
        </View>
      );

    case "user":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.44, height: s * 0.44, borderRadius: s * 0.22, borderWidth: 1.5, borderColor: color }} />
          <View style={{ width: s * 0.72, height: s * 0.3, borderTopLeftRadius: s * 0.36, borderTopRightRadius: s * 0.36, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, marginTop: 1.5 }} />
        </View>
      );

    case "user-check":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.44, height: s * 0.44, borderRadius: s * 0.22, borderWidth: 1.5, borderColor: color, alignSelf: "flex-start", marginLeft: s * 0.04 }} />
          <View style={{ width: s * 0.6, height: s * 0.3, borderTopLeftRadius: s * 0.36, borderTopRightRadius: s * 0.36, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, marginTop: 1.5, alignSelf: "flex-start", marginLeft: s * 0.04 }} />
          <View style={{ position: "absolute", right: 0, bottom: s * 0.08, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: s * 0.18, height: 1.5, backgroundColor: color, transform: [{ rotate: "45deg" }] }} />
            <View style={{ width: s * 0.28, height: 1.5, backgroundColor: color, transform: [{ rotate: "-45deg" }], marginLeft: -1 }} />
          </View>
        </View>
      );

    case "home":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "flex-end" }}>
          <View style={{ width: s * 0.74, height: s * 0.52, borderWidth: 1.5, borderColor: color, borderRadius: 2 }} />
          <View style={{ position: "absolute", top: s * 0.08, width: 0, height: 0, borderLeftWidth: s * 0.48, borderRightWidth: s * 0.48, borderBottomWidth: s * 0.44, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color }} />
        </View>
      );

    case "list":
      return (
        <View style={{ width: s, height: s, justifyContent: "center", gap: s * 0.22 }}>
          <View style={{ height: 1.5, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ height: 1.5, backgroundColor: color, borderRadius: 1, marginRight: s * 0.2 }} />
          <View style={{ height: 1.5, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );

    case "trash-2":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "flex-end" }}>
          <View style={{ width: s * 0.72, height: s * 0.72, borderWidth: 1.5, borderColor: color, borderRadius: 2, borderTopWidth: 0 }} />
          <View style={{ position: "absolute", top: s * 0.1, width: s * 0.85, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ position: "absolute", top: s * 0.02, width: s * 0.4, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );

    case "scissors":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: "30deg" }], borderRadius: 1 }} />
          <View style={{ width: s * 0.7, height: 1.5, backgroundColor: color, transform: [{ rotate: "-30deg" }], borderRadius: 1, marginTop: -1.5 }} />
        </View>
      );

    case "sliders":
      return (
        <View style={{ width: s, height: s, justifyContent: "center", gap: s * 0.2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <View style={{ flex: 1, height: 1.5, backgroundColor: color + "88" }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
            <View style={{ flex: 0.5, height: 1.5, backgroundColor: color + "88" }} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <View style={{ flex: 0.5, height: 1.5, backgroundColor: color + "88" }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
            <View style={{ flex: 1, height: 1.5, backgroundColor: color + "88" }} />
          </View>
        </View>
      );

    case "dumbbell":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: s * 0.18, height: s * 0.42, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: s * 0.44, height: s * 0.18, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: s * 0.18, height: s * 0.42, backgroundColor: color, borderRadius: 2 }} />
          </View>
        </View>
      );

    case "log-in":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: s * 0.45, height: s * 0.65, borderWidth: 1.5, borderColor: color, borderRadius: 3, borderRightWidth: 0 }} />
            <View style={{ width: 1.5, height: s * 0.65, backgroundColor: color }} />
          </View>
          <View style={{ position: "absolute", right: s * 0.08, flexDirection: "row", alignItems: "center", gap: 2 }}>
            <View style={{ width: s * 0.28, height: 1.5, backgroundColor: color }} />
            <View style={{ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 5, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: color }} />
          </View>
          <View style={{ position: "absolute", right: s * 0.08, top: s * 0.18, width: s * 0.32, height: 1.5, backgroundColor: color, transform: [{ rotate: "45deg" }] }} />
          <View style={{ position: "absolute", right: s * 0.08, bottom: s * 0.18, width: s * 0.32, height: 1.5, backgroundColor: color, transform: [{ rotate: "-45deg" }] }} />
        </View>
      );

    case "shield":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.7, height: s * 0.82, borderWidth: 1.5, borderColor: color, borderRadius: s * 0.1, borderBottomLeftRadius: s * 0.35, borderBottomRightRadius: s * 0.35 }}>
            <View style={{ position: "absolute", top: "30%", left: "25%", width: "20%", height: 1.5, backgroundColor: color, transform: [{ rotate: "45deg" }] }} />
            <View style={{ position: "absolute", top: "45%", left: "35%", width: "35%", height: 1.5, backgroundColor: color, transform: [{ rotate: "-45deg" }] }} />
          </View>
        </View>
      );

    case "play-circle":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 0, height: 0, borderTopWidth: s * 0.2, borderBottomWidth: s * 0.2, borderLeftWidth: s * 0.33, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: color, marginLeft: s * 0.06 }} />
          </View>
        </View>
      );

    case "mic":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.36, height: s * 0.54, borderRadius: s * 0.18, borderWidth: 1.5, borderColor: color, marginBottom: 1 }} />
          <View style={{ width: s * 0.6, height: s * 0.25, borderTopLeftRadius: s * 0.3, borderTopRightRadius: s * 0.3, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0 }} />
          <View style={{ width: 1.5, height: s * 0.1, backgroundColor: color }} />
          <View style={{ width: s * 0.3, height: 1.5, backgroundColor: color }} />
        </View>
      );

    case "mic-off":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.36, height: s * 0.54, borderRadius: s * 0.18, borderWidth: 1.5, borderColor: color, marginBottom: 1, opacity: 0.4 }} />
          <View style={{ position: "absolute", width: s * 0.85, height: 1.5, backgroundColor: color, transform: [{ rotate: "45deg" }] }} />
        </View>
      );

    case "award":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.58, height: s * 0.58, borderRadius: s * 0.29, borderWidth: 1.5, borderColor: color, marginBottom: 1 }} />
          <View style={{ width: 0, height: 0, borderLeftWidth: s * 0.22, borderRightWidth: s * 0.22, borderTopWidth: s * 0.32, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: color, marginTop: -1 }} />
        </View>
      );

    case "star":
      return <Text style={{ fontSize: s * 0.9, color, lineHeight: s * 1.1, includeFontPadding: false }}>★</Text>;

    case "volume-2":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 2 }}>
          <View style={{ width: s * 0.32, height: s * 0.5, borderWidth: 1.5, borderColor: color, borderRadius: 1 }} />
          <View style={{ width: 0, height: 0, borderTopWidth: s * 0.25, borderBottomWidth: s * 0.25, borderLeftWidth: s * 0.22, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: color }} />
          <View style={{ gap: 3 }}>
            <View style={{ width: s * 0.18, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: s * 0.24, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: s * 0.18, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    case "battery-charging":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.7, height: s * 0.44, borderRadius: 2, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: s * 0.4, height: s * 0.22, backgroundColor: color + "55", borderRadius: 1 }} />
          </View>
          <View style={{ position: "absolute", right: s * 0.06, width: 2, height: s * 0.28, backgroundColor: color, borderRadius: 1 }} />
          <Text style={{ position: "absolute", fontSize: s * 0.4, color, fontWeight: "700", includeFontPadding: false }}>⚡</Text>
        </View>
      );

    case "cpu":
      return (
        <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.54, height: s * 0.54, borderWidth: 1.5, borderColor: color, borderRadius: 3, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: s * 0.26, height: s * 0.26, backgroundColor: color + "55", borderRadius: 1, borderWidth: 1, borderColor: color }} />
          </View>
          {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy], i) => (
            <View key={i} style={{ position: "absolute", width: dx !== 0 ? s * 0.22 : 1.5, height: dy !== 0 ? s * 0.22 : 1.5, backgroundColor: color, left: dx < 0 ? s * 0.04 : dx > 0 ? s * 0.74 : s * 0.5 - 0.75, top: dy < 0 ? s * 0.04 : dy > 0 ? s * 0.74 : s * 0.5 - 0.75 }} />
          ))}
        </View>
      );

    case "layers":
      return (
        <View style={{ width: s, height: s, justifyContent: "center", alignItems: "center", gap: s * 0.08 }}>
          <View style={{ width: s * 0.8, height: s * 0.22, borderRadius: 2, borderWidth: 1.5, borderColor: color }} />
          <View style={{ width: s * 0.8, height: s * 0.22, borderRadius: 2, borderWidth: 1.5, borderColor: color, opacity: 0.7 }} />
          <View style={{ width: s * 0.8, height: s * 0.22, borderRadius: 2, borderWidth: 1.5, borderColor: color, opacity: 0.4 }} />
        </View>
      );

    default:
      return <View style={{ width: s, height: s, borderRadius: 2, backgroundColor: color + "66" }} />;
  }
}
