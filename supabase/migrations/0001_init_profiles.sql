-- ============================================================
-- FF TEAM HUB — Migration 0001: Extensões, enums e profiles
-- ============================================================

create extension if not exists "pgcrypto";

-- ---- ENUMS ----------------------------------------------------

create type user_role as enum ('player', 'captain', 'organizer', 'moderator', 'admin');
create type account_status as enum ('active', 'suspended', 'banned');
create type player_role as enum ('RUSH', 'IGL', 'SUPPORT', 'SNIPER', 'FLEX');
create type skill_level as enum ('Iniciante', 'Intermédio', 'Competitivo', 'Avançado');
create type availability_slot as enum ('Manhã', 'Tarde', 'Noite', 'Fim de semana');

-- ---- FUNÇÃO GENÉRICA PARA updated_at ---------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---- TABELA: profiles ------------------------------------------
-- Estende auth.users (Supabase Auth) com dados competitivos.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  free_fire_id text,
  country text not null default 'Moçambique',
  province text,
  city text,
  primary_role player_role,
  secondary_role player_role,
  skill_level skill_level,
  availability availability_slot[] default '{}',
  bio text,
  avatar_url text,
  role user_role not null default 'player',
  status account_status not null default 'active',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint nickname_length check (char_length(nickname) between 2 and 32)
);

create unique index profiles_nickname_unique_idx on profiles (lower(nickname));
create index profiles_country_province_idx on profiles (country, province);
create index profiles_role_idx on profiles (role);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Cria automaticamente um perfil mínimo quando um utilizador se regista,
-- como rede de segurança caso o insert do frontend falhe (ex: perda de rede).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', 'Player' || substr(new.id::text, 1, 6)),
    'Moçambique'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---- RLS: profiles -----------------------------------------------

alter table profiles enable row level security;

-- Qualquer utilizador autenticado pode ver perfis públicos (não suspensos/banidos
-- para terceiros; o próprio dono vê sempre o seu).
create policy "profiles_select_public"
  on profiles for select
  using (status = 'active' or id = auth.uid());

create policy "profiles_insert_own"
  on profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- um jogador comum não pode auto-promover-se a admin/moderador/organizador
    and role in ('player', 'captain')
  );

-- Admins podem gerir qualquer perfil (suspender, banir, mudar role).
create policy "profiles_admin_all"
  on profiles for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
