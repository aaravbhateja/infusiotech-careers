-- Applicants for the InfusioTech Careers program.
-- RLS is enabled with NO policies, so the public anon key cannot read or write this table.
-- All access goes through the Edge Functions, which use the service-role key.
create table if not exists public.applicants (
  id                 uuid primary key default gen_random_uuid(),
  first_name         text not null,
  last_name          text not null,
  email              text not null,
  gender             text not null,
  phone              text not null,
  state              text not null,
  country            text not null,
  college            text not null,
  qualification      text not null,
  current_year       text not null,
  source             text not null,
  followed_linkedin  boolean not null default false,
  followed_instagram boolean not null default false,
  status             text not null default 'registered' check (status in ('registered', 'paid')),
  order_id           text,
  payment_id         text,
  amount_paise       integer,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

create unique index if not exists applicants_email_key on public.applicants (lower(email));
create index if not exists applicants_order_id_idx on public.applicants (order_id);

alter table public.applicants enable row level security;
