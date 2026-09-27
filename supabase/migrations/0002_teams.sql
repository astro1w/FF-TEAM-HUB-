-- ============================================================
-- FF TEAM HUB — Migration 0002: Teams e membros
-- ============================================================

create type team_status as enum ('active', 'inactive', 'disbanded');
create type team_member_role as enum ('Captain', 'Vice Captain', 'Rush', 'IGL', 'Support', 'Sniper', 'Flex');

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null,
  logo_url text,
  banner_url text,
  country text not null default 'Moçambique',
  province text,
  description text,
  captain_id uuid not null references profiles(id) on delete restrict,
  status team_status not null default 'active',
  recruiting boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_name_length check (char_length(name) between 2 and 48),
  constraint team_tag_length check (char_length(tag) between 2 and 8)
);

create unique index teams_tag_unique_idx on teams (lower(tag));
create index teams_country_province_idx on teams (country, province);
create index teams_recruiting_idx on teams (recruiting) where recruiting = true;

create trigger teams_set_updated_at
  before update on teams
  for each row execute function set_updated_at();

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  team_role team_member_role not null default 'Flex',
  joined_at timestamptz not null default now(),

  unique (team_id, profile_id)
);

create index team_members_team_idx on team_members (team_id);
create index team_members_profile_idx on team_members (profile_id);

-- Garante que uma Team nunca fica sem capitão: bloqueia remover/alterar
-- o único membro com team_role = 'Captain' sem promover outro primeiro.
create or replace function prevent_captain_removal()
returns trigger
language plpgsql
as $$
declare
  remaining_captains integer;
begin
  if (TG_OP = 'DELETE' and old.team_role = 'Captain')
     or (TG_OP = 'UPDATE' and old.team_role = 'Captain' and new.team_role <> 'Captain') then
    select count(*) into remaining_captains
    from team_members
    where team_id = old.team_id and team_role = 'Captain' and id <> old.id;

    if remaining_captains = 0 then
      raise exception 'Uma Team não pode ficar sem capitão.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger team_members_protect_captain
  before update or delete on team_members
  for each row execute function prevent_captain_removal();

-- ---- RLS: teams -----------------------------------------------

alter table teams enable row level security;

create policy "teams_select_all"
  on teams for select
  using (true);

create policy "teams_insert_own_as_captain"
  on teams for insert
  with check (captain_id = auth.uid());

create policy "teams_update_captain"
  on teams for update
  using (captain_id = auth.uid())
  with check (captain_id = auth.uid());

create policy "teams_admin_all"
  on teams for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---- RLS: team_members -------------------------------------------

alter table team_members enable row level security;

create policy "team_members_select_all"
  on team_members for select
  using (true);

-- Só o capitão da respetiva Team pode gerir a lineup.
create policy "team_members_captain_manage"
  on team_members for all
  using (exists (
    select 1 from teams t where t.id = team_members.team_id and t.captain_id = auth.uid()
  ))
  with check (exists (
    select 1 from teams t where t.id = team_members.team_id and t.captain_id = auth.uid()
  ));

create policy "team_members_admin_all"
  on team_members for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
