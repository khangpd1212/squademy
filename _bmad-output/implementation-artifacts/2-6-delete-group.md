# Story 2.6: Delete Group

Status: ready-for-dev

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
   **When** `DELETE /groups/:groupId` (GroupAdminGuard) executes,
   **Then** NestJS GroupsService executes the deletion within a Prisma transaction:
   **And** all `lessons`, `exercises`, `flashcard_decks` with `group_id` matching this group have `is_deleted` set to `true` (soft-delete),
   **And** all `group_members` rows for this group are deleted,
   **And** all `group_invitations` rows for this group are deleted,
   **And** the `groups` row is deleted,
   **And** I am redirected to `/dashboard` with an inline confirmation: "Group deleted."

3. **Given** I am a non-Admin member,
   **When** I view Group Settings,
   **Then** the "Delete Group" section is not visible.

## Tasks / Subtasks

- [ ] **Task 1: Shared — add error code for group deletion** (AC: 2)
  - [ ] Add `GROUP_DELETE_FAILED: "GROUP_DELETE_FAILED"` to `ErrorCode` in `packages/shared/src/constants/index.ts`
  - [ ] Add corresponding error message in `ErrorMessage` map (if it exists)

- [ ] **Task 2: Backend — `DELETE /groups/:id` endpoint** (AC: 2)
  - [ ] Add `@Delete(":id")` route to `GroupsController` in `apps/api/src/groups/groups.controller.ts`
    - Guards: `@UseGuards(GroupAdminGuard)`
    - Uses `@Param("id")` for groupId
    - Calls `groupsService.deleteGroup(id)`
    - Returns `{ ok: true }`
  - [ ] Add `deleteGroup(id: string)` method to `GroupsService` in `apps/api/src/groups/groups.service.ts`
    - Uses `prisma.$transaction()` for atomicity
    - Transaction steps (order matters for FK constraints):
      1. Soft-delete lessons: `prisma.lesson.updateMany({ where: { groupId }, data: { isDeleted: true } })`
      2. Soft-delete exercises: `prisma.exercise.updateMany({ where: { groupId }, data: { isDeleted: true } })` — **NOTE**: `exercises` table may not have `isDeleted` column yet; check Prisma schema and skip if column doesn't exist
      3. Delete group invitations: `prisma.groupInvitation.deleteMany({ where: { groupId } })`
      4. Delete group members: `prisma.groupMember.deleteMany({ where: { groupId } })` — Prisma `onDelete: Cascade` on GroupMember relation handles this, but explicit delete is safer in transaction
      5. Delete the group: `prisma.group.delete({ where: { id } })`
    - Wrap in try/catch; throw `BadRequestException({ code: ErrorCode.GROUP_DELETE_FAILED })` on failure
  - [ ] Add `Delete` import to controller imports

- [ ] **Task 3: Frontend — `useDeleteGroup` hook** (AC: 2)
  - [ ] Add `useDeleteGroup(groupId)` to `apps/web/src/hooks/api/use-group-queries.ts`
    - Mutation: `apiRequest(\`/groups/${groupId}\`, { method: "DELETE" })`
    - On success: invalidate `queryKeys.groups.myGroups` (dashboard refresh)
    - On error: throw `ApiError` with message
  - [ ] Follow existing mutation pattern from `useUpdateGroup`

- [ ] **Task 4: Frontend — Delete Group section in Settings** (AC: 1, 2, 3)
  - [ ] Create `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/delete-group-section.tsx` ("use client")
    - Props: `{ groupId: string; groupName: string }`
    - Only rendered when `isAdmin === true` (parent `GroupSettingsView` handles this check)
    - UI layout:
      - Separator above section
      - Section title: "Danger Zone" with destructive styling (`text-destructive`)
      - "Delete Group" button: `variant="destructive"` — opens confirmation dialog
    - Confirmation dialog (shadcn `Dialog`):
      - Title: "Delete {groupName}?"
      - Body: "Are you sure? All group content will be removed for members. This cannot be undone."
      - Text input: placeholder "Type the group name to confirm" — requires exact match of `groupName` (case-sensitive)
      - "Delete" button: `variant="destructive"`, disabled until input matches group name
      - "Cancel" button: closes dialog
    - On confirm:
      - Call `deleteGroupMutation.mutateAsync()`
      - On success: `router.push("/dashboard")` + display success toast "Group deleted."
      - On error: show inline error in dialog
    - Reset dialog state (input, error) when dialog closes

