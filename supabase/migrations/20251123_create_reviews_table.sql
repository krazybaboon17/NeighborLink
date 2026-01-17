-- Create reviews table if it doesn't exist
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  task_id uuid references public.tasks(id) not null,
  reviewer_id uuid references auth.users(id) not null,
  reviewee_id uuid references auth.users(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Drop existing policies to avoid errors
drop policy if exists "Users can read all reviews" on public.reviews;
drop policy if exists "Users can insert reviews for tasks they are involved in" on public.reviews;

-- Re-create Policies
create policy "Users can read all reviews"
  on public.reviews for select
  using (true);

create policy "Users can insert reviews for tasks they are involved in"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- Create simplified RPC function (without profile updates for now)
create or replace function public.submit_review(
  p_task_id uuid,
  p_helper_id uuid,
  p_rating integer,
  p_comment text
) returns json as $$
declare
  v_result json;
begin
  -- Insert review
  insert into public.reviews (task_id, reviewer_id, reviewee_id, rating, comment)
  values (p_task_id, auth.uid(), p_helper_id, p_rating, p_comment);

  -- Update task status
  update public.tasks
  set status = 'completed'
  where id = p_task_id;

  -- Return success
  return json_build_object('success', true);
exception
  when others then
    return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;
