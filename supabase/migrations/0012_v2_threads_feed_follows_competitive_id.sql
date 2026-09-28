-- V2 · Feed estilo Threads (respostas em cadeia, reposts), follows, ID competitivo.
-- Migration incremental: não apaga nem altera dados existentes.
-- (Já aplicada no projeto Supabase; este ficheiro serve de registo e para recriar a base de dados.)

alter type notification_type add value if not exists 'new_follower';
alter type notification_type add value if not exists 'post_reply';

alter table posts add column if not exists parent_id uuid references posts(id) on delete cascade;
alter table posts add column if not exists root_id uuid references posts(id) on delete cascade;
create index if not exists posts_parent_idx on posts (parent_id) where parent_id is not null;
create index if not exists posts_root_idx on posts (root_id) where root_id is not null;
create index if not exists posts_toplevel_created_idx on posts (created_at desc) where parent_id is null;

create or replace function public.posts_thread_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    if new.parent_id is null then
      new.root_id := null;
    else
      select coalesce(p.root_id, p.id) into new.root_id from public.posts p where p.id = new.parent_id;
      if new.root_id is null then
        raise exception 'O post a que respondes já não existe.';
      end if;
    end if;
  else
    new.parent_id := old.parent_id;
    new.root_id := old.root_id;
  end if;
  return new;
end;
$$;
drop trigger if exists posts_thread_guard_trg on posts;
create trigger posts_thread_guard_trg before insert or update on posts
  for each row execute function public.posts_thread_guard();

create or replace function public.notify_post_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_parent_author uuid; v_nick text;
begin
  if new.parent_id is null then return new; end if;
  select author_id into v_parent_author from public.posts where id = new.parent_id;
  if v_parent_author is null or v_parent_author = new.author_id then return new; end if;
  select nickname into v_nick from public.profiles where id = new.author_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (v_parent_author, 'post_reply', 'Nova resposta',
          coalesce(v_nick, 'Alguém') || ' respondeu ao teu post.', '/feed/' || new.root_id);
  return new;
end;
$$;
drop trigger if exists posts_notify_reply on posts;
create trigger posts_notify_reply after insert on posts
  for each row execute function public.notify_post_reply();

create table if not exists reposts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists reposts_post_idx on reposts (post_id);
create index if not exists reposts_user_idx on reposts (user_id);
alter table reposts enable row level security;
create policy "reposts_select_all" on reposts for select using (true);
create policy "reposts_insert_own" on reposts for insert with check (user_id = auth.uid());
create policy "reposts_delete_own" on reposts for delete using (user_id = auth.uid());

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  followed_profile_id uuid references profiles(id) on delete cascade,
  followed_team_id uuid references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_one_target check ((followed_profile_id is not null)::int + (followed_team_id is not null)::int = 1),
  constraint follows_no_self check (followed_profile_id is null or followed_profile_id <> follower_id)
);
create unique index if not exists follows_profile_unique on follows (follower_id, followed_profile_id) where followed_profile_id is not null;
create unique index if not exists follows_team_unique on follows (follower_id, followed_team_id) where followed_team_id is not null;
create index if not exists follows_followed_profile_idx on follows (followed_profile_id);
create index if not exists follows_followed_team_idx on follows (followed_team_id);
create index if not exists follows_follower_idx on follows (follower_id);
alter table follows enable row level security;
create policy "follows_select_all" on follows for select using (true);
create policy "follows_insert_own" on follows for insert with check (follower_id = auth.uid());
create policy "follows_delete_own" on follows for delete using (follower_id = auth.uid());

create or replace function public.notify_new_follower()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nick text;
begin
  if new.followed_profile_id is null then return new; end if;
  select nickname into v_nick from public.profiles where id = new.follower_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (new.followed_profile_id, 'new_follower', 'Novo seguidor',
          coalesce(v_nick, 'Alguém') || ' começou a seguir-te.', '/players/' || new.follower_id);
  return new;
end;
$$;
drop trigger if exists follows_notify on follows;
create trigger follows_notify after insert on follows
  for each row execute function public.notify_new_follower();

alter table profiles add column if not exists country_code text not null default 'MZ';
alter table profiles add column if not exists competitive_id text;

create or replace function public.generate_competitive_id(p_country text)
returns text language plpgsql security definer set search_path = public as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code text; i int; attempts int := 0;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    code := 'FTH-' || upper(coalesce(p_country, 'MZ')) || '-' || code;
    exit when not exists (select 1 from public.profiles where competitive_id = code);
    attempts := attempts + 1;
    if attempts > 20 then raise exception 'Não foi possível gerar o ID competitivo.'; end if;
  end loop;
  return code;
end;
$$;

update profiles set competitive_id = public.generate_competitive_id(country_code) where competitive_id is null;
alter table profiles alter column competitive_id set not null;
create unique index if not exists profiles_competitive_id_idx on profiles (competitive_id);

create or replace function public.profiles_competitive_id_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    new.competitive_id := public.generate_competitive_id(new.country_code);
  else
    new.competitive_id := old.competitive_id;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_competitive_id_trg on profiles;
create trigger profiles_competitive_id_trg before insert or update on profiles
  for each row execute function public.profiles_competitive_id_guard();
