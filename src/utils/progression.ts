import {
  ExerciseDefinition,
  LoggedExercise,
  LoggedSet,
  PlanExerciseSlot,
  ProgressionRecommendation,
  WorkoutLog,
  WorkoutPlan
} from '../types/workout';

export function isWorkingSet(s: LoggedSet): boolean {
  return Boolean(s.completed && !s.isWarmup && s.reps > 0);
}

export const DUMBBELL_WEIGHT_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function snapToDumbbellIncrement(weight: number): number {
  if (weight <= 0) return 0;
  if (weight >= 55) return 55;
  return Math.round(weight / 5) * 5;
}

export function calculateEstimated1RM(weightLbs: number, reps: number): number {
  if (reps <= 0) return 0;
  if (weightLbs <= 0) return reps; // For bodyweight movements, track max reps
  if (reps === 1) return weightLbs;
  return Math.round(weightLbs * (1 + reps / 30) * 10) / 10;
}

export function getNextPlanInRotation(plans: WorkoutPlan[], logs: WorkoutLog[]): WorkoutPlan {
  const rotationPlans = [...plans]
    .filter((p) => p.code === 'A' || p.code === 'B' || p.code === 'C')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (rotationPlans.length === 0) {
    return plans[0];
  }

  // Sort logs newest first
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const lastRotationLog = sortedLogs.find(
    (l) => l.planCode === 'A' || l.planCode === 'B' || l.planCode === 'C'
  );

  if (!lastRotationLog) {
    return rotationPlans[0];
  }

  const nextCodeMap: Record<string, 'A' | 'B' | 'C'> = {
    A: 'B',
    B: 'C',
    C: 'A'
  };

  const nextCode = nextCodeMap[lastRotationLog.planCode] || 'A';
  return rotationPlans.find((p) => p.code === nextCode) || rotationPlans[0];
}

export function getProgressionForExercise(
  slot: PlanExerciseSlot,
  exerciseDef: ExerciseDefinition | undefined,
  logs: WorkoutLog[]
): ProgressionRecommendation {
  const repMin = slot.repRangeMin || exerciseDef?.repRangeMin || 8;
  const repMax = slot.repRangeMax || exerciseDef?.repRangeMax || 12;
  const isBodyweight =
    exerciseDef?.equipment === 'Bodyweight' || exerciseDef?.equipment === 'Bodyweight + DB';

  // Find most recent completed log that has at least 1 completed set for this exercise
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  let lastLoggedEx: LoggedExercise | undefined;
  let lastLogDate: string | undefined;

  for (const log of sortedLogs) {
    const found = log.exercises.find(
      (ex) => ex.exerciseId === slot.exerciseId && ex.sets.some(isWorkingSet)
    );
    if (found) {
      lastLoggedEx = found;
      lastLogDate = log.completedAt;
      break;
    }
  }

  if (!lastLoggedEx) {
    if (isBodyweight) {
      return {
        action: 'FIRST_TIME',
        recommendedWeightLbs: 0,
        recommendedReps: repMin,
        badgeText: `FIRST SESSION • BW × ${repMin}–${repMax}`,
        reason: `Bodyweight baseline: aim for ${slot.targetSets} sets of ${repMin}–${repMax} controlled reps (or add a dumbbell when ready).`
      };
    }

    const customStartWeight =
      exerciseDef?.startingWeightLbs != null && exerciseDef.startingWeightLbs > 0
        ? exerciseDef.startingWeightLbs
        : null;

    if (customStartWeight !== null) {
      return {
        action: 'FIRST_TIME',
        recommendedWeightLbs: customStartWeight,
        recommendedReps: repMin,
        badgeText: `START: ${customStartWeight} lbs × ${repMin}–${repMax}`,
        reason: `Baseline target: aim for ${slot.targetSets} sets of ${repMin}–${repMax} controlled reps.`
      };
    }

    return {
      action: 'FIRST_TIME',
      recommendedWeightLbs: null,
      recommendedReps: repMin,
      badgeText: 'FIRST SESSION • PICK YOUR WEIGHT',
      reason: `No preset weight — pick a dumbbell weight where ${repMin}–${repMax} clean reps feel challenging. Once logged, the app remembers it for next time.`
    };
  }

  const completedSets = lastLoggedEx.sets.filter(isWorkingSet);
  const previousWorkingSets = completedSets.map((s) => ({
    weightLbs: s.weightLbs ?? 0,
    reps: s.reps
  }));
  const lastSummary = completedSets
    .map((s) => {
      const w = s.weightLbs ?? 0;
      return `${w > 0 ? `${w}lb` : 'BW'}×${s.reps}`;
    })
    .join(', ');

  // Primary working weight from last session (use highest weight among completed working sets)
  const workingWeight = Math.max(...completedSets.map((s) => s.weightLbs ?? 0));
  const avgReps = Math.round(
    completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length
  );
  const allSetsHitTopOfRange =
    completedSets.length >= slot.targetSets &&
    completedSets.every((s) => s.reps >= repMax && (s.weightLbs ?? 0) >= workingWeight);

  if (allSetsHitTopOfRange) {
    if (workingWeight >= 55) {
      return {
        action: 'MASTERY_AT_55',
        recommendedWeightLbs: 55,
        recommendedReps: repMax + 1,
        badgeText: `55 LB MAX • AIM FOR ${repMax + 1} REPS OR 3s NEGATIVE`,
        reason: `You crushed all sets at 55 lbs (${lastSummary}). Push for +1 rep or use a strict 3-second lowering tempo.`,
        lastSessionDate: lastLogDate,
        lastSetsSummary: lastSummary,
        previousWorkingSets
      };
    }

    if (lastLoggedEx.effort === 'max') {
      return {
        action: 'ADD_REPS',
        recommendedWeightLbs: workingWeight,
        recommendedReps: repMax,
        badgeText: `CONSOLIDATE • REPEAT ${workingWeight > 0 ? `${workingWeight} LBS` : 'BW'} × ${repMax}`,
        reason: `Hit ${repMax} reps last time at Max effort (${lastSummary}). Repeat this weight for smoother reps before jumping +5 lbs.`,
        lastSessionDate: lastLogDate,
        lastSetsSummary: lastSummary,
        previousWorkingSets
      };
    }

    if (workingWeight === 0 && exerciseDef?.equipment === 'Bodyweight') {
      const nextReps = Math.min(25, avgReps + 1);
      return {
        action: 'ADD_REPS',
        recommendedWeightLbs: 0,
        recommendedReps: nextReps,
        badgeText: `BEAT LAST • AIM FOR ${nextReps} REPS`,
        reason: `You hit the top of the rep range last session (${lastSummary}). Add 1–2 reps per set or place a dumbbell on your lap.`,
        lastSessionDate: lastLogDate,
        lastSetsSummary: lastSummary,
        previousWorkingSets
      };
    }

    const nextWeight = Math.min(55, snapToDumbbellIncrement(workingWeight + 5));
    return {
      action: 'INCREASE_WEIGHT',
      recommendedWeightLbs: nextWeight,
      recommendedReps: repMin,
      badgeText: `LEVEL UP +5 LBS → ${nextWeight} LBS × ${repMin}`,
      reason: `Hit ${repMax}+ reps across all ${completedSets.length} sets last time (${lastSummary}). Time to move up 5 lbs!`,
      lastSessionDate: lastLogDate,
      lastSetsSummary: lastSummary,
      previousWorkingSets
    };
  }

  const repStep = lastLoggedEx.effort === 'easy' ? 2 : 1;
  const nextTargetReps = Math.min(repMax, Math.max(repMin, avgReps + repStep));
  const easyHint =
    lastLoggedEx.effort === 'easy'
      ? ` Last session felt Easy — aim for +2 reps!`
      : '';
  return {
    action: 'ADD_REPS',
    recommendedWeightLbs: workingWeight,
    recommendedReps: nextTargetReps,
    badgeText: `BEAT LAST • ${workingWeight > 0 ? `${workingWeight} LBS` : 'BW'} × ${nextTargetReps} REPS`,
    reason: `Last session: ${lastSummary}. Keep ${
      workingWeight > 0 ? `${workingWeight} lbs` : 'bodyweight'
    } and add +${repStep} rep${repStep > 1 ? 's' : ''} per set until all sets hit ${repMax}.${easyHint}`,
    lastSessionDate: lastLogDate,
    lastSetsSummary: lastSummary,
    previousWorkingSets
  };
}

