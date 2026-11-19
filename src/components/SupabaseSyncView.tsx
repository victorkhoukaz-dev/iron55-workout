import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Database,
  Download,
  RefreshCw,
  Smartphone,
  Upload
} from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../data/supabaseSql';
import { SyncResult } from '../services/storage';
import { SupabaseConfig, WorkoutLog, WorkoutPlan } from '../types/workout';

interface SupabaseSyncViewProps {
  config: SupabaseConfig;
  syncStatus: SyncResult | null;
  isSyncing: boolean;
  plans: WorkoutPlan[];
  logs: WorkoutLog[];
  onSaveConfigAndSync: (newConfig: SupabaseConfig) => Promise<void>;
  onTriggerSync: () => Promise<void>;
  onImportBackup: (plans: WorkoutPlan[], logs: WorkoutLog[]) => void;
}

export const SupabaseSyncView: React.FC<SupabaseSyncViewProps> = ({
  config,
  syncStatus,
  isSyncing,
  plans,
  logs,
  onSaveConfigAndSync,
  onTriggerSync,
  onImportBackup
}) => {
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveConfigAndSync({
      url: url.trim(),
      anonKey: anonKey.trim(),
      enabled: Boolean(url.trim() && anonKey.trim()),
      lastSyncedAt: config.lastSyncedAt
    });
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'IRON 55 Upper Body Dumbbell Tracker',
      plans,
      logs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `iron55-workout-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(dlUrl);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.plans) && Array.isArray(parsed.logs)) {
          onImportBackup(parsed.plans, parsed.logs);
          setImportMsg(
            `Imported ${parsed.plans.length} plans and ${parsed.logs.length} workout logs.`
          );
        } else {
          setImportMsg('Invalid backup file format.');
        }
      } catch {
        setImportMsg('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* Status Banner */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                config.enabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {config.enabled ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-base font-extrabold text-zinc-100">
                Supabase Cloud &amp; Offline Sync
              </h1>
              <p className="text-xs text-zinc-400">
                {config.enabled
                  ? 'Connected • Auto-syncs workouts between your Phone & PC'
                  : 'Local Offline Mode active • Connect Supabase below for cloud sync'}
              </p>
            </div>
          </div>

          {config.enabled && (
            <button
              type="button"
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>

        {config.lastSyncedAt && (
          <div className="text-[11px] text-zinc-500 font-mono">
            Last cloud sync: {new Date(config.lastSyncedAt).toLocaleString()}
          </div>
        )}

        {syncStatus && (
          <div
            className={`p-3 rounded-2xl text-xs border flex items-start gap-2 ${
              syncStatus.ok
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            {syncStatus.ok ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold">{syncStatus.message}</div>
              {syncStatus.needsSchemaSetup && (
                <button
                  type="button"
                  onClick={() => setShowSql(true)}
                  className="underline font-bold text-amber-300 cursor-pointer"
                >
                  Open SQL Schema below to create the tables in 10 seconds →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Supabase Credentials Form */}
      <form
        onSubmit={handleSave}
        className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-400" />
            Supabase Project Credentials
          </h2>
          <button
            type="button"
            onClick={() => setShowSql((v) => !v)}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            {showSql ? 'Hide SQL Schema' : 'View SQL Setup Script'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1">
            Project URL (Project Settings → API)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-project-id.supabase.co"
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1">
            Anon / Public Key
          </label>
          <input
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSyncing}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15 cursor-pointer"
        >
          <Cloud className="w-4 h-4" />
          Save Credentials &amp; Sync with Supabase
        </button>

        {showSql && (
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">
                Paste in Supabase → SQL Editor → New Query → Run
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy SQL
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-64">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        )}
      </form>

      {/* Phone Installation Guide (PWA) */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
        <h2 className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-sky-400" />
          Use on Your Phone (Home Screen App)
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Open this app URL on your phone while on the same Wi-Fi (or once deployed to Vercel/Netlify)
          and tap <strong className="text-zinc-200">Share → Add to Home Screen</strong> (iPhone) or{' '}
          <strong className="text-zinc-200">Menu → Install App</strong> (Android). It runs
          full-screen like a native app and caches your workouts locally even if signal drops.
        </p>
      </div>

      {/* Local JSON Export / Import Backup */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h2 className="text-sm font-extrabold text-zinc-100">Local File Backup (JSON)</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export JSON
          </button>
          <label className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
        {importMsg && <p className="text-xs text-emerald-400 font-medium">{importMsg}</p>}
      </div>
    </div>
  );
};