- [ ] **Task 5: Frontend — integrate Delete section into GroupSettingsView** (AC: 1, 3)
  - [ ] Update `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-view.tsx`
    - Import `DeleteGroupSection`
    - Render `<DeleteGroupSection groupId={groupId} groupName={group.name} />` AFTER the settings card
    - Only render when `isAdmin === true`
    - Wrap in a separate `<Card>` with danger zone styling or render below current card with spacing

- [ ] **Task 6: Install shadcn `separator` component if missing** (AC: 1)
  - [ ] Check if `apps/web/src/components/ui/separator.tsx` exists — it was listed in Story 2.1's available shadcn components, so it should exist
  - [ ] If missing: `npx shadcn@latest add separator`

- [ ] **Task 7: Tests** (AC: 1–3)
  - [ ] Backend: Add test to `apps/api/src/groups/groups.controller.spec.ts` or create `groups-delete.spec.ts`:
    - `DELETE /groups/:id` unauthenticated → 401
    - `DELETE /groups/:id` non-admin → 403
    - `DELETE /groups/:id` admin → 200, group deleted
    - `DELETE /groups/:id` non-existent group → 404
  - [ ] Frontend: Create `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/delete-group-section.test.tsx`:
    - Does not render when `isAdmin === false` (handled by parent, but test parent integration)
    - Renders "Danger Zone" section with "Delete Group" button
    - Opens confirmation dialog on button click
    - "Delete" button disabled until group name typed correctly
    - "Delete" button enabled when name matches
    - Calls delete API and redirects on success
    - Shows error on failure
    - Dialog resets on close
  - [ ] Run `yarn test`, `yarn lint`, `yarn build` to verify all pass

## Dev Notes

### Critical: Prisma Schema Check for Soft-Delete Columns

Before implementing the transaction, verify which models have `isDeleted` in `packages/database/prisma/schema.prisma`:

| Model | Has `isDeleted`? | Action |
|-------|-----------------|--------|
| `Lesson` | Check schema | If yes: `updateMany({ isDeleted: true })`; if no: skip soft-delete |
| `Exercise` | Check schema | Same as above |
| `FlashcardDeck` | Check schema | Same as above |

The architecture doc mentions `lessons.is_deleted` and `flashcard_decks.is_deleted` but **NOT** `exercises.is_deleted`. The Prisma schema is the source of truth — use `isDeleted` field only if it exists on the model. If it doesn't exist, either:
- Add a migration to include the column, OR
- Skip the soft-delete for that model (hard-delete with cascade will handle it when the group is deleted)

**Recommendation**: If `onDelete: Cascade` is set on the FK relations (check schema), the `prisma.group.delete()` call will cascade delete related records automatically. In that case, explicitly soft-delete lessons/flashcard_decks first (to preserve content attribution), then let cascade handle the rest.

### Critical: Cascade Behavior in Prisma Schema

Current `GroupMember` has `onDelete: Cascade` on both `group` and `user` relations. Verify:
- `GroupInvitation` → does it cascade on group delete?
- `Lesson` → does it cascade on group delete?

If cascade is configured, the transaction order simplifies to:
1. Soft-delete lessons/flashcard_decks (`updateMany`)
2. `prisma.group.delete()` — cascades: group_members, group_invitations, exercises (hard delete)

### Existing Patterns to Follow

**Controller pattern** (from `groups.controller.ts`):
```typescript
@Delete(":id")
@UseGuards(GroupAdminGuard)
async delete(@Param("id") id: string) {
  await this.groupsService.deleteGroup(id);
  return { ok: true };
}
```

**Service transaction pattern** (NestJS + Prisma):
```typescript
async deleteGroup(id: string) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Soft-delete content
    await tx.lesson.updateMany({
      where: { groupId: id },
      data: { isDeleted: true },
    });
    // 2. Delete group (cascade handles members, invitations)
    await tx.group.delete({ where: { id } });
  });
}
```

