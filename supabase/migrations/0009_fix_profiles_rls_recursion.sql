-- Corrige recursão infinita nas políticas RLS de profiles.
-- As funções security definer leem profiles sem passar pelo RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_status()
returns account_status language sql stable security definer set search_path = public as $$
  select status from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles_admin_all" on profiles;
create policy "profiles_admin_all" on profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- O utilizador não pode alterar o seu próprio role nem status.
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role() and status = public.my_status());
