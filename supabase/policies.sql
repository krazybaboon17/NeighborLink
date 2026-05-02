-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    budget_min INTEGER,
    budget_max INTEGER,
    status TEXT DEFAULT 'open',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy for viewing tasks: Anyone can view tasks with status 'open'
CREATE POLICY "Tasks are viewable by everyone" ON tasks
    FOR SELECT
    USING (status = 'open');

-- Policy for creating tasks: Authenticated users can create tasks
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for updating tasks: Task owners can update their tasks
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for deleting tasks: Task owners can delete their tasks
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE
    USING (auth.uid() = user_id);