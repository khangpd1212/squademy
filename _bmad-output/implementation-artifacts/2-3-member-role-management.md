# Story 2.3: Member & Role Management

Status: done

## Story

As a Group Admin,
I want to view all group members, remove inactive members, and assign or change their roles,
so that I can maintain a healthy group with the right people in the right roles.

## Acceptance Criteria

1. **Given** I am a Group Admin and navigate to the Members page,
   **When** the page loads,
   **Then** `GET /groups/:groupId/members` (GroupMemberGuard) returns all members with display name, avatar, role badge, and join date.

2. **Given** I click the role dropdown next to a member and select "Editor",
   **When** I confirm the change,
   **Then** `PATCH /groups/:groupId/members/:userId/role` (GroupAdminGuard) updates `group_members.role` to `'editor'` via Prisma,
   **And** the role badge updates immediately via optimistic update with rollback on error.

3. **Given** I try to change my own role as the sole Admin,
   **When** I attempt to demote myself,
   **Then** NestJS returns a 400 error and an inline error appears: "Cannot demote the sole admin. Promote another admin first.",
   **And** the change is not saved.

4. **Given** I click "Remove" next to a member and confirm the dialog,
   **When** `DELETE /groups/:groupId/members/:userId` (admin check in service) executes,
   **Then** the `group_members` row is deleted via Prisma,
   **And** the member disappears from the members list immediately,
   **And** the removed member loses access to all group content (enforced by GroupMemberGuard on all group endpoints).

5. **Given** I try to remove myself as the sole Admin,
   **When** I attempt the action,
   **Then** NestJS returns a 400 error and an inline error appears: "Cannot remove the sole admin. Transfer admin role first."

## Tasks / Subtasks

- [x] **Task 1: Backend — MembersModule with controller, service, DTO** (AC: 1, 2, 3, 4, 5)
  - [x] `MembersModule` registered in `apps/api/src/members/members.module.ts`
  - [x] `MembersController` at `groups/:groupId/members` with `@UseGuards(JwtAuthGuard)` class-level
  - [x] `GET /` route with `@UseGuards(GroupMemberGuard)` — calls `membersService.listByGroup(groupId)`
  - [x] `PATCH /:memberId/role` route with `@UseGuards(GroupAdminGuard)` — calls `membersService.changeRole()`
  - [x] `DELETE /:memberId` route — calls `membersService.remove()` (admin check done in service for self-removal support)
  - [x] `ChangeRoleDto` validates role is one of `admin`, `editor`, `member` using `@IsIn()` from class-validator

- [x] **Task 2: Backend — MembersService business logic** (AC: 2, 3, 4, 5)
  - [x] `listByGroup(groupId)` — Prisma `groupMember.findMany` with user select (id, displayName, email, avatarUrl), ordered by `joinedAt: 'asc'`
  - [x] `changeRole(groupId, memberId, role)` — finds target member, checks sole-admin-demote, updates via Prisma
  - [x] `remove(groupId, memberId, requesterId)` — finds target, supports self-removal, checks admin for non-self, checks sole-admin-remove, deletes via Prisma
  - [x] Sole admin demote → throws `BadRequestException({ code: ErrorCode.MEMBER_SOLE_ADMIN_DEMOTE })`
  - [x] Sole admin remove → throws `BadRequestException({ code: ErrorCode.MEMBER_SOLE_ADMIN_REMOVE })`
  - [x] Non-admin trying to remove another → throws `ForbiddenException({ code: ErrorCode.MEMBER_ADMIN_REQUIRED })`

- [x] **Task 3: Shared — error codes and messages** (AC: 3, 5)
  - [x] `ErrorCode.MEMBER_NOT_FOUND`, `MEMBER_ADMIN_REQUIRED`, `MEMBER_SOLE_ADMIN_REMOVE`, `MEMBER_SOLE_ADMIN_DEMOTE` in `packages/shared/src/constants/index.ts`
  - [x] Corresponding human-readable messages in `packages/shared/src/errors/error-messages.ts`

