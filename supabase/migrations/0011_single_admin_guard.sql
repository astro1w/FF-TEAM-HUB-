-- Ninguém consegue criar administradores a partir da app (API).
-- Só é possível diretamente na base de dados (SQL Editor / painel Supabase), onde auth.uid() é nulo.
create or replace function public.block_admin_promotion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'admin' and old.role is distinct from 'admin' and auth.uid() is not null then
    raise exception 'Administradores só podem ser criados diretamente na base de dados.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_admin_promotion on profiles;
create trigger profiles_block_admin_promotion
  before update on profiles
  for each row execute function public.block_admin_promotion();
