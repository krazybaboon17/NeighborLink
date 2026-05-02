-- First, drop any existing policies
DROP POLICY IF EXISTS "Allow users to read all tasks" ON tasks;
DROP POLICY IF EXISTS "Allow users to create tasks" ON tasks;
DROP POLICY IF EXISTS "Allow task owners to update their tasks" ON tasks;
DROP POLICY IF EXISTS "Allow task owners to delete their tasks" ON tasks;

-- Enable RLS on the tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read all tasks
CREATE POLICY "Allow users to read all tasks"
ON tasks
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow authenticated users to create tasks
CREATE POLICY "Allow users to create tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow task owners to update their tasks
CREATE POLICY "Allow task owners to update their tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow task owners to delete their tasks
CREATE POLICY "Allow task owners to delete their tasks"
ON tasks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);

-- Add a security definer function to check task ownership
CREATE OR REPLACE FUNCTION check_task_owner(task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM tasks
        WHERE id = task_id
        AND user_id = auth.uid()
    );
END;
$$;