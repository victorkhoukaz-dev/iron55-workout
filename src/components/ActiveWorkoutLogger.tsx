import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  SkipForward,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  X
} from 'lucide-react';
import { getExerciseImagePath } from '../data/exerciseMedia';
import {
  ActiveWorkoutDraft,
  ExerciseDefinition,
  LoggedExercise,
  LoggedSet,
  WorkoutLog,
  WorkoutPlan
} from '../types/workout';
import {
  DUMBBELL_WEIGHT_STEPS,
  getProgressionForExercise,
  snapToDumbbellIncrement
} from '../utils/progression';
import { playRestCompleteAlert, playSetCheckBeep } from '../utils/audio';
import { ExerciseDetailModal } from './ExerciseDetailModal';

interface ActiveWorkoutLoggerProps {
  draft: ActiveWorkoutDraft;
  plan: WorkoutPlan | undefined;
  exercises: ExerciseDefinition[];
  logs: WorkoutLog[];
  onUpdateDraft: (updated: ActiveWorkoutDraft) => void;
  onFinishWorkout: (finalDraft: ActiveWorkoutDraft, elapsedSeconds: number) => void;
  onDiscardWorkout: () => void;
}

export const ActiveWorkoutLogger: React.FC<ActiveWorkoutLoggerProps> = ({
  draft,
  plan,
  exercises,
  logs,
  onUpdateDraft,
  onFinishWorkout,
  onDiscardWorkout
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const started = new Date(draft.startedAt).getTime();
    return Math.max(0, Math.floor((Date.now() - started) / 1000));
  });

  // Rest timer state
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [restTotal, setRestTotal] = useState<number>(60);
  const [restActive, setRestActive] = useState<boolean>(false);
  const [restNextLabel, setRestNextLabel] = useState<string>('');

  // UI state
  const [expandedCues, setExpandedCues] = useState<Record<number, boolean>>({});
  const [swapExerciseIdx, setSwapExerciseIdx] = useState<number | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [weightPickerTarget, setWeightPickerTarget] = useState<{
    exIdx: number;
    setIdx: number;
  } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);
  const [modalExerciseIdx, setModalExerciseIdx] = useState<number | null>(null);

  // Elapsed workout timer
  useEffect(() => {
    const interval = window.setInterval(() => {
      const started = new Date(draft.startedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [draft.startedAt]);

  // Rest countdown timer
  useEffect(() => {
    if (!restActive || restRemaining <= 0) return;

    const timer = window.setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          setRestActive(false);
          playRestCompleteAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restActive, restRemaining]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const getExerciseDef = (exerciseId: string): ExerciseDefinition | undefined =>
    exercises.find((e) => e.id === exerciseId);

  const startRestTimer = (seconds: number, label: string) => {
    setRestTotal(seconds);
    setRestRemaining(seconds);
    setRestNextLabel(label);
    setRestActive(true);
  };

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<LoggedSet>) => {
    const nextExercises = draft.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const nextSets = ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s));
      return { ...ex, sets: nextSets };
    });
    onUpdateDraft({ ...draft, exercises: nextExercises });
  };

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const ex = draft.exercises[exIdx];
    const currentSet = ex.sets[setIdx];
    const nextCompleted = !currentSet.completed;

    updateSet(exIdx, setIdx, { completed: nextCompleted });

    if (nextCompleted) {
      playSetCheckBeep();
      const exDef = getExerciseDef(ex.exerciseId);
      const planSlot = plan?.exercises.find((s) => s.exerciseId === ex.exerciseId);
      const defaultRest = planSlot?.restSeconds || exDef?.defaultRestSeconds || 60;

      // Determine smart superset hint
      let hint = `${ex.exerciseName} — Set ${setIdx + 1} done`;
      if (ex.supersetTag) {
        const prefix = ex.supersetTag.charAt(0);
        const num = ex.supersetTag.charAt(1);
        const partnerTag = `${prefix}${num === '1' ? '2' : '1'}`;
        const partner = draft.exercises.find((e) => e.supersetTag === partnerTag);
        if (partner) {
          hint = `Up next in Superset: ${partnerTag} ${partner.exerciseName}`;
        }
      }
      startRestTimer(defaultRest, hint);
    }
  };

  const handleAdjustWeight = (exIdx: number, setIdx: number, delta: number) => {
    const current = draft.exercises[exIdx].sets[setIdx].weightLbs;
    const next = Math.max(0, Math.min(55, snapToDumbbellIncrement(current + delta)));
    updateSet(exIdx, setIdx, { weightLbs: next });
  };

  const handleAdjustReps = (exIdx: number, setIdx: number, delta: number) => {
    const current = draft.exercises[exIdx].sets[setIdx].reps;
    const next = Math.max(1, Math.min(50, current + delta));
    updateSet(exIdx, setIdx, { reps: next });
  };

  const handleAddSet = (exIdx: number) => {
    const ex = draft.exercises[exIdx];
    const lastSet = ex.sets[ex.sets.length - 1] || {
      setNumber: 0,
      weightLbs: 20,
      reps: ex.repRangeMin || 10,
      completed: false
    };
    const newSet: LoggedSet = {
      setNumber: ex.sets.length + 1,
      weightLbs: lastSet.weightLbs,
      reps: lastSet.reps,
      completed: false
    };
    const nextExercises = draft.exercises.map((item, idx) =>
      idx === exIdx ? { ...item, sets: [...item.sets, newSet] } : item
    );
    onUpdateDraft({ ...draft, exercises: nextExercises });
  };

  const handleRemoveLastSet = (exIdx: number) => {
    const ex = draft.exercises[exIdx];
    if (ex.sets.length <= 1) return;
    const nextExercises = draft.exercises.map((item, idx) =>
      idx === exIdx ? { ...item, sets: item.sets.slice(0, -1) } : item
    );
    onUpdateDraft({ ...draft, exercises: nextExercises });
  };

  const handleSwapExercise = (exIdx: number, newDef: ExerciseDefinition) => {
    const currentEx = draft.exercises[exIdx];
    const fakeSlot = {
      slotId: `swap-${exIdx}`,
      exerciseId: newDef.id,
      supersetTag: currentEx.supersetTag,
      targetSets: currentEx.sets.length,
      repRangeMin: newDef.repRangeMin,
      repRangeMax: newDef.repRangeMax,
      restSeconds: newDef.defaultRestSeconds
    };
    const prog = getProgressionForExercise(fakeSlot, newDef, logs);

    const swapped: LoggedExercise = {
      exerciseId: newDef.id,
      exerciseName: newDef.name,
      primaryMuscle: newDef.primaryMuscle,
      supersetTag: currentEx.supersetTag,
      repRangeMin: newDef.repRangeMin,
      repRangeMax: newDef.repRangeMax,
      sets: currentEx.sets.map((_, sIdx) => ({
        setNumber: sIdx + 1,
        weightLbs: prog.recommendedWeightLbs,
        reps: prog.recommendedReps,
        completed: false
      }))
    };

    const nextExercises = draft.exercises.map((item, idx) => (idx === exIdx ? swapped : item));
    onUpdateDraft({ ...draft, exercises: nextExercises });
    setSwapExerciseIdx(null);
  };

  const handleAddBonusExercise = (newDef: ExerciseDefinition) => {
    const fakeSlot = {
      slotId: `bonus-${Date.now()}`,
      exerciseId: newDef.id,
      targetSets: 3,
      repRangeMin: newDef.repRangeMin,
      repRangeMax: newDef.repRangeMax,
      restSeconds: newDef.defaultRestSeconds
    };
    const prog = getProgressionForExercise(fakeSlot, newDef, logs);
    const added: LoggedExercise = {
      exerciseId: newDef.id,
      exerciseName: newDef.name,
      primaryMuscle: newDef.primaryMuscle,
      repRangeMin: newDef.repRangeMin,
      repRangeMax: newDef.repRangeMax,
      sets: [1, 2, 3].map((num) => ({
        setNumber: num,
        weightLbs: prog.recommendedWeightLbs,
        reps: prog.recommendedReps,
        completed: false
      }))
    };
    onUpdateDraft({ ...draft, exercises: [...draft.exercises, added] });
    setShowAddExerciseModal(false);
  };

  // Totals
  const totalSetsCount = draft.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = draft.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const currentVolumeLbs = draft.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sAcc, s) => sAcc + (s.weightLbs > 0 ? s.weightLbs : 0) * s.reps, 0),
    0
  );

  const progressPct = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;
  const isOver40Min = elapsedSeconds >= 40 * 60;

  return (
    <div className="pb-36">
      {/* Sticky Live Workout Top Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE • WORKOUT {draft.planCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                    isOver40Min
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {formatTime(elapsedSeconds)}
                  <span className="text-zinc-500 text-[10px]">/ 35m</span>
                </span>
              </div>
              <h1 className="text-sm font-bold text-zinc-100 mt-1 truncate max-w-[230px] sm:max-w-xs">
                {draft.planName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(true)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
                title="Discard Workout"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onFinishWorkout(draft, elapsedSeconds)}
                disabled={completedSetsCount === 0}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-lg transition ${
                  completedSetsCount > 0
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Finish ({completedSetsCount}/{totalSetsCount})
              </button>
            </div>
          </div>

          {/* Progress bar & Volume pill */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">
              {currentVolumeLbs.toLocaleString()} <span className="text-zinc-500">lbs vol</span>
            </span>
          </div>
        </div>
      </div>

      {/* Discard confirmation banner */}
      {confirmDiscard && (
        <div className="max-w-xl mx-auto mt-3 px-4">
          <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-between gap-3">
            <p className="text-xs text-red-200 font-medium">
              Discard this active workout without saving?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold"
              >
                Keep Logging
              </button>
              <button
                type="button"
                onClick={onDiscardWorkout}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-zinc-950 text-xs font-bold"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="max-w-xl mx-auto px-4 mt-4 space-y-4">
        {draft.exercises.map((ex, exIdx) => {
          const exDef = getExerciseDef(ex.exerciseId);
          const planSlot = plan?.exercises.find((s) => s.exerciseId === ex.exerciseId) || {
            slotId: `slot-${exIdx}`,
            exerciseId: ex.exerciseId,
            supersetTag: ex.supersetTag,
            targetSets: ex.sets.length,
            repRangeMin: ex.repRangeMin,
            repRangeMax: ex.repRangeMax,
            restSeconds: exDef?.defaultRestSeconds || 60
          };
          const prog = getProgressionForExercise(planSlot, exDef, logs);
          const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.completed);
          const isCuesOpen = Boolean(expandedCues[exIdx]);

          const supersetColor =
            ex.supersetTag?.startsWith('A')
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : ex.supersetTag?.startsWith('B')
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

          return (
            <div
              key={`${ex.exerciseId}-${exIdx}`}
              className={`rounded-2xl border transition-all ${
                allDone
                  ? 'bg-zinc-900/50 border-emerald-500/40'
                  : 'bg-zinc-900 border-zinc-800'
              } overflow-hidden shadow-lg`}
            >
              {/* Card Header */}
              <div className="p-4 pb-3 border-b border-zinc-800/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {ex.supersetTag && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${supersetColor}`}
                        >
                          PAIR {ex.supersetTag}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-800 text-zinc-300">
                        {ex.primaryMuscle}
                      </span>
                      {exDef?.benchAngle && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-amber-300 border border-amber-500/20">
                          Bench: {exDef.benchAngle}
                        </span>
                      )}
                      {exDef?.unilateral && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          Per Arm
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-zinc-100 leading-snug">
                      {ex.exerciseName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSwapExerciseIdx(exIdx)}
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1"
                      title="Swap Exercise"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCues((prev) => ({ ...prev, [exIdx]: !prev[exIdx] }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition ${
                        isCuesOpen
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                      Cues
                      {isCuesOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Smart Double Progression Pill */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-extrabold ${
                        prog.action === 'INCREASE_WEIGHT'
                          ? 'text-emerald-400'
                          : prog.action === 'MASTERY_AT_55'
                          ? 'text-amber-400'
                          : 'text-sky-400'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {prog.badgeText}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Target: {ex.repRangeMin}–{ex.repRangeMax} reps
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{prog.reason}</p>
                </div>

                {/* Expandable Setup & Execution Cues + Visual Overview */}
                {isCuesOpen && exDef && (() => {
                  const cuesImgPath = getExerciseImagePath(exDef);
                  return (
                    <div className="mt-2.5 p-3 rounded-xl bg-zinc-950 border border-emerald-500/25 text-xs space-y-2.5">
                      {cuesImgPath && (
                        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0f12] relative">
                          <img
                            src={cuesImgPath}
                            alt={`${exDef.name} visual guide`}
                            onClick={() => setModalExerciseIdx(exIdx)}
                            className="w-full aspect-video object-cover cursor-zoom-in block"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-950/85 border border-zinc-700/80 text-[9px] font-extrabold text-zinc-200">
                              1. START
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-[9px] font-extrabold text-emerald-300">
                              2. PEAK
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setModalExerciseIdx(exIdx)}
                            className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-700/70 text-[10px] font-bold text-zinc-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3 text-emerald-400" />
                            Full View
                          </button>
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                          Bench &amp; Body Setup ({exDef.equipment})
                        </div>
                        <ul className="mt-1 space-y-1 text-zinc-300 list-disc list-inside">
                          {exDef.setupCues.map((cue, i) => (
                            <li key={i}>{cue}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-bold text-sky-400 uppercase tracking-wider text-[10px]">
                          Execution &amp; Tempo Cues
                        </div>
                        <ul className="mt-1 space-y-1 text-zinc-300 list-disc list-inside">
                          {exDef.executionCues.map((cue, i) => (
                            <li key={i}>{cue}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-1 border-t border-zinc-800 text-[11px] text-zinc-400 italic">
                        Why it works: {exDef.whyItWorks}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Sets Logger Table */}
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-12 gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <div className="col-span-1 text-center">Set</div>
                  <div className="col-span-5 text-center">Weight (lbs)</div>
                  <div className="col-span-4 text-center">Reps</div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                {ex.sets.map((set, setIdx) => {
                  const hitTopRange = set.reps >= ex.repRangeMax;
                  return (
                    <div
                      key={setIdx}
                      className={`grid grid-cols-12 gap-1.5 items-center p-2 rounded-xl border transition ${
                        set.completed
                          ? 'bg-emerald-950/25 border-emerald-500/35'
                          : 'bg-zinc-950/70 border-zinc-800/80'
                      }`}
                    >
                      {/* Set # */}
                      <div className="col-span-1 flex justify-center">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                            set.completed
                              ? 'bg-emerald-500 text-zinc-950'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {setIdx + 1}
                        </span>
                      </div>

                      {/* Weight Stepper (-5 / tap picker / +5) */}
                      <div className="col-span-5 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(exIdx, setIdx, -5)}
                          className="w-8 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-bold text-xs flex items-center justify-center select-none cursor-pointer"
                          aria-label="Decrease weight by 5 lbs"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightPickerTarget({ exIdx, setIdx })}
                          className="flex-1 h-9 px-1 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500/50 text-center font-mono font-extrabold text-sm text-zinc-100 flex flex-col items-center justify-center leading-none cursor-pointer"
                          title="Tap to pick dumbbell weight (0–55 lbs)"
                        >
                          <span>{set.weightLbs === 0 ? 'BW' : set.weightLbs}</span>
                          <span className="text-[9px] text-zinc-500 font-sans">
                            {set.weightLbs === 0 ? 'body' : 'lbs'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(exIdx, setIdx, 5)}
                          className="w-8 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-bold text-xs flex items-center justify-center select-none cursor-pointer"
                          aria-label="Increase weight by 5 lbs"
                        >
                          +5
                        </button>
                      </div>

                      {/* Reps Stepper (-1 / input / +1) */}
                      <div className="col-span-4 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustReps(exIdx, setIdx, -1)}
                          className="w-7 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 flex items-center justify-center select-none cursor-pointer"
                          aria-label="Decrease reps"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={99}
                          value={set.reps}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateSet(exIdx, setIdx, { reps: Number.isNaN(val) ? 0 : val });
                          }}
                          className={`w-11 h-9 rounded-lg bg-zinc-900 border text-center font-mono font-extrabold text-sm focus:outline-none ${
                            set.completed && hitTopRange
                              ? 'border-emerald-500/60 text-emerald-300'
                              : 'border-zinc-700/80 text-zinc-100'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleAdjustReps(exIdx, setIdx, 1)}
                          className="w-7 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 flex items-center justify-center select-none cursor-pointer"
                          aria-label="Increase reps"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Complete Checkmark Button */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                          className={`w-11 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                            set.completed
                              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/25'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                          }`}
                          aria-label={`Mark set ${setIdx + 1} complete`}
                        >
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add / Remove Set Footer */}
                <div className="pt-1 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-zinc-800/60 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Set
                  </button>
                  {ex.sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLastSet(exIdx)}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-300 py-1 px-2 rounded-lg hover:bg-zinc-800/60 transition cursor-pointer"
                    >
                      Remove Last Set
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Bonus Exercise & Session Notes */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => setShowAddExerciseModal(true)}
            className="w-full py-3 rounded-2xl border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/50 text-zinc-300 hover:text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Bonus Exercise to Today&apos;s Session
          </button>

          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Workout Notes (Pump, Energy, Grip, Bench Notches)
            </label>
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => onUpdateDraft({ ...draft, notes: e.target.value })}
              placeholder="e.g., Bench notch #3 felt great for incline press; move up to 45 lbs next time..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Dumbbell Weight Grid Modal (0 - 55 lbs in one tap) */}
      {weightPickerTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-700 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  Select Dumbbell Weight (5–55 lbs)
                </h3>
                <p className="text-xs text-zinc-400">
                  {draft.exercises[weightPickerTarget.exIdx]?.exerciseName} — Set{' '}
                  {weightPickerTarget.setIdx + 1}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWeightPickerTarget(null)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {DUMBBELL_WEIGHT_STEPS.map((w) => {
                const currentW =
                  draft.exercises[weightPickerTarget.exIdx]?.sets[weightPickerTarget.setIdx]
                    ?.weightLbs;
                const isSelected = currentW === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      updateSet(weightPickerTarget.exIdx, weightPickerTarget.setIdx, {
                        weightLbs: w
                      });
                      setWeightPickerTarget(null);
                    }}
                    className={`py-3 rounded-xl font-mono font-extrabold text-sm border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {w === 0 ? 'BW' : `${w} lb`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Swap or Add Exercise Modal */}
      {(swapExerciseIdx !== null || showAddExerciseModal) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                {swapExerciseIdx !== null
                  ? `Swap "${draft.exercises[swapExerciseIdx]?.exerciseName}"`
                  : 'Add Upper-Body Exercise'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSwapExerciseIdx(null);
                  setShowAddExerciseModal(false);
                }}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto space-y-2">
              {exercises.map((def) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() =>
                    swapExerciseIdx !== null
                      ? handleSwapExercise(swapExerciseIdx, def)
                      : handleAddBonusExercise(def)
                  }
                  className="w-full text-left p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 transition flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-400">
                        {def.primaryMuscle}
                      </span>
                      <span className="text-[11px] text-zinc-500">• {def.benchAngle}</span>
                    </div>
                    <div className="text-sm font-bold text-zinc-100 mt-0.5">{def.name}</div>
                    <div className="text-[11px] text-zinc-400">
                      Start: {def.startingWeightLbs > 0 ? `${def.startingWeightLbs} lbs` : 'BW'} •{' '}
                      {def.repRangeMin}–{def.repRangeMax} reps
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Rest Timer Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          {restActive ? (
            <div className="rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/50 p-3 shadow-2xl shadow-black">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-extrabold text-base text-emerald-300">
                    {formatTime(restRemaining)}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      Rest Timer Active
                    </div>
                    <div className="text-xs text-zinc-300 truncate max-w-[180px] sm:max-w-xs">
                      {restNextLabel || 'Recover & set your dumbbell dials'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRestRemaining((r) => Math.max(5, r - 15))}
                    className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 cursor-pointer"
                  >
                    -15s
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestRemaining((r) => r + 15);
                      setRestTotal((t) => Math.max(t, restRemaining + 15));
                    }}
                    className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 cursor-pointer"
                  >
                    +15s
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestActive(false);
                      setRestRemaining(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    Skip
                  </button>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{
                    width: `${restTotal > 0 ? Math.min(100, (restRemaining / restTotal) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-zinc-800 px-3.5 py-2.5 flex items-center justify-between shadow-xl">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                Quick Rest Timer:
              </span>
              <div className="flex items-center gap-1.5">
                {[45, 60, 75, 90].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => startRestTimer(sec, 'Manual rest countdown')}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-200 cursor-pointer"
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Exercise Detail Modal from Active Workout Cues */}
      {modalExerciseIdx !== null && (() => {
        const activeEx = draft.exercises[modalExerciseIdx];
        const def = activeEx ? getExerciseDef(activeEx.exerciseId) : undefined;
        if (!activeEx || !def) return null;
        const slot = plan?.exercises.find((s) => s.exerciseId === activeEx.exerciseId) || {
          slotId: `active-${modalExerciseIdx}`,
          exerciseId: activeEx.exerciseId,
          supersetTag: activeEx.supersetTag,
          targetSets: activeEx.sets.length,
          repRangeMin: activeEx.repRangeMin,
          repRangeMax: activeEx.repRangeMax,
          restSeconds: def.defaultRestSeconds
        };
        const prog = getProgressionForExercise(slot, def, logs);
        return (
          <ExerciseDetailModal
            exercise={def}
            slot={slot}
            progression={prog}
            onClose={() => setModalExerciseIdx(null)}
          />
        );
      })()}
    </div>
  );
};
