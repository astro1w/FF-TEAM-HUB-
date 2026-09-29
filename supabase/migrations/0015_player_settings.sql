-- V2.1 · Configurações do Jogador: privacidade, notificações, bloqueios, segurança, conta.
-- Migration incremental — não apaga nem altera dados existentes.

create type message_permission as enum ('everyone', 'team', 'none');
create type profile_visibility as enum ('everyone', 'team', 'none');
create type competitive_status as enum ('searching', 'in_team', 'unavailable');

alter table profiles add column if not exists who_can_message message_permission not null default 'everyone';
alter table profiles add column if not exists who_can_comment message_permission not null default 'everyone';
alter table profiles add column if not exists profile_visibility profile_visibility not null default 'everyone';
alter table profiles add column if not exists show_online_status boolean not null default true;
alter table profiles add column if not exists show_uid boolean not null default true;
alter table profiles add column if not exists show_stats boolean not null default true;
alter table profiles add column if not exists competitive_status competitive_status not null default 'searching';
-- Preferências de UI ainda sem suporte real na app (arquitetura visual/i18n não preparada);
-- guardadas desde já para não perder a escolha do jogador quando a app passar a suportá-las.
alter table profiles add column if not exists theme_preference text not null default 'system'
  check (theme_preference in ('light', 'dark', 'system'));
alter table profiles add column if not exists locale text not null default 'pt' check (locale in ('pt', 'en'));

-- Uma linha por tipo de notificação que o jogador desligou (ausente = ligado; simples e sem migrar defaults).
create table if not exists notification_mutes (
  profile_id uuid not null references profiles(id) on delete cascade,
  notification_type notification_type not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, notification_type)
);
alter table notification_mutes enable row level security;
create policy "notification_mutes_own" on notification_mutes for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create or replace function public.notifications_muted(p_profile uuid, p_type notification_type)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.notification_mutes where profile_id = p_profile and notification_type = p_type);
$$;
revoke all on function public.notifications_muted(uuid, notification_type) from public;
grant execute on function public.notifications_muted(uuid, notification_type) to authenticated;

-- ---------- bloqueios ----------
create table if not exists blocked_players (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocked_players_no_self check (blocker_id <> blocked_id)
);
create index if not exists blocked_players_blocked_idx on blocked_players (blocked_id);
alter table blocked_players enable row level security;
create policy "blocked_players_manage_own" on blocked_players for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create or replace function public.is_blocked_either_way(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocked_players
    where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  );
$$;
revoke all on function public.is_blocked_either_way(uuid, uuid) from public;
grant execute on function public.is_blocked_either_way(uuid, uuid) to authenticated;

