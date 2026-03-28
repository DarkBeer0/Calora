// MET values (Metabolic Equivalent of Task)
// Calories burned = MET * weight(kg) * duration(hours)
export interface ExerciseInfo {
  label: string;
  met: number;
  icon: string; // Ionicons name
}

export const EXERCISES: Record<string, ExerciseInfo> = {
  walking: { label: 'Ходьба', met: 3.5, icon: 'walk' },
  running: { label: 'Бег', met: 8.0, icon: 'fitness' },
  cycling: { label: 'Велосипед', met: 6.0, icon: 'bicycle' },
  swimming: { label: 'Плавание', met: 7.0, icon: 'water' },
  gym: { label: 'Тренажёрный зал', met: 5.0, icon: 'barbell' },
  yoga: { label: 'Йога', met: 3.0, icon: 'body' },
  hiit: { label: 'HIIT', met: 9.0, icon: 'flash' },
  dancing: { label: 'Танцы', met: 5.5, icon: 'musical-notes' },
  stretching: { label: 'Растяжка', met: 2.5, icon: 'hand-left' },
  other: { label: 'Другое', met: 4.0, icon: 'ellipsis-horizontal' },
} as const;

export function calculateCaloriesBurned(
  met: number,
  weightKg: number,
  durationMin: number
): number {
  return Math.round(met * weightKg * (durationMin / 60));
}
