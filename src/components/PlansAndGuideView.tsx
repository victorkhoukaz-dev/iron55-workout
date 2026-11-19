import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Dumbbell,
  Edit3,
  Info,
  LayoutGrid,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { getExerciseImagePath } from '../data/exerciseMedia';
import {
  BenchAngle,
  EquipmentType,
  ExerciseDefinition,
  MuscleGroup,
  PlanExerciseSlot,
  ProgressionRecommendation,
  WorkoutLog,
  WorkoutPlan
} from '../types/workout';
import { getProgressionForExercise } from '../utils/progression';
import { ExerciseDetailModal } from './ExerciseDetailModal';

interface PlansAndGuideViewProps {
  plans: WorkoutPlan[];
  exercises: ExerciseDefinition[];
  logs: WorkoutLog[];
  onStartPlan: (plan: WorkoutPlan) => void;
  onSavePlan: (updatedPlan: WorkoutPlan) => void;
  onResetDefaultPlans: () => void;
  onAddCustomExercise: (newExercise: ExerciseDefinition) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Biceps',
  'Triceps',
  'Shoulders',
  'Back',
  'Chest',
  'Forearms',
  'Traps',
  'Core'
];

const BENCH_ANGLES: BenchAngle[] = [
  'Flat Bench (0°)',
  'Low Incline (30°)',
  'Incline (45°)',
  'High Incline (60°)',
  'Seated Upright (75–85°)',
  'Standing',
  'Floor / Bench Edge'
];

const EQUIPMENT_TYPES: EquipmentType[] = [
  'Dumbbell (Pair)',
  'Dumbbell (Single)',
  'Bodyweight',
  'Bodyweight + DB'
];

