-- ============================================================
-- FF TEAM HUB — Migration 0007: Feed + Messaging
-- ============================================================

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  body text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_body_length check (char_length(body) between 1 and 2000)
);

create index posts_created_idx on posts (created_at desc);
create index posts_author_idx on posts (author_id);

create trigger posts_set_updated_at
  before update on posts for each row execute function set_updated_at();

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint comment_body_length check (char_length(body) between 1 and 1000)
);

create index comments_post_idx on comments (post_id);

create table likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index likes_post_idx on likes (post_id);

-- Messaging
create table conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  team_id uuid references teams(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (conversation_id, profile_id)
);

create index conversation_members_profile_idx on conversation_members (profile_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint message_body_length check (char_length(body) between 1 and 4000)
);

create index messages_conversation_idx on messages (conversation_id, created_at);

-- RLS
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;

create policy "posts_select_all" on posts for select using (true);
create policy "posts_insert_own" on posts for insert with check (author_id = auth.uid());
create policy "posts_update_own" on posts for update using (author_id = auth.uid());
create policy "posts_delete_own" on posts for delete
  using (
    author_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

create policy "comments_select_all" on comments for select using (true);
create policy "comments_insert_own" on comments for insert with check (author_id = auth.uid());
create policy "comments_delete_own" on comments for delete
  using (
    author_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

create policy "likes_select_all" on likes for select using (true);
create policy "likes_insert_own" on likes for insert with check (user_id = auth.uid());
create policy "likes_delete_own" on likes for delete using (user_id = auth.uid());

create policy "conversations_select_member" on conversations for select
  using (exists (
    select 1 from conversation_members cm
    where cm.conversation_id = id and cm.profile_id = auth.uid()
  ));

create policy "conversations_insert_auth" on conversations for insert
  with check (auth.uid() is not null);

create policy "conversation_members_select_own" on conversation_members for select
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from conversation_members cm2
      where cm2.conversation_id = conversation_id and cm2.profile_id = auth.uid()
    )
  );

create policy "conversation_members_insert" on conversation_members for insert
  with check (auth.uid() is not null);

create policy "messages_select_member" on messages for select
  using (exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversation_id and cm.profile_id = auth.uid()
  ));

create policy "messages_insert_member" on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversation_id and cm.profile_id = auth.uid()
    )
  );
