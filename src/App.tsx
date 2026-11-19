import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cloud,
  CloudOff,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Play,
  Sparkles,
  Trophy
} from 'lucide-react';
import { DEFAULT_WORKOUT_PLANS } from './data/defaultPlans';
import { getExerciseImagePath } from './data/exerciseMedia';
import {
  ActiveWorkoutDraft,
  ExerciseDefinition,
  LoggedExercise,
  PlanExerciseSlot,
  ProgressionRecommendation,
  SupabaseConfig,
  WorkoutLog,
  WorkoutPlan
} from './types/workout';
import {
  deleteLogFromSupabase,
  loadActiveDraft,
  loadExercises,
  loadLogs,
  loadPlans,
  loadSupabaseConfig,
  pushPlansToSupabase,
  pushSingleLogToSupabase,
  saveActiveDraft,
  saveExercises,
  saveLogs,
  savePlans,
  saveSupabaseConfig,
  SyncResult,
  syncWithSupabase
} from './services/storage';
import {
  evaluateAndMarkPRs,
  getNextPlanInRotation,
  getProgressionForExercise
} from './utils/progression';
import { ActiveWorkoutLogger } from './components/ActiveWorkoutLogger';
import { PlansAndGuideView } from './components/PlansAndGuideView';
import { AnalyticsAndHistoryView } from './components/AnalyticsAndHistoryView';
import { SupabaseSyncView } from './components/SupabaseSyncView';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';

type NavTab = 'train' | 'plans' | 'analytics' | 'sync';

interface InspectTarget {
  exercise: ExerciseDefinition;
  slot?: PlanExerciseSlot;
  progression?: ProgressionRecommendation;
}

