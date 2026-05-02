-- Add parental consent fields to profiles table for Young Neighbor support
-- Young Neighbors (under 18) need parental approval to post/accept tasks

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parental_consent boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_email text DEFAULT null;
