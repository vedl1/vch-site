-- Fitness Tracker Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/qpgoplcwlcnbauilweux/sql)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Main training plan table (12-week workout schedule)
-- ============================================
CREATE TABLE IF NOT EXISTS training_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week INT NOT NULL,
    day TEXT NOT NULL,
    primary_type TEXT NOT NULL,
    secondary_type TEXT,
    description TEXT,
    target_pace_load TEXT,
    duration_min TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Exercise checklists (individual exercises parsed from descriptions)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES training_plan(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Daily logs (user progress, external metrics)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES training_plan(id) ON DELETE CASCADE,
    whoop_recovery_score INT,
    strava_activity_id TEXT,
    effort_rating INT CHECK (effort_rating >= 1 AND effort_rating <= 10),
    is_day_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_training_plan_week_day ON training_plan(week, day);
CREATE INDEX IF NOT EXISTS idx_exercise_checklists_plan_id ON exercise_checklists(plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_plan_id ON daily_logs(plan_id);

-- ============================================
-- Row Level Security (RLS) - Enable for production
-- ============================================
ALTER TABLE training_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for development (adjust for production)
CREATE POLICY "Allow anonymous read training_plan" ON training_plan
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert training_plan" ON training_plan
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update training_plan" ON training_plan
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete training_plan" ON training_plan
    FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read exercise_checklists" ON exercise_checklists
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert exercise_checklists" ON exercise_checklists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update exercise_checklists" ON exercise_checklists
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete exercise_checklists" ON exercise_checklists
    FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read daily_logs" ON daily_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert daily_logs" ON daily_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update daily_logs" ON daily_logs
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete daily_logs" ON daily_logs
    FOR DELETE USING (true);

-- ============================================
-- Verify tables were created
-- ============================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('training_plan', 'exercise_checklists', 'daily_logs');

