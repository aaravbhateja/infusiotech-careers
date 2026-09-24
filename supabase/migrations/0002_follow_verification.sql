-- Follow verification: payment is only allowed once both screenshots have been verified.
alter table public.applicants
  add column if not exists follow_verified boolean not null default false,
  add column if not exists follow_attempts integer not null default 0,
  add column if not exists linkedin_hash text,
  add column if not exists instagram_hash text;

-- A screenshot file can only be used by one applicant (blocks passing the same image around).
create unique index if not exists applicants_linkedin_hash_key on public.applicants (linkedin_hash) where linkedin_hash is not null;
create unique index if not exists applicants_instagram_hash_key on public.applicants (instagram_hash) where instagram_hash is not null;
