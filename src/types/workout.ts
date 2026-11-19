export type MuscleGroup =
  | 'Biceps'
  | 'Triceps'
  | 'Shoulders'
  | 'Back'
  | 'Chest'
  | 'Forearms'
  | 'Traps'
  | 'Core';

export type EquipmentType =
  | 'Dumbbell (Pair)'
  | 'Dumbbell (Single)'
  | 'Bodyweight'
  | 'Bodyweight + DB';

export type BenchAngle =
  | 'Flat Bench (0°)'
  | 'Low Incline (30°)'
  | 'Incline (45°)'
  | 'High Incline (60°)'
  | 'Seated Upright (75–85°)'
  | 'Standing'
  | 'Floor / Bench Edge';

export interface ExerciseDefinition {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  benchAngle: BenchAngle;
  defaultRestSeconds: number;
  repRangeMin: number;
  repRangeMax: number;
  startingWeightLbs?: number | null;
  unilateral: boolean;
  setupCues: string[];
  executionCues: string[];
  whyItWorks: string;
  imagePath?: string;
}

export interface PlanExerciseSlot {
  slotId: string;
  exerciseId: string;
  supersetTag?: string; // e.g. 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  coachingNote?: string;
}

export interface WorkoutPlan {
  id: string;
  code: 'A' | 'B' | 'C' | 'CUSTOM';
  name: string;
  subtitle: string;
  estimatedMinutes: number;
  focusMuscles: MuscleGroup[];
  description: string;
  exercises: PlanExerciseSlot[];
  sortOrder: number;
  updatedAt: string;
}

export interface LoggedSet {
  setNumber: number;
  weightLbs: number | null;
  reps: number;
  completed: boolean;
  isWarmup?: boolean;
  rpe?: number;
  isPR?: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  supersetTag?: string;
  repRangeMin: number;
  repRangeMax: number;
  sets: LoggedSet[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  planId: string;
  planCode: string;
  planName: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  totalVolumeLbs: number;
  totalSets: number;
  prsAchieved: number;
  notes?: string;
  exercises: LoggedExercise[];
  updatedAt: string;
}

export interface ActiveWorkoutDraft {
  id: string;
  planId: string;
  planCode: string;
  planName: string;
  startedAt: string;
  exercises: LoggedExercise[];
  notes: string;
}

export type ProgressionAction =
  | 'INCREASE_WEIGHT'
  | 'ADD_REPS'
  | 'MASTERY_AT_55'
  | 'FIRST_TIME';

export interface ProgressionRecommendation {
  action: ProgressionAction;
  recommendedWeightLbs: number | null;
  recommendedReps: number;
  badgeText: string;
  reason: string;
  lastSessionDate?: string;
  lastSetsSummary?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSyncedAt?: string;
}
