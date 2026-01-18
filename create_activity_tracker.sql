-- Student Activity Tracking Table for Streak/Contribution Graph
-- Run this in your Supabase SQL Editor

-- Create student_activity table
CREATE TABLE IF NOT EXISTS public.student_activity (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id uuid REFERENCES public.profiles(id) NOT NULL,
    activity_date date NOT NULL,
    visit_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, activity_date)
);

-- Enable RLS
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view own activity." ON public.student_activity
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own activity." ON public.student_activity
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own activity." ON public.student_activity
    FOR UPDATE USING (auth.uid() = student_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity." ON public.student_activity
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_activity_student_date 
    ON public.student_activity(student_id, activity_date);

-- Function to update visit count on conflict (upsert)
CREATE OR REPLACE FUNCTION increment_visit_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.visit_count := COALESCE(OLD.visit_count, 0) + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing visit count
DROP TRIGGER IF EXISTS increment_visit_trigger ON public.student_activity;
CREATE TRIGGER increment_visit_trigger
    BEFORE UPDATE ON public.student_activity
    FOR EACH ROW
    EXECUTE FUNCTION increment_visit_count();
