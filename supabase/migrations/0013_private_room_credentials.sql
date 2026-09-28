-- ============================================================
-- FF TEAM HUB — Migration 0013: credenciais de salas privadas
-- Problema: scrims.room_code/room_password e matches.room_code/room_password
-- eram legíveis por qualquer utilizador autenticado (select using (true)).
-- Solução: mover para tabelas próprias com RLS restrita.
--   Podem ler: quem criou/organiza, admin/moderador, e membros de equipas inscritas.
--   Podem escrever: só quem criou/organiza (ou admin).
-- Não apaga dados: copia primeiro, só depois remove as colunas antigas.
-- ============================================================

-- ---- Funções auxiliares (security definer evita recursão de RLS) ----
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_member_of_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and profile_id = auth.uid()
  );
$$;

create or replace function public.can_read_scrim_room(p_scrim_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_staff()
    or exists (select 1 from public.scrims s where s.id = p_scrim_id and s.created_by = auth.uid())
    or exists (
      select 1
      from public.scrim_teams st
      join public.team_members tm on tm.team_id = st.team_id
      where st.scrim_id = p_scrim_id and tm.profile_id = auth.uid()
    );
$$;

create or replace function public.can_manage_scrim_room(p_scrim_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_staff()
    or exists (select 1 from public.scrims s where s.id = p_scrim_id and s.created_by = auth.uid());
$$;

create or replace function public.can_read_match_room(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_staff()
    or exists (
      select 1 from public.matches m
      join public.tournaments t on t.id = m.tournament_id
      where m.id = p_match_id and t.organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.matches m
      join public.tournament_teams tt on tt.tournament_id = m.tournament_id
      join public.team_members tm on tm.team_id = tt.team_id
      where m.id = p_match_id and tm.profile_id = auth.uid()
    );
$$;

create or replace function public.can_manage_match_room(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_staff()
    or exists (
      select 1 from public.matches m
      join public.tournaments t on t.id = m.tournament_id
      where m.id = p_match_id and t.organizer_id = auth.uid()
    );
$$;

-- ---- Tabelas privadas ----
create table if not exists scrim_rooms (
  scrim_id uuid primary key references scrims(id) on delete cascade,
  room_code text,
  room_password text,
  updated_at timestamptz not null default now()
);

create table if not exists match_rooms (
  match_id uuid primary key references matches(id) on delete cascade,
  room_code text,
  room_password text,
  updated_at timestamptz not null default now()
);

create trigger scrim_rooms_set_updated_at
  before update on scrim_rooms
  for each row execute function set_updated_at();

create trigger match_rooms_set_updated_at
  before update on match_rooms
  for each row execute function set_updated_at();

-- ---- Copiar dados existentes (sem perder nada) ----
insert into scrim_rooms (scrim_id, room_code, room_password)
select id, room_code, room_password
from scrims
where room_code is not null or room_password is not null
on conflict (scrim_id) do nothing;

insert into match_rooms (match_id, room_code, room_password)
select id, room_code, room_password
from matches
where room_code is not null or room_password is not null
on conflict (match_id) do nothing;

-- ---- RLS ----
alter table scrim_rooms enable row level security;
alter table match_rooms enable row level security;

create policy "scrim_rooms_select" on scrim_rooms for select
  using (public.can_read_scrim_room(scrim_id));
create policy "scrim_rooms_insert" on scrim_rooms for insert
  with check (public.can_manage_scrim_room(scrim_id));
create policy "scrim_rooms_update" on scrim_rooms for update
  using (public.can_manage_scrim_room(scrim_id))
  with check (public.can_manage_scrim_room(scrim_id));
create policy "scrim_rooms_delete" on scrim_rooms for delete
  using (public.can_manage_scrim_room(scrim_id));

create policy "match_rooms_select" on match_rooms for select
  using (public.can_read_match_room(match_id));
create policy "match_rooms_insert" on match_rooms for insert
  with check (public.can_manage_match_room(match_id));
create policy "match_rooms_update" on match_rooms for update
  using (public.can_manage_match_room(match_id))
  with check (public.can_manage_match_room(match_id));
create policy "match_rooms_delete" on match_rooms for delete
  using (public.can_manage_match_room(match_id));

-- ---- Remover as colunas públicas (só depois de copiar) ----
alter table scrims drop column if exists room_code;
alter table scrims drop column if exists room_password;
alter table matches drop column if exists room_code;
alter table matches drop column if exists room_password;