create or replace function public.block_player(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_target is null or p_target = auth.uid() then raise exception 'Alvo inválido.'; end if;
  insert into public.blocked_players (blocker_id, blocked_id) values (auth.uid(), p_target)
  on conflict do nothing;
end;
$$;
revoke all on function public.block_player(uuid) from public;
grant execute on function public.block_player(uuid) to authenticated;

create or replace function public.unblock_player(p_target uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.blocked_players where blocker_id = auth.uid() and blocked_id = p_target;
$$;
revoke all on function public.unblock_player(uuid) from public;
grant execute on function public.unblock_player(uuid) to authenticated;

-- Bloquear corta mensagens nos dois sentidos, mesmo em conversas já existentes.
drop policy if exists "messages_insert_member" on messages;
create policy "messages_insert_member" on messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
    and not exists (
      select 1 from conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.profile_id <> auth.uid()
        and public.is_blocked_either_way(auth.uid(), cm.profile_id)
    )
  );

-- Nova conversa respeita bloqueio e a preferência "quem pode enviar mensagens".
create or replace function public.get_or_create_dm(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_conv uuid; v_perm message_permission;
begin
  if v_me is null then raise exception 'Sessão inválida.'; end if;
  if p_other is null or p_other = v_me then raise exception 'Destinatário inválido.'; end if;
  if not exists (select 1 from profiles where id = p_other and status = 'active') then
    raise exception 'Este jogador não está disponível.';
  end if;
  if public.is_blocked_either_way(v_me, p_other) then
    raise exception 'Não é possível enviar mensagens a este jogador.';
  end if;

  select who_can_message into v_perm from profiles where id = p_other;
  if v_perm = 'none' then
    raise exception 'Este jogador não está a aceitar mensagens de momento.';
  elsif v_perm = 'team' then
    if not exists (
      select 1 from team_members a join team_members b on a.team_id = b.team_id
      where a.profile_id = v_me and b.profile_id = p_other
    ) then
      raise exception 'Este jogador só aceita mensagens de colegas de equipa.';
    end if;
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

-- Respostas (comentários) respeitam bloqueio e "quem pode comentar" do autor do post original.
create or replace function public.posts_thread_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_parent_author uuid; v_perm message_permission;
begin
  if TG_OP = 'INSERT' then
    if new.parent_id is null then
      new.root_id := null;
    else
      select coalesce(p.root_id, p.id), pr.id, pr.who_can_comment
        into new.root_id, v_parent_author, v_perm
      from public.posts p join public.profiles pr on pr.id = p.author_id
      where p.id = new.parent_id;

      if new.root_id is null and v_parent_author is null then
        raise exception 'O post a que respondes já não existe.';
      end if;
      if v_parent_author is not null and v_parent_author <> new.author_id then
        if public.is_blocked_either_way(new.author_id, v_parent_author) then
          raise exception 'Não é possível responder a este jogador.';
        end if;
        if v_perm = 'none' then
          raise exception 'Este jogador desativou os comentários nas publicações dele.';
        elsif v_perm = 'team' and not exists (
          select 1 from team_members a join team_members b on a.team_id = b.team_id
          where a.profile_id = new.author_id and b.profile_id = v_parent_author
        ) then
          raise exception 'Só colegas de equipa podem comentar nas publicações deste jogador.';
        end if;
      end if;
    end if;
  else
    new.parent_id := old.parent_id;
    new.root_id := old.root_id;
  end if;
  return new;
end;
$$;

-- ---------- notificações respeitam as preferências e os bloqueios ----------
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
    and not public.notifications_muted(m.profile_id, 'message_received')
    and not exists (
      select 1 from public.notifications n
      where n.profile_id = m.profile_id and n.type = 'message_received'
        and n.link = '/messages/' || new.conversation_id and n.read = false
    );
  return new;
end;
$$;

create or replace function public.notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_root uuid; v_id uuid; v_nick text; v_link text;
begin
  select author_id, root_id, id into v_author, v_root, v_id from public.posts where id = new.post_id;
  if v_author is null or v_author = new.user_id then return new; end if;
  if public.notifications_muted(v_author, 'post_like') then return new; end if;
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

create or replace function public.notify_post_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_parent_author uuid; v_nick text;
begin
  if new.parent_id is null then return new; end if;
  select author_id into v_parent_author from public.posts where id = new.parent_id;
  if v_parent_author is null or v_parent_author = new.author_id then return new; end if;
  if public.notifications_muted(v_parent_author, 'post_reply') then return new; end if;
  select nickname into v_nick from public.profiles where id = new.author_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (v_parent_author, 'post_reply', 'Nova resposta',
          coalesce(v_nick, 'Alguém') || ' respondeu ao teu post.', '/feed/' || new.root_id);
  return new;
end;
$$;

create or replace function public.notify_new_follower()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nick text;
begin
  if new.followed_profile_id is null then return new; end if;
  if public.notifications_muted(new.followed_profile_id, 'new_follower') then return new; end if;
  select nickname into v_nick from public.profiles where id = new.follower_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (new.followed_profile_id, 'new_follower', 'Novo seguidor',
          coalesce(v_nick, 'Alguém') || ' começou a seguir-te.', '/players/' || new.follower_id);
  return new;
end;
$$;

-- list_my_conversations passa a respeitar "mostrar estado online" do outro participante.
create or replace function public.list_my_conversations()
returns table (
  c_id uuid, c_is_group boolean, c_title text, c_team_id uuid, c_created_at timestamptz,
  other_id uuid, other_nickname text, other_avatar_url text, other_verified boolean, other_show_online boolean,
  last_body text, last_at timestamptz, last_sender_id uuid, unread_count integer
) language sql stable security definer set search_path = public as $$
  select c.id, c.is_group, c.title, c.team_id, c.created_at,
         o.profile_id, p.nickname, p.avatar_url, coalesce(p.is_verified, false), coalesce(p.show_online_status, true),
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

-- ---------- pedido de eliminação de conta ----------
-- A anon key não tem permissão para apagar utilizadores do Supabase Auth; fica registado o
-- pedido e um administrador confirma a eliminação. Suspende a conta de imediato para o jogador
-- deixar de aparecer como ativo enquanto o pedido não é processado.
create table if not exists account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table account_deletion_requests enable row level security;
create policy "account_deletion_requests_own_select" on account_deletion_requests for select
  using (profile_id = auth.uid());
create policy "account_deletion_requests_own_insert" on account_deletion_requests for insert
  with check (profile_id = auth.uid());

create or replace function public.request_account_deletion(p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into account_deletion_requests (profile_id, reason) values (auth.uid(), p_reason);
  update profiles set status = 'suspended' where id = auth.uid();
end;
$$;
revoke all on function public.request_account_deletion(text) from public;
grant execute on function public.request_account_deletion(text) to authenticated;
