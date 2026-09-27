-- ============================================================
-- FF TEAM HUB — Migration 0005: Scrims
-- ============================================================

create type scrim_status as enum ('open', 'full', 'live', 'finished', 'cancelled');
create type scrim_format as enum ('BR', 'CS', 'Custom');

create table scrims (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  host_team_id uuid references teams(id) on delete set null,
  created_by uuid not null references profiles(id) on delete restrict,
  scheduled_at timestamptz not null,
  format scrim_format not null default 'BR',
  max_teams integer not null default 12 check (max_teams between 2 and 48),
  rules text,
  room_code text,
  room_password text,
  status scrim_status not null default 'open',
  country text not null default 'Moçambique',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scrim_name_length check (char_length(name) between 2 and 80)
);

create index scrims_status_idx on scrims (status);
create index scrims_scheduled_idx on scrims (scheduled_at);
create index scrims_country_idx on scrims (country);

create trigger scrims_set_updated_at
  before update on scrims
  for each row execute function set_updated_at();

create table scrim_teams (
  id uuid primary key default gen_random_uuid(),
  scrim_id uuid not null references scrims(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (scrim_id, team_id)
);

create index scrim_teams_scrim_idx on scrim_teams (scrim_id);

-- Auto-update status to full when max reached
create or replace function check_scrim_capacity()
returns trigger language plpgsql as $$
declare
  cnt integer;
  mx integer;
begin
  select count(*), s.max_teams into cnt, mx
  from scrim_teams st
  join scrims s on s.id = st.scrim_id
  where st.scrim_id = new.scrim_id
  group by s.max_teams;

  if cnt >= mx then
    update scrims set status = 'full' where id = new.scrim_id and status = 'open';
  end if;
  return new;
end;
$$;

create trigger scrim_teams_capacity
  after insert on scrim_teams
  for each row execute function check_scrim_capacity();

alter table scrims enable row level security;
alter table scrim_teams enable row level security;

create policy "scrims_select_all" on scrims for select using (true);

create policy "scrims_insert_authenticated" on scrims for insert
  with check (auth.uid() = created_by);

create policy "scrims_update_creator_or_admin" on scrims for update
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

create policy "scrim_teams_select_all" on scrim_teams for select using (true);

create policy "scrim_teams_insert_captain" on scrim_teams for insert
  with check (
    exists (
      select 1 from teams t
      where t.id = team_id and t.captain_id = auth.uid() and t.status = 'active'
    )
    and exists (select 1 from scrims s where s.id = scrim_id and s.status = 'open')
  );

create policy "scrim_teams_delete_captain" on scrim_teams for delete
  using (
    exists (select 1 from teams t where t.id = team_id and t.captain_id = auth.uid())
  );
