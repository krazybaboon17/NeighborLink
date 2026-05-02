-- Allow users to delete their own tasks
CREATE POLICY "Users can delete own tasks"
ON tasks
FOR DELETE
USING (auth.uid() = user_id);