export const App: React.FC = () => {
  const [plans, setPlans] = useState<WorkoutPlan[]>(() => loadPlans());
  const [exercises, setExercises] = useState<ExerciseDefinition[]>(() => loadExercises());
  const [logs, setLogs] = useState<WorkoutLog[]>(() => loadLogs());
  const [activeDraft, setActiveDraft] = useState<ActiveWorkoutDraft | null>(() =>
    loadActiveDraft()
  );
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() =>
    loadSupabaseConfig()
  );
  const [syncStatus, setSyncStatus] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('train');
  const [justCompletedLog, setJustCompletedLog] = useState<WorkoutLog | null>(null);
  const [inspectTarget, setInspectTarget] = useState<InspectTarget | null>(null);

  // Recommended next plan in the A -> B -> C rotation
  const recommendedNextPlan = useMemo(
    () => getNextPlanInRotation(plans, logs),
    [plans, logs]
  );

  const [selectedPreviewPlanId, setSelectedPreviewPlanId] = useState<string>(
    () => recommendedNextPlan?.id || plans[0]?.id || 'plan-upper-a'
  );

  // Update preview plan whenever rotation advances after finishing a workout
  useEffect(() => {
    if (recommendedNextPlan) {
      setSelectedPreviewPlanId(recommendedNextPlan.id);
    }
  }, [recommendedNextPlan]);

  // Auto-sync on initial boot if Supabase is configured
  useEffect(() => {
    const cfg = loadSupabaseConfig();
    if (cfg.enabled && cfg.url && cfg.anonKey) {
      void handleRunSync(plans, logs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunSync = async (currentPlans = plans, currentLogs = logs) => {
    setIsSyncing(true);
    const { result, mergedPlans, mergedLogs } = await syncWithSupabase(
      currentPlans,
      currentLogs
    );
    setPlans(mergedPlans);
    setLogs(mergedLogs);
    setSyncStatus(result);
    setSupabaseConfig(loadSupabaseConfig());
    setIsSyncing(false);
  };

  const handleSaveSupabaseConfig = async (newConfig: SupabaseConfig) => {
    saveSupabaseConfig(newConfig);
    setSupabaseConfig(newConfig);
    if (newConfig.enabled) {
      await handleRunSync(plans, logs);
    } else {
      setSyncStatus({
        ok: false,
        message: 'Switched to Local Offline Mode.'
      });
    }
  };

  // Build and launch a new ActiveWorkoutDraft from any WorkoutPlan with Double Progression prefill
  const handleStartWorkoutFromPlan = (plan: WorkoutPlan) => {
    const loggedExercises: LoggedExercise[] = plan.exercises.map((slot) => {
      const def = exercises.find((e) => e.id === slot.exerciseId);
      const prog = getProgressionForExercise(slot, def, logs);

      return {
        exerciseId: slot.exerciseId,
        exerciseName: def?.name || slot.exerciseId,
        primaryMuscle: def?.primaryMuscle || 'Biceps',
        supersetTag: slot.supersetTag,
        repRangeMin: slot.repRangeMin,
        repRangeMax: slot.repRangeMax,
        sets: Array.from({ length: slot.targetSets }, (_, i) => ({
          setNumber: i + 1,
          weightLbs: prog.recommendedWeightLbs,
          reps: prog.recommendedReps,
          completed: false
        }))
      };
    });

    const newDraft: ActiveWorkoutDraft = {
      id: `log-${Date.now()}`,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      startedAt: new Date().toISOString(),
      exercises: loggedExercises,
      notes: ''
    };

    setActiveDraft(newDraft);
    saveActiveDraft(newDraft);
    setActiveTab('train');
  };

  const handleUpdateDraft = (updated: ActiveWorkoutDraft) => {
    setActiveDraft(updated);
    saveActiveDraft(updated);
  };

  const handleDiscardWorkout = () => {
    setActiveDraft(null);
    saveActiveDraft(null);
  };

  const handleFinishWorkout = async (
    finalDraft: ActiveWorkoutDraft,
    elapsedSeconds: number
  ) => {
    const { exercisesWithPRs, totalPRsCount } = evaluateAndMarkPRs(
      finalDraft.exercises,
      logs
    );

    const normalizedExercises: LoggedExercise[] = exercisesWithPRs.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        weightLbs: s.weightLbs ?? 0
      }))
    }));

    const completedSetsCount = normalizedExercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed && s.reps > 0).length,
      0
    );

    const totalVolumeLbs = normalizedExercises.reduce(
      (sum, ex) =>
        sum +
        ex.sets
          .filter((s) => s.completed && s.reps > 0)
          .reduce((sAcc, s) => {
            const w = s.weightLbs ?? 0;
            return sAcc + (w > 0 ? w : 0) * s.reps;
          }, 0),
      0
    );

    const nowIso = new Date().toISOString();
    const completedLog: WorkoutLog = {
      id: finalDraft.id,
      planId: finalDraft.planId,
      planCode: finalDraft.planCode,
      planName: finalDraft.planName,
      startedAt: finalDraft.startedAt,
      completedAt: nowIso,
      durationSeconds: elapsedSeconds,
      totalVolumeLbs,
      totalSets: completedSetsCount,
      prsAchieved: totalPRsCount,
      notes: finalDraft.notes.trim() || undefined,
      exercises: normalizedExercises,
      updatedAt: nowIso
    };

    const nextLogs = [completedLog, ...logs];
    setLogs(nextLogs);
    saveLogs(nextLogs);
    setActiveDraft(null);
    saveActiveDraft(null);
    setJustCompletedLog(completedLog);

    if (supabaseConfig.enabled) {
      const pushed = await pushSingleLogToSupabase(completedLog);
      if (pushed) {
        setSupabaseConfig(loadSupabaseConfig());
      }
    }
  };

  const handleDeleteLog = async (logId: string) => {
    const nextLogs = logs.filter((l) => l.id !== logId);
    setLogs(nextLogs);
    saveLogs(nextLogs);
    if (supabaseConfig.enabled) {
      await deleteLogFromSupabase(logId);
    }
  };

  const handleSavePlan = async (updatedPlan: WorkoutPlan) => {
    const nextPlans = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    setPlans(nextPlans);
    savePlans(nextPlans);
    if (supabaseConfig.enabled) {
      await pushPlansToSupabase(nextPlans);
    }
  };

  const handleResetDefaultPlans = async () => {
    setPlans(DEFAULT_WORKOUT_PLANS);
    savePlans(DEFAULT_WORKOUT_PLANS);
    if (supabaseConfig.enabled) {
      await pushPlansToSupabase(DEFAULT_WORKOUT_PLANS);
    }
  };

  const handleAddCustomExercise = (newExercise: ExerciseDefinition) => {
    const next = [...exercises, newExercise];
    setExercises(next);
    saveExercises(next);
  };

  const handleImportBackup = (importedPlans: WorkoutPlan[], importedLogs: WorkoutLog[]) => {
    setPlans(importedPlans);
    savePlans(importedPlans);
    setLogs(importedLogs);
    saveLogs(importedLogs);
    if (supabaseConfig.enabled) {
      void handleRunSync(importedPlans, importedLogs);
    }
  };

  // Workouts completed in the past 7 days
  const workoutsLast7Days = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return logs.filter((l) => new Date(l.completedAt).getTime() >= sevenDaysAgo).length;
  }, [logs]);

  const previewPlan =
    plans.find((p) => p.id === selectedPreviewPlanId) ||
    recommendedNextPlan ||
    plans[0];

  // If a workout is currently active and user is on 'train' tab, render full-screen Gym Mode logger
  if (activeDraft && activeTab === 'train') {
    const activePlanObj = plans.find((p) => p.id === activeDraft.planId);
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <ActiveWorkoutLogger
          draft={activeDraft}
          plan={activePlanObj}
          exercises={exercises}
          logs={logs}
          onUpdateDraft={handleUpdateDraft}
          onFinishWorkout={handleFinishWorkout}
          onDiscardWorkout={handleDiscardWorkout}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-sm text-zinc-100">
                  IRON 55
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-emerald-400">
                  5–55 LBS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Upper Body Strength, Power &amp; Mass
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeDraft && (
              <button
                type="button"
                onClick={() => setActiveTab('train')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-extrabold animate-pulse cursor-pointer"
              >
                Resume Live Workout
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                supabaseConfig.enabled
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
              title="Supabase Sync Status"
            >
              {supabaseConfig.enabled ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Synced</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Local</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content by Tab */}
      {activeTab === 'train' && (
        <main className="max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
          {/* Weekly 2-3x Target & Equipment Status Strip */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                7-Day Frequency (Goal: 2–3x / week)
              </div>
              <div className="text-sm font-extrabold text-zinc-100 mt-0.5">
                {workoutsLast7Days === 0
                  ? 'Ready for Session #1 this week'
                  : `${workoutsLast7Days} of 3 sessions completed (Last 7 days)`}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((slot) => (
                <div
                  key={slot}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold border ${
                    workoutsLast7Days >= slot
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                      : 'bg-zinc-950 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>

          {/* Up Next in Rotation Hero Card */}
          {previewPlan && (
            <div className="rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-900/90 border border-emerald-500/35 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-zinc-800/90">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-zinc-950">
                      {previewPlan.id === recommendedNextPlan?.id
                        ? `UP NEXT • WORKOUT ${previewPlan.code}`
                        : `PREVIEW • WORKOUT ${previewPlan.code}`}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-zinc-300 bg-zinc-800">
                      <Clock className="w-3 h-3 text-emerald-400" />~{previewPlan.estimatedMinutes}{' '}
                      min
                    </span>
                  </div>

                  {/* Quick A / B / C Switcher Pills */}
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    {plans.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPreviewPlanId(p.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                          previewPlan.id === p.id
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {p.code}
                      </button>
                    ))}
                  </div>
                </div>

                <h1 className="text-lg font-extrabold text-zinc-100 leading-snug">
                  {previewPlan.name}
                </h1>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                  {previewPlan.subtitle}
                </p>

                {/* Focus Muscle Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {previewPlan.focusMuscles.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-800/90 text-zinc-300"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                {/* Big Start Workout CTA */}
                <button
                  type="button"
                  onClick={() => handleStartWorkoutFromPlan(previewPlan)}
                  className="mt-4 w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Workout {previewPlan.code} ({previewPlan.exercises.length} Exercises •{' '}
                  {previewPlan.exercises.reduce((s, e) => s + e.targetSets, 0)} Sets)
                </button>
              </div>

              {/* Today's Lineup & Smart Targets Preview */}
              <div className="p-3.5 space-y-2 bg-zinc-950/40">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Today&apos;s Lineup &amp; Smart Targets
                  </span>
                  <span className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Tap any exercise for visuals &amp; cues
                  </span>
                </div>

                {previewPlan.exercises.map((slot, idx) => {
                  const def = exercises.find((e) => e.id === slot.exerciseId);
                  const prog = getProgressionForExercise(slot, def, logs);
                  const imgPath = getExerciseImagePath(def);

                  return (
                    <button
                      key={slot.slotId || idx}
                      type="button"
                      onClick={() => {
                        if (def) {
                          setInspectTarget({ exercise: def, slot, progression: prog });
                        }
                      }}
                      className="w-full text-left p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/80 border border-zinc-800/90 hover:border-emerald-500/40 active:scale-[0.99] transition flex items-center justify-between gap-2.5 cursor-pointer group"
                    >
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 flex items-center justify-center">
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

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {slot.supersetTag && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {slot.supersetTag}
                            </span>
                          )}
                          <span className="text-xs font-bold text-zinc-100 truncate">
                            {def?.name || slot.exerciseId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 truncate">
                          <span>{def?.primaryMuscle}</span>
                          <span>•</span>
                          <span className="text-amber-300/90 truncate">{def?.benchAngle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-xs font-mono font-extrabold flex items-center justify-end gap-1 ${
                              prog.action === 'INCREASE_WEIGHT'
                                ? 'text-emerald-400'
                                : prog.action === 'MASTERY_AT_55'
                                ? 'text-amber-400'
                                : prog.recommendedWeightLbs === null
                                ? 'text-amber-300'
                                : 'text-sky-400'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {prog.recommendedWeightLbs === null
                              ? 'Pick weight'
                              : prog.recommendedWeightLbs > 0
                              ? `${prog.recommendedWeightLbs} lbs × ${prog.recommendedReps}`
                              : `BW × ${prog.recommendedReps}`}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {slot.targetSets} sets ({slot.repRangeMin}–{slot.repRangeMax})
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {activeTab === 'plans' && (
        <PlansAndGuideView
          plans={plans}
          exercises={exercises}
          logs={logs}
          onStartPlan={handleStartWorkoutFromPlan}
          onSavePlan={handleSavePlan}
          onResetDefaultPlans={handleResetDefaultPlans}
          onAddCustomExercise={handleAddCustomExercise}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsAndHistoryView
          logs={logs}
          exercises={exercises}
          onDeleteLog={handleDeleteLog}
        />
      )}

      {activeTab === 'sync' && (
        <SupabaseSyncView
          config={supabaseConfig}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          plans={plans}
          logs={logs}
          onSaveConfigAndSync={handleSaveSupabaseConfig}
          onTriggerSync={() => handleRunSync(plans, logs)}
          onImportBackup={handleImportBackup}
        />
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

      {/* Post-Workout Celebration Summary Modal */}
      {justCompletedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-emerald-500/50 p-5 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                WORKOUT {justCompletedLog.planCode} COMPLETE
              </span>
              <h2 className="text-lg font-extrabold text-zinc-100 mt-0.5">
                {justCompletedLog.planName}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase">Duration</div>
                <div className="text-sm font-mono font-extrabold text-zinc-100 mt-0.5">
                  {Math.max(1, Math.round(justCompletedLog.durationSeconds / 60))}m
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase">Sets</div>
                <div className="text-sm font-mono font-extrabold text-zinc-100 mt-0.5">
                  {justCompletedLog.totalSets}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase">Volume</div>
                <div className="text-sm font-mono font-extrabold text-emerald-400 mt-0.5">
                  {justCompletedLog.totalVolumeLbs.toLocaleString()} lb
                </div>
              </div>
            </div>

            {justCompletedLog.prsAchieved > 0 && (
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4" />
                You set {justCompletedLog.prsAchieved} new Personal Record
                {justCompletedLog.prsAchieved > 1 ? 's' : ''}!
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setJustCompletedLog(null);
                setActiveTab('analytics');
              }}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm cursor-pointer"
            >
              View Progress &amp; Logbook
            </button>
          </div>
        </div>
      )}

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 px-2 py-2">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('train')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === 'train'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Train</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>A/B/C Plans</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Progress</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Supabase</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
