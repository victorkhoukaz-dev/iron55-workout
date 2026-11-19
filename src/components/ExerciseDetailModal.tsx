import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Maximize2,
  Minimize2,
  Sparkles,
  Target,
  X
} from 'lucide-react';
import { getExerciseImagePath } from '../data/exerciseMedia';
import {
  ExerciseDefinition,
  PlanExerciseSlot,
  ProgressionRecommendation
} from '../types/workout';

interface ExerciseDetailModalProps {
  exercise: ExerciseDefinition;
  slot?: PlanExerciseSlot;
  progression?: ProgressionRecommendation;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  slot,
  progression,
  onClose
}) => {
  const [imgError, setImgError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const imgPath = getExerciseImagePath(exercise);
  const showImage = Boolean(imgPath) && !imgError;

  useEffect(() => {
    setImgError(false);
    setZoomed(false);
  }, [exercise.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomed) {
          setZoomed(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomed, onClose]);

  const repMin = slot?.repRangeMin ?? exercise.repRangeMin;
  const repMax = slot?.repRangeMax ?? exercise.repRangeMax;
  const targetSets = slot?.targetSets ?? 3;
  const restSeconds = slot?.restSeconds ?? exercise.defaultRestSeconds;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={exercise.name}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-zinc-700/80 overflow-hidden shadow-2xl"
      >
        {/* Sticky Modal Header */}
        <div className="p-4 pb-3 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {slot?.supersetTag && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                  PAIR {slot.supersetTag}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-800 text-zinc-200">
                {exercise.primaryMuscle}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
                {exercise.benchAngle}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-zinc-300">
                {exercise.equipment}
              </span>
              {exercise.unilateral && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Per Arm
                </span>
              )}
            </div>
            <h2 className="text-base font-extrabold text-zinc-100 leading-snug">
              {exercise.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 shrink-0 cursor-pointer"
            aria-label="Close exercise details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* 2-Frame Visual Overview Card */}
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-[#0d0f12] relative">
            {showImage ? (
              <>
                <img
                  src={imgPath!}
                  alt={`${exercise.name} start and finish form overview`}
                  onError={() => setImgError(true)}
                  onClick={() => setZoomed(true)}
                  className="w-full aspect-video object-cover cursor-zoom-in block"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-950/85 border border-zinc-700/80 text-[10px] font-extrabold tracking-wider text-zinc-200">
                    1. START
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-extrabold tracking-wider text-emerald-300">
                    2. PEAK / FINISH
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomed(true)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700/70 text-zinc-200 cursor-pointer"
                  title="Expand visual overview"
                  aria-label="Expand visual overview"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="aspect-video w-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/20">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-zinc-200">
                  {exercise.equipment} • {exercise.benchAngle}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Primary Target: <span className="text-emerald-400 font-semibold">{exercise.primaryMuscle}</span>
                  {exercise.secondaryMuscles.length > 0 && (
                    <span> • Secondary: {exercise.secondaryMuscles.join(', ')}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Target Muscles Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Muscles:
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Primary: {exercise.primaryMuscle}
            </span>
            {exercise.secondaryMuscles.map((m) => (
              <span
                key={m}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60"
              >
                {m}
              </span>
            ))}
          </div>

          {/* Prescription & Smart Progression Box */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80">
                <div className="text-[10px] font-bold uppercase text-zinc-500">Sets × Reps</div>
                <div className="text-xs font-mono font-extrabold text-zinc-100 mt-0.5">
                  {targetSets} × {repMin}–{repMax}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80">
                <div className="text-[10px] font-bold uppercase text-zinc-500">Rest</div>
                <div className="text-xs font-mono font-extrabold text-zinc-100 mt-0.5 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {restSeconds}s
                </div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80">
                <div className="text-[10px] font-bold uppercase text-zinc-500">
                  {progression ? 'Next Load' : 'Start Load'}
                </div>
                <div className="text-xs font-mono font-extrabold text-emerald-400 mt-0.5">
                  {progression
                    ? progression.recommendedWeightLbs > 0
                      ? `${progression.recommendedWeightLbs} lbs`
                      : 'BW'
                    : exercise.startingWeightLbs > 0
                    ? `${exercise.startingWeightLbs} lbs`
                    : 'BW'}
                </div>
              </div>
            </div>

            {progression && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                <div
                  className={`inline-flex items-center gap-1 text-xs font-extrabold ${
                    progression.action === 'INCREASE_WEIGHT'
                      ? 'text-emerald-400'
                      : progression.action === 'MASTERY_AT_55'
                      ? 'text-amber-400'
                      : 'text-sky-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {progression.badgeText}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{progression.reason}</p>
                {progression.lastSetsSummary && (
                  <p className="text-[11px] font-mono text-zinc-500">
                    Last logged: {progression.lastSetsSummary}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Setup Cues */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              Bench &amp; Body Setup
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-200 leading-relaxed">
              {exercise.setupCues.map((cue, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Execution & Tempo Cues */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
              Execution &amp; Tempo Cues
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-200 leading-relaxed">
              {exercise.executionCues.map((cue, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coaching Note & Why It Works */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-2">
            {slot?.coachingNote && (
              <div className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block mb-0.5">
                  Plan Coaching Note
                </span>
                {slot.coachingNote}
              </div>
            )}
            <div className="text-xs text-zinc-400 leading-relaxed">
              <span className="font-bold text-zinc-300">Why it works: </span>
              {exercise.whyItWorks}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Overlay */}
      {zoomed && showImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-3"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed(false);
          }}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 cursor-pointer"
            aria-label="Exit fullscreen image"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <div className="w-full max-w-3xl relative">
            <img
              src={imgPath!}
              alt={exercise.name}
              className="w-full rounded-2xl border border-zinc-800"
            />
            <div className="mt-2 flex items-center justify-between px-1 text-xs font-bold">
              <span className="text-zinc-300">1. START POSITION</span>
              <span className="text-zinc-400 text-center">{exercise.name}</span>
              <span className="text-emerald-400">2. PEAK / FINISH</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