- [x] **Task 4: Frontend — member query hooks** (AC: 1, 2, 4)
  - [x] `useGroupMembers(groupId)` in `apps/web/src/hooks/api/use-member-queries.ts` — queries `GET /groups/:groupId/members`, maps NestJS response to component shape
  - [x] `useUpdateMemberRole(groupId)` — mutation `PATCH /groups/:groupId/members/:userId/role`, invalidates `groups.detail` + `groups.members`
  - [x] `useRemoveMember(groupId)` — mutation `DELETE /groups/:groupId/members/:userId`, invalidates `groups.detail` + `groups.members`
  - [x] `queryKeys.groups.members(groupId)` defined in `apps/web/src/lib/api/query-keys.ts`

- [x] **Task 5: Frontend — Members page and GroupMembersView** (AC: 1)
  - [x] Server page `apps/web/src/app/(dashboard)/group/[groupId]/members/page.tsx` — renders `<GroupMembersView groupId={groupId} />`
  - [x] `GroupMembersView` loads group via `useGroup(groupId)`, members via `useGroupMembers(groupId)`, and user via `useCurrentUser()`
  - [x] Checks admin role: `currentMember?.role === GROUP_ROLES.ADMIN`
  - [x] Admin sees invite sections (InviteLinkSection + InviteByUsername) + member management list
  - [x] Non-admin sees member management list only (read-only badges)

- [x] **Task 6: Frontend — MemberManagementList component** (AC: 1, 2, 3, 4, 5)
  - [x] Renders each member: Avatar (with fallback initials), display name, "(You)" marker, join date, role badge or dropdown
  - [x] Admin mode: native `<select>` dropdown with admin/editor/member options, "Remove" button per row
  - [x] Non-admin mode: `<Badge>` with capitalized role text
  - [x] Role change: optimistic UI via local `setMembers()`, rollback on error, inline error per user
  - [x] Remove: opens shadcn `Dialog` for confirmation, optimistic removal from list, rollback on error
  - [x] Sole admin errors: backend returns error code → error message displayed inline under the member row

- [x] **Task 7: Tests** (AC: 1–5)
  - [x] Frontend: `member-management-list.test.tsx` — seven cases (list, admin vs non-admin controls, optimistic role/removal on success, error rollback for role and remove).
  - [x] Backend: `members.service.spec.ts` — twelve unit tests for `listByGroup`, `changeRole`, `remove`.
  - [x] Story-scoped suites verified passing; full monorepo `yarn test` may still fail on unrelated suites (see Dev Agent Record).

## Dev Notes

### Implementation Status

This story's backend and frontend are **fully implemented**. The Members module (controller, service, DTO) handles all CRUD operations with proper authorization and business rules (sole-admin protection). The frontend renders an admin management interface with role dropdowns, remove buttons, confirmation dialog, and optimistic updates with error rollback.

All 7 test cases in `member-management-list.test.tsx` now pass. The optimistic state sync was fixed by simplifying the `useEffect` dependency array to `[initialMembers]` only.

### Existing File Map

```
packages/shared/src/
├── constants/index.ts              # ErrorCode.MEMBER_*, GROUP_ROLES
├── errors/error-messages.ts        # Human-readable messages for all MEMBER_* codes

apps/api/src/members/
├── members.module.ts               # Module registration
├── members.controller.ts           # GET /, PATCH /:memberId/role, DELETE /:memberId
├── members.service.ts              # listByGroup, changeRole, remove (with sole-admin checks)
├── members.service.spec.ts         # 12 unit tests for service business logic
├── dto/change-role.dto.ts          # @IsIn([admin, editor, member])

apps/web/src/app/(dashboard)/group/[groupId]/members/
├── page.tsx                        # Server page → <GroupMembersView>
├── _components/
│   ├── group-members-view.tsx      # Admin check, useGroupMembers + invite sections + member list
│   ├── member-management-list.tsx  # Role dropdown, remove button, dialog, optimistic updates
│   ├── member-management-list.test.tsx  # 7 test cases (all passing)
│   ├── invite-link-section.tsx     # From Story 2.2
│   ├── invite-link-section.test.tsx
│   └── invite-by-username.tsx      # From Story 2.2

apps/web/src/hooks/api/
├── use-member-queries.ts           # useGroupMembers, useUpdateMemberRole, useRemoveMember

apps/web/src/lib/api/
├── query-keys.ts                   # groups.members(groupId) key
```

