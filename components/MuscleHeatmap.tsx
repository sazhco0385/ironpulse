import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

export type MuscleStatus = "ready" | "recovering" | "sore" | "untrained";

export type MuscleData = {
  id: string;
  name: string;
  status: MuscleStatus;
  hoursAgo: number | null;
};

const STATUS_COLOR: Record<MuscleStatus, string> = {
  ready: "#22CC66",
  recovering: "#FFCC00",
  sore: "#FF6B35",
  untrained: "#2a2a35",
};

const STATUS_LABEL: Record<MuscleStatus, string> = {
  ready: "Bereit",
  recovering: "Erholung",
  sore: "Erschöpft",
  untrained: "Nicht trainiert",
};

type Props = {
  muscles: MuscleData[];
};

function getColor(muscles: MuscleData[], ...ids: string[]) {
  const relevant = muscles.filter((m) => ids.includes(m.id));
  if (relevant.length === 0) return STATUS_COLOR.untrained;
  const worst = relevant.reduce((a, b) => {
    const order = { sore: 0, recovering: 1, ready: 2, untrained: 3 };
    return order[a.status] <= order[b.status] ? a : b;
  });
  return STATUS_COLOR[worst.status];
}

function BodyFront({ muscles }: { muscles: MuscleData[] }) {
  const c = (id: string) => getColor(muscles, id);
  const mc = (...ids: string[]) => getColor(muscles, ...ids);

  return (
    <Svg width={110} height={220} viewBox="0 0 110 220">
      <Circle cx={55} cy={18} r={14} fill="#1e1e28" stroke="#333" strokeWidth={1} />

      <Ellipse cx={26} cy={42} rx={10} ry={8} fill={mc("shoulders", "lateral-raise-m")} opacity={0.85} />
      <Ellipse cx={84} cy={42} rx={10} ry={8} fill={mc("shoulders", "lateral-raise-m")} opacity={0.85} />

      <Path d="M36 38 Q55 34 74 38 L78 80 Q55 85 32 80 Z" fill={c("chest")} opacity={0.85} />

      <Path d="M12 40 Q6 56 8 80 L20 82 Q18 60 18 42 Z" fill={c("biceps")} opacity={0.85} />
      <Path d="M98 40 Q104 56 102 80 L90 82 Q92 60 92 42 Z" fill={c("biceps")} opacity={0.85} />

      <Path d="M6 80 Q4 104 8 118 L18 116 Q16 100 18 82 Z" fill={c("triceps")} opacity={0.85} />
      <Path d="M104 80 Q106 104 102 118 L92 116 Q94 100 92 82 Z" fill={c("triceps")} opacity={0.85} />

      <Rect x={36} y={82} width={38} height={28} rx={4} fill={c("abs")} opacity={0.8} />
      <Path d="M55 82 L55 110" stroke="#1a1a25" strokeWidth={1.5} />
      <Path d="M36 94 L74 94" stroke="#1a1a25" strokeWidth={1.5} />
      <Path d="M36 106 L74 106" stroke="#1a1a25" strokeWidth={1.5} />

      <Path d="M32 110 Q26 124 28 148 L44 148 Q44 128 40 112 Z" fill={c("quads")} opacity={0.85} />
      <Path d="M78 110 Q84 124 82 148 L66 148 Q66 128 70 112 Z" fill={c("quads")} opacity={0.85} />

      <Path d="M28 148 Q28 164 32 178 L44 178 Q44 162 44 148 Z" fill={c("calves")} opacity={0.8} />
      <Path d="M82 148 Q82 164 78 178 L66 178 Q66 162 66 148 Z" fill={c("calves")} opacity={0.8} />

      <Rect x={36} y={106} width={16} height={6} rx={2} fill="#1a1a25" opacity={0.5} />
      <Rect x={58} y={106} width={16} height={6} rx={2} fill="#1a1a25" opacity={0.5} />
    </Svg>
  );
}

