const P = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`;

export const EXERCISE_IMAGES: Record<string, string> = {
  "bench-press":     P(3837781),
  "incline-press":   P(3837797),
  "ohp":             P(3837793),
  "lateral-raise":   P(3837800),
  "tricep-pushdown": P(4162452),
  "deadlift":        P(3289711),
  "pullup":          P(4720334),
  "cable-row":       P(3837773),
  "face-pull":       P(3837800),
  "bicep-curl":      P(3837764),
  "squat":           P(1552242),
  "leg-press":       P(3837790),
  "leg-curl":        P(4162575),
  "calf-raise":      P(3764011),
  "leg-ext":         P(4162452),
  "incline-curl":    P(3837764),
  "hammer-curl":     P(3837764),
  "overhead-ext":    P(4162452),
  "front-raise":     P(3837793),
};

const FALLBACK_BY_KEYWORD: Array<[string, string]> = [
  ["bank", P(3837781)],
  ["brust", P(3837781)],
  ["schräg", P(3837797)],
  ["schulter", P(3837793)],
  ["seitheben", P(3837800)],
  ["frontheben", P(3837793)],
  ["trizeps", P(4162452)],
  ["bizeps", P(3837764)],
  ["curl", P(3837764)],
  ["hammer", P(3837764)],
  ["kreuz", P(3289711)],
  ["deadlift", P(3289711)],
  ["klimmzug", P(4720334)],
  ["pullup", P(4720334)],
  ["rudern", P(3837773)],
  ["row", P(3837773)],
  ["face", P(3837800)],
  ["kniebeuge", P(1552242)],
  ["squat", P(1552242)],
  ["beinpress", P(3837790)],
  ["beinbeuger", P(4162575)],
  ["beinstrecker", P(4162452)],
  ["wade", P(3764011)],
  ["calf", P(3764011)],
];

export function getExerciseImage(exerciseId: string, exerciseName?: string): string | null {
  if (EXERCISE_IMAGES[exerciseId]) return EXERCISE_IMAGES[exerciseId];
  if (exerciseName) {
    const lower = exerciseName.toLowerCase();
    for (const [kw, url] of FALLBACK_BY_KEYWORD) {
      if (lower.includes(kw)) return url;
    }
  }
  return null;
}
