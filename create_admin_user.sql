-- ============================================
-- ADMIN USER CREATION SCRIPT FOR SUPABASE
-- ============================================
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Go to: Project Dashboard -> SQL Editor -> New Query
-- Paste this entire script and click "Run"
-- ============================================

-- STEP 1: Create the admin user in auth.users
-- Note: This creates the user with a pre-hashed password
-- The password will be: admin@tech123

-- First, let's check if user already exists and delete if necessary
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  -- Find existing user with this email
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = 'admin@tech.com';
  
  -- If user exists, delete from profiles first (due to foreign key), then from auth.users
  IF existing_user_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = existing_user_id;
    DELETE FROM auth.users WHERE id = existing_user_id;
    RAISE NOTICE 'Deleted existing user with email admin@tech.com';
  END IF;
END $$;

-- STEP 2: Insert the admin user into auth.users
-- Using Supabase's built-in password hashing
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  gen_random_uuid(),                                    -- Generate a new UUID for the user
  '00000000-0000-0000-0000-000000000000',              -- Default instance ID
  'admin@tech.com',                                     -- Admin email
  crypt('admin@tech123', gen_salt('bf')),              -- Password: admin@tech123 (bcrypt hashed)
  now(),                                                -- Email confirmed immediately
  '{"provider": "email", "providers": ["email"]}'::jsonb, -- App metadata
  '{"name": "Admin User", "role": "admin"}'::jsonb,    -- User metadata with admin role
  'authenticated',                                      -- Audience
  'authenticated',                                      -- Role
  now(),                                                -- Created at
  now(),                                                -- Updated at
  '',                                                   -- No confirmation token needed
  '',                                                   -- No recovery token
  '',                                                   -- No email change token
  ''                                                    -- No email change
);

-- STEP 3: Create the corresponding profile entry with admin role
-- Note: This might be handled automatically by the trigger, but let's ensure it's set correctly
INSERT INTO public.profiles (id, email, name, role, created_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name',
  'admin',  -- Explicitly set as admin
  now()
FROM auth.users 
WHERE email = 'admin@tech.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = EXCLUDED.name;

-- STEP 4: Create the auth.identities entry (required for Supabase auth to work)
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  id,
  email,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'name', raw_user_meta_data->>'name',
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@tech.com'
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify the user was created in auth.users
SELECT 
  id, 
  email, 
  email_confirmed_at,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as meta_role,
  created_at
FROM auth.users 
WHERE email = 'admin@tech.com';

-- Verify the profile exists with admin role
SELECT 
  id, 
  email, 
  name, 
  role, 
  created_at 
FROM public.profiles 
WHERE email = 'admin@tech.com';

-- Verify the identity was created
SELECT 
  user_id,
  provider,
  provider_id,
  identity_data->>'email' as email
FROM auth.identities 
WHERE provider_id = 'admin@tech.com';

-- ============================================
-- ADMIN LOGIN CREDENTIALS
-- ============================================
-- Email:    admin@tech.com
-- Password: admin@tech123
-- Role:     admin
-- ============================================
