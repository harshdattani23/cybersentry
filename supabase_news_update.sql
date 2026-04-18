-- ================================================================
-- CyberSentry: News Table Updates
-- Run this SQL in your Supabase SQL Editor to fix schema mismatches
-- ================================================================

-- Add the missing columns to the news table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Add subcategory if you intend to use it as a separate column in the future
-- ALTER TABLE public.news ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Add pseudo_name to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pseudo_name TEXT;
