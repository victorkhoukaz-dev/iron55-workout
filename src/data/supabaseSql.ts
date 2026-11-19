export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- IRON 55 — Personal Upper Body Dumbbell Workout App (Supabase Schema)
-- Run this once in your Supabase SQL Editor (New Query -> Run)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workout_plans (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL DEFAULT 35,
    focus_muscles JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exercise_library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_muscle TEXT NOT NULL,
    secondary_muscles JSONB NOT NULL DEFAULT '[]'::jsonb,
    equipment TEXT NOT NULL DEFAULT 'Dumbbell',
    bench_angle TEXT NOT NULL DEFAULT 'Flat',
    default_rest_seconds INTEGER NOT NULL DEFAULT 75,
    rep_range_min INTEGER NOT NULL DEFAULT 8,
    rep_range_max INTEGER NOT NULL DEFAULT 12,
    starting_weight_lbs NUMERIC NOT NULL DEFAULT 20,
    unilateral BOOLEAN NOT NULL DEFAULT false,
    setup_cues JSONB NOT NULL DEFAULT '[]'::jsonb,
    execution_cues JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    plan_code TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    total_volume_lbs NUMERIC NOT NULL DEFAULT 0,
    total_sets INTEGER NOT NULL DEFAULT 0,
    prs_achieved INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_at ON public.workout_logs (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_plans_sort_order ON public.workout_plans (sort_order ASC);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Allow personal sync on workout_plans'
    ) THEN
        CREATE POLICY "Allow personal sync on workout_plans"
            ON public.workout_plans FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'exercise_library' AND policyname = 'Allow personal sync on exercise_library'
    ) THEN
        CREATE POLICY "Allow personal sync on exercise_library"
            ON public.exercise_library FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'Allow personal sync on workout_logs'
    ) THEN
        CREATE POLICY "Allow personal sync on workout_logs"
            ON public.workout_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;`;
