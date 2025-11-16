-- Step 2: Set up RLS policies
-- First, drop any existing policies
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy for viewing tasks: Anyone can view tasks with status 'open'
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks
    FOR SELECT
    USING (status = 'open');

-- Policy for creating tasks: Authenticated users can create tasks
CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for updating tasks: Task owners can update their tasks
CREATE POLICY "Users can update their own tasks" ON public.tasks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for deleting tasks: Task owners can delete their tasks
CREATE POLICY "Users can delete their own tasks" ON public.tasks
    FOR DELETE
    USING (auth.uid() = user_id);