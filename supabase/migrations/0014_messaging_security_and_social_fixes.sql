-- V2.1 · Mensagens: correção de segurança (RLS) + funcionalidades em falta.
-- Migration incremental. Não apaga mensagens nem conversas.
--
-- PROBLEMAS CORRIGIDOS (da 0007):
--  1. messages_select_member / messages_insert_member / conversation_members_select_own:
--     dentro do subselect, `conversation_id` (sem prefixo) resolvia para cm.conversation_id,
--     tornando a condição sempre verdadeira → qualquer membro de QUALQUER conversa podia
--     ler/escrever em todas. Além disso a política de conversation_members consultava a
--     própria tabela (recursão de RLS).
--  2. conversations_select_member: `cm.conversation_id = id` comparava com cm.id (nunca
--     verdadeiro) → a lista de conversas vinha vazia.
--  3. conversations_insert_auth / conversation_members_insert: qualquer utilizador podia
--     criar conversas e meter QUALQUER pessoa em QUALQUER conversa. A criação passa a ser
--     feita só pela função get_or_create_dm().

alter type notification_type add value if not exists 'post_like';

-- ---------- helper sem recursão de RLS ----------
create or replace function public.is_conversation_member(p_conversation uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation and profile_id = auth.uid()
  );
$$;
revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- ---------- políticas ----------
drop policy if exists "conversations_select_member" on conversations;
drop policy if exists "conversations_insert_auth" on conversations;
drop policy if exists "conversation_members_select_own" on conversation_members;
drop policy if exists "conversation_members_insert" on conversation_members;
drop policy if exists "messages_select_member" on messages;
drop policy if exists "messages_insert_member" on messages;

create policy "conversations_select_member" on conversations for select
  using (public.is_conversation_member(id));

create policy "conversation_members_select_same_conversation" on conversation_members for select
  using (profile_id = auth.uid() or public.is_conversation_member(conversation_id));

create policy "messages_select_member" on messages for select
  using (public.is_conversation_member(conversation_id));

create policy "messages_insert_member" on messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- Sem políticas de INSERT/UPDATE/DELETE em conversations e conversation_members:
-- só as funções abaixo (security definer) as alteram.

-- ---------- idempotência de envio (evita mensagens duplicadas em retry) ----------
alter table messages add column if not exists client_id uuid;
create unique index if not exists messages_client_unique on messages (sender_id, client_id) where client_id is not null;

-- ---------- criar / encontrar DM ----------
create or replace function public.get_or_create_dm(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_conv uuid;
begin
  if v_me is null then raise exception 'Sessão inválida.'; end if;
  if p_other is null or p_other = v_me then raise exception 'Destinatário inválido.'; end if;
  if not exists (select 1 from profiles where id = p_other and status = 'active') then
    raise exception 'Este jogador não está disponível.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(least(v_me::text, p_other::text) || greatest(v_me::text, p_other::text), 0));

  select c.id into v_conv
  from conversations c
  where c.is_group = false
    and exists (select 1 from conversation_members m where m.conversation_id = c.id and m.profile_id = v_me)
    and exists (select 1 from conversation_members m where m.conversation_id = c.id and m.profile_id = p_other)
    and (select count(*) from conversation_members m where m.conversation_id = c.id) = 2
  limit 1;

  if v_conv is null then
    insert into conversations (is_group) values (false) returning id into v_conv;
    insert into conversation_members (conversation_id, profile_id, last_read_at)
    values (v_conv, v_me, now()), (v_conv, p_other, null);
  end if;
  return v_conv;
end;
$$;
revoke all on function public.get_or_create_dm(uuid) from public;
grant execute on function public.get_or_create_dm(uuid) to authenticated;

-- ---------- marcar como lida ----------
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversation_members set last_read_at = now()
  where conversation_id = p_conversation and profile_id = auth.uid();
$$;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ---------- lista de conversas numa só consulta (sem N+1) ----------
create or replace function public.list_my_conversations()
returns table (
  c_id uuid, c_is_group boolean, c_title text, c_team_id uuid, c_created_at timestamptz,
  other_id uuid, other_nickname text, other_avatar_url text, other_verified boolean,
  last_body text, last_at timestamptz, last_sender_id uuid, unread_count integer
) language sql stable security definer set search_path = public as $$
  select c.id, c.is_group, c.title, c.team_id, c.created_at,
         o.profile_id, p.nickname, p.avatar_url, coalesce(p.is_verified, false),
         lm.body, lm.created_at, lm.sender_id,
         (select count(*) from public.messages m
           where m.conversation_id = c.id and m.sender_id <> auth.uid()
             and m.created_at > coalesce(me.last_read_at, '-infinity'::timestamptz))::int
  from public.conversation_members me
  join public.conversations c on c.id = me.conversation_id
  left join lateral (
    select x.profile_id from public.conversation_members x
    where x.conversation_id = c.id and x.profile_id <> auth.uid()
    order by x.joined_at limit 1
  ) o on true
  left join public.profiles p on p.id = o.profile_id
  left join lateral (
    select m.body, m.created_at, m.sender_id from public.messages m
    where m.conversation_id = c.id order by m.created_at desc limit 1
  ) lm on true
  where me.profile_id = auth.uid()
  order by coalesce(lm.created_at, c.created_at) desc;
$$;
revoke all on function public.list_my_conversations() from public;
grant execute on function public.list_my_conversations() to authenticated;

-- ---------- notificações: nova mensagem e like ----------
-- Uma só notificação não lida por conversa/post (evita spam).
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nick text;
begin
  select nickname into v_nick from public.profiles where id = new.sender_id;
  insert into public.notifications (profile_id, type, title, body, link)
  select m.profile_id, 'message_received', 'Nova mensagem',
         coalesce(v_nick, 'Alguém') || ': ' || left(new.body, 80),
         '/messages/' || new.conversation_id
  from public.conversation_members m
  where m.conversation_id = new.conversation_id and m.profile_id <> new.sender_id
    and not exists (
      select 1 from public.notifications n
      where n.profile_id = m.profile_id and n.type = 'message_received'
        and n.link = '/messages/' || new.conversation_id and n.read = false
    );
  return new;
end;
$$;
drop trigger if exists messages_notify on messages;
create trigger messages_notify after insert on messages for each row execute function public.notify_new_message();

create or replace function public.notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_root uuid; v_id uuid; v_nick text; v_link text;
begin
  select author_id, root_id, id into v_author, v_root, v_id from public.posts where id = new.post_id;
  if v_author is null or v_author = new.user_id then return new; end if;
  v_link := '/feed/' || coalesce(v_root, v_id);
  select nickname into v_nick from public.profiles where id = new.user_id;
  if exists (select 1 from public.notifications n
             where n.profile_id = v_author and n.type = 'post_like' and n.link = v_link and n.read = false) then
    return new;
  end if;
  insert into public.notifications (profile_id, type, title, body, link)
  values (v_author, 'post_like', 'Novo like', coalesce(v_nick, 'Alguém') || ' gostou do teu post.', v_link);
  return new;
end;
$$;
drop trigger if exists likes_notify on likes;
create trigger likes_notify after insert on likes for each row execute function public.notify_post_like();

-- ---------- realtime (usa a infraestrutura Supabase já existente) ----------
do $$
declare t text;
begin
  foreach t in array array['messages', 'conversation_members', 'posts', 'notifications'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
