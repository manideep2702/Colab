-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table (extends Supabase auth.users)
-- Note: 'role' and 'name' are stored in auth.users metadata, but we can also have a public profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  avatar_url text,
  role text check (role in ('admin', 'student')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Announcements
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) not null,
  title text not null,
  content text not null,
  is_pinned boolean default false,
  category text check (category in ('general', 'urgent', 'course_update', 'assignment', 'event')) default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  scheduled_at timestamp with time zone
);

alter table public.announcements enable row level security;

create policy "Announcements are viewable by everyone." on public.announcements
  for select using (true);

create policy "Admins can insert announcements." on public.announcements
  for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update announcements." on public.announcements
  for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete announcements." on public.announcements
  for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Assessments
create table public.assessments (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  type text check (type in ('daily_quiz', 'weekly_test', 'module_assessment')) not null,
  questions jsonb not null, -- Stores array of questions
  time_limit integer, -- in minutes
  due_date timestamp with time zone,
  max_attempts integer default 1,
  passing_score integer,
  ai_grading_enabled boolean default false,
  grading_criteria_weights jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  module text check (module in ('python', 'sql', 'machine_learning', 'deep_learning'))
);

alter table public.assessments enable row level security;

create policy "Assessments are viewable by authenticated users." on public.assessments
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage assessments." on public.assessments
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Assessment Submissions
create table public.assessment_submissions (
  id uuid default uuid_generate_v4() primary key,
  assessment_id uuid references public.assessments(id) not null,
  student_id uuid references public.profiles(id) not null,
  answers jsonb not null,
  score numeric,
  ai_score numeric,
  ai_feedback jsonb,
  ai_graded_at timestamp with time zone,
  human_reviewed boolean default false,
  human_score numeric,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assessment_submissions enable row level security;

create policy "Students can view their own submissions." on public.assessment_submissions
  for select using (auth.uid() = student_id);

create policy "Admins can view all submissions." on public.assessment_submissions
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Students can insert their own submissions." on public.assessment_submissions
  for insert with check (auth.uid() = student_id);

-- Projects
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) not null,
  title text not null,
  description text not null,
  requirements text,
  resources text[],
  deadline timestamp with time zone,
  grading_rubric text,
  module text check (module in ('python', 'sql', 'machine_learning', 'deep_learning')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;

create policy "Projects are viewable by authenticated users." on public.projects
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage projects." on public.projects
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Project Submissions
create table public.project_submissions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) not null,
  student_id uuid references public.profiles(id) not null,
  submission_url text not null,
  github_url text,
  description text,
  screenshots text[],
  status text check (status in ('draft', 'submitted', 'under_review', 'feedback_received', 'approved', 'revision_requested')) default 'submitted',
  feedback text,
  score numeric,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.project_submissions enable row level security;

create policy "Students can view own project submissions." on public.project_submissions
  for select using (auth.uid() = student_id);

create policy "Admins can view all project submissions." on public.project_submissions
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Students can insert own project submissions." on public.project_submissions
  for insert with check (auth.uid() = student_id);

create policy "Students can update own project submissions." on public.project_submissions
  for update using (auth.uid() = student_id);

create policy "Admins can update project submissions (grading)." on public.project_submissions
  for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Recordings
create table public.recordings (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  module text check (module in ('python', 'sql', 'machine_learning', 'deep_learning')),
  duration integer, -- seconds
  allow_download boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recordings enable row level security;

create policy "Recordings are viewable by authenticated users." on public.recordings
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage recordings." on public.recordings
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Recording Progress
create table public.recording_progress (
  id uuid default uuid_generate_v4() primary key,
  recording_id uuid references public.recordings(id) not null,
  student_id uuid references public.profiles(id) not null,
  progress_percentage numeric default 0,
  completed boolean default false,
  last_watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(recording_id, student_id)
);

alter table public.recording_progress enable row level security;

create policy "Students can view own recording progress." on public.recording_progress
  for select using (auth.uid() = student_id);

create policy "Students can upsert own recording progress." on public.recording_progress
  for insert with check (auth.uid() = student_id); -- Note: upsert requires more complex policy or standard insert/update logic

create policy "Students can update own recording progress." on public.recording_progress
  for update using (auth.uid() = student_id);

-- Live Classes
create table public.live_classes (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  meeting_link text not null,
  scheduled_at timestamp with time zone not null,
  duration integer, -- minutes
  recorded_video_url text,
  module text check (module in ('python', 'sql', 'machine_learning', 'deep_learning')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.live_classes enable row level security;

create policy "Live classes are viewable by authenticated users." on public.live_classes
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage live classes." on public.live_classes
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  type text check (type in ('announcement', 'assessment', 'project', 'live_class', 'grade', 'reminder')),
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  link text
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications." on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications (mark read)." on public.notifications
  for update using (auth.uid() = user_id);

-- Admissions Table
create table public.admissions (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text not null,
  phone text,
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  motivation text,
  status text check (status in ('pending', 'under_review', 'accepted', 'rejected')) default 'pending',
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.admissions enable row level security;

-- NOTE: In a production environment, you might want to restrict this to unauthenticated users or specific origins.
-- For this demo, we allow anyone to submit applications.
create policy "Anyone can submit an admission application." on public.admissions
  for insert with check (true);

create policy "Admins can view all admission applications." on public.admissions
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));


-- Add profile fields
alter table public.profiles 
add column if not exists bio text,
add column if not exists phone text,
add column if not exists location text,
add column if not exists timezone text,
add column if not exists department text;

-- Coding Challenges
create table public.coding_challenges (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) not null,
  title text not null,
  description text not null, -- Markdown
  constraints text,
  starter_code jsonb default '{}'::jsonb, -- Map of language -> code
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  points integer default 0,
  time_limit integer, -- in minutes
  module text check (module in ('python', 'sql', 'machine_learning', 'deep_learning')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.coding_challenges enable row level security;

create policy "Coding challenges are viewable by authenticated users." on public.coding_challenges
    for select using (auth.role() = 'authenticated');

create policy "Admins can manage coding challenges." on public.coding_challenges
    for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Challenge Test Cases
create table public.challenge_test_cases (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.coding_challenges(id) on delete cascade not null,
  input text not null,
  expected_output text not null,
  is_hidden boolean default false,
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.challenge_test_cases enable row level security;

create policy "Test cases are viewable by authenticated users." on public.challenge_test_cases
    for select using (auth.role() = 'authenticated');

create policy "Admins can manage test cases." on public.challenge_test_cases
    for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Coding Submissions
create table public.coding_submissions (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.coding_challenges(id) not null,
  student_id uuid references public.profiles(id) not null,
  code text not null,
  language text not null,
  test_cases_passed integer,
  total_test_cases integer,
  score integer,
  status text check (status in ('pending', 'passed', 'failed')) default 'pending',
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.coding_submissions enable row level security;

create policy "Students can view their own coding submissions." on public.coding_submissions
  for select using (auth.uid() = student_id);

create policy "Admins can view all coding submissions." on public.coding_submissions
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Students can insert their own coding submissions." on public.coding_submissions
  for insert with check (auth.uid() = student_id);
