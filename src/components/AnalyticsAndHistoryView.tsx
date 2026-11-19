import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Trash2,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { ExerciseDefinition, WorkoutLog } from '../types/workout';
import { calculateEstimated1RM, getExerciseHistory } from '../utils/progression';

interface AnalyticsAndHistoryViewProps {
  logs: WorkoutLog[];
  exercises: ExerciseDefinition[];
  onDeleteLog: (logId: string) => void;
}

export const AnalyticsAndHistoryView: React.FC<AnalyticsAndHistoryViewProps> = ({
  logs,
  exercises,
  onDeleteLog
}) => {
  // Default selected exercise for chart: first exercise with logged history, or Incline Bench Press
  const exercisesWithHistory = useMemo(() => {
    const ids = new Set<string>();
    logs.forEach((l) =>
      l.exercises.forEach((ex) => {
        if (ex.sets.some((s) => s.completed && s.reps > 0)) {
          ids.add(ex.exerciseId);
        }
      })
    );
    return exercises.filter((e) => ids.has(e.id));
  }, [logs, exercises]);

  const [selectedExId, setSelectedExId] = useState<string>(
    () => exercisesWithHistory[0]?.id || exercises[0]?.id || 'ex-incline-db-bench-press'
  );
  const [expandedLogId, setExpandedLogId] = useState<string | null>(logs[0]?.id || null);

  const activeExId =
    exercisesWithHistory.some((e) => e.id === selectedExId) || logs.length === 0
      ? selectedExId
      : exercisesWithHistory[0]?.id || selectedExId;

  const historyPoints = useMemo(
    () => getExerciseHistory(activeExId, logs),
    [activeExId, logs]
  );

  // All-time Personal Records per exercise
  const personalRecords = useMemo(() => {
    const records: Array<{
      exerciseId: string;
      exerciseName: string;
      primaryMuscle: string;
      bestWeight: number;
      bestReps: number;
      estimated1RM: number;
      date: string;
    }> = [];

    for (const def of exercises) {
      const pts = getExerciseHistory(def.id, logs);
      if (pts.length === 0) continue;
      let top = pts[0];
      for (const p of pts) {
        if (p.estimated1RM >= top.estimated1RM) {
          top = p;
        }
      }
      records.push({
        exerciseId: def.id,
        exerciseName: def.name,
        primaryMuscle: def.primaryMuscle,
        bestWeight: top.maxWeightLbs,
        bestReps: top.bestSetReps,
        estimated1RM: top.estimated1RM,
        date: top.formattedDate
      });
    }

    return records.sort((a, b) => b.estimated1RM - a.estimated1RM);
  }, [exercises, logs]);

  // Summary metrics
  const totalVolumeAllTime = logs.reduce((sum, l) => sum + (l.totalVolumeLbs || 0), 0);
  const totalSetsAllTime = logs.reduce((sum, l) => sum + (l.totalSets || 0), 0);
  const avgDurationMins =
    logs.length > 0
      ? Math.round(
          logs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0) / logs.length / 60
        )
      : 0;

  // Max value for SVG bar chart scaling
  const maxChart1RM = Math.max(...historyPoints.map((p) => p.estimated1RM), 10);

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* Top Lifetime Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            Workouts
          </div>
          <div className="text-xl font-extrabold font-mono text-zinc-100 mt-1">
            {logs.length}
          </div>
          <div className="text-[10px] text-zinc-500">
            {avgDurationMins > 0 ? `Avg ${avgDurationMins} min` : 'Target 30–40m'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
            <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
            Total Lifted
          </div>
          <div className="text-xl font-extrabold font-mono text-zinc-100 mt-1">
            {totalVolumeAllTime >= 1000
              ? `${(totalVolumeAllTime / 1000).toFixed(1)}k`
              : totalVolumeAllTime}
          </div>
          <div className="text-[10px] text-zinc-500">{totalSetsAllTime} working sets</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Active PRs
          </div>
          <div className="text-xl font-extrabold font-mono text-zinc-100 mt-1">
            {personalRecords.length}
          </div>
          <div className="text-[10px] text-zinc-500">Tracked lifts</div>
        </div>
      </div>

      {/* Exercise Strength & Progression Chart Card */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              STRENGTH &amp; OVERLOAD PROGRESSION
            </span>
            <h2 className="text-base font-extrabold text-zinc-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Lift Progression Chart
            </h2>
          </div>
        </div>

        {/* Exercise Selector */}
        <select
          value={activeExId}
          onChange={(e) => setSelectedExId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
        >
          {exercises.map((ex) => {
            const hasData = exercisesWithHistory.some((h) => h.id === ex.id);
            return (
              <option key={ex.id} value={ex.id}>
                {hasData ? '★ ' : ''}
                {ex.name} ({ex.primaryMuscle})
              </option>
            );
          })}
        </select>

        {historyPoints.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80 px-4">
            <p className="text-xs text-zinc-400">
              No logged sets for this exercise yet. Complete a workout containing this lift to see
              your 1RM and weight progression chart!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Best Lift & Gain Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">
                  Latest Best Set
                </div>
                <div className="text-sm font-mono font-extrabold text-emerald-400 mt-0.5">
                  {historyPoints[historyPoints.length - 1].maxWeightLbs > 0
                    ? `${historyPoints[historyPoints.length - 1].maxWeightLbs} lbs`
                    : 'BW'}{' '}
                  × {historyPoints[historyPoints.length - 1].bestSetReps} reps
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">
                  Est. 1-Rep Max
                </div>
                <div className="text-sm font-mono font-extrabold text-sky-400 mt-0.5">
                  {historyPoints[historyPoints.length - 1].estimated1RM} lbs
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-end gap-2 h-32 pt-4 overflow-x-auto">
                {historyPoints.slice(-10).map((pt, idx) => {
                  const heightPct = Math.max(18, Math.round((pt.estimated1RM / maxChart1RM) * 100));
                  return (
                    <div
                      key={`${pt.date}-${idx}`}
                      className="flex-1 min-w-[38px] flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-[10px] font-mono font-bold text-emerald-300 mb-1">
                        {pt.maxWeightLbs > 0 ? `${pt.maxWeightLbs}×${pt.bestSetReps}` : `BW×${pt.bestSetReps}`}
                      </span>
                      <div
                        className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                        style={{ height: `${heightPct}%` }}
                        title={`${pt.formattedDate}: ${pt.setsSummary} (Est 1RM: ${pt.estimated1RM})`}
                      />
                      <span className="text-[9px] text-zinc-500 mt-1.5 truncate">
                        {pt.formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Personal Records Board */}
      {personalRecords.length > 0 && (
        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Personal Records (5–55 lb Dumbbells)
            </h2>
            <span className="text-[11px] text-zinc-500">Best Set &amp; Est. 1RM</span>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {personalRecords.slice(0, 8).map((pr) => (
              <div
                key={pr.exerciseId}
                className="py-2 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-zinc-200">{pr.exerciseName}</div>
                  <div className="text-[10px] text-zinc-500">
                    {pr.primaryMuscle} • {pr.date}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-extrabold text-amber-300">
                    {pr.bestWeight > 0 ? `${pr.bestWeight} lbs` : 'BW'} × {pr.bestReps}
                  </div>
                  {pr.bestWeight > 0 && (
                    <div className="text-[10px] text-zinc-500">1RM: {pr.estimated1RM} lb</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Workout Logs History */}
      <div className="space-y-2.5">
        <h2 className="text-sm font-extrabold text-zinc-200 px-1 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Completed Workout Logbook ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
            <p className="text-sm font-bold text-zinc-300">No workouts logged yet</p>
            <p className="text-xs text-zinc-500">
              Start Workout A from the Train tab to log your first upper-body session!
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const dateStr = new Date(log.completedAt).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const mins = Math.max(1, Math.round(log.durationSeconds / 60));

            return (
              <div
                key={log.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden"
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-zinc-800/40 transition"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        PLAN {log.planCode}
                      </span>
                      <span className="text-xs text-zinc-400">{dateStr}</span>
                      {log.prsAchieved > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {log.prsAchieved} PR{log.prsAchieved > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 mt-1">{log.planName}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {mins}m
                      </span>
                      <span>{log.totalSets} sets</span>
                      <span>{log.totalVolumeLbs.toLocaleString()} lbs vol</span>
                    </div>
                  </div>
                  <div className="text-zinc-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-zinc-800/80 bg-zinc-950/50 space-y-2.5 text-xs">
                    {log.exercises.map((ex, idx) => {
                      const doneSets = ex.sets.filter((s) => s.completed);
                      if (doneSets.length === 0) return null;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200">
                              {ex.supersetTag ? `[${ex.supersetTag}] ` : ''}
                              {ex.exerciseName}
                            </span>
                            <span className="text-[10px] text-zinc-500">{ex.primaryMuscle}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {doneSets.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className={`px-2 py-0.5 rounded-lg font-mono text-[11px] border ${
                                  s.isPR
                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                                }`}
                              >
                                #{sIdx + 1}: {s.weightLbs > 0 ? `${s.weightLbs}lb` : 'BW'} ×{' '}
                                {s.reps}
                                {s.isPR ? ' ★PR' : ''}
                                {s.weightLbs > 0
                                  ? ` (1RM ${calculateEstimated1RM(s.weightLbs, s.reps)})`
                                  : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {log.notes && (
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 italic">
                        &ldquo;{log.notes}&rdquo;
                      </div>
                    )}

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onDeleteLog(log.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Log
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
