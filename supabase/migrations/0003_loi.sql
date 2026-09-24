-- Tracks whether the Letter of Intent email has been sent (also acts as a claim lock so it is sent once).
alter table public.applicants
  add column if not exists loi_sent_at timestamptz,
  add column if not exists loi_error text;
