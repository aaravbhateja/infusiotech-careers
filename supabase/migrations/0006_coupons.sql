-- Discount coupons for the program fee. Managed from the local admin panel (service role) and
-- applied by the create-order Edge Function. RLS on with no policies: the public keys can't read codes.

create table if not exists public.coupons (
  code        text primary key check (code ~ '^[A-Z0-9_-]{3,30}$'),   -- stored upper-case
  kind        text not null check (kind in ('percent', 'flat')),
  value       integer not null check (value > 0),                      -- percent (1-100) or rupees off
  max_uses    integer check (max_uses > 0),                            -- null = unlimited
  used_count  integer not null default 0,
  expires_at  timestamptz,                                             -- null = never
  active      boolean not null default true,
  note        text check (char_length(note) <= 200),
  created_at  timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);
alter table public.coupons enable row level security;
revoke all on public.coupons from anon, authenticated;

alter table public.applicants
  add column if not exists coupon_code text,
  add column if not exists discount_paise integer;

-- Counts one use of a coupon. Called once per paid applicant, after markPaid succeeds.
create or replace function public.redeem_coupon(p_code text) returns void
language sql security definer set search_path = public as $$
  update public.coupons set used_count = used_count + 1 where code = p_code;
$$;
revoke all on function public.redeem_coupon(text) from public, anon, authenticated;
