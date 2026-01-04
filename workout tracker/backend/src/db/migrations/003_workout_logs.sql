-- Workout Logs Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- Completed Workouts Table
-- ============================================
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id TEXT,                              -- Reference to routine template (e.g., 'lower-day')
    routine_name TEXT NOT NULL,                   -- Name at time of workout (e.g., 'Lower Day')
    workout_type TEXT NOT NULL DEFAULT 'strength', -- 'strength', 'run', 'hyrox', 'core'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    duration_seconds INT NOT NULL,                -- Total workout duration
    total_volume DECIMAL(10,2) DEFAULT 0,         -- Total weight lifted (kg)
    total_sets INT DEFAULT 0,
    total_reps INT DEFAULT 0,
    calories_burned INT,
    notes TEXT,
    effort_rating INT CHECK (effort_rating >= 1 AND effort_rating <= 10),
    -- External integrations
    strava_activity_id TEXT,
    whoop_workout_id TEXT,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Exercise Logs Table (exercises within a workout)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_id TEXT,                             -- Reference to exercise template
    exercise_name TEXT NOT NULL,
    exercise_order INT NOT NULL DEFAULT 0,        -- Order in workout
    is_superset BOOLEAN DEFAULT FALSE,
    superset_group_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Set Logs Table (individual sets within an exercise)
-- ============================================
CREATE TABLE IF NOT EXISTS set_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_log_id UUID NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    set_type TEXT NOT NULL DEFAULT 'working',     -- 'warmup', 'working', 'failure', 'drop'
    weight DECIMAL(6,2),                          -- Weight in kg
    reps INT,
    duration_seconds INT,                         -- For timed exercises
    distance_meters DECIMAL(10,2),                -- For distance-based exercises
    is_completed BOOLEAN DEFAULT TRUE,
    is_pr BOOLEAN DEFAULT FALSE,                  -- Personal record flag
    rpe DECIMAL(3,1),                             -- Rate of Perceived Exertion (1-10)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Personal Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_name TEXT NOT NULL,
    record_type TEXT NOT NULL,                    -- 'weight', 'reps', 'volume', 'time'
    value DECIMAL(10,2) NOT NULL,
    reps INT,                                     -- For weight PRs, the rep count
    set_log_id UUID REFERENCES set_logs(id) ON DELETE SET NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    previous_value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exercise_name, record_type, reps)      -- One PR per exercise/type/rep combo
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_at ON workout_logs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_routine_id ON workout_logs(routine_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_log_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_name);

-- ============================================
-- Enable RLS and create policies
-- ============================================
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for single-user app)
CREATE POLICY "Allow all on workout_logs" ON workout_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercise_logs" ON exercise_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on set_logs" ON set_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on personal_records" ON personal_records FOR ALL USING (true) WITH CHECK (true);

