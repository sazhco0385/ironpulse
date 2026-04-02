export type CoachRating = "excellent" | "good" | "ok" | "struggling";

export type CoachAdvice = {
  rating: CoachRating;
  headline: string;
  detail: string;
  nextWeight: number;
  nextReps: number;
  tip: string;
};

const COMPOUNDS = [
  "bankdrücken", "kniebeuge", "kreuzheben", "schulterdrücken",
  "klimmzüge", "dips", "beinpresse", "rudern", "langhantel",
  "squat", "deadlift", "bench", "row", "press",
];

export function isCompound(name: string): boolean {
  const lower = name.toLowerCase();
  return COMPOUNDS.some((k) => lower.includes(k));
}

export function analyzeExercise(
  exerciseName: string,
  completedSets: { weight: number; reps: number }[],
  targetReps: number,
  targetWeight: number,
): CoachAdvice {
  if (completedSets.length === 0) {
    return {
      rating: "ok",
      headline: "Keine Sätze abgeschlossen",
      detail: `Versuche beim nächsten Mal alle Sätze durchzuführen. Starte mit ${targetWeight} kg × ${targetReps} Wdh.`,
      nextWeight: targetWeight,
      nextReps: targetReps,
      tip: "Starte mit leichterem Gewicht um die Bewegung zu spüren.",
    };
  }

  const avgReps = completedSets.reduce((s, d) => s + d.reps, 0) / completedSets.length;
  const lastWeight = completedSets[completedSets.length - 1].weight;
  const increment = isCompound(exerciseName) ? 2.5 : 1.25;
  const repsRatio = avgReps / Math.max(targetReps, 1);

  let rating: CoachRating;
  let headline: string;
  let detail: string;
  let nextWeight: number;
  let nextReps: number;
  let tip: string;

  if (repsRatio >= 1.2) {
    rating = "excellent";
    nextWeight = Math.round((lastWeight + increment) * 2) / 2;
    nextReps = targetReps;
    headline = "Stark! Gewicht erhöhen";
    detail = `Du hast ⌀ ${Math.round(avgReps)} von ${targetReps} Ziel-Wdh gemacht. Nächstes Training: ${nextWeight} kg × ${nextReps} Wdh.`;
    tip = "Progressive Überladung aktiv – du wächst!";
  } else if (repsRatio >= 0.95) {
    rating = "good";
    nextWeight = Math.round((lastWeight + increment) * 2) / 2;
    nextReps = targetReps;
    headline = "Solide – weiter erhöhen";
    detail = `Ziel-Wdh erreicht. Nächstes Training: ${nextWeight} kg × ${nextReps} Wdh.`;
    tip = "Gleichmäßige Steigerung ist der sicherste Weg zu mehr Kraft.";
  } else if (repsRatio >= 0.80) {
    rating = "ok";
    nextWeight = Math.round(lastWeight * 2) / 2;
    nextReps = targetReps;
    headline = "Gut – Gewicht halten";
    detail = `Fast am Ziel. Bleib bei ${nextWeight} kg × ${nextReps} Wdh bis du alle Wdh schaffst.`;
    tip = "Kontrollierte Bewegung in jedem Satz – Qualität vor Gewicht.";
  } else if (repsRatio >= 0.65) {
    rating = "ok";
    nextWeight = Math.round(lastWeight * 2) / 2;
    nextReps = Math.max(Math.round(targetReps - 1), 1);
    headline = "Wdh reduzieren";
    detail = `Reduziere auf ${nextWeight} kg × ${nextReps} Wdh und steigere dich von dort.`;
    tip = "Langsame exzentrische Phase (absenken) für mehr Muskelaktivierung.";
  } else {
    rating = "struggling";
    nextWeight = Math.max(Math.round(lastWeight * 0.9 * 2) / 2, 5);
    nextReps = Math.max(Math.round(avgReps), 4);
    headline = "Gewicht reduzieren";
    detail = `Reduziere auf ${nextWeight} kg × ${nextReps} Wdh – saubere Ausführung hat Priorität.`;
    tip = "Weniger Gewicht, mehr Kontrolle – so verhinderst du Verletzungen.";
  }

  return { rating, headline, detail, nextWeight, nextReps, tip };
}

export const RATING_COLORS: Record<CoachRating, { bg: string; text: string; border: string }> = {
  excellent: { bg: "#00E67618", text: "#00E676", border: "#00E67644" },
  good:      { bg: "#00D4FF18", text: "#00D4FF", border: "#00D4FF44" },
  ok:        { bg: "#FFB80018", text: "#FFB800", border: "#FFB80044" },
  struggling:{ bg: "#FF3D3D18", text: "#FF3D3D", border: "#FF3D3D44" },
};

export const RATING_ICONS: Record<CoachRating, string> = {
  excellent: "trending-up",
  good:      "check-circle",
  ok:        "alert-circle",
  struggling:"arrow-down-circle",
};