**Hook pattern** (from `useUpdateGroup`):
```typescript
export function useDeleteGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await apiRequest(`/groups/${groupId}`, { method: "DELETE" });
      if (result.message) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.myGroups });
    },
  });
}
```

**Dialog pattern** (shadcn Dialog):
```typescript
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
```

### Confirmation Dialog UX

The dialog must:
- Show the group name in the title for clarity
- Require **exact** group name match (case-sensitive) to prevent accidental deletion
- Disable the destructive "Delete" button until input matches
- Show a loading state during the API call (`isPending`)
- Prevent dialog close during deletion (disable close button and overlay click)
- Reset confirmation input when dialog re-opens

### Frontend Component Structure

```
apps/web/src/app/(dashboard)/group/[groupId]/settings/
├── page.tsx                                    # Server page (no changes)
└── _components/
    ├── group-settings-view.tsx                 # UPDATE: add DeleteGroupSection (admin only)
    ├── group-settings-form.tsx                 # No changes
    ├── group-settings-form.test.tsx            # No changes
    ├── delete-group-section.tsx                # NEW: danger zone + confirm dialog
    └── delete-group-section.test.tsx           # NEW: tests
```

### Backend File Changes

```
apps/api/src/groups/
├── groups.controller.ts                        # UPDATE: add DELETE :id route
├── groups.service.ts                           # UPDATE: add deleteGroup() method
└── groups.controller.spec.ts                   # UPDATE: add delete tests
```

### Hooks/Query Keys

No new query keys needed. `useDeleteGroup` invalidates existing `queryKeys.groups.myGroups`. The group detail cache for the deleted group will be automatically stale (group no longer exists).

### Cache Invalidation After Delete

After successful deletion:
1. Invalidate `queryKeys.groups.myGroups` — dashboard will refresh without the deleted group
2. Do NOT invalidate `queryKeys.groups.detail(groupId)` — the group no longer exists; navigating to the group page will show "Group not found" from `GroupLayoutShell` error state
3. Router push to `/dashboard` happens immediately

### Non-Admin Visibility

The `GroupSettingsView` component already checks `isAdmin` to conditionally render admin features. The `DeleteGroupSection` should only be rendered within the admin check block. Non-admin members will see the settings page but without any delete option (AC: 3).

### Available shadcn Components

Already installed: `dialog`, `button`, `input`, `label`, `card`, `separator`

### Testing Standards

- **Backend**: Mock `PrismaService` with `$transaction`, `lesson.updateMany`, `group.delete`
- **Frontend**: Mock `global.fetch`, mock `next/navigation` (`useRouter` for `push`), mock `sonner` (`toast`)
- **Dialog testing**: Use `userEvent.click()` to open dialog, `userEvent.type()` for name input, verify button disabled/enabled states
- **Colocated tests**: `*.test.tsx` next to source files

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.6 ACs]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 3.2 groups/lessons/exercises schema (soft-delete columns), Section 3.1 NestJS Guards]
- [Source: `_bmad-output/implementation-artifacts/2-1-create-configure-a-group.md` — Group creation patterns, API response format]
- [Source: `_bmad-output/implementation-artifacts/2-4-group-settings-exercise-scheduling.md` — Settings page structure, admin check pattern]
- [Source: `apps/api/src/groups/groups.controller.ts` — Controller route patterns, Guard usage]
- [Source: `apps/api/src/groups/groups.service.ts` — Prisma service patterns, transaction style]
- [Source: `apps/web/src/hooks/api/use-group-queries.ts` — Mutation hook patterns, cache invalidation]
- [Source: `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-view.tsx` — Admin check, component layout]
- [Source: `apps/web/src/app/(dashboard)/group/[groupId]/_components/group-layout-shell.tsx` — Error state for non-existent groups]
- [Source: `packages/database/prisma/schema.prisma` — Group model, cascade behavior]
- [Source: `packages/shared/src/constants/index.ts` — ErrorCode enum]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
