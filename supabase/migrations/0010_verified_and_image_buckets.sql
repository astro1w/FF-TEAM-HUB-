-- Selo de verificado (só admin/SQL pode alterar), buckets de imagens e promoção automática a capitão.
alter table profiles add column if not exists is_verified boolean not null default false;

create or replace function public.my_verified()
returns boolean language sql stable security definer set search_path = public as $$
  select is_verified from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.my_role()
    and status = public.my_status()
    and is_verified = public.my_verified()
  );

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert
  with check (id = auth.uid() and role = 'player' and status = 'active' and is_verified = false);

create or replace function public.promote_team_creator()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set role = 'captain' where id = new.captain_id and role = 'player';
  return new;
end;
$$;

drop trigger if exists teams_promote_creator on teams;
create trigger teams_promote_creator after insert on teams
  for each row execute function public.promote_team_creator();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('post-media', 'post-media', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('tournament-banners', 'tournament-banners', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "post_media_public_read" on storage.objects for select using (bucket_id = 'post-media');
create policy "post_media_owner_insert" on storage.objects for insert
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tournament_banners_public_read" on storage.objects for select using (bucket_id = 'tournament-banners');
create policy "tournament_banners_owner_insert" on storage.objects for insert
  with check (bucket_id = 'tournament-banners' and (storage.foldername(name))[1] = auth.uid()::text);
