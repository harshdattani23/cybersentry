-- Run this SQL in your Supabase SQL Editor if you encounter constraint errors

-- Ensure columns exist and have proper defaults
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'low';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'under_review';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Fix potential NOT NULL constraint issues on existing columns
ALTER TABLE public.cases ALTER COLUMN priority SET DEFAULT 'low';
ALTER TABLE public.cases ALTER COLUMN status SET DEFAULT 'under_review';
ALTER TABLE public.cases ALTER COLUMN is_public SET DEFAULT true;

-- Final state of the table
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