function BodyBack({ muscles }: { muscles: MuscleData[] }) {
  const c = (id: string) => getColor(muscles, id);
  const mc = (...ids: string[]) => getColor(muscles, ...ids);

  return (
    <Svg width={110} height={220} viewBox="0 0 110 220">
      <Circle cx={55} cy={18} r={14} fill="#1e1e28" stroke="#333" strokeWidth={1} />

      <Ellipse cx={26} cy={42} rx={10} ry={8} fill={mc("shoulders", "lateral-raise-m")} opacity={0.85} />
      <Ellipse cx={84} cy={42} rx={10} ry={8} fill={mc("shoulders", "lateral-raise-m")} opacity={0.85} />

      <Path d="M36 38 Q55 34 74 38 L76 72 Q55 78 34 72 Z" fill={c("back")} opacity={0.85} />
      <Path d="M38 72 Q55 76 72 72 L70 86 Q55 88 40 86 Z" fill={c("back")} opacity={0.7} />

      <Path d="M12 40 Q6 56 8 80 L20 82 Q18 60 18 42 Z" fill={c("triceps")} opacity={0.85} />
      <Path d="M98 40 Q104 56 102 80 L90 82 Q92 60 92 42 Z" fill={c("triceps")} opacity={0.85} />

      <Path d="M6 80 Q4 104 8 118 L18 116 Q16 100 18 82 Z" fill={c("biceps")} opacity={0.7} />
      <Path d="M104 80 Q106 104 102 118 L92 116 Q94 100 92 82 Z" fill={c("biceps")} opacity={0.7} />

      <Path d="M36 86 Q32 102 34 112 L44 112 Q44 100 40 88 Z" fill={c("glutes")} opacity={0.8} />
      <Path d="M74 86 Q78 102 76 112 L66 112 Q66 100 70 88 Z" fill={c("glutes")} opacity={0.8} />

      <Path d="M32 110 Q28 128 30 148 L44 148 Q44 128 40 112 Z" fill={c("hamstrings")} opacity={0.85} />
      <Path d="M78 110 Q82 128 80 148 L66 148 Q66 128 70 112 Z" fill={c("hamstrings")} opacity={0.85} />

      <Path d="M30 148 Q30 164 34 178 L44 178 Q44 162 44 148 Z" fill={c("calves")} opacity={0.8} />
      <Path d="M80 148 Q80 164 76 178 L66 178 Q66 162 66 148 Z" fill={c("calves")} opacity={0.8} />
    </Svg>
  );
}

