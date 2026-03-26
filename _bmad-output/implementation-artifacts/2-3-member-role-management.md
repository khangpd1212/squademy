# Story 2.3: Member & Role Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Group Admin,  
I want to view all group members, remove inactive members, and assign or change their roles,  
so that I can maintain a healthy group with the right people in the right roles.

## Acceptance Criteria

1. **Given** I am a Group Admin and navigate to the Members page,  
   **When** the page loads,  
   **Then** all `group_members` rows for my group are listed with their display name, avatar, role badge, and join date.

2. **Given** I click the role dropdown next to a member and select "Editor",  
   **When** I confirm the change,  
   **Then** `group_members.role` is updated to `'editor'` via NestJS API,  
   **And** the role badge updates immediately via optimistic update.

3. **Given** I try to change my own role as the sole Admin,  
   **When** I attempt to demote myself,  
   **Then** an inline error appears: "You cannot remove admin role from yourself while you are the only admin.",  
   **And** the change is not saved.

4. **Given** I click "Remove" next to a member and confirm the dialog,  
   **When** the action executes,  
   **Then** the `group_members` row is deleted for that user,  
   **And** the member disappears from the members list immediately,  
   **And** the removed member loses access to all group content (enforced by RLS).

5. **Given** I try to remove myself as the sole Admin,  
   **When** I attempt the action,  
   **Then** an inline error appears: "You cannot remove yourself while you are the only admin. Transfer admin role first."

## Tasks / Subtasks

- [x] **Task 1: Add API endpoints for role updates and member removal** (AC: 2, 3, 4, 5)
  - [x] Create `src/app/api/groups/[groupId]/members/[memberId]/role/route.ts` with `PATCH` handler
    - [x] Auth check via `getCurrentUser()` from `@/lib/api/client`
    - [x] Validate payload with Zod schema (`role` in `admin | editor | member`)
    - [x] Verify caller is admin in target group; return 403 if not admin
    - [x] Verify target member belongs to group; return 404 if not found
    - [x] Block self-demotion when caller is sole admin; return 409 with exact AC error message
    - [x] Use `createAdminClient()` for update mutation to avoid RLS/ownership edge cases
    - [x] Return updated role with 200
  - [x] Create `src/app/api/groups/[groupId]/members/[memberId]/route.ts` with `DELETE` handler
    - [x] Auth check and admin verification
    - [x] Verify target member exists in group; return 404 if not found
    - [x] Block deleting self when caller is sole admin; return 409 with exact AC error message
    - [x] Delete target `group_members` row using admin client
    - [x] Return 200 `{ ok: true }` on success
  - [x] Add helper logic in route handlers to count admins in group for sole-admin guardrails

- [x] **Task 2: Build members management client UI** (AC: 1, 2, 3, 4, 5)
  - [x] Create `src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.tsx`
    - [x] Client component receives initial members + current user role/id
    - [x] Render member rows with avatar, display name, join date, role badge (preserve existing list UX)
    - [x] Add role dropdown (admin-only actions) with `admin`, `editor`, `member` options
    - [x] Add remove action button (admin-only) with shadcn Dialog confirmation
    - [x] Implement optimistic UI for role update and remove operations
    - [x] Revert optimistic state and show inline errors when API fails
    - [x] Show exact AC error strings for sole-admin self-demotion / self-removal violations
  - [x] Keep existing non-admin behavior read-only (no role dropdown, no remove button)
  - [x] Ensure keyboard-accessible controls and focus handling in dropdown/dialog (WCAG AA alignment)

- [x] **Task 3: Integrate management list into members page server component** (AC: 1)
  - [x] Update `src/app/(dashboard)/group/[groupId]/members/page.tsx`
    - [x] Keep current auth guard and membership fetch pattern
    - [x] Continue fetching `group_members` + `profiles(display_name, avatar_url)` sorted by `joined_at ASC`
    - [x] Replace static member `<ul>` rendering with `<MemberManagementList />` while preserving current card layout
    - [x] Pass server-fetched members and caller context (`currentUserId`, `isAdmin`) to client list component
  - [x] Preserve invite-link and invite-by-username sections from Story 2.2 (no regression)

