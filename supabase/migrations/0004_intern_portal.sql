-- Intern portal: attendance, tasks, meetings, progress.
-- Each paid applicant gets a Supabase Auth user (id = their registered email, random password, must reset on first login).
-- Interns read/write only their own rows through RLS. Managers (admins) manage tasks, meetings and notes
-- from the Supabase dashboard / service role. Rows with intern_id NULL are cohort-wide (visible to every intern).

alter table public.applicants
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists portal_sent_at timestamptz;

create unique index if not exists applicants_user_id_key on public.applicants (user_id);

-- The intern's own applicant row (used to show name / start date). No other columns are exposed via views below.
create or replace view public.my_profile with (security_invoker = false) as
  select id, first_name, last_name, email, college, paid_at
  from public.applicants
  where user_id = auth.uid();

revoke all on public.my_profile from anon, authenticated;
grant select on public.my_profile to authenticated;

-- ATTENDANCE -----------------------------------------------------------------
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  att_date   date not null default (now() at time zone 'Asia/Kolkata')::date,
  checked_in timestamptz not null default now(),
  note       text check (char_length(note) <= 300),
  unique (user_id, att_date)
);
alter table public.attendance enable row level security;

create policy "own attendance read" on public.attendance for select to authenticated
  using (user_id = auth.uid());
-- Interns can only mark today (IST) for themselves; no edits or deletes.
create policy "own attendance mark today" on public.attendance for insert to authenticated
  with check (user_id = auth.uid() and att_date = (now() at time zone 'Asia/Kolkata')::date);

revoke all on public.attendance from anon, authenticated;
grant select on public.attendance to authenticated;
grant insert (att_date, note) on public.attendance to authenticated;

-- TASKS ----------------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  intern_id   uuid references auth.users (id) on delete cascade,   -- null = assigned to everyone
  title       text not null,
  description text,
  due_date    date,
  created_at  timestamptz not null default now()
);
alter table public.tasks enable row level security;

-- Each intern's own status per task (works for both cohort-wide and individual tasks).
-- No row = not started. A manager sets 'done' from the dashboard.
create table if not exists public.task_progress (
  task_id    uuid not null references public.tasks (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  status     text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'done')),
  submission text check (char_length(submission) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (task_id, user_id)
);
alter table public.task_progress enable row level security;

create policy "tasks visible to assignee" on public.tasks for select to authenticated
  using (intern_id is null or intern_id = auth.uid());

create policy "own task progress read" on public.task_progress for select to authenticated
  using (user_id = auth.uid());
create policy "own task progress insert" on public.task_progress for insert to authenticated
  with check (
    user_id = auth.uid()
    and status <> 'done'   -- only a manager can mark work as done
    and exists (select 1 from public.tasks t where t.id = task_id and (t.intern_id is null or t.intern_id = auth.uid()))
  );
create policy "own task progress update" on public.task_progress for update to authenticated
  using (user_id = auth.uid() and status <> 'done')
  with check (user_id = auth.uid() and status <> 'done');

revoke all on public.tasks, public.task_progress from anon, authenticated;
grant select on public.tasks to authenticated;
grant select on public.task_progress to authenticated;
grant insert (task_id, status, submission) on public.task_progress to authenticated;
grant update (status, submission, updated_at) on public.task_progress to authenticated;

-- MEETINGS -------------------------------------------------------------------
create table if not exists public.meetings (
  id          uuid primary key default gen_random_uuid(),
  intern_id   uuid references auth.users (id) on delete cascade,   -- null = whole cohort
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  duration_min integer not null default 60,
  link        text,
  host        text,
  created_at  timestamptz not null default now()
);
alter table public.meetings enable row level security;
create policy "meetings visible to invitee" on public.meetings for select to authenticated
  using (intern_id is null or intern_id = auth.uid());
revoke all on public.meetings from anon, authenticated;
grant select on public.meetings to authenticated;
create index if not exists meetings_starts_idx on public.meetings (starts_at);

-- MANAGER FEEDBACK (progress notes / ratings) ---------------------------------
create table if not exists public.progress_notes (
  id         uuid primary key default gen_random_uuid(),
  intern_id  uuid not null references auth.users (id) on delete cascade,
  week       integer,
  rating     integer check (rating between 1 and 5),
  note       text not null,
  author     text,
  created_at timestamptz not null default now()
);
alter table public.progress_notes enable row level security;
create policy "own progress notes" on public.progress_notes for select to authenticated
  using (intern_id = auth.uid());
revoke all on public.progress_notes from anon, authenticated;
grant select on public.progress_notes to authenticated;
