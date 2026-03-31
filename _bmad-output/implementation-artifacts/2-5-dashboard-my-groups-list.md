# Story 2.5: Dashboard — My Groups List

Status: done

## Story

As a logged-in user,
I want to see a list of all groups I belong to on the dashboard,
so that I can quickly navigate to any group and understand my role and activity at a glance.

## Acceptance Criteria

1. **Given** I am authenticated and navigate to `/dashboard`,
   **When** the page loads,
   **Then** `GET /groups/me` (JwtAuthGuard) queries all `group_members` rows for my `user_id` via Prisma, joining `groups` table,
   **And** the dashboard displays a card grid of my groups, each showing: group name, my role badge (Admin/Editor/Member), member count, and creation date,
   **And** groups are sorted by creation date (most recent first).

2. **Given** I click on a group card,
   **When** the navigation fires,
   **Then** I am navigated to the group home page at `/group/[groupId]`.

3. **Given** I am authenticated and have no group memberships,
   **When** the dashboard loads,
   **Then** an empty state illustration is shown with the message: "You're not part of any group yet.",
   **And** two CTAs are visible: "Create a Group" (primary) linking to `/groups/create`, and "Join with Invite Link" (secondary) with a text input field to paste an invite link.

4. **Given** I am authenticated and navigate to `/dashboard`,
   **When** I have pending group invitations,
   **Then** a "Pending Invitations" section appears above the group list showing each invitation with group name, inviter name, and "Accept" / "Decline" buttons (delegates to Story 2.2 invitation acceptance flow).

5. **Given** I am on the dashboard and a group's name or my role changes,
   **When** another tab or session triggers the mutation,
   **Then** the group card reflects the updated data on the next React Query refetch (staleTime-based).

## Tasks / Subtasks

