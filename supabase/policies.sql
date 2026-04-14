alter table app612_aislekin_profiles enable row level security;
alter table app612_aislekin_households enable row level security;
alter table app612_aislekin_household_members enable row level security;
alter table app612_aislekin_invites enable row level security;
alter table app612_aislekin_lists enable row level security;
alter table app612_aislekin_items enable row level security;
alter table app612_aislekin_library_entries enable row level security;

drop policy if exists "profiles_select_own" on app612_aislekin_profiles;
create policy "profiles_select_own"
on app612_aislekin_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on app612_aislekin_profiles;
create policy "profiles_insert_own"
on app612_aislekin_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on app612_aislekin_profiles;
create policy "profiles_update_own"
on app612_aislekin_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "households_select_member" on app612_aislekin_households;
create policy "households_select_member"
on app612_aislekin_households
for select
to authenticated
using (app612_aislekin_is_member(id));

drop policy if exists "households_insert_owner" on app612_aislekin_households;
create policy "households_insert_owner"
on app612_aislekin_households
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "households_update_admin" on app612_aislekin_households;
create policy "households_update_admin"
on app612_aislekin_households
for update
to authenticated
using (app612_aislekin_is_admin(id))
with check (app612_aislekin_is_admin(id));

drop policy if exists "members_select_member" on app612_aislekin_household_members;
create policy "members_select_member"
on app612_aislekin_household_members
for select
to authenticated
using (app612_aislekin_is_member(household_id));

drop policy if exists "invites_select_member" on app612_aislekin_invites;
create policy "invites_select_member"
on app612_aislekin_invites
for select
to authenticated
using (app612_aislekin_is_member(household_id));

drop policy if exists "invites_insert_admin" on app612_aislekin_invites;
create policy "invites_insert_admin"
on app612_aislekin_invites
for insert
to authenticated
with check (
  auth.uid() = created_by
  and app612_aislekin_is_admin(household_id)
);

drop policy if exists "invites_update_admin" on app612_aislekin_invites;
create policy "invites_update_admin"
on app612_aislekin_invites
for update
to authenticated
using (app612_aislekin_is_admin(household_id))
with check (app612_aislekin_is_admin(household_id));

drop policy if exists "lists_select_member" on app612_aislekin_lists;
create policy "lists_select_member"
on app612_aislekin_lists
for select
to authenticated
using (app612_aislekin_is_member(household_id));

drop policy if exists "lists_insert_member" on app612_aislekin_lists;
create policy "lists_insert_member"
on app612_aislekin_lists
for insert
to authenticated
with check (
  auth.uid() = created_by
  and app612_aislekin_is_member(household_id)
);

drop policy if exists "lists_update_member" on app612_aislekin_lists;
create policy "lists_update_member"
on app612_aislekin_lists
for update
to authenticated
using (app612_aislekin_is_member(household_id))
with check (app612_aislekin_is_member(household_id));

drop policy if exists "lists_delete_member" on app612_aislekin_lists;
create policy "lists_delete_member"
on app612_aislekin_lists
for delete
to authenticated
using (app612_aislekin_is_member(household_id));

drop policy if exists "items_select_member" on app612_aislekin_items;
create policy "items_select_member"
on app612_aislekin_items
for select
to authenticated
using (app612_aislekin_is_member(household_id));

drop policy if exists "items_insert_member" on app612_aislekin_items;
create policy "items_insert_member"
on app612_aislekin_items
for insert
to authenticated
with check (
  auth.uid() = created_by
  and app612_aislekin_is_member(household_id)
);

drop policy if exists "items_update_member" on app612_aislekin_items;
create policy "items_update_member"
on app612_aislekin_items
for update
to authenticated
using (app612_aislekin_is_member(household_id))
with check (app612_aislekin_is_member(household_id));

drop policy if exists "items_delete_member" on app612_aislekin_items;
create policy "items_delete_member"
on app612_aislekin_items
for delete
to authenticated
using (app612_aislekin_is_member(household_id));

drop policy if exists "library_select_member" on app612_aislekin_library_entries;
create policy "library_select_member"
on app612_aislekin_library_entries
for select
to authenticated
using (app612_aislekin_is_member(household_id));

drop policy if exists "library_insert_member" on app612_aislekin_library_entries;
create policy "library_insert_member"
on app612_aislekin_library_entries
for insert
to authenticated
with check (
  auth.uid() = created_by
  and app612_aislekin_is_member(household_id)
);

drop policy if exists "library_update_member" on app612_aislekin_library_entries;
create policy "library_update_member"
on app612_aislekin_library_entries
for update
to authenticated
using (app612_aislekin_is_member(household_id))
with check (app612_aislekin_is_member(household_id));

drop policy if exists "library_delete_member" on app612_aislekin_library_entries;
create policy "library_delete_member"
on app612_aislekin_library_entries
for delete
to authenticated
using (app612_aislekin_is_member(household_id));