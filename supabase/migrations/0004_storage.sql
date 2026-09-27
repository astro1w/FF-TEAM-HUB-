-- ============================================================
-- FF TEAM HUB — Migration 0004: Storage buckets (Fase 1: avatars, team-logos)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('team-logos', 'team-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Qualquer pessoa pode ver (buckets públicos, apenas leitura).
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "team_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'team-logos');

-- Um utilizador só pode fazer upload/alterar o seu próprio avatar,
-- guardado sob o caminho "<user_id>/...".
create policy "avatars_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Só o capitão da Team pode alterar o logo, guardado sob "<team_id>/...".
create policy "team_logos_captain_write"
  on storage.objects for insert
  with check (
    bucket_id = 'team-logos'
    and exists (
      select 1 from teams t
      where t.id::text = (storage.foldername(name))[1] and t.captain_id = auth.uid()
    )
  );
