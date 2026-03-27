# Story 2.6: Delete Group

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Group Admin,
I want to delete a group I no longer need,
so that inactive groups do not clutter the platform.

## Acceptance Criteria

1. **Given** I am a Group Admin and navigate to Group Settings,
   **When** I click "Delete Group",
   **Then** a confirmation dialog appears: "Are you sure? All group content will be removed for members. This cannot be undone.",
   **And** the dialog requires me to type the group name to confirm.

2. **Given** I confirm the deletion by typing the group name correctly,
   **When** the delete action executes via a server Route Handler with `service_role` key,
   **Then** all `lessons`, `exercises`, `flashcard_decks` with `group_id` matching this group have `is_deleted` set to `true` (soft-delete),
   **And** the `groups` row is deleted,
   **And** all `group_members` rows for this group are deleted,
   **And** I am redirected to `/dashboard` with an inline confirmation: "Group deleted."

3. **Given** I am a non-Admin member,
   **When** I view Group Settings,
   **Then** the "Delete Group" section is not visible.

## Tasks / Subtasks

- [ ] **Task 1: Create DELETE `/api/groups/[groupId]` route** (AC: 2)
  - [ ] Create (or add `DELETE` export to) `src/app/api/groups/[groupId]/route.ts`
    - [ ] **Auth:** verify JWT via `getCurrentUser()` → 401 if no user
    - [ ] **Admin guard:** Query `group_members` where `group_id = groupId AND user_id = user.id AND role = 'admin'` → 403 if not admin
    - [ ] **Confirm group exists:** Query `groups` by `groupId` → 404 if not found
    - [ ] **Soft-delete content** using `createAdminClient()`:
      - `UPDATE lessons SET is_deleted = true WHERE group_id = groupId AND is_deleted = false`
      - `UPDATE exercises SET is_deleted = true WHERE group_id = groupId AND is_deleted = false`
      - `UPDATE flashcard_decks SET is_deleted = true WHERE group_id = groupId AND is_deleted = false`
    - [ ] **Hard-delete membership:** `DELETE FROM group_members WHERE group_id = groupId`
    - [ ] **Hard-delete group:** `DELETE FROM groups WHERE id = groupId`
    - [ ] **Response:** `{ ok: true }` with 200
    - [ ] If any step fails → return 500 with `{ message: "Could not delete group." }` (no partial rollback needed — service_role ops are authoritative)
  - [ ] Note: if `route.ts` already exists from Story 2-4 (PATCH handler), add `DELETE` export alongside it in the same file
  - [ ] Create or update `src/app/api/groups/[groupId]/route.test.ts` with DELETE cases:
    - [ ] 401 unauthenticated
    - [ ] 403 non-admin caller
    - [ ] 404 group not found
    - [ ] 200 successful deletion: verifies soft-delete mutations called for lessons/exercises/flashcard_decks + hard-delete for group_members + groups

- [ ] **Task 2: Build `DeleteGroupSection` client component** (AC: 1, 2, 3)
  - [ ] Create `src/app/(dashboard)/group/[groupId]/settings/_components/delete-group-section.tsx`
    - [ ] Mark `"use client"` on first line
    - [ ] Accept props: `groupId: string`, `groupName: string`, `isAdmin: boolean`
    - [ ] If `!isAdmin` → render nothing (return null)
    - [ ] Render a "Danger Zone" card section with heading "Delete Group" + warning text
    - [ ] "Delete Group" button → opens a shadcn `Dialog` (AlertDialog pattern) with:
      - Title: "Delete Group"
      - Body: "Are you sure? All group content will be removed for members. This cannot be undone."
      - An `<input>` labeled "Type the group name to confirm:" with placeholder `groupName`
      - "Delete" button (destructive variant, red) — disabled until input value matches `groupName` exactly (case-sensitive)
      - "Cancel" button → closes dialog
    - [ ] On "Delete" confirm:
      - Set loading state → disable both buttons
      - `fetch(\`/api/groups/\${groupId}\`, { method: "DELETE" })`
      - On success: `router.push("/dashboard")` — the page redirects, so no local toast needed
      - On error: show inline error message inside the dialog + re-enable buttons (do NOT close dialog on error)
    - [ ] Typing in confirmation input clears any previous error state
  - [ ] Create `src/app/(dashboard)/group/[groupId]/settings/_components/delete-group-section.test.tsx`:
    - [ ] Non-admin: renders nothing
    - [ ] Admin: renders "Delete Group" button
    - [ ] Dialog opens on button click
    - [ ] "Delete" confirm button is disabled until input matches group name exactly
    - [ ] "Delete" button enabled after typing correct group name
    - [ ] Loading state on submit (both buttons disabled)
    - [ ] Error message displayed inline on API failure (dialog stays open)
    - [ ] `router.push("/dashboard")` called on success

- [ ] **Task 3: Add `DeleteGroupSection` to settings page** (AC: 1, 2, 3)
  - [ ] Update `src/app/(dashboard)/group/[groupId]/settings/page.tsx`:
    - [ ] Import and render `<DeleteGroupSection>` below `<GroupSettingsForm>` (below the Story 2-4 placeholder comment)
    - [ ] Pass `groupId`, `groupName` (from fetched group row), and `isAdmin` props
    - [ ] No additional data fetching needed — group name and isAdmin already fetched in this page

- [ ] **Task 4: Handle "Group deleted" confirmation on dashboard** (AC: 2)
  - [ ] After `router.push("/dashboard")`, the dashboard page renders without the deleted group
  - [ ] Use a URL search param to show confirmation: `router.push("/dashboard?message=group-deleted")`
  - [ ] Update `src/app/(dashboard)/layout.tsx` or `src/app/(dashboard)/page.tsx` to read `?message=group-deleted` and show a sonner toast `toast.success("Group deleted.")` on mount if param present
  - [ ] Clear the param from URL after displaying: `router.replace("/dashboard")` after toast

