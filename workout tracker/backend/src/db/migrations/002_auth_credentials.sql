-- OAuth Token Storage Table
-- Run this in your Supabase SQL Editor

-- ============================================
-- Auth credentials table for OAuth tokens
-- ============================================
CREATE TABLE IF NOT EXISTS auth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,  -- 'strava', 'whoop'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick provider lookups
CREATE INDEX IF NOT EXISTS idx_auth_credentials_provider ON auth_credentials(provider_name);

-- Enable RLS
ALTER TABLE auth_credentials ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for development (restrict in production!)
CREATE POLICY "Allow anonymous read auth_credentials" ON auth_credentials
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert auth_credentials" ON auth_credentials
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update auth_credentials" ON auth_credentials
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete auth_credentials" ON auth_credentials
    FOR DELETE USING (true);

-- Function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_auth_credentials_updated_at ON auth_credentials;
CREATE TRIGGER update_auth_credentials_updated_at
    BEFORE UPDATE ON auth_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'auth_credentials';

