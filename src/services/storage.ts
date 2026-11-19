import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_EXERCISES, DEFAULT_WORKOUT_PLANS } from '../data/defaultPlans';
import {
  ActiveWorkoutDraft,
  ExerciseDefinition,
  SupabaseConfig,
  WorkoutLog,
  WorkoutPlan
} from '../types/workout';

const KEYS = {
  PLANS: 'iron55_plans_v1',
  EXERCISES: 'iron55_exercises_v1',
  LOGS: 'iron55_logs_v1',
  DRAFT: 'iron55_active_draft_v1',
  SUPABASE: 'iron55_supabase_config_v1'
};

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

const DEFAULT_PROJECT_URL = 'https://ixxdrfghthewkigyvdts.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_a4pVptFseZ7E9KVhwTnDuw_OJvktuHe';

export function loadSupabaseConfig(): SupabaseConfig {
  const envUrl =
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL ||
    DEFAULT_PROJECT_URL;
  const envKey =
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_PUBLISHABLE_KEY;

  try {
    const raw = localStorage.getItem(KEYS.SUPABASE);
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseConfig;
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        enabled:
          Boolean(parsed.url || envUrl) &&
          Boolean(parsed.anonKey || envKey) &&
          parsed.enabled !== false,
        lastSyncedAt: parsed.lastSyncedAt
      };
    }
  } catch (err) {
    console.warn('Failed to read Supabase config from localStorage:', err);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    enabled: Boolean(envUrl && envKey)
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(KEYS.SUPABASE, JSON.stringify(config));
  cachedClient = null;
  cachedConfigKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = loadSupabaseConfig();
  if (!cfg.enabled || !cfg.url.trim() || !cfg.anonKey.trim()) {
    return null;
  }
  const key = `${cfg.url.trim()}::${cfg.anonKey.trim()}`;
  if (cachedClient && cachedConfigKey === key) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(cfg.url.trim(), cfg.anonKey.trim());
    cachedConfigKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Invalid Supabase client configuration:', err);
    return null;
  }
}

// ==================== LOCAL STORAGE CRUD ====================

export function loadPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(KEYS.PLANS);
    if (!raw) {
      localStorage.setItem(KEYS.PLANS, JSON.stringify(DEFAULT_WORKOUT_PLANS));
      return DEFAULT_WORKOUT_PLANS;
    }
    const parsed = JSON.parse(raw) as WorkoutPlan[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEYS.PLANS, JSON.stringify(DEFAULT_WORKOUT_PLANS));
      return DEFAULT_WORKOUT_PLANS;
    }
    return parsed.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return DEFAULT_WORKOUT_PLANS;
  }
}

export function savePlans(plans: WorkoutPlan[]): void {
  localStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
}

