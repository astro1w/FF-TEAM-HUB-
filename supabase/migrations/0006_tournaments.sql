-- ============================================================
-- FF TEAM HUB — Migration 0006: Tournaments, Matches, Results
-- ============================================================

create type tournament_status as enum ('draft', 'open', 'upcoming', 'live', 'finished', 'cancelled');
create type tournament_format as enum ('Battle Royale', 'Liga', 'Eliminação', 'Grupos + Final');
create type match_status as enum ('scheduled', 'live', 'completed', 'cancelled');

create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint season_dates check (ends_at > starts_at)
);

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  banner_url text,
  organizer_id uuid not null references profiles(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz,
  max_teams integer not null default 16 check (max_teams between 2 and 128),
  format tournament_format not null default 'Battle Royale',
  rules text,
  prize text,
  status tournament_status not null default 'draft',
  country text not null default 'Moçambique',
  season_id uuid references seasons(id) on delete set null,
  -- scoring config
  points_per_kill numeric not null default 1,
  placement_points jsonb not null default '{"1":12,"2":9,"3":8,"4":7,"5":6,"6":5,"7":4,"8":3,"9":2,"10":1}',
  tiebreaker text not null default 'kills',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_name_length check (char_length(name) between 2 and 80),
  constraint tournament_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index tournaments_slug_idx on tournaments (lower(slug));
create index tournaments_status_idx on tournaments (status);
create index tournaments_country_idx on tournaments (country);

create trigger tournaments_set_updated_at
  before update on tournaments
  for each row execute function set_updated_at();

create table tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  seed integer,
  registered_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

create index tournament_teams_tournament_idx on tournament_teams (tournament_id);

create table tournament_rounds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  round_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round_id uuid references tournament_rounds(id) on delete set null,
  name text,
  scheduled_at timestamptz,
  room_code text,
  room_password text,
  status match_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index matches_tournament_idx on matches (tournament_id);

create trigger matches_set_updated_at
  before update on matches
  for each row execute function set_updated_at();

create table match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  placement integer not null check (placement >= 1),
  kills integer not null default 0 check (kills >= 0),
  placement_points numeric not null default 0,
  kill_points numeric not null default 0,
  total_points numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, team_id)
);

create index match_results_match_idx on match_results (match_id);

-- Compute points from tournament scoring config
create or replace function compute_match_result_points()
returns trigger language plpgsql as $$
declare
  ppk numeric;
  pp jsonb;
  t_id uuid;
begin
  select m.tournament_id into t_id from matches m where m.id = new.match_id;
  select points_per_kill, placement_points into ppk, pp
  from tournaments where id = t_id;

  new.kill_points := new.kills * coalesce(ppk, 1);
  new.placement_points := coalesce((pp->>new.placement::text)::numeric, 0);
  new.total_points := new.kill_points + new.placement_points;
  return new;
end;
$$;

create trigger match_results_compute_points
  before insert or update on match_results
  for each row execute function compute_match_result_points();

-- RLS
alter table seasons enable row level security;
alter table tournaments enable row level security;
alter table tournament_teams enable row level security;
alter table tournament_rounds enable row level security;
alter table matches enable row level security;
alter table match_results enable row level security;

create policy "seasons_select_all" on seasons for select using (true);
create policy "seasons_admin" on seasons for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "tournaments_select_all" on tournaments for select using (true);

create policy "tournaments_insert_organizer" on tournaments for insert
  with check (
    organizer_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('organizer', 'admin'))
  );

create policy "tournaments_update_organizer" on tournaments for update
  using (
    organizer_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "tournament_teams_select_all" on tournament_teams for select using (true);

create policy "tournament_teams_insert_captain" on tournament_teams for insert
  with check (
    exists (select 1 from teams t where t.id = team_id and t.captain_id = auth.uid() and t.status = 'active')
    and exists (select 1 from tournaments tn where tn.id = tournament_id and tn.status = 'open')
  );

create policy "rounds_select_all" on tournament_rounds for select using (true);
create policy "rounds_manage_organizer" on tournament_rounds for all
  using (
    exists (
      select 1 from tournaments t
      where t.id = tournament_id
        and (t.organizer_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

create policy "matches_select_all" on matches for select using (true);
create policy "matches_manage_organizer" on matches for all
  using (
    exists (
      select 1 from tournaments t
      where t.id = tournament_id
        and (t.organizer_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

create policy "match_results_select_all" on match_results for select using (true);
create policy "match_results_manage_organizer" on match_results for all
  using (
    exists (
      select 1 from matches m
      join tournaments t on t.id = m.tournament_id
      where m.id = match_id
        and (t.organizer_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

-- Allow captains to create tournaments as well (community organizers)
drop policy if exists "tournaments_insert_organizer" on tournaments;
create policy "tournaments_insert_organizer" on tournaments for insert
  with check (
    organizer_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('organizer', 'admin', 'captain')
    )
  );
