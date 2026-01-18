-- INSTRUCTIONS FOR SETUP
-- 1. Create a new account using the Registration Page in the App for:
--    Email: admin@tech.com
--    Password: admin@tech123
--    Name: Admin User

-- 2. AFTER registering, run the following SQL snippet in the Supabase SQL Editor
--    to promote this user to an admin role.

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@tech.com';

-- Verify the update
SELECT * FROM public.profiles WHERE email = 'admin@tech.com';
