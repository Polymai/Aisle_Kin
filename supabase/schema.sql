create extension if not exists pgcrypto;

create table if not exists app612_aislekin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app612_aislekin_households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_path text,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app612_aislekin_household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app612_aislekin_households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists app612_aislekin_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app612_aislekin_households(id) on delete cascade,
  code text not null unique,
  email text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_by uuid not null references auth.users(id) on delete cascade,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  revoked_at timestamptz
);

create table if not exists app612_aislekin_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app612_aislekin_households(id) on delete cascade,
  title text not null,
  emoji text not null default '🛒',
  position integer not null default 0,
  is_archived boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app612_aislekin_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app612_aislekin_households(id) on delete cascade,
  list_id uuid not null references app612_aislekin_lists(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit text,
  notes text,
  section text not null default 'Produce',
  priority integer not null default 2 check (priority between 1 and 3),
  is_checked boolean not null default false,
  sort_order integer not null default 0,
  source_kind text not null default 'manual' check (source_kind in ('manual', 'favorite', 'staple', 'recent')),
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app612_aislekin_library_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app612_aislekin_households(id) on delete cascade,
  name text not null,
  default_quantity numeric(10,2) not null default 1,
  default_unit text,
  notes text,
  default_section text not null default 'Produce',
  priority integer not null default 2 check (priority between 1 and 3),
  kind text not null check (kind in ('favorite', 'staple')),
  usage_count integer not null default 0,
  last_used_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app612_aislekin_starter_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  emoji text not null default '🧺',
  position integer not null default 0
);

create table if not exists app612_aislekin_starter_items (
  id uuid primary key default gen_random_uuid(),
  starter_list_id uuid not null references app612_aislekin_starter_lists(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit text,
  notes text,
  section text not null default 'Produce',
  priority integer not null default 2 check (priority between 1 and 3),
  sort_order integer not null default 0,
  library_kind text check (library_kind in ('favorite', 'staple'))
);

create index if not exists app612_aislekin_household_members_user_idx
  on app612_aislekin_household_members (user_id);

create index if not exists app612_aislekin_lists_household_idx
  on app612_aislekin_lists (household_id, is_archived, position);

create index if not exists app612_aislekin_items_list_idx
  on app612_aislekin_items (list_id, is_checked, section, sort_order);

create index if not exists app612_aislekin_items_household_idx
  on app612_aislekin_items (household_id, updated_at desc);

create index if not exists app612_aislekin_invites_household_idx
  on app612_aislekin_invites (household_id, created_at desc);

create index if not exists app612_aislekin_library_household_idx
  on app612_aislekin_library_entries (household_id, kind, last_used_at desc);

create unique index if not exists app612_aislekin_library_unique_name_idx
  on app612_aislekin_library_entries (household_id, kind, lower(name));

create or replace function app612_aislekin_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app612_aislekin_profiles_touch_updated_at on app612_aislekin_profiles;
create trigger app612_aislekin_profiles_touch_updated_at
before update on app612_aislekin_profiles
for each row execute function app612_aislekin_touch_updated_at();

drop trigger if exists app612_aislekin_households_touch_updated_at on app612_aislekin_households;
create trigger app612_aislekin_households_touch_updated_at
before update on app612_aislekin_households
for each row execute function app612_aislekin_touch_updated_at();

drop trigger if exists app612_aislekin_lists_touch_updated_at on app612_aislekin_lists;
create trigger app612_aislekin_lists_touch_updated_at
before update on app612_aislekin_lists
for each row execute function app612_aislekin_touch_updated_at();

drop trigger if exists app612_aislekin_items_touch_updated_at on app612_aislekin_items;
create trigger app612_aislekin_items_touch_updated_at
before update on app612_aislekin_items
for each row execute function app612_aislekin_touch_updated_at();

drop trigger if exists app612_aislekin_library_touch_updated_at on app612_aislekin_library_entries;
create trigger app612_aislekin_library_touch_updated_at
before update on app612_aislekin_library_entries
for each row execute function app612_aislekin_touch_updated_at();

create or replace function app612_aislekin_generate_code(p_length integer default 6)
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  idx integer := 0;
begin
  if p_length < 4 then
    p_length := 4;
  end if;

  for idx in 1..p_length loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;

  return result;
end;
$$;

create or replace function app612_aislekin_is_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from app612_aislekin_household_members
    where household_id = p_household_id
      and user_id = auth.uid()
  );