export interface ExerciseHistoryPoint {
  date: string;
  formattedDate: string;
  planCode: string;
  maxWeightLbs: number;
  bestSetReps: number;
  estimated1RM: number;
  totalVolumeLbs: number;
  setsSummary: string;
}

export function getExerciseHistory(
  exerciseId: string,
  logs: WorkoutLog[]
): ExerciseHistoryPoint[] {
  const chronological = [...logs].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const points: ExerciseHistoryPoint[] = [];

  for (const log of chronological) {
    const ex = log.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const validSets = ex.sets.filter(isWorkingSet);
    if (validSets.length === 0) continue;

    let best1RM = 0;
    let bestWeight = 0;
    let bestReps = 0;
    let volume = 0;

    for (const s of validSets) {
      const w = s.weightLbs ?? 0;
      const e1rm = calculateEstimated1RM(w, s.reps);
      if (e1rm >= best1RM) {
        best1RM = e1rm;
        bestWeight = w;
        bestReps = s.reps;
      }
      volume += (w > 0 ? w : 1) * s.reps;
    }

    const dt = new Date(log.completedAt);
    points.push({
      date: log.completedAt,
      formattedDate: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      planCode: log.planCode,
      maxWeightLbs: bestWeight,
      bestSetReps: bestReps,
      estimated1RM: best1RM,
      totalVolumeLbs: volume,
      setsSummary: validSets
        .map((s) => {
          const w = s.weightLbs ?? 0;
          return `${w > 0 ? `${w}lb` : 'BW'}×${s.reps}`;
        })
        .join(', ')
    });
  }

  return points;
}

export function evaluateAndMarkPRs(
  newExercises: LoggedExercise[],
  existingLogs: WorkoutLog[]
): { exercisesWithPRs: LoggedExercise[]; totalPRsCount: number } {
  let totalPRsCount = 0;

  const updated = newExercises.map((ex) => {
    // Find historical best 1RM for this exercise
    const history = getExerciseHistory(ex.exerciseId, existingLogs);
    let historicalBest1RM = history.reduce((max, pt) => Math.max(max, pt.estimated1RM), 0);

    const newSets = ex.sets.map((s) => {
      if (!isWorkingSet(s)) {
        return { ...s, isPR: false };
      }
      const current1RM = calculateEstimated1RM(s.weightLbs ?? 0, s.reps);
      if (history.length > 0 && current1RM > historicalBest1RM) {
        historicalBest1RM = current1RM;
        totalPRsCount += 1;
        return { ...s, isPR: true };
      }
      return { ...s, isPR: false };
    });

    return {
      ...ex,
      sets: newSets
    };
  });

  return { exercisesWithPRs: updated, totalPRsCount };
}
