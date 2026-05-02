-- Add per-task parental consent fields to tasks and offers
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parental_consent_given boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_email text;

ALTER TABLE offers ADD COLUMN IF NOT EXISTS parental_consent_given boolean DEFAULT false;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS parent_email text;