$$;

create or replace function app612_aislekin_is_admin(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from app612_aislekin_household_members
    where household_id = p_household_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function app612_aislekin_create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_code text;
  v_list record;
  v_new_list_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Household name is required';
  end if;

  loop
    v_code := app612_aislekin_generate_code(6);
    exit when not exists (
      select 1 from app612_aislekin_households where invite_code = v_code
      union all
      select 1 from app612_aislekin_invites where code = v_code
    );
  end loop;

  insert into app612_aislekin_households (name, invite_code, created_by)
  values (trim(p_name), v_code, v_user_id)
  returning id into v_household_id;

  insert into app612_aislekin_household_members (household_id, user_id, role)
  values (v_household_id, v_user_id, 'admin')
  on conflict (household_id, user_id) do nothing;

  for v_list in
    select id, title, emoji, position
    from app612_aislekin_starter_lists
    order by position, title
  loop
    insert into app612_aislekin_lists (household_id, title, emoji, position, created_by)
    values (v_household_id, v_list.title, v_list.emoji, v_list.position, v_user_id)
    returning id into v_new_list_id;

    insert into app612_aislekin_items (
      household_id,
      list_id,
      name,
      quantity,
      unit,
      notes,
      section,
      priority,
      sort_order,
      source_kind,
      created_by
    )
    select
      v_household_id,
      v_new_list_id,
      name,
      quantity,
      unit,
      notes,
      section,
      priority,
      sort_order,
      coalesce(library_kind, 'manual'),
      v_user_id
    from app612_aislekin_starter_items
    where starter_list_id = v_list.id
    order by sort_order, name;
  end loop;

  insert into app612_aislekin_library_entries (
    household_id,
    name,
    default_quantity,
    default_unit,
    notes,
    default_section,
    priority,
    kind,
    usage_count,
    last_used_at,
    created_by
  )
  select
    v_household_id,
    name,
    quantity,
    unit,
    notes,
    section,
    priority,
    library_kind,
    1,
    now(),
    v_user_id
  from app612_aislekin_starter_items
  where library_kind is not null;

  return v_household_id;
end;
$$;

create or replace function app612_aislekin_create_invite(
  p_household_id uuid,
  p_email text default null,
  p_role text default 'member'
)
returns app612_aislekin_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text;
  v_invite app612_aislekin_invites;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not app612_aislekin_is_admin(p_household_id) then
    raise exception 'Admin access required';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'Invalid role';
  end if;

  loop
    v_code := app612_aislekin_generate_code(6);
    exit when not exists (
      select 1 from app612_aislekin_households where invite_code = v_code
      union all
      select 1 from app612_aislekin_invites where code = v_code
    );
  end loop;

  insert into app612_aislekin_invites (household_id, code, email, role, created_by)
  values (p_household_id, v_code, nullif(trim(coalesce(p_email, '')), ''), p_role, v_user_id)
  returning * into v_invite;

  return v_invite;
end;
$$;

create or replace function app612_aislekin_accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite app612_aislekin_invites;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_invite
  from app612_aislekin_invites
  where upper(code) = upper(trim(p_code))
    and claimed_at is null
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if v_invite.id is null then
    raise exception 'Invite not found or expired';
  end if;

  insert into app612_aislekin_household_members (household_id, user_id, role)
  values (v_invite.household_id, v_user_id, v_invite.role)
  on conflict (household_id, user_id) do nothing;

  update app612_aislekin_invites
  set claimed_by = v_user_id,
      claimed_at = coalesce(claimed_at, now())
  where id = v_invite.id;

  return v_invite.household_id;
end;
$$;