-- =============================================
-- ENABLE REALTIME FOR LMS TABLES
-- =============================================
-- Run this script in your Supabase SQL Editor to enable real-time updates
-- This allows the frontend to receive instant notifications when data changes

-- Enable realtime for announcements table
alter publication supabase_realtime add table announcements;

-- Enable realtime for assessments table
alter publication supabase_realtime add table assessments;

-- Enable realtime for projects table
alter publication supabase_realtime add table projects;

-- Enable realtime for recordings table
alter publication supabase_realtime add table recordings;

-- Enable realtime for live_classes table
alter publication supabase_realtime add table live_classes;

-- Enable realtime for profiles table (for student updates)
alter publication supabase_realtime add table profiles;

-- Enable realtime for notifications table
alter publication supabase_realtime add table notifications;

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this to verify which tables have realtime enabled:
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- =============================================
-- NOTES
-- =============================================
-- After running this script:
-- 1. Your frontend will receive real-time updates via WebSocket
-- 2. When an admin creates an announcement, all connected students see it immediately
-- 3. When an assessment is updated, changes appear instantly for all users
-- 4. Same for projects, recordings, and live classes

-- If you get an error that the table is already in the publication,
-- that's fine - it means realtime is already enabled for that table.
