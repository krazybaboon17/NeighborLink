-- Drop the existing foreign key that points to auth.users
ALTER TABLE offers
DROP CONSTRAINT offers_helper_id_fkey;

-- Create new foreign key pointing to profiles table
ALTER TABLE offers
ADD CONSTRAINT offers_helper_id_fkey
FOREIGN KEY (helper_id)
REFERENCES profiles(id)
ON DELETE CASCADE;