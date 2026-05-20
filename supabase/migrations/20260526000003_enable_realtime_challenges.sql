-- Enable Realtime for challenges table to allow instantaneous 1v1 matchmaking updates
alter publication supabase_realtime add table public.challenges;
