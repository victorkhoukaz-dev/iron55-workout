import { ExerciseDefinition } from '../types/workout';

export const EXERCISE_IMAGE_MAP: Record<string, string> = {
  'ex-single-arm-db-row': './exercises/ex-single-arm-db-row.webp',
  'ex-chest-supported-incline-row': './exercises/ex-chest-supported-incline-row.webp',
  'ex-db-pullover': './exercises/ex-db-pullover.webp',
  'ex-rear-delt-row': './exercises/ex-rear-delt-row.webp',
  'ex-seated-db-shoulder-press': './exercises/ex-seated-db-shoulder-press.webp',
  'ex-db-push-press': './exercises/ex-db-push-press.webp',
  'ex-db-lateral-raise': './exercises/ex-db-lateral-raise.webp',
  'ex-chest-supported-rear-delt-fly': './exercises/ex-chest-supported-rear-delt-fly.webp',
  'ex-arnold-press': './exercises/ex-arnold-press.webp',
  'ex-incline-db-curl': './exercises/ex-incline-db-curl.webp',
  'ex-hammer-curl': './exercises/ex-hammer-curl.webp',
  'ex-spider-preacher-curl': './exercises/ex-spider-preacher-curl.webp',
  'ex-zottman-curl': './exercises/ex-zottman-curl.webp',
  'ex-concentration-curl': './exercises/ex-concentration-curl.webp',
  'ex-db-skullcrusher': './exercises/ex-db-skullcrusher.webp',
  'ex-overhead-db-triceps-ext': './exercises/ex-overhead-db-triceps-ext.webp',
  'ex-close-grip-neutral-db-press': './exercises/ex-close-grip-neutral-db-press.svg',
  'ex-diamond-pushup-or-dips': './exercises/ex-diamond-pushup-or-dips.svg',
  'ex-incline-db-bench-press': './exercises/ex-incline-db-bench-press.webp',
  'ex-db-shrugs': './exercises/ex-db-shrugs.webp',
  'ex-feet-elevated-pushup': './exercises/ex-feet-elevated-pushup.webp'
};

export function getExerciseImagePath(
  ex: Pick<ExerciseDefinition, 'id' | 'imagePath'> | undefined
): string | null {
  if (!ex) return null;
  return ex.imagePath || EXERCISE_IMAGE_MAP[ex.id] || null;
}
