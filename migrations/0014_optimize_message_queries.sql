-- FF TEAM HUB — Migration 0014
-- Otimização das queries de mensagens e conversas.
-- Rever políticas RLS e testar em staging antes de produção.

create index if not exists messages_conversation_created_desc_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists messages_conversation_sender_created_idx
  on public.messages (conversation_id, sender_id, created_at desc);

create index if not exists conversation_members_profile_conversation_idx
  on public.conversation_members (profile_id, conversation_id);

create index if not exists conversation_members_conversation_profile_idx
  on public.conversation_members (conversation_id, profile_id);

create or replace function public.list_my_conversations(
  p_limit integer default 30,
  p_before timestamptz default null
)
returns table (
  id uuid,
  is_group boolean,
  title text,
  team_id uuid,
  created_at timestamptz,
  other_profile_id uuid,
  other_nickname text,
  other_avatar_url text,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint,
  last_read_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.is_group,
    c.title,
    c.team_id,
    c.created_at,
    other_member.profile_id,
    other_profile.nickname,
    other_profile.avatar_url,
    last_msg.body,
    last_msg.created_at,
    coalesce(unread.total, 0),
    mine.last_read_at
  from public.conversation_members mine
  join public.conversations c on c.id = mine.conversation_id
  left join lateral (
    select cm.profile_id
    from public.conversation_members cm
    where cm.conversation_id = c.id
      and cm.profile_id <> auth.uid()
    order by cm.joined_at asc
    limit 1
  ) other_member on true
  left join public.profiles other_profile
    on other_profile.id = other_member.profile_id
  left join lateral (
    select m.body, m.created_at
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) last_msg on true
  left join lateral (
    select count(*)::bigint as total
    from public.messages m
    where m.conversation_id = c.id
      and m.sender_id <> auth.uid()
      and m.created_at > coalesce(
        mine.last_read_at,
        '1970-01-01T00:00:00Z'::timestamptz
      )
  ) unread on true
  where mine.profile_id = auth.uid()
    and (
      p_before is null
      or coalesce(last_msg.created_at, c.created_at) < p_before
    )
  order by coalesce(last_msg.created_at, c.created_at) desc
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function public.list_my_conversations(integer, timestamptz)
from public;

grant execute on function public.list_my_conversations(integer, timestamptz)
to authenticated;

create or replace function public.mark_conversation_read(
  p_conversation_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.conversation_members
  set last_read_at = now()
  where conversation_id = p_conversation_id
    and profile_id = auth.uid();

  if not found then
    raise exception 'Não tens acesso a esta conversa.';
  end if;
end;
$$;

revoke all on function public.mark_conversation_read(uuid)
from public;

grant execute on function public.mark_conversation_read(uuid)
to authenticated;

create or replace function public.get_or_create_dm(
  p_other_profile_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_user_id is null then
    raise exception 'Utilizador não autenticado.';
  end if;

  if v_user_id = p_other_profile_id then
    raise exception 'Não podes iniciar uma conversa contigo próprio.';
  end if;

  select cm1.conversation_id
  into v_conversation_id
  from public.conversation_members cm1
  join public.conversation_members cm2
    on cm2.conversation_id = cm1.conversation_id
  join public.conversations c
    on c.id = cm1.conversation_id
  where cm1.profile_id = v_user_id
    and cm2.profile_id = p_other_profile_id
    and c.is_group = false
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (is_group)
  values (false)
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, profile_id)
  values
    (v_conversation_id, v_user_id),
    (v_conversation_id, p_other_profile_id);

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_dm(uuid)
from public;

grant execute on function public.get_or_create_dm(uuid)
to authenticated;
