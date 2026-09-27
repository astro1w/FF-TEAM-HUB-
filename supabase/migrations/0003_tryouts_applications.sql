-- ============================================================
-- FF TEAM HUB — Migration 0003: Tryouts, candidaturas, notificações
-- ============================================================

create type application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type notification_type as enum (
  'application_received', 'application_accepted', 'application_rejected',
  'tryout_created', 'scrim_invitation', 'tournament_update',
  'match_reminder', 'message_received', 'team_update'
);

create table tryouts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  role_needed player_role not null,
  slots integer not null default 1,
  requirements text,
  description text,
  closes_at timestamptz,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint slots_positive check (slots > 0)
);

create index tryouts_team_idx on tryouts (team_id);
create index tryouts_role_idx on tryouts (role_needed);
create index tryouts_open_idx on tryouts (closes_at);

create trigger tryouts_set_updated_at
  before update on tryouts
  for each row execute function set_updated_at();

create table applications (
  id uuid primary key default gen_random_uuid(),
  tryout_id uuid not null references tryouts(id) on delete cascade,
  applicant_id uuid not null references profiles(id) on delete cascade,
  message text,
  experience text,
  availability text,
  video_url text,
  status application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (tryout_id, applicant_id)
);

create index applications_tryout_idx on applications (tryout_id);
create index applications_applicant_idx on applications (applicant_id);

create trigger applications_set_updated_at
  before update on applications
  for each row execute function set_updated_at();

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_profile_idx on notifications (profile_id, read);

-- Notifica automaticamente o capitão quando chega uma candidatura,
-- e o candidato quando o estado da candidatura muda.
create or replace function notify_new_application()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_team_captain uuid;
  v_tryout_title text;
begin
  select t.captain_id, ty.title into v_team_captain, v_tryout_title
  from tryouts ty
  join teams t on t.id = ty.team_id
  where ty.id = new.tryout_id;

  insert into notifications (profile_id, type, title, body, link)
  values (
    v_team_captain,
    'application_received',
    'Nova candidatura recebida',
    'Recebeste uma nova candidatura para "' || v_tryout_title || '".',
    '/tryouts/' || new.tryout_id
  );
  return new;
end;
$$;

create trigger applications_notify_captain
  after insert on applications
  for each row execute function notify_new_application();

create or replace function notify_application_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status <> old.status and new.status in ('accepted', 'rejected') then
    insert into notifications (profile_id, type, title, body, link)
    values (
      new.applicant_id,
      case when new.status = 'accepted' then 'application_accepted' else 'application_rejected' end,
      case when new.status = 'accepted' then 'Candidatura aceite!' else 'Candidatura rejeitada' end,
      null,
      '/tryouts/' || new.tryout_id
    );
  end if;
  return new;
end;
$$;

create trigger applications_notify_status_change
  after update on applications
  for each row execute function notify_application_status_change();

-- ---- RLS: tryouts ------------------------------------------------

alter table tryouts enable row level security;

create policy "tryouts_select_all"
  on tryouts for select
  using (true);

create policy "tryouts_captain_manage"
  on tryouts for all
  using (exists (select 1 from teams t where t.id = tryouts.team_id and t.captain_id = auth.uid()))
  with check (exists (select 1 from teams t where t.id = tryouts.team_id and t.captain_id = auth.uid()));

create policy "tryouts_admin_all"
  on tryouts for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---- RLS: applications ---------------------------------------------
-- Candidato só vê/gere a própria candidatura; capitão da Team dona do
-- tryout vê e atualiza o estado das candidaturas recebidas.

alter table applications enable row level security;

create policy "applications_select_own_or_captain"
  on applications for select
  using (
    applicant_id = auth.uid()
    or exists (
      select 1 from tryouts ty join teams t on t.id = ty.team_id
      where ty.id = applications.tryout_id and t.captain_id = auth.uid()
    )
  );

create policy "applications_insert_own"
  on applications for insert
  with check (applicant_id = auth.uid());

create policy "applications_update_own_withdraw"
  on applications for update
  using (applicant_id = auth.uid())
  with check (applicant_id = auth.uid() and status = 'withdrawn');

create policy "applications_update_captain_decision"
  on applications for update
  using (exists (
    select 1 from tryouts ty join teams t on t.id = ty.team_id
    where ty.id = applications.tryout_id and t.captain_id = auth.uid()
  ))
  with check (exists (
    select 1 from tryouts ty join teams t on t.id = ty.team_id
    where ty.id = applications.tryout_id and t.captain_id = auth.uid()
  ));

-- ---- RLS: notifications ---------------------------------------------

alter table notifications enable row level security;

create policy "notifications_select_own"
  on notifications for select
  using (profile_id = auth.uid());

create policy "notifications_update_own_read_state"
  on notifications for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