export function MuscleHeatmap({ muscles }: Props) {
  const [view, setView] = useState<"front" | "back">("front");

  const frontMuscles = muscles.filter((m) =>
    ["chest", "biceps", "abs", "quads", "calves", "shoulders"].includes(m.id)
  );
  const backMuscles = muscles.filter((m) =>
    ["back", "triceps", "glutes", "hamstrings", "calves", "shoulders"].includes(m.id)
  );

  const displayMuscles = view === "front" ? frontMuscles : backMuscles;

  return (
    <View style={s.container}>
      <View style={s.viewToggle}>
        <TouchableOpacity
          style={[s.toggleBtn, view === "front" && s.toggleBtnActive]}
          onPress={() => setView("front")}
        >
          <Text style={[s.toggleText, view === "front" && s.toggleTextActive]}>Vorderseite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, view === "back" && s.toggleBtnActive]}
          onPress={() => setView("back")}
        >
          <Text style={[s.toggleText, view === "back" && s.toggleTextActive]}>Rückseite</Text>
        </TouchableOpacity>
      </View>

      <View style={s.bodyWrap}>
        {view === "front" ? (
          <BodyFront muscles={muscles} />
        ) : (
          <BodyBack muscles={muscles} />
        )}

        <View style={s.legend}>
          {displayMuscles.map((m) => (
            <View key={m.id} style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: STATUS_COLOR[m.status] }]} />
              <View>
                <Text style={s.legendName}>{m.name}</Text>
                <Text style={[s.legendStatus, { color: STATUS_COLOR[m.status] }]}>
                  {m.hoursAgo !== null ? `Vor ${Math.round(m.hoursAgo)}h` : STATUS_LABEL[m.status]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={s.colorKey}>
        {(["ready", "recovering", "sore", "untrained"] as MuscleStatus[]).map((st) => (
          <View key={st} style={s.keyItem}>
            <View style={[s.keyDot, { backgroundColor: STATUS_COLOR[st] }]} />
            <Text style={s.keyLabel}>{STATUS_LABEL[st]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function buildMuscleData(
  exerciseProgress: Record<string, { exerciseName: string; history: { date: string }[] }>
): MuscleData[] {
  const EX_MUSCLES: Record<string, string[]> = {
    "bench-press": ["chest", "triceps", "shoulders"],
    "incline-press": ["chest", "triceps", "shoulders"],
    ohp: ["shoulders", "triceps"],
    "lateral-raise": ["shoulders"],
    "tricep-pushdown": ["triceps"],
    deadlift: ["back", "glutes", "hamstrings"],
    pullup: ["back", "biceps"],
    "cable-row": ["back", "biceps"],
    "face-pull": ["shoulders", "back"],
    "bicep-curl": ["biceps"],
    squat: ["quads", "glutes", "hamstrings"],
    "leg-press": ["quads", "glutes"],
    "leg-curl": ["hamstrings"],
    "calf-raise": ["calves"],
    "leg-ext": ["quads"],
    "incline-dumbbell-press": ["chest", "triceps"],
    "cable-fly": ["chest"],
    "dumbbell-row": ["back", "biceps"],
    "hammer-curl": ["biceps"],
    "lateral-raise-m": ["shoulders"],
  };

  const ALL_MUSCLES: { id: string; name: string }[] = [
    { id: "chest", name: "Brust" },
    { id: "back", name: "Rücken" },
    { id: "shoulders", name: "Schultern" },
    { id: "biceps", name: "Bizeps" },
    { id: "triceps", name: "Trizeps" },
    { id: "abs", name: "Bauch" },
    { id: "quads", name: "Quadrizeps" },
    { id: "hamstrings", name: "Hamstrings" },
    { id: "glutes", name: "Gesäß" },
    { id: "calves", name: "Waden" },
  ];

  const lastWorked: Record<string, number> = {};
  const now = Date.now();

  for (const [exId, prog] of Object.entries(exerciseProgress)) {
    if (prog.history.length === 0) continue;
    const lastDate = prog.history[prog.history.length - 1].date;
    const ms = now - new Date(lastDate).getTime();
    const muscles = EX_MUSCLES[exId] ?? [];
    for (const muscle of muscles) {
      if (!lastWorked[muscle] || ms < lastWorked[muscle]) {
        lastWorked[muscle] = ms;
      }
    }
  }

  return ALL_MUSCLES.map(({ id, name }) => {
    const ms = lastWorked[id];
    if (ms === undefined) return { id, name, status: "untrained", hoursAgo: null };
    const hours = ms / 3600000;
    let status: MuscleStatus;
    if (hours < 24) status = "sore";
    else if (hours < 60) status = "recovering";
    else status = "ready";
    return { id, name, status, hoursAgo: hours };
  });
}

const s = StyleSheet.create({
  container: { gap: 16 },
  viewToggle: { flexDirection: "row", backgroundColor: "#0d0d0f", borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  toggleBtnActive: { backgroundColor: "#1a1a25" },
  toggleText: { color: "#6b7280", fontFamily: "Inter_500Medium", fontSize: 13 },
  toggleTextActive: { color: "#f9fafb" },
  bodyWrap: { flexDirection: "row", gap: 16, alignItems: "center" },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { color: "#f9fafb", fontFamily: "Inter_500Medium", fontSize: 13 },
  legendStatus: { fontFamily: "Inter_400Regular", fontSize: 11 },
  colorKey: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  keyItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  keyDot: { width: 8, height: 8, borderRadius: 4 },
  keyLabel: { color: "#6b7280", fontFamily: "Inter_400Regular", fontSize: 12 },
});
