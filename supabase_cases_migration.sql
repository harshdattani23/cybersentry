-- ================================================================
-- CyberSentry: Cases Table - Complete Migration
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- Final state of the table (only creates if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    platform TEXT,
    description TEXT,
    phone TEXT,
    url TEXT,
    evidence_url TEXT,
    priority TEXT DEFAULT 'low',
    status TEXT DEFAULT 'under_review',
    is_public BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (safe for existing tables)
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'low';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'under_review';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Fix defaults
ALTER TABLE public.cases ALTER COLUMN priority SET DEFAULT 'low';
ALTER TABLE public.cases ALTER COLUMN status SET DEFAULT 'under_review';
ALTER TABLE public.cases ALTER COLUMN is_public SET DEFAULT true;

-- ================================================================
-- RLS POLICIES (Critical for frontend access!)
-- ================================================================

-- Enable Row Level Security
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicate errors)
DROP POLICY IF EXISTS "Allow public insert" ON public.cases;
DROP POLICY IF EXISTS "Allow public select" ON public.cases;
DROP POLICY IF EXISTS "Allow public update" ON public.cases;

-- Policy: Allow anyone to INSERT (submit fraud reports)
CREATE POLICY "Allow public insert" ON public.cases
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anyone to SELECT (read public fraud cases)
CREATE POLICY "Allow public select" ON public.cases
    FOR SELECT
    USING (true);

-- Policy: Allow updates (for admin status changes)
CREATE POLICY "Allow public update" ON public.cases
    FOR UPDATE
    USING (true);

-- ================================================================
-- GRANT PERMISSIONS (Critical! Without these, anon role can't access)
-- ================================================================
GRANT ALL ON public.cases TO authenticated;
GRANT ALL ON public.cases TO anon;
GRANT ALL ON public.cases TO service_role;
