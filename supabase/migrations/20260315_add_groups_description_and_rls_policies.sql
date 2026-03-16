alter table public.groups
add column if not exists description text;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'groups'
      and policyname = 'groups_select_member'
  ) then
    create policy groups_select_member
      on public.groups
      for select
      to authenticated
      using (
        auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = groups.id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'groups'
      and policyname = 'groups_insert_authenticated'
  ) then
    create policy groups_insert_authenticated
      on public.groups
      for insert
      to authenticated
      with check (auth.uid() is not null and created_by = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'groups'
      and policyname = 'groups_update_admin'
  ) then
    create policy groups_update_admin
      on public.groups
      for update
      to authenticated
      using (
        auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = groups.id
            and gm.role = 'admin'
        )
      )
      with check (
        auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = groups.id
            and gm.role = 'admin'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'group_members_select_member'
  ) then
    create policy group_members_select_member
      on public.group_members
      for select
      to authenticated
      using (
        auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = group_members.group_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'group_members_insert_self_or_admin'
  ) then
    -- Only the group creator may insert themselves as admin (group bootstrap).
    -- Story 2.2 will extend this policy to allow invite-based joins.
    create policy group_members_insert_self_or_admin
      on public.group_members
      for insert
      to authenticated
      with check (
        user_id = auth.uid()
        and role = 'admin'
        and auth.uid() in (
          select g.created_by
          from public.groups g
          where g.id = group_members.group_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'group_members_update_admin'
  ) then
    create policy group_members_update_admin
      on public.group_members
      for update
      to authenticated
      using (
        auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = group_members.group_id
            and gm.role = 'admin'
        )
      )
      with check (
        auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = group_members.group_id
            and gm.role = 'admin'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'group_members_delete_admin'
  ) then
    create policy group_members_delete_admin
      on public.group_members
      for delete
      to authenticated
      using (
        -- User can remove themselves (self-removal / leave group)
        user_id = auth.uid()
        -- Group admin can remove any member
        or auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = group_members.group_id
            and gm.role = 'admin'
        )
      );
  end if;
end $$;