export function loadExercises(): ExerciseDefinition[] {
  try {
    const raw = localStorage.getItem(KEYS.EXERCISES);
    if (!raw) {
      localStorage.setItem(KEYS.EXERCISES, JSON.stringify(DEFAULT_EXERCISES));
      return DEFAULT_EXERCISES;
    }
    const parsed = JSON.parse(raw) as ExerciseDefinition[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEYS.EXERCISES, JSON.stringify(DEFAULT_EXERCISES));
      return DEFAULT_EXERCISES;
    }
    // Merge any newly added default exercises or updated built-in metadata (e.g. imagePath, cues)
    const defaultById = new Map(DEFAULT_EXERCISES.map((d) => [d.id, d]));
    let changed = false;
    const merged = parsed.map((savedEx) => {
      const def = defaultById.get(savedEx.id);
      if (!def) return savedEx;
      const needsSync =
        (def.imagePath && savedEx.imagePath !== def.imagePath) ||
        (!savedEx.whyItWorks && def.whyItWorks) ||
        (!savedEx.setupCues?.length && def.setupCues.length > 0) ||
        (!savedEx.executionCues?.length && def.executionCues.length > 0);
      if (!needsSync) return savedEx;
      changed = true;
      return {
        ...savedEx,
        imagePath: def.imagePath || savedEx.imagePath,
        whyItWorks: savedEx.whyItWorks || def.whyItWorks,
        setupCues: savedEx.setupCues?.length ? savedEx.setupCues : def.setupCues,
        executionCues: savedEx.executionCues?.length ? savedEx.executionCues : def.executionCues
      };
    });

    const existingIds = new Set(merged.map((e) => e.id));
    for (const def of DEFAULT_EXERCISES) {
      if (!existingIds.has(def.id)) {
        merged.push(def);
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(KEYS.EXERCISES, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return DEFAULT_EXERCISES;
  }
}

export function saveExercises(exercises: ExerciseDefinition[]): void {
  localStorage.setItem(KEYS.EXERCISES, JSON.stringify(exercises));
}

export function loadLogs(): WorkoutLog[] {
  try {
    const raw = localStorage.getItem(KEYS.LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkoutLog[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveLogs(logs: WorkoutLog[]): void {
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

export function loadActiveDraft(): ActiveWorkoutDraft | null {
  try {
    const raw = localStorage.getItem(KEYS.DRAFT);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveWorkoutDraft;
  } catch {
    return null;
  }
}

export function saveActiveDraft(draft: ActiveWorkoutDraft | null): void {
  if (!draft) {
    localStorage.removeItem(KEYS.DRAFT);
  } else {
    localStorage.setItem(KEYS.DRAFT, JSON.stringify(draft));
  }
}

// ==================== SUPABASE CLOUD MAPPERS ====================

interface DbPlanRow {
  id: string;
  code: 'A' | 'B' | 'C' | 'CUSTOM';
  name: string;
  subtitle: string;
  estimated_minutes: number;
  focus_muscles: WorkoutPlan['focusMuscles'];
  description: string;
  exercises: WorkoutPlan['exercises'];
  sort_order: number;
  updated_at: string;
}

interface DbLogRow {
  id: string;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  total_volume_lbs: number;
  total_sets: number;
  prs_achieved: number;
  notes?: string;
  exercises: WorkoutLog['exercises'];
  updated_at: string;
}

function planToRow(plan: WorkoutPlan): DbPlanRow {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    subtitle: plan.subtitle,
    estimated_minutes: plan.estimatedMinutes,
    focus_muscles: plan.focusMuscles,
    description: plan.description,
    exercises: plan.exercises,
    sort_order: plan.sortOrder,
    updated_at: plan.updatedAt || new Date().toISOString()
  };
}

function rowToPlan(row: DbPlanRow): WorkoutPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    subtitle: row.subtitle,
    estimatedMinutes: Number(row.estimated_minutes) || 35,
    focusMuscles: Array.isArray(row.focus_muscles) ? row.focus_muscles : [],
    description: row.description || '',
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
    sortOrder: Number(row.sort_order) || 1,
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

function logToRow(log: WorkoutLog): DbLogRow {
  return {
    id: log.id,
    plan_id: log.planId,
    plan_code: log.planCode,
    plan_name: log.planName,
    started_at: log.startedAt,
    completed_at: log.completedAt,
    duration_seconds: log.durationSeconds,
    total_volume_lbs: log.totalVolumeLbs,
    total_sets: log.totalSets,
    prs_achieved: log.prsAchieved,
    notes: log.notes || '',
    exercises: log.exercises,
    updated_at: log.updatedAt || log.completedAt
  };
}

function rowToLog(row: DbLogRow): WorkoutLog {
  return {
    id: row.id,
    planId: row.plan_id,
    planCode: row.plan_code,
    planName: row.plan_name,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationSeconds: Number(row.duration_seconds) || 0,
    totalVolumeLbs: Number(row.total_volume_lbs) || 0,
    totalSets: Number(row.total_sets) || 0,
    prsAchieved: Number(row.prs_achieved) || 0,
    notes: row.notes || undefined,
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
    updatedAt: row.updated_at || row.completed_at
  };
}

// ==================== SUPABASE CLOUD OPERATIONS ====================

export interface SyncResult {
  ok: boolean;
  message: string;
  plansCount?: number;
  logsCount?: number;
  needsSchemaSetup?: boolean;
}

export async function syncWithSupabase(
  localPlans: WorkoutPlan[],
  localLogs: WorkoutLog[]
): Promise<{
  result: SyncResult;
  mergedPlans: WorkoutPlan[];
  mergedLogs: WorkoutLog[];
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      result: { ok: false, message: 'Supabase is not configured yet (running in Local Offline Mode).' },
      mergedPlans: localPlans,
      mergedLogs: localLogs
    };
  }

  try {
    // 1. Fetch remote plans
    const { data: remotePlanRows, error: planErr } = await client
      .from('workout_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (planErr) {
      const isMissingTable =
        planErr.code === '42P01' ||
        planErr.message.includes('relation') ||
        planErr.message.includes('does not exist') ||
        planErr.message.includes('schema cache');

      return {
        result: {
          ok: false,
          needsSchemaSetup: isMissingTable,
          message: isMissingTable
            ? 'Connected to Supabase, but tables do not exist yet. Run the SQL Schema in your Supabase SQL Editor.'
            : `Supabase error: ${planErr.message}`
        },
        mergedPlans: localPlans,
        mergedLogs: localLogs
      };
    }

    // 2. Fetch remote logs
    const { data: remoteLogRows, error: logErr } = await client
      .from('workout_logs')
      .select('*')
      .order('completed_at', { ascending: false });

    if (logErr) {
      return {
        result: { ok: false, message: `Error fetching workout_logs: ${logErr.message}` },
        mergedPlans: localPlans,
        mergedLogs: localLogs
      };
    }

    // Merge Plans by ID + updatedAt
    const planMap = new Map<string, WorkoutPlan>();
    for (const lp of localPlans) {
      planMap.set(lp.id, lp);
    }
    for (const rRow of (remotePlanRows || []) as DbPlanRow[]) {
      const rp = rowToPlan(rRow);
      const existing = planMap.get(rp.id);
      if (!existing || new Date(rp.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        planMap.set(rp.id, rp);
      }
    }
    const mergedPlans = Array.from(planMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);

    // Merge Logs by ID + updatedAt
    const logMap = new Map<string, WorkoutLog>();
    for (const ll of localLogs) {
      logMap.set(ll.id, ll);
    }
    for (const rRow of (remoteLogRows || []) as DbLogRow[]) {
      const rl = rowToLog(rRow);
      const existing = logMap.get(rl.id);
      if (!existing || new Date(rl.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        logMap.set(rl.id, rl);
      }
    }
    const mergedLogs = Array.from(logMap.values()).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    // Upsert merged data back to Supabase so both sides are identical
    if (mergedPlans.length > 0) {
      const { error: upsertPlanErr } = await client
        .from('workout_plans')
        .upsert(mergedPlans.map(planToRow), { onConflict: 'id' });
      if (upsertPlanErr) {
        return {
          result: { ok: false, message: `Failed to push plans: ${upsertPlanErr.message}` },
          mergedPlans,
          mergedLogs
        };
      }
    }

    if (mergedLogs.length > 0) {
      const { error: upsertLogErr } = await client
        .from('workout_logs')
        .upsert(mergedLogs.map(logToRow), { onConflict: 'id' });
      if (upsertLogErr) {
        return {
          result: { ok: false, message: `Failed to push logs: ${upsertLogErr.message}` },
          mergedPlans,
          mergedLogs
        };
      }
    }

    // Persist locally and update lastSyncedAt
    savePlans(mergedPlans);
    saveLogs(mergedLogs);
    const currentCfg = loadSupabaseConfig();
    const nowIso = new Date().toISOString();
    saveSupabaseConfig({ ...currentCfg, lastSyncedAt: nowIso });

    return {
      result: {
        ok: true,
        message: `Synced ${mergedPlans.length} plans & ${mergedLogs.length} workout logs with Supabase.`,
        plansCount: mergedPlans.length,
        logsCount: mergedLogs.length
      },
      mergedPlans,
      mergedLogs
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: { ok: false, message: `Network / Sync error: ${msg}` },
      mergedPlans: localPlans,
      mergedLogs: localLogs
    };
  }
}

export async function pushSingleLogToSupabase(log: WorkoutLog): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('workout_logs').upsert(logToRow(log), { onConflict: 'id' });
    if (!error) {
      const cfg = loadSupabaseConfig();
      saveSupabaseConfig({ ...cfg, lastSyncedAt: new Date().toISOString() });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function deleteLogFromSupabase(logId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('workout_logs').delete().eq('id', logId);
    return !error;
  } catch {
    return false;
  }
}

export async function pushPlansToSupabase(plans: WorkoutPlan[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('workout_plans')
      .upsert(plans.map(planToRow), { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}