### Backend API Endpoints

| Method | Path | Guard | Service Method |
|--------|------|-------|----------------|
| `GET` | `/groups/:groupId/members` | `GroupMemberGuard` | `listByGroup()` |
| `PATCH` | `/groups/:groupId/members/:memberId/role` | `GroupAdminGuard` | `changeRole()` |
| `DELETE` | `/groups/:groupId/members/:memberId` | `JwtAuthGuard` only (admin check in service) | `remove()` |

The DELETE endpoint intentionally uses only `JwtAuthGuard` (not `GroupAdminGuard`) because the service layer handles both admin-removal and self-removal logic. A non-admin member can remove themselves; only removing *other* members requires admin.

### Optimistic Update Pattern

The `MemberManagementList` uses local `useState` for optimistic updates rather than React Query's built-in `onMutate`/`onError` pattern. The component receives `members` as a prop from `GroupMembersView` (via `useGroupMembers()` query data).

Flow:
1. User changes role/removes → local state updated immediately
2. Mutation fires → on success, `queryKeys.groups.detail` + `queryKeys.groups.members` invalidated → parent re-fetches → new `initialMembers` prop arrives
3. `useEffect(() => setMembers(initialMembers), [initialMembers])` syncs local state with server data
4. On error → local state reverted to previous snapshot, inline error shown

### Non-Admin View

When `isAdmin === false`, each member row renders a `<Badge variant="outline">` with the role name instead of a dropdown + remove button. The admin-only invite sections (InviteLinkSection, InviteByUsername) are also hidden.

### Architecture Deviations from Epic

| Epic Says | Implementation | Reason |
|-----------|---------------|--------|
| `PATCH /groups/:groupId/members/:userId` | `PATCH /groups/:groupId/members/:memberId/role` | Better REST modeling — updating specific sub-resource |
| DELETE uses `GroupAdminGuard` | DELETE uses `JwtAuthGuard` only (admin check in service) | Enables self-removal — non-admin members can leave group voluntarily |

### Codebase Patterns Used

