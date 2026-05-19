create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  phone text,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  created_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text not null,
  city text not null,
  neighborhood text not null,
  latitude numeric(10, 6) not null,
  longitude numeric(10, 6) not null,
  booking_url text not null,
  source_url text not null,
  sports text[] not null,
  number_of_courts int not null default 0,
  indoor_outdoor text not null check (indoor_outdoor in ('indoor', 'outdoor', 'both')),
  lights boolean not null default false,
  public_private text not null check (public_private in ('public', 'private', 'public_private')),
  live_status text not null default 'coming_soon' check (live_status in ('live_alerts', 'manual_beta', 'booking_link_only', 'coming_soon')),
  source_platform text not null default 'unknown' check (source_platform in ('manual', 'courtreserve', 'playbypoint', 'webtrac', 'activenet', 'civicrec', 'unknown')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  sport text not null check (sport in ('tennis', 'pickleball')),
  surface text not null,
  indoor boolean not null default false,
  active boolean not null default true
);

create table if not exists public.alert_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  court_id uuid not null references public.courts(id) on delete cascade,
  sport text not null check (sport in ('tennis', 'pickleball')),
  days_of_week int[] not null check (days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]),
  start_time time not null,
  end_time time not null,
  channels text[] not null check (channels <@ array['sms', 'email']),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table if not exists public.availability_snapshots (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz not null default now(),
  source text not null default 'mock' check (source in ('mock', 'manual')),
  open_slot_count int not null default 0,
  slots jsonb not null default '[]'::jsonb
);

create table if not exists public.monitoring_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.venues(id) on delete cascade,
  sport text not null check (sport in ('tennis', 'pickleball')),
  preferred_time text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  alert_preference_id uuid not null references public.alert_preferences(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  channel text not null check (channel in ('sms', 'email')),
  recipient text not null,
  slot_fingerprint text not null,
  status text not null check (status in ('pending', 'dry_run', 'sent', 'skipped', 'failed')),
  message text not null,
  provider_response text,
  created_at timestamptz not null default now(),
  unique (alert_preference_id, slot_fingerprint, channel)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.app_users(id) on delete cascade,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz
);

alter table public.app_users enable row level security;
alter table public.venues enable row level security;
alter table public.courts enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.availability_snapshots enable row level security;
alter table public.notification_events enable row level security;
alter table public.monitoring_requests enable row level security;
alter table public.subscriptions enable row level security;

create policy "venues are readable" on public.venues
  for select using (true);

create policy "courts are readable" on public.courts
  for select using (true);

create policy "users read own profile" on public.app_users
  for select using (auth_user_id = auth.uid());

create policy "users update own profile" on public.app_users
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy "users read own alerts" on public.alert_preferences
  for select using (
    exists (
      select 1 from public.app_users
      where app_users.id = alert_preferences.user_id
      and app_users.auth_user_id = auth.uid()
    )
  );

create policy "users create own alerts" on public.alert_preferences
  for insert with check (
    exists (
      select 1 from public.app_users
      where app_users.id = alert_preferences.user_id
      and app_users.auth_user_id = auth.uid()
    )
  );

create policy "users update own alerts" on public.alert_preferences
  for update using (
    exists (
      select 1 from public.app_users
      where app_users.id = alert_preferences.user_id
      and app_users.auth_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.app_users
      where app_users.id = alert_preferences.user_id
      and app_users.auth_user_id = auth.uid()
    )
  );

create policy "users read own notifications" on public.notification_events
  for select using (
    exists (
      select 1 from public.app_users
      where app_users.id = notification_events.user_id
      and app_users.auth_user_id = auth.uid()
    )
  );

create policy "anyone can create monitoring requests" on public.monitoring_requests
  for insert with check (true);

create policy "users read own subscription" on public.subscriptions
  for select using (
    exists (
      select 1 from public.app_users
      where app_users.id = subscriptions.user_id
      and app_users.auth_user_id = auth.uid()
    )
  );

grant usage on schema public to anon, authenticated;
grant select on public.venues, public.courts to anon, authenticated;
grant select, insert, update on public.alert_preferences to authenticated;
grant select, update on public.app_users to authenticated;
grant select on public.notification_events, public.subscriptions to authenticated;
grant insert on public.monitoring_requests to anon, authenticated;