- [x] **Task 4: Add/adjust server validation schema for role mutation** (AC: 2, 3)
  - [x] Add `member-role-schema.ts` (or route-local schema) using Zod v4
  - [x] Export schema + inferred type
  - [x] Keep API error response format consistent with existing route patterns (`{ message, field? }`)

- [x] **Task 5: Tests for API and UI behavior** (AC: 1, 2, 3, 4, 5)
  - [x] Create `src/app/api/groups/[groupId]/members/[memberId]/role/route.test.ts`
    - [x] 401 unauthenticated
    - [x] 403 non-admin caller
    - [x] 404 target member not found
    - [x] 400 invalid role payload
    - [x] 409 sole-admin self-demotion with exact error message
    - [x] 200 valid role change to editor
  - [x] Create `src/app/api/groups/[groupId]/members/[memberId]/route.test.ts`
    - [x] 401 unauthenticated
    - [x] 403 non-admin caller
    - [x] 404 target member not found
    - [x] 409 sole-admin self-removal with exact error message
    - [x] 200 valid member removal
  - [x] Create `src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.test.tsx`
    - [x] Renders members with display name, role badge, join date
    - [x] Admin sees role controls + remove controls
    - [x] Non-admin does not see management controls
    - [x] Optimistic role update UI on success
    - [x] Optimistic removal UI on success
    - [x] Error rollback for failed role update/removal
    - [x] Exact sole-admin error copy displayed inline
  - [x] Run `npm test`, `npm run lint`, `npm run build`

## Dev Notes

### Story Context and Intent

- This story extends Epic 2 from invitation/onboarding into ongoing group governance.
- Story 2.2 already established the members page and invitation flows; this story must add role and removal controls without breaking those flows.
- Group role taxonomy in schema is fixed at `admin | editor | member`.

### Previous Story Intelligence (2.2)

- Reuse proven patterns from Story 2.2:
  - Server auth + permission checks in route handlers (`createClient`, `auth.getUser`, clear 401/403/404/409 handling)
  - `createAdminClient()` for privileged mutations against `group_members` and invitations
  - Inline API errors and optimistic UX in client components (`invite-link-section`, `invite-by-username`, `invitation-list`)
  - Existing members page data shape with profile join already matches AC1 needs.
- Avoid regression in existing routes/features:
  - `/api/invitations/*`
  - `/api/groups/join`
  - `/api/groups/[groupId]/invite-link`
  - invite UI in members page.

### Technical Requirements

- Use existing stack only (Next.js App Router + React 19 + TypeScript strict + Zod v4 + shadcn/ui + NestJS API).
- No new dependency required for this story.
- Keep API route implementation order consistent with project context:
  1. auth
  2. validation
  3. authorization
  4. business rule guards
  5. mutation
  6. response.
- Use exact AC strings for sole-admin constraints:
  - "You cannot remove admin role from yourself while you are the only admin."
  - "You cannot remove yourself while you are the only admin. Transfer admin role first."

### Architecture Compliance

- Source of truth tables:
  - `group_members(group_id, user_id, role, joined_at)` with role check constraint.
  - `profiles(id, display_name, avatar_url, ...)` for member identity display.
- RLS remains authoritative for content access after member removal (AC4), but admin operations should still use server-side guarded endpoints.
- Service role key must remain server-only; never imported into client components.
- Keep route/file placement under Next.js App Router conventions:
  - dashboard page components in route segment `_components`
  - API handlers under `src/app/api/.../route.ts`.

### File Structure Requirements

Expected touched files for implementation:

