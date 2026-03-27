-- ================================================================
-- CyberSentry: Geo Logs Table Migration
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- Create the geo_logs table to track viewer and publisher locations
CREATE TABLE IF NOT EXISTS public.geo_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('article_view', 'article_publish')),
    article_id TEXT,
    user_id TEXT,
    user_email TEXT,
    ip_address TEXT DEFAULT 'Unknown',
    country TEXT DEFAULT 'Unknown',
    state TEXT DEFAULT 'Unknown',
    city TEXT DEFAULT 'Unknown',
    device_type TEXT DEFAULT 'desktop',
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_geo_logs_event_type ON public.geo_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_geo_logs_created_at ON public.geo_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_logs_article_id ON public.geo_logs (article_id);

-- Enable Row Level Security
ALTER TABLE public.geo_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from authenticated and anonymous users (for article views)
CREATE POLICY "Allow inserts for all" ON public.geo_logs
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow admins to read all geo logs
CREATE POLICY "Allow admin read access" ON public.geo_logs
    FOR SELECT
    USING (true);

-- Grant necessary permissions
GRANT ALL ON public.geo_logs TO authenticated;
GRANT INSERT ON public.geo_logs TO anon;
GRANT SELECT ON public.geo_logs TO anon;