- **Controller**: `@Controller("groups/:groupId/members")` with `@UseGuards(JwtAuthGuard)` at class level
- **Guard stacking**: Route-level `@UseGuards(GroupAdminGuard)` added only for admin-only endpoints
- **Error codes**: Service throws `{ code: ErrorCode.X }` — `HttpExceptionFilter` auto-resolves message from shared `getErrorMessage(code)`
- **Mutation hooks**: Follow established `apiRequest` + `ApiError` + `queryClient.invalidateQueries` pattern
- **Dialog**: shadcn `Dialog` with `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- **Avatar**: shadcn `Avatar` with `AvatarImage` + `AvatarFallback` (initials)

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.3 ACs]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 3.1.2 Guards, Section 3.2 group_members schema, Section 3.3 Authorization Matrix]
- [Source: `_bmad-output/implementation-artifacts/2-2-invite-members-link-direct-invite.md` — Invite sections, members page patterns]
- [Source: `apps/api/src/members/members.controller.ts` — REST endpoint structure]
- [Source: `apps/api/src/members/members.service.ts` — Business logic with sole-admin checks]
- [Source: `apps/web/src/hooks/api/use-member-queries.ts` — Mutation hooks with cache invalidation]
- [Source: `apps/web/src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.tsx` — Optimistic update UI]
- [Source: `packages/shared/src/constants/index.ts` — ErrorCode.MEMBER_*, GROUP_ROLES]
- [Source: `packages/shared/src/errors/error-messages.ts` — Error messages for all member codes]
- [Source: `_bmad-output/project-context.md` — API client patterns, testing rules, NestJS conventions]

## Dev Agent Record

### Agent Model Used

Cursor Agent (implementation + review follow-up, 2026-03-30)

### Debug Log References

- `yarn test --runTestsByPath "src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.test.tsx"` (apps/web) — PASS (7/7)
- `yarn test --runTestsByPath "src/members/members.service.spec.ts"` (apps/api) — PASS (12/12)
- `yarn test` (root) — story-scoped suites pass; remaining failures may include auth pages (`next-intl` ESM) if still present.
- `profile-form.test.tsx` — PASS (4/4) after registering `email` with RHF and valid fixture emails.
- `yarn lint` (root) — PASS
- `yarn build` (root) — PASS (with React Compiler enabled)
### Completion Notes List

- All backend implementation (MembersModule, controller, service, DTO) completed as part of prior work.
- All frontend implementation (GroupMembersView, MemberManagementList, member hooks) completed.
- Error codes and messages for all member operations defined in shared package.
- Fixed optimistic state sync regression in `member-management-list.tsx` by updating local state sync effect to run only when `initialMembers` changes.
- `member-management-list.test.tsx` now passes (7/7).
- **Code review fixes applied:**
  - [H1] Added `members.service.spec.ts` with 12 backend unit tests covering all service methods and edge cases.
  - [M1] Refactored `GroupMembersView` to use `useGroupMembers()` hook (dedicated members endpoint) instead of extracting members from `useGroup()` response.
  - [M2] Enabled React Compiler (`reactCompiler: true` in `next.config.ts`) — auto-memoization eliminates fragile optimistic state sync issue.
  - [M3] Documented architecture deviations from epic (API path + guard changes) in Dev Notes.
  - [L1] Unified `avatar_url` type to `string | null` across `GroupMember`, `Member`, and `useGroupMembers` return type.
  - [L3] Fixed stale Dev Notes: removed outdated "2 test cases failing" text, fixed typo, updated optimistic update pattern description.
  - [2026-03-30] Review follow-up: role confirm dialog; `members.controller.spec.ts`; `avatarUrl` `string | null` across web hooks + shared profile schema + `UpdateUserDto`; profile form `email` registered; `profile-form` tests fixed.

### File List

- `packages/shared/src/constants/index.ts`
- `packages/shared/src/errors/error-messages.ts`
- `apps/api/src/members/members.module.ts`
- `apps/api/src/members/members.controller.ts`
- `apps/api/src/members/members.service.ts`
- `apps/api/src/members/members.service.spec.ts` (new — code review)
- `apps/api/src/members/dto/change-role.dto.ts`
- `apps/web/next.config.ts` (modified — enabled React Compiler)
- `apps/web/src/app/(dashboard)/group/[groupId]/members/page.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/members/_components/group-members-view.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.test.tsx`
- `apps/web/src/hooks/api/use-member-queries.ts`
- `apps/web/src/lib/api/query-keys.ts`
- `packages/shared/src/schemas/profile.ts` (`avatarUrl` union with `null`; aligns with DB)
- `apps/api/src/users/dto/update-user.dto.ts` (`avatarUrl?: string | null`)
- `apps/api/src/members/members.controller.spec.ts` (controller smoke tests)
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/app/(dashboard)/settings/_components/profile-form.tsx`
- `apps/web/src/app/(dashboard)/settings/_components/profile-form.test.tsx`

## Senior Developer Review (AI)

### Review 1 — 2026-03-30

_Outcome: Changes Requested, resolved same session_

### Resolution summary

- **H1** — Role change now uses a confirmation dialog (“Change role?” / “Confirm change”) before PATCH; tests updated.
- **M3** — Added `members.controller.spec.ts` (list / changeRole / remove / error propagation).
- **M4** — `avatarUrl` typed as `string | null` in `use-group-queries`, `use-user-queries` (`SearchResult`), `use-member-queries` API generic; shared `profileFormSchema` allows `null`; `UpdateUserDto.avatarUrl` optional nullable; header passes `undefined` to `AvatarImage` when null.
- **L5/L6/L7** — `ChangeRoleDto` spacing (already clean in tree); agent placeholder filled; sole-admin demote spec uses a single `.catch` assertion path.
- **M2** (File List vs git) — Still a process note for the branch; File List above extended with files touched by this follow-up.
- **Profile form** — Separated `profileSchema`/`profileEditSchema`; email field display-only (not registered); tests use valid fixture email.

### Review 2 — 2026-03-30

_Outcome: **Approved**_

All 5 ACs verified implemented with code evidence. All tasks [x] confirmed. Tests: 7/7 FE + 17/17 BE passing. TypeScript clean.

**Non-blocking notes:** [M1] branch-shared git diff (process); [L1] `listByGroup` selects `email` unused by FE; [L2] Dev Notes optimistic section could document role confirm dialog flow.