- `src/app/(dashboard)/group/[groupId]/members/page.tsx` (update)
- `src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.tsx` (new)
- `src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.test.tsx` (new)
- `src/app/api/groups/[groupId]/members/[memberId]/role/route.ts` (new)
- `src/app/api/groups/[groupId]/members/[memberId]/role/route.test.ts` (new)
- `src/app/api/groups/[groupId]/members/[memberId]/route.ts` (new)
- `src/app/api/groups/[groupId]/members/[memberId]/route.test.ts` (new)
- `src/app/api/groups/[groupId]/members/[memberId]/member-role-schema.ts` (optional new, if extracted)

### Testing Requirements

- Unit/integration tests via Jest + Testing Library as current project standard.
- Route tests should mock API clients and assert HTTP status + JSON payload.
- Component tests should mock `fetch` and validate optimistic transitions + rollback behavior.
- Regression gate: existing members/invitations tests must remain green.

### Latest Technical Information (Web Research Highlights)

- Next.js 16 officially renamed request interception from middleware to proxy (`proxy.ts`); current project already follows this. Do not introduce a new root `middleware.ts`.
- Keep privileged mutations strictly in NestJS API endpoints protected by appropriate Guards (JwtAuthGuard, GroupAdminGuard).

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (Sections 2, 3.2, 3.3, 8.5, 12)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR9, FR10, NFR8, NFR13)]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/2-2-invite-members-link-direct-invite.md`]
- [Source: `src/app/(dashboard)/group/[groupId]/members/page.tsx`]
- [Source: `src/app/(dashboard)/group/[groupId]/members/_components/invite-link-section.tsx`]
- [Source: `src/app/(dashboard)/group/[groupId]/members/_components/invite-by-username.tsx`]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm install -D @testing-library/dom`: installed missing test dependency.
- `npm test`: pass (25/25 suites, 82/82 tests).
- `npm run lint`: pass.
- `npm run build`: pass.

### Completion Notes List

- Implemented member role update API (`PATCH`) with admin authorization, Zod validation, and sole-admin self-demotion protection.
- Implemented member removal API (`DELETE`) with admin authorization and sole-admin self-removal protection.
- Added shared role validation schema (`member-role-schema.ts`) for strict API payload handling.
- Added member management client component with role controls, remove confirmation dialog, optimistic updates, and rollback/error handling.
- Integrated member management component into members page while preserving Story 2.2 invite features.
- Added route tests for new role/removal APIs and component tests for management interactions.
- Added `@testing-library/dom` dev dependency to restore UI test runtime compatibility.
- Updated ESLint global ignores to exclude `.yarn/**`, allowing project lint checks to reflect source files instead of SDK internals.
- Verified full quality gates: tests, lint, and build all pass.

### File List

- `_bmad-output/implementation-artifacts/2-3-member-role-management.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `eslint.config.mjs`
- `package.json`
- `src/app/api/groups/[groupId]/members/[memberId]/member-role-schema.ts`
- `src/app/api/groups/[groupId]/members/[memberId]/role/route.ts`
- `src/app/api/groups/[groupId]/members/[memberId]/role/route.test.ts`
- `src/app/api/groups/[groupId]/members/[memberId]/route.ts`
- `src/app/api/groups/[groupId]/members/[memberId]/route.test.ts`
- `src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.tsx`
- `src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.test.tsx`
- `src/app/(dashboard)/group/[groupId]/members/page.tsx`
- `yarn.lock`

## Change Log

- 2026-03-17: Created Story 2.3 implementation guide with full developer context and acceptance-criteria-mapped tasks.
- 2026-03-17: Implemented core Story 2.3 member role/removal APIs and member management UI integration.
- 2026-03-17: Completed full verification gates (`npm test`, `npm run lint`, `npm run build`) and set story status to review.
- 2026-03-17: Code review — fixed 3 issues: removed redundant role Badge in admin view, fixed dialog not closing on failed member removal (error hidden behind overlay), added missing component test for sole-admin self-removal error display. Updated existing Badge-dependent test assertions to use select value checks. Status → done.
