-- Run this SQL in your Supabase SQL Editor to fix the 'cases' table schema

CREATE TABLE IF NOT EXISTS public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    platform TEXT,
    description TEXT,
    phone TEXT,
    url TEXT,
    evidence_url TEXT,
    status TEXT DEFAULT 'under_review',
    is_public BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Allow anyone to report (insert)
CREATE POLICY "Allow public insert" ON public.cases FOR INSERT WITH CHECK (true);

-- Allow everyone to view public cases
CREATE POLICY "Allow public select" ON public.cases FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON public.cases TO authenticated;
GRANT ALL ON public.cases TO anon;
GRANT ALL ON public.cases TO service_role;
