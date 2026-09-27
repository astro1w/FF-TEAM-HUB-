-- ============================================================
-- FF TEAM HUB — Migration 0008: Rankings, Achievements, Reports, Blocks, Admin
-- ============================================================

create table rankings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  points numeric not null default 0,
  kills integer not null default 0,
  wins integer not null default 0,
  matches_played integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint ranking_entity check (
    (profile_id is not null and team_id is null) or (profile_id is null and team_id is not null)
  )
);

create unique index rankings_player_season_idx on rankings (season_id, profile_id) where profile_id is not null;
create unique index rankings_team_season_idx on rankings (season_id, team_id) where team_id is not null;
create index rankings_points_idx on rankings (points desc);

create type achievement_key as enum (
  'first_tournament', 'first_win', 'scrims_10', 'scrims_50',
  'tournament_champion', 'mvp'
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  key achievement_key not null unique,
  title text not null,
  description text,
  icon text
);

create table player_achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (profile_id, achievement_id)
);

insert into achievements (key, title, description, icon) values
  ('first_tournament', 'First Tournament', 'Participou no primeiro torneio', '🏆'),
  ('first_win', 'First Win', 'Primeira vitória registada', '🥇'),
  ('scrims_10', '10 Scrims', 'Participou em 10 scrims', '⚔️'),
  ('scrims_50', '50 Scrims', 'Participou em 50 scrims', '🔥'),
  ('tournament_champion', 'Tournament Champion', 'Venceu um torneio', '👑'),
  ('mvp', 'MVP', 'Foi MVP num evento', '⭐');

-- Reports
create type report_reason as enum ('spam', 'fraud', 'harassment', 'fake_account', 'inappropriate', 'other');
create type report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');
create type report_target as enum ('player', 'team', 'post', 'comment', 'message');

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type report_target not null,
  target_id uuid not null,
  reason report_reason not null,
  details text,
  status report_status not null default 'pending',
  reviewed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_status_idx on reports (status);
create trigger reports_set_updated_at
  before update on reports for each row execute function set_updated_at();

create table blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create table admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id) on delete cascade,
  action text not null,
  target_type text,
  target_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Suspension fields already on profiles (status). Add ban metadata table.
create table account_sanctions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  status account_status not null,
  reason text,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS
alter table rankings enable row level security;
alter table achievements enable row level security;
alter table player_achievements enable row level security;
alter table reports enable row level security;
alter table blocked_users enable row level security;
alter table admin_logs enable row level security;
alter table account_sanctions enable row level security;

create policy "rankings_select_all" on rankings for select using (true);
create policy "rankings_admin_write" on rankings for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "achievements_select_all" on achievements for select using (true);
create policy "player_achievements_select_all" on player_achievements for select using (true);

create policy "reports_insert_own" on reports for insert with check (reporter_id = auth.uid());
create policy "reports_select_own_or_mod" on reports for select
  using (
    reporter_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );
create policy "reports_update_mod" on reports for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator')));

create policy "blocked_select_own" on blocked_users for select using (blocker_id = auth.uid());
create policy "blocked_insert_own" on blocked_users for insert with check (blocker_id = auth.uid());
create policy "blocked_delete_own" on blocked_users for delete using (blocker_id = auth.uid());

create policy "admin_logs_admin" on admin_logs for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "sanctions_select_admin" on account_sanctions for select
  using (
    profile_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );
create policy "sanctions_admin_write" on account_sanctions for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