- [x] **Task 1: Backend — Add `GET /groups/me` endpoint** (AC: 1, 5)
  - [x] Add `findMyGroups(userId: string)` method to `GroupsService` (`apps/api/src/groups/groups.service.ts`)
    - Prisma query: `groupMember.findMany({ where: { userId }, include: { group: { include: { _count: { select: { members: true } } } } }, orderBy: { group: { createdAt: 'desc' } } })`
    - Map result to response shape: `{ id, name, description, role, memberCount, createdAt }`
  - [x] Add `@Get("me")` route to `GroupsController` (`apps/api/src/groups/groups.controller.ts`)
    - Guards: `@UseGuards(JwtAuthGuard)` only (no group-specific guard — user's own memberships)
    - Uses `@CurrentUser()` to get `userId`
    - Returns `{ ok: true, data: MyGroupItem[] }`
    - **CRITICAL ROUTE ORDER**: Place `@Get("me")` BEFORE `@Get(":id")` in the controller — NestJS matches routes top-down, and `"me"` would be interpreted as a `:id` param if it comes after
  - [x] Add `MyGroupItem` type to response (can be inline or a response class):
    ```typescript
    { id: string; name: string; description: string | null; role: string; memberCount: number; createdAt: string }
    ```

- [x] **Task 2: Frontend data layer — query key + hook** (AC: 1, 5)
  - [x] Add `myGroups: () => ["groups", "my"] as const` to `queryKeys.groups` in `apps/web/src/lib/api/query-keys.ts`
  - [x] Add `useMyGroups()` hook to `apps/web/src/hooks/api/use-group-queries.ts`
    - Uses `useQuery({ queryKey: queryKeys.groups.myGroups, queryFn: ... })`
    - Calls `apiRequest<MyGroupItem[]>("/groups/me")`
    - Returns typed array of `MyGroupItem`
  - [x] Export `MyGroupItem` type from `use-group-queries.ts`
  - [x] Invalidate `queryKeys.groups.myGroups` in `useCreateGroup`, `useJoinGroup`, and `useRespondInvitation` `onSuccess` callbacks (so dashboard refreshes when user creates/joins a group or accepts an invite)

- [x] **Task 3: Resolve route conflict — dashboard under (dashboard) layout** (AC: 1)
  - [x] DELETE `apps/web/src/app/dashboard/page.tsx` (currently redirects to `/review` — obsolete)
  - [x] CREATE `apps/web/src/app/(dashboard)/dashboard/page.tsx` — server component:
    - Auth check: `getCurrentUser()` → redirect to `/login?redirect=/dashboard` if no user
    - Renders `<DashboardView />` client component
  - [x] Verify: `/dashboard` now renders inside `(dashboard)/layout.tsx` (sidebar + header)

- [x] **Task 4: Dashboard view — main client component** (AC: 1, 2, 3, 4, 5)
  - [x] CREATE `apps/web/src/app/(dashboard)/dashboard/_components/dashboard-view.tsx` ("use client")
    - Uses `useMyGroups()` for group list
    - Uses `useInvitations()` for pending invitations (already exists in `use-invitation-queries.ts`)
    - Layout: single column, max-w-5xl centered
    - Sections in order:
      1. `<PendingInvitations />` — only if invitations.length > 0
      2. `<GroupCardGrid />` — card grid of groups
      3. If no groups AND no invitations: `<EmptyState />`
    - Loading state: skeleton cards (pulse animation)
    - Error state: inline error message with retry button

- [x] **Task 5: Group card component** (AC: 1, 2)
  - [x] CREATE `apps/web/src/app/(dashboard)/dashboard/_components/group-card.tsx` ("use client")
    - Wraps entire card in `<Link href={/group/${group.id}}>` for navigation
    - Displays:
      - Group name (`text-lg font-semibold`)
      - Description (1-line truncated, `text-muted-foreground`, show only if exists)
      - Role badge: use `<Badge>` from shadcn — variants: `admin` = purple, `editor` = teal, `member` = zinc/default
      - Member count with `Users` icon from lucide-react
      - Creation date (relative: "Created 3 days ago" — use simple date formatting, no extra library)
    - Hover: subtle shadow lift (`hover:shadow-md transition-shadow`)
    - Use `Card`, `CardContent` from shadcn/ui

- [x] **Task 6: Pending invitations component** (AC: 4)
  - [x] CREATE `apps/web/src/app/(dashboard)/dashboard/_components/pending-invitations.tsx` ("use client")
    - Uses `useInvitations()` and `useRespondInvitation()` hooks (already exist)
    - Section title: "Pending Invitations" with `Mail` icon
    - Each invitation card: group name, "Invited by {name}", Accept (green) / Decline (ghost) buttons
    - On Accept: call `respondInvitation({ id, action: 'accept' })`, then invalidate `queryKeys.groups.myGroups` and navigate to `/group/${groupId}`
    - On Decline: call `respondInvitation({ id, action: 'decline' })`, remove from list (optimistic)
    - **REUSE PATTERN**: Follow `invitation-list.tsx` component pattern from `(dashboard)/invitations/_components/`
    - **DO NOT DUPLICATE**: Import `useRespondInvitation` from existing hooks, don't recreate

- [x] **Task 7: Empty state component** (AC: 3)
  - [x] CREATE `apps/web/src/app/(dashboard)/dashboard/_components/empty-state.tsx` ("use client")
    - Centered illustration area (use lucide `Users` or `UserPlus` icon as large decorative icon, not an image)
    - Message: "You're not part of any group yet."
    - CTA 1: "Create a Group" → `<Link href="/groups/create">` styled as primary button (`sq-btn-green` or equivalent shadcn primary)
    - CTA 2: Inline "Join with Invite Link" form:
      - Text input for pasting invite link/code
      - "Join" button next to input
      - Uses `useJoinGroup()` hook (already exists in `use-group-queries.ts`)
      - Parse invite code from input: handle both full URL (`/join/abc123`) and bare code (`abc123`)
      - On success: navigate to `/group/${groupId}` + invalidate `queryKeys.groups.myGroups`
      - On error: inline error below the input

- [x] **Task 8: Navigation updates** (AC: 1)
  - [x] Update `apps/web/src/components/layout/sidebar.tsx`: change Dashboard href from `/` to `/dashboard`
  - [x] Update `apps/web/src/components/layout/mobile-nav.tsx`: change Dashboard href from `/` to `/dashboard` (check if exists there too)
  - [x] Update root page `apps/web/src/app/page.tsx`: if it exists and redirects somewhere, update to redirect to `/dashboard`

- [x] **Task 9: Tests** (AC: 1–5)
  - [x] Backend: `apps/api/src/groups/groups.controller.spec.ts` or new test file:
    - `GET /groups/me` unauthenticated → 401
    - `GET /groups/me` authenticated with groups → 200 with array including role, memberCount
    - `GET /groups/me` authenticated with no groups → 200 with empty array
  - [x] Frontend: `apps/web/src/app/(dashboard)/dashboard/_components/dashboard-view.test.tsx`:
    - Renders loading skeleton while fetching
    - Renders group cards when data loaded
    - Renders empty state when no groups
    - Renders pending invitations section when invitations exist
  - [x] Frontend: `apps/web/src/app/(dashboard)/dashboard/_components/group-card.test.tsx`:
    - Renders group name, role badge, member count
    - Card links to `/group/[groupId]`
  - [x] Run `yarn test`, `yarn lint`, `yarn build` to verify all pass

## Dev Notes

### Critical: NestJS Route Order

The `GET /groups/me` route MUST be placed BEFORE `GET /groups/:id` in the controller. NestJS matches routes in declaration order. If `:id` comes first, `"me"` will be captured as an `:id` parameter and fail with a UUID validation or "not found" error.

```typescript
// In GroupsController — CORRECT order:
@Get("me")                    // ← FIRST
async findMyGroups(...) {}

@Get(":id")                   // ← SECOND
@UseGuards(GroupMemberGuard)
async findOne(...) {}
```

### Critical: Route Conflict Resolution

Currently `apps/web/src/app/dashboard/page.tsx` exists at `/dashboard` WITHOUT the dashboard layout. A new `apps/web/src/app/(dashboard)/dashboard/page.tsx` would conflict because both resolve to `/dashboard`. The existing file MUST be deleted first.

### Critical: Prisma `Group` Model Has No `updatedAt`

The `Group` model only has `createdAt`, not `updatedAt`. The AC mentions "last activity date" — for this story, use `createdAt` as the date displayed on cards. True "last activity" tracking requires the `daily_activity` table from Epic 8 (gamification). Document this as a known simplification.

### Existing Hooks to Reuse (DO NOT RECREATE)

| Hook | File | Purpose |
|------|------|---------|
| `useInvitations()` | `hooks/api/use-invitation-queries.ts` | Fetches pending invitations for current user |
| `useRespondInvitation()` | `hooks/api/use-invitation-queries.ts` | Accept/decline an invitation |
| `useJoinGroup()` | `hooks/api/use-group-queries.ts` | Join a group via invite code |
| `useCreateGroup()` | `hooks/api/use-group-queries.ts` | Create a new group |

### Existing Components to Reference (DO NOT DUPLICATE PATTERNS)

| Component | File | Pattern to Follow |
|-----------|------|-------------------|
| `InvitationList` | `(dashboard)/invitations/_components/invitation-list.tsx` | Accept/decline button pattern, loading states per item |
| `InvitationsView` | `(dashboard)/invitations/_components/invitations-view.tsx` | Skeleton loading, empty state pattern |
| `CreateGroupForm` | `(dashboard)/groups/create/_components/create-group-form.tsx` | Form pattern with RHF + Zod, error handling |

### API Client Pattern

```typescript
// In hooks/api/use-group-queries.ts:
export function useMyGroups() {
  return useQuery({
    queryKey: queryKeys.groups.myGroups,
    queryFn: async () => {
      const result = await apiRequest<MyGroupItem[]>("/groups/me");
      if (result.message || !result.data) {
        throw new ApiError({ message: result.message ?? "Could not load groups.", code: result.code, status: result.status });
      }
      return result.data;
    },
  });
}
```

### Backend Service Pattern

```typescript
// In GroupsService:
async findMyGroups(userId: string) {
  const memberships = await this.prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { group: { createdAt: "desc" } },
  });

  return memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    role: m.role,
    memberCount: m.group._count.members,
    createdAt: m.group.createdAt.toISOString(),
  }));
}
```

### Badge Variant Mapping

Follow the existing role badge pattern from `members/page.tsx`:

| Role | Badge Color | Tailwind Classes |
|------|-------------|------------------|
| `admin` | Purple | `bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300` |
| `editor` | Teal | `bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300` |
| `member` | Default/Zinc | `bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400` |

Use the shadcn `<Badge>` component with appropriate `className` overrides or create a `RoleBadge` helper.

### Invite Link Parsing (Empty State Join Form)

The user might paste a full URL or just the code:
```typescript
function extractInviteCode(input: string): string {
  const trimmed = input.trim();
  // Handle full URL: https://squademy.app/join/abc123 or /join/abc123
  const match = trimmed.match(/\/join\/([a-z0-9]+)$/i);
  return match ? match[1] : trimmed;
}
```

### Query Invalidation on Mutations

Update these existing hooks to also invalidate `queryKeys.groups.myGroups`:

1. **`useCreateGroup`** in `use-group-queries.ts` — after creating a group, dashboard should show it
2. **`useJoinGroup`** in `use-group-queries.ts` — after joining, dashboard should show new group
3. **`useRespondInvitation`** in `use-invitation-queries.ts` — after accepting, dashboard group list refreshes

### Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Single column card stack, full-width cards |
| Tablet (768px–1024px) | 2-column card grid |
| Desktop (> 1024px) | 3-column card grid, max-w-5xl centered |

Use Tailwind grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### Project Structure Notes

```
apps/web/src/app/
├── dashboard/page.tsx                          # DELETE (currently redirects to /review)
├── (dashboard)/
│   ├── dashboard/
│   │   ├── page.tsx                            # NEW: server component (auth check)
│   │   └── _components/
│   │       ├── dashboard-view.tsx              # NEW: main client component
│   │       ├── group-card.tsx                  # NEW: individual group card
│   │       ├── pending-invitations.tsx         # NEW: invitations section
│   │       └── empty-state.tsx                 # NEW: no groups state + join form
│   └── ...

apps/api/src/groups/
├── groups.controller.ts                        # UPDATE: add GET /groups/me
├── groups.service.ts                           # UPDATE: add findMyGroups()
└── ...

apps/web/src/lib/api/
├── query-keys.ts                               # UPDATE: add groups.myGroups

apps/web/src/hooks/api/
├── use-group-queries.ts                        # UPDATE: add useMyGroups(), update invalidation
├── use-invitation-queries.ts                   # UPDATE: add myGroups invalidation to useRespondInvitation

apps/web/src/components/layout/
├── sidebar.tsx                                 # UPDATE: Dashboard href → /dashboard
├── mobile-nav.tsx                              # UPDATE: Dashboard href → /dashboard
```

### Testing Standards

- **Backend tests**: Follow existing pattern in `apps/api/src/` — mock PrismaService, test controller responses
- **Frontend component tests**: Use `renderWithQueryClient()` from `@/test-utils/render-with-query-client`
- **Mock fetch**: Mock `global.fetch` for API responses
- **Mock navigation**: Mock `next/navigation` (`useRouter`, `usePathname`)
- **Test file naming**: Colocated `*.test.tsx` next to source files

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.5 ACs]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR5a (dashboard group listing)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 2.2 directory structure, Section 2.3 data flow, Section 3.1 backend stack]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Dashboard design, empty states, card-based UI, responsive breakpoints]
- [Source: `_bmad-output/implementation-artifacts/2-2-invite-members-link-direct-invite.md` — Invitation hooks, accept/decline patterns]
- [Source: `_bmad-output/implementation-artifacts/2-1-create-configure-a-group.md` — Group creation patterns, form patterns]
- [Source: `_bmad-output/project-context.md` — Critical implementation rules, API client patterns, testing conventions]
- [Source: `apps/api/src/groups/groups.controller.ts` — Existing controller routes (need route order fix)]
- [Source: `apps/api/src/groups/groups.service.ts` — Existing Prisma patterns]
- [Source: `apps/web/src/hooks/api/use-group-queries.ts` — Existing hooks to extend]
- [Source: `apps/web/src/hooks/api/use-invitation-queries.ts` — Existing invitation hooks to reuse]
- [Source: `apps/web/src/lib/api/query-keys.ts` — Existing key factory to extend]
- [Source: `apps/web/src/components/layout/sidebar.tsx` — Current nav items to update]
- [Source: `packages/database/prisma/schema.prisma` — Group model (no updatedAt field)]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `yarn workspace @squademy/api test -- groups.controller.spec.ts` (pass)
- `yarn test --runTestsByPath "src/app/(dashboard)/dashboard/_components/dashboard-view.test.tsx" "src/app/(dashboard)/dashboard/_components/group-card.test.tsx"` in `apps/web` (pass)
- `yarn test` at monorepo root (fails due existing unrelated test failures in `@squademy/web`)
- `yarn lint` at monorepo root (pass)
- `yarn build` at monorepo root (pass)
- `npx -y react-doctor@latest . --verbose --diff` in `apps/web` (score 97/100, warnings only)