- [ ] **Task 5: Quality gates**
  - [ ] Run `npm test` — all suites pass (including regressions for members/invite/settings-2.4 tests)
  - [ ] Run `npm run lint` — no errors
  - [ ] Run `npm run build` — build succeeds

## Dev Notes

### Story Context and Intent

- This story adds a "Danger Zone" delete section to the Group Settings page implemented in Story 2-4.
- The settings page (`/group/[groupId]/settings`) MUST already have `<GroupSettingsForm>` from Story 2-4 before this story is implemented.
- Story 2-6 depends on Story 2-4's `settings/page.tsx` being functional. Do not implement 2-6 until 2-4 is done.
- The "Delete Group" section is only visible to admins (non-admins see nothing — `<DeleteGroupSection>` returns null when `isAdmin === false`).

### Previous Story Intelligence (2-4)

Story 2-4 created:
- `src/app/api/groups/[groupId]/route.ts` — PATCH handler
- `src/app/api/groups/[groupId]/route.test.ts` — PATCH tests
- `src/app/api/groups/[groupId]/group-settings-schema.ts`
- `src/app/(dashboard)/group/[groupId]/settings/page.tsx` — full settings page with GroupSettingsForm
- `src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.tsx`

This story ADDS the DELETE handler to the existing `route.ts` and adds `<DeleteGroupSection>` to the existing page. Do NOT rewrite the PATCH handler.

From Story 2-3 (member management):
- `createAdminClient()` pattern for service_role operations — reuse exactly
- Confirmation dialog pattern with shadcn `Dialog` — adapt for group name confirmation input

### Technical Requirements

- **Must use `createAdminClient()` (service_role key) for all delete operations** — RLS does not allow bulk cross-user deletes; `service_role` bypasses RLS for these privileged mutations
- **Admin operations:** handled by NestJS service layer with Prisma (no client-side admin needed)
- **`service_role` key is server-only** — never imported into client components
- **Soft-delete for content:** `lessons`, `exercises`, `flashcard_decks` use `is_deleted boolean` column — set to `true` (do NOT hard-delete content rows)
- **Hard-delete:** `groups` and `group_members` rows are permanently deleted
- **Transaction support:** NestJS service uses Prisma transactions for atomic multi-table operations
- **Confirmation dialog input:** must be case-sensitive exact match of `groupName`
- **Dialog pattern:** Use shadcn `Dialog` component (already in `src/components/ui/`) — use `AlertDialog` variant if available, otherwise standard `Dialog`
- **Router:** Use `useRouter` from `next/navigation` in client component

### Architecture Compliance

- **service_role key usage:** Explicitly required by architecture for "bulk delete, tombstoning" operations (arch Section 3.3: "Sensitive admin operations use `service_role` key exclusively from Route Handlers or Edge Functions")
- **soft-delete pattern:** `lessons.is_deleted`, `exercises.is_deleted`, `flashcard_decks.is_deleted` — these columns exist per the database schema. Set to `true` (do NOT delete rows)
- **group_members hard-delete:** Full row deletion as per AC
- **groups hard-delete:** Full row deletion as per AC
- **RLS enforces access control post-deletion:** Once `group_members` rows are deleted, former members automatically lose access to all remaining group content (enforced by RLS policies that check group membership)
- **Proxy not middleware:** `src/proxy.ts` handles auth — do NOT create `middleware.ts`

### File Structure Requirements

Expected new/modified files:

| File | Action |
|------|--------|
| `src/app/api/groups/[groupId]/route.ts` | **Update** — add `DELETE` export alongside PATCH |
| `src/app/api/groups/[groupId]/route.test.ts` | **Update** — add DELETE test cases |
| `src/app/(dashboard)/group/[groupId]/settings/page.tsx` | **Update** — add `<DeleteGroupSection>` |
| `src/app/(dashboard)/group/[groupId]/settings/_components/delete-group-section.tsx` | **New** — client component |
| `src/app/(dashboard)/group/[groupId]/settings/_components/delete-group-section.test.tsx` | **New** — component tests |
| `src/app/(dashboard)/page.tsx` or `layout.tsx` | **Update** — handle `?message=group-deleted` toast |

### Testing Requirements

- **Jest + Testing Library** (standard config)
- **DELETE route tests:** Mock `createClient` + `createAdminClient`; verify correct DB operations called per AC
- **Component tests:** Mock `fetch` + `useRouter`; test dialog flow, confirmation input matching, error handling
- **Regression gate:** Story 2-4 tests (PATCH route + GroupSettingsForm) + Story 2-3 tests must remain green

### Latest Technical Information

- **Next.js 16:** `src/proxy.ts` is the auth entrypoint — do NOT add `middleware.ts`
- **Tailwind CSS v4:** Config in `globals.css` — no `tailwind.config.js`
- **shadcn/ui base-nova:** Uses `@base-ui/react` primitives — check existing Dialog import in `src/components/ui/dialog.tsx` before using it
- **React 19:** `"use client"` on first line; `ref` is a regular prop (no `forwardRef`)
- **Privileged operations:** All destructive operations handled server-side in NestJS behind appropriate Guards

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.6]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Sections 3.2 (Groups schema), 3.3 (RLS — soft delete + service_role), 4.1]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/2-4-group-settings-exercise-scheduling.md`]
- [Source: `_bmad-output/implementation-artifacts/2-3-member-role-management.md`]
- [Source: `src/app/(dashboard)/group/[groupId]/settings/page.tsx`]
- [Source: `src/app/api/groups/[groupId]/route.ts`]
- [Source: NestJS GroupsModule service layer]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
