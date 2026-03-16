create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invited_by uuid not null references public.profiles(id),
  invitee_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (group_id, invitee_id, status)
);

alter table public.group_invitations enable row level security;

-- Invitee can see their own invitations; group admin can see invitations for their group
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_invitations'
      and policyname = 'group_invitations_select'
  ) then
    create policy group_invitations_select
      on public.group_invitations
      for select
      to authenticated
      using (
        auth.uid() = invitee_id
        or auth.uid() in (
          select gm.user_id
          from public.group_members gm
          where gm.group_id = group_invitations.group_id
            and gm.role = 'admin'
        )
      );
  end if;
end $$;
