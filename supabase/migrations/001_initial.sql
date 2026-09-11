create table if not exists public.user_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.user_states enable row level security;
create policy "Users can read their own state" on public.user_states for select using (auth.uid() = user_id);
create policy "Users can insert their own state" on public.user_states for insert with check (auth.uid() = user_id);
create policy "Users can update their own state" on public.user_states for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.user_states from anon;
grant select,insert,update on public.user_states to authenticated;