export const PlansAndGuideView: React.FC<PlansAndGuideViewProps> = ({
  plans,
  exercises,
  logs,
  onStartPlan,
  onSavePlan,
  onResetDefaultPlans,
  onAddCustomExercise
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || 'plan-upper-a');
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState<boolean>(false);
  const [showNewExerciseModal, setShowNewExerciseModal] = useState<boolean>(false);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [subView, setSubView] = useState<'plans' | 'library'>('plans');
  const [muscleFilter, setMuscleFilter] = useState<'All' | MuscleGroup>('All');
  const [inspectTarget, setInspectTarget] = useState<{
    exercise: ExerciseDefinition;
    slot?: PlanExerciseSlot;
    progression?: ProgressionRecommendation;
  } | null>(null);

  // New Custom Exercise Form
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('Biceps');
  const [newExBench, setNewExBench] = useState<BenchAngle>('Flat Bench (0°)');
  const [newExEquip, setNewExEquip] = useState<EquipmentType>('Dumbbell (Pair)');
  const [newExStartWeight, setNewExStartWeight] = useState<number>(20);
  const [newExRepMin, setNewExRepMin] = useState<number>(8);
  const [newExRepMax, setNewExRepMax] = useState<number>(12);
  const [newExCue, setNewExCue] = useState('');

  const activePlan =
    editingPlan || plans.find((p) => p.id === selectedPlanId) || plans[0];

  const getExDef = (id: string) => exercises.find((e) => e.id === id);

  const handleStartEdit = (plan: WorkoutPlan) => {
    setEditingPlan(JSON.parse(JSON.stringify(plan)) as WorkoutPlan);
  };

  const handleSaveEdit = () => {
    if (!editingPlan) return;
    onSavePlan({
      ...editingPlan,
      updatedAt: new Date().toISOString()
    });
    setEditingPlan(null);
  };

  const handleUpdateSlot = (slotIdx: number, patch: Partial<PlanExerciseSlot>) => {
    if (!editingPlan) return;
    const nextSlots = editingPlan.exercises.map((s, idx) =>
      idx === slotIdx ? { ...s, ...patch } : s
    );
    setEditingPlan({ ...editingPlan, exercises: nextSlots });
  };

  const handleMoveSlot = (slotIdx: number, dir: -1 | 1) => {
    if (!editingPlan) return;
    const targetIdx = slotIdx + dir;
    if (targetIdx < 0 || targetIdx >= editingPlan.exercises.length) return;
    const copy = [...editingPlan.exercises];
    const [removed] = copy.splice(slotIdx, 1);
    copy.splice(targetIdx, 0, removed);
    setEditingPlan({ ...editingPlan, exercises: copy });
  };

  const handleDeleteSlot = (slotIdx: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      exercises: editingPlan.exercises.filter((_, idx) => idx !== slotIdx)
    });
  };

  const handleAddSlotToPlan = (def: ExerciseDefinition) => {
    if (!editingPlan) return;
    const newSlot: PlanExerciseSlot = {
      slotId: `slot-${Date.now()}`,
      exerciseId: def.id,
      supersetTag: `C${editingPlan.exercises.length + 1}`,
      targetSets: 3,
      repRangeMin: def.repRangeMin,
      repRangeMax: def.repRangeMax,
      restSeconds: def.defaultRestSeconds,
      coachingNote: def.executionCues[0] || ''
    };
    setEditingPlan({
      ...editingPlan,
      exercises: [...editingPlan.exercises, newSlot]
    });
    setShowAddSlotModal(false);
  };

  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;
    const created: ExerciseDefinition = {
      id: `ex-custom-${Date.now()}`,
      name: newExName.trim(),
      primaryMuscle: newExMuscle,
      secondaryMuscles: [],
      equipment: newExEquip,
      benchAngle: newExBench,
      defaultRestSeconds: 60,
      repRangeMin: newExRepMin,
      repRangeMax: newExRepMax,
      startingWeightLbs: newExStartWeight,
      unilateral: newExEquip === 'Dumbbell (Single)',
      setupCues: [newExCue.trim() || `Set bench to ${newExBench} and brace core.`],
      executionCues: ['Control the eccentric for 2 seconds and drive forcefully on the concentric.'],
      whyItWorks: 'Custom exercise added to your personal 5–55 lb dumbbell library.'
    };
    onAddCustomExercise(created);
    setNewExName('');
    setNewExCue('');
    setShowNewExerciseModal(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* Header & Program Blueprint Drawer */}
      <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border border-zinc-800 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              5–55 LB DUMBBELL + BENCH SYSTEM
            </span>
            <h1 className="text-lg font-extrabold text-zinc-100 mt-0.5">
              Upper Body A / B / C Program
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              2–3 workouts/week • 30–40 min max • Biceps, Triceps, Shoulders &amp; Back focus
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowMethodology((v) => !v)}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-300 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showMethodology ? 'Hide Guide' : 'How It Works'}
          </button>
        </div>

        {showMethodology && (
          <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-300 space-y-2.5 leading-relaxed">
            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="font-bold text-emerald-400 mb-1">
                1. Why Rolling A → B → C Works for 2–3 Days/Week
              </div>
              <p className="text-zinc-400">
                Instead of tying workouts to fixed calendar days, you simply rotate{' '}
                <strong className="text-zinc-200">A → B → C → A</strong>. Every workout hits your
                full upper body in ~35 minutes with a different stimulus:
              </p>
              <ul className="mt-1.5 space-y-1 text-zinc-300 list-disc list-inside">
                <li>
                  <strong>Workout A (Heavy Strength):</strong> 6–10 rep compound presses &amp; rows +
                  heavy hammer curls &amp; skullcrushers.
                </li>
                <li>
                  <strong>Workout B (Stretch Hypertrophy):</strong> Incline bench stretch positions
                  for biceps peak, triceps long head, lats, and 3D delts.
                </li>
                <li>
                  <strong>Workout C (Explosive Power &amp; Arms):</strong> Push press power +
                  pullovers + high-density biceps/triceps/forearm specialization.
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="font-bold text-sky-400 mb-1">
                2. Finishing 18 Sets in 35 Minutes (Antagonist Pairs)
              </div>
              <p className="text-zinc-400">
                Exercises are paired as <strong>A1/A2</strong>, <strong>B1/B2</strong>, and{' '}
                <strong>C1/C2</strong> using opposing muscles (e.g., Pressing + Pulling, or Biceps +
                Triceps). Perform 1 set of A1, rest 45–60s while setting your dumbbells, perform 1
                set of A2, rest 60–75s, and repeat for 3 rounds.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="font-bold text-amber-400 mb-1">
                3. Smart 5 lb Double Progression (Up to 55 lbs)
              </div>
              <p className="text-zinc-400">
                Because your dumbbells move in <strong>5 lb jumps</strong>, each exercise uses a
                target rep window (e.g., 8–12 reps). Keep the same weight across your 3 sets and add
                reps each workout until you hit the top number on all 3 sets—then the app
                automatically prompts you to add <strong>+5 lbs</strong>! Once you reach 55 lbs, it
                switches to tempo &amp; rep mastery.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2-Segment Toggle: A/B/C Plans vs Full Exercise Library */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
        <button
          type="button"
          onClick={() => setSubView('plans')}
          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            subView === 'plans'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/15'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          A / B / C Plans
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingPlan(null);
            setSubView('library');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            subView === 'library'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/15'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          All Exercises ({exercises.length})
        </button>
      </div>

      {subView === 'plans' ? (
        <>
          {/* Workout A / B / C Tab Selector */}
          <div className="grid grid-cols-3 gap-2">
            {plans.map((p) => {
              const isSelected = activePlan?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setEditingPlan(null);
                    setSelectedPlanId(p.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-zinc-100 shadow-lg shadow-emerald-500/10'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${
                        isSelected
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      PLAN {p.code}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {p.estimatedMinutes}m
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-2 line-clamp-1">
                    {p.name.replace(/^Workout [A-C] — /, '')}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {p.exercises.length} exercises •{' '}
                    {p.exercises.reduce((s, e) => s + e.targetSets, 0)} sets
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Plan Card */}
          {activePlan && (
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-100">{activePlan.name}</h2>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                      {activePlan.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {editingPlan ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingPlan(null)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save Plan
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(activePlan)}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Customize
                        </button>
                        <button
                          type="button"
                          onClick={() => onStartPlan(activePlan)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  {activePlan.description}
                </p>
              </div>

              {/* Exercise Slots List */}
              <div className="p-3.5 space-y-2.5">
                {activePlan.exercises.map((slot, idx) => {
                  const def = getExDef(slot.exerciseId);
                  const prog = getProgressionForExercise(slot, def, logs);
                  const imgPath = getExerciseImagePath(def);

                  return (
                    <div
                      key={slot.slotId || idx}
                      onClick={() => {
                        if (!editingPlan && def) {
                          setInspectTarget({ exercise: def, slot, progression: prog });
                        }
                      }}
                      className={`p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 space-y-2.5 ${
                        !editingPlan
                          ? 'hover:border-emerald-500/40 transition cursor-pointer'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        {!editingPlan && (
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center mt-0.5">
                            {imgPath ? (
                              <img
                                src={imgPath}
                                alt={def?.name || slot.exerciseId}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Dumbbell className="w-4 h-4 text-emerald-400/70" />
                            )}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {slot.supersetTag && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {slot.supersetTag}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-800 text-zinc-300">
                              {def?.primaryMuscle || 'Upper Body'}
                            </span>
                            {def?.benchAngle && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-900 text-amber-300 border border-amber-500/20">
                                {def.benchAngle}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-zinc-100 mt-1">
                            {def?.name || slot.exerciseId}
                          </h3>
                        </div>

                        {editingPlan ? (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(idx, -1)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(idx, 1)}
                              disabled={idx === activePlan.exercises.length - 1}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(idx)}
                              className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-extrabold text-zinc-200">
                              {slot.targetSets} sets × {slot.repRangeMin}–{slot.repRangeMax}
                            </div>
                            <div className="text-[11px] text-zinc-500">Rest {slot.restSeconds}s</div>
                          </div>
                        )}
                      </div>

                      {/* Next Session Smart Target & Visuals Pill */}
                      {!editingPlan && (
                        <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-zinc-900">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 truncate">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span className="truncate">{prog.badgeText}</span>
                          </span>
                          {def && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectTarget({ exercise: def, slot, progression: prog });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-[11px] font-bold text-zinc-200 flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Info className="w-3 h-3 text-emerald-400" />
                              Form &amp; Visuals
                            </button>
                          )}
                        </div>
                      )}

                      {/* Edit Controls when in Customize Mode */}
                      {editingPlan && (
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800 text-xs">
                          <div>
                            <label className="block text-[10px] text-zinc-500 uppercase">Pair</label>
                            <input
                              type="text"
                              value={slot.supersetTag || ''}
                              onChange={(e) =>
                                handleUpdateSlot(idx, { supersetTag: e.target.value.toUpperCase() })
                              }
                              className="w-full mt-0.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-bold text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 uppercase">Sets</label>
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={slot.targetSets}
                              onChange={(e) =>
                                handleUpdateSlot(idx, {
                                  targetSets: Math.max(1, parseInt(e.target.value, 10) || 3)
                                })
                              }
                              className="w-full mt-0.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-mono font-bold text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 uppercase">
                              Min–Max Reps
                            </label>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                min={1}
                                max={30}
                                value={slot.repRangeMin}
                                onChange={(e) =>
                                  handleUpdateSlot(idx, {
                                    repRangeMin: Math.max(1, parseInt(e.target.value, 10) || 8)
                                  })
                                }
                                className="w-1/2 px-1 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-mono font-bold text-zinc-100"
                              />
                              <input
                                type="number"
                                min={1}
                                max={30}
                                value={slot.repRangeMax}
                                onChange={(e) =>
                                  handleUpdateSlot(idx, {
                                    repRangeMax: Math.max(1, parseInt(e.target.value, 10) || 12)
                                  })
                                }
                                className="w-1/2 px-1 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-mono font-bold text-zinc-100"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 uppercase">
                              Rest (s)
                            </label>
                            <input
                              type="number"
                              step={15}
                              min={15}
                              max={240}
                              value={slot.restSeconds}
                              onChange={(e) =>
                                handleUpdateSlot(idx, {
                                  restSeconds: Math.max(15, parseInt(e.target.value, 10) || 60)
                                })
                              }
                              className="w-full mt-0.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-mono font-bold text-zinc-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {editingPlan && (
                  <button
                    type="button"
                    onClick={() => setShowAddSlotModal(true)}
                    className="w-full py-3 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Exercise to {editingPlan.name}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Full Exercise Library Browser View */
        <div className="space-y-3">
          {/* Muscle Group Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['All', 'Biceps', 'Triceps', 'Shoulders', 'Back', 'Chest', 'Traps'] as const).map(
              (group) => {
                const active = muscleFilter === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setMuscleFilter(group)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {group}
                  </button>
                );
              }
            )}
          </div>

          <div className="space-y-2.5">
            {exercises
              .filter((ex) => muscleFilter === 'All' || ex.primaryMuscle === muscleFilter)
              .map((ex) => {
                const imgPath = getExerciseImagePath(ex);
                const defaultSlot: PlanExerciseSlot = {
                  slotId: `lib-${ex.id}`,
                  exerciseId: ex.id,
                  targetSets: 3,
                  repRangeMin: ex.repRangeMin,
                  repRangeMax: ex.repRangeMax,
                  restSeconds: ex.defaultRestSeconds
                };
                const prog = getProgressionForExercise(defaultSlot, ex, logs);

                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setInspectTarget({ exercise: ex, progression: prog })}
                    className="w-full text-left p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/40 transition flex items-start gap-3 cursor-pointer"
                  >
                    <div className="w-24 h-14 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 flex items-center justify-center">
                      {imgPath ? (
                        <img
                          src={imgPath}
                          alt={ex.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Dumbbell className="w-5 h-5 text-emerald-400/70" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {ex.primaryMuscle}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-amber-300">
                          {ex.benchAngle}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {ex.repRangeMin}–{ex.repRangeMax} reps
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-100 mt-1 truncate">{ex.name}</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {ex.whyItWorks}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Footer Actions: Create Custom Exercise & Reset Default Plans */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => setShowNewExerciseModal(true)}
          className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
          + Create Custom Exercise ({exercises.length} in library)
        </button>

        <button
          type="button"
          onClick={onResetDefaultPlans}
          className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Plans to Default A/B/C
        </button>
      </div>

      {/* Add Exercise to Plan Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                Choose Exercise to Add
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSlotModal(false)}
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
                  onClick={() => handleAddSlotToPlan(def)}
                  className="w-full text-left p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-emerald-400">
                      {def.primaryMuscle} • {def.benchAngle}
                    </div>
                    <div className="text-sm font-bold text-zinc-100">{def.name}</div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Custom Exercise Modal */}
      {showNewExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomExercise}
            className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700 p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                Create Custom Upper-Body Exercise
              </h3>
              <button
                type="button"
                onClick={() => setShowNewExerciseModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Exercise Name
              </label>
              <input
                type="text"
                required
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="e.g., Cross-Body Pinwheel Curl"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Primary Muscle
                </label>
                <select
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Bench / Stance
                </label>
                <select
                  value={newExBench}
                  onChange={(e) => setNewExBench(e.target.value as BenchAngle)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                >
                  {BENCH_ANGLES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Start Weight
                </label>
                <input
                  type="number"
                  step={5}
                  min={0}
                  max={55}
                  value={newExStartWeight}
                  onChange={(e) => setNewExStartWeight(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Min Reps
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newExRepMin}
                  onChange={(e) => setNewExRepMin(parseInt(e.target.value, 10) || 8)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Max Reps
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newExRepMax}
                  onChange={(e) => setNewExRepMax(parseInt(e.target.value, 10) || 12)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Equipment
              </label>
              <select
                value={newExEquip}
                onChange={(e) => setNewExEquip(e.target.value as EquipmentType)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              >
                {EQUIPMENT_TYPES.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Coaching / Setup Cue
              </label>
              <input
                type="text"
                value={newExCue}
                onChange={(e) => setNewExCue(e.target.value)}
                placeholder="e.g., Keep elbows pinned and squeeze for 1s at the top"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Exercise to Library
            </button>
          </form>
        </div>
      )}
      {/* Exercise Detail & Visual Overview Modal */}
      {inspectTarget && (
        <ExerciseDetailModal
          exercise={inspectTarget.exercise}
          slot={inspectTarget.slot}
          progression={inspectTarget.progression}
          onClose={() => setInspectTarget(null)}
        />
      )}
    </div>
  );
};