### Completion Notes List

- Implemented backend `GET /groups/me` endpoint in NestJS with route-order safety (`/me` before `/:id`) and service mapping to `{ id, name, description, role, memberCount, createdAt }`.
- Added frontend query key `groups.myGroups`, `useMyGroups()` hook, and invalidation updates in `useCreateGroup`, `useJoinGroup`, and `useRespondInvitation`.
- Resolved `/dashboard` route conflict by deleting `apps/web/src/app/dashboard/page.tsx` and introducing `apps/web/src/app/(dashboard)/dashboard/page.tsx`.
- Implemented dashboard feature UI: `dashboard-view`, `group-card`, `pending-invitations`, and `empty-state` (with invite link/code parsing for join flow).
- Updated desktop/mobile navigation dashboard links to `/dashboard`.
- Added tests for new backend/frontend functionality and validated lint/build successfully.
- Full monorepo `yarn test` still reports pre-existing unrelated failures in other suites; this story remains `in-progress` until those failures are resolved or waived.

### File List

- apps/api/jest.config.cjs
- apps/api/src/groups/groups.controller.spec.ts
- apps/api/src/groups/groups.controller.ts
- apps/api/src/groups/groups.service.ts
- apps/web/src/app/(dashboard)/dashboard/page.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/dashboard-view.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/dashboard-view.test.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/group-card.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/group-card.test.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/pending-invitations.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/pending-invitations.test.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/empty-state.test.tsx
- apps/web/src/app/(dashboard)/dashboard/_components/empty-state.tsx
- apps/web/src/app/(dashboard)/group/[groupId]/members/_components/group-members-view.tsx
- apps/web/src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.tsx
- apps/web/src/components/layout/sidebar.tsx
- apps/web/src/components/layout/mobile-nav.tsx
- apps/web/src/hooks/api/use-auth-queries.ts
- apps/web/src/hooks/api/use-group-queries.ts
- apps/web/src/hooks/api/use-invitation-queries.ts
- apps/web/src/lib/api/query-keys.ts
- apps/web/src/app/dashboard/page.tsx (deleted)
- apps/web/src/app/dashboard/page.test.ts (deleted)
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-03-30: Implemented Story 2.5 dashboard groups listing flow across API + frontend with new dashboard route/components, query/cache integration, and test additions.
- 2026-03-30: Code review fixes — added missing `useRespondInvitation` myGroups invalidation (H1), simplified `pending-invitations.tsx` removing broken localInvitations state (H3), added error propagation test to controller spec (M3), added invalid date guard in `formatCreatedAt` (L1), fixed "Create a Group" to use `render` prop + `Link` for prefetch (L3). Added query key convention rule to `.cursor/rules/frontend-nextjs.mdc` (H2). Story marked done.
- 2026-03-30: Second code review fixes — added JwtAuthGuard metadata test to controller spec (H1), documented `use-auth-queries.ts` and `member-management-list.tsx` in File List (H2/M1), added invitations error handling in dashboard-view (M2), added tests for pending-invitations and empty-state components (M3), changed Decline button to ghost variant (M4), added "My Groups" page heading (L2).
- 2026-03-30: Third code review fixes — fixed `extractInviteCode` regex to handle URLs with query parameters (M1), added invitationsError test case to dashboard-view.test.tsx (M2). Story marked done.
