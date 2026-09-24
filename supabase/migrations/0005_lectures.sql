-- Lecture videos for the intern portal. Videos are hosted on YouTube as "Unlisted";
-- managers add them from the local admin panel (service role). Rows with intern_id NULL are for every intern.

create table if not exists public.lectures (
  id          uuid primary key default gen_random_uuid(),
  intern_id   uuid references auth.users (id) on delete cascade,   -- null = whole cohort
  title       text not null check (char_length(title) <= 200),
  description text check (char_length(description) <= 2000),
  youtube_id  text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  week        integer check (week between 1 and 52),
  created_at  timestamptz not null default now()
);
alter table public.lectures enable row level security;

create policy "lectures visible to viewer" on public.lectures for select to authenticated
  using (intern_id is null or intern_id = auth.uid());

revoke all on public.lectures from anon, authenticated;
grant select on public.lectures to authenticated;
create index if not exists lectures_week_idx on public.lectures (week, created_at);
