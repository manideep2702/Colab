-- Run this in your Supabase SQL Editor to create the coding challenges tables

-- Coding Challenges Table
CREATE TABLE IF NOT EXISTS public.coding_challenges (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  constraints text,
  starter_code jsonb default '{}'::jsonb,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  points integer default 0,
  time_limit integer,
  module text check (module in ('python', 'sql', 'machine_learning', 'deep_learning')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.coding_challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Coding challenges are viewable by authenticated users." ON public.coding_challenges;
DROP POLICY IF EXISTS "Admins can manage coding challenges." ON public.coding_challenges;

-- Create policies
CREATE POLICY "Coding challenges are viewable by authenticated users." ON public.coding_challenges
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage coding challenges." ON public.coding_challenges
    FOR ALL USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Challenge Test Cases Table
CREATE TABLE IF NOT EXISTS public.challenge_test_cases (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.coding_challenges(id) on delete cascade not null,
  input text not null,
  expected_output text not null,
  is_hidden boolean default false,
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.challenge_test_cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Test cases are viewable by authenticated users." ON public.challenge_test_cases;
DROP POLICY IF EXISTS "Admins can manage test cases." ON public.challenge_test_cases;

-- Create policies
CREATE POLICY "Test cases are viewable by authenticated users." ON public.challenge_test_cases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage test cases." ON public.challenge_test_cases
    FOR ALL USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Coding Submissions Table
CREATE TABLE IF NOT EXISTS public.coding_submissions (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.coding_challenges(id) not null,
  student_id uuid references public.profiles(id) not null,
  code text not null,
  language text not null,
  test_cases_passed integer,
  total_test_cases integer,
  score integer,
  status text check (status in ('pending', 'passed', 'failed')) default 'pending',
  execution_time integer,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own submissions." ON public.coding_submissions;
DROP POLICY IF EXISTS "Students can submit." ON public.coding_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions." ON public.coding_submissions;

-- Create policies
CREATE POLICY "Students can view own submissions." ON public.coding_submissions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can submit." ON public.coding_submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all submissions." ON public.coding_submissions
    FOR SELECT USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Grant permissions
GRANT ALL ON public.coding_challenges TO authenticated;
GRANT ALL ON public.challenge_test_cases TO authenticated;
GRANT ALL ON public.coding_submissions TO authenticated;
