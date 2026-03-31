# Story 2.4: Group Settings & Exercise Scheduling

Status: done

## Story

As a Group Admin,
I want to configure my group's name, description, and weekly exercise schedule,
so that members know what the group is about and when exercises are due.

## Acceptance Criteria

1. **Given** I navigate to the Group Settings page (`/group/[groupId]/settings`),
   **When** the page loads,
   **Then** `GET /groups/:groupId` (GroupMemberGuard) returns the current group name, description, and exercise schedule settings pre-populated.

2. **Given** I update the group name or description and click Save,
   **When** `PATCH /groups/:groupId` (GroupAdminGuard) executes,
   **Then** the `groups` table is updated via Prisma,
   **And** a success indicator appears inline,
   **And** the updated name is reflected immediately in the group layout header via React Query cache invalidation.

3. **Given** I configure the weekly exercise schedule (deadline day and time),
   **When** I save the settings,
   **Then** the schedule configuration is stored in the `groups` table via NestJS API,
   **And** the schedule is displayed in the group home page for all members to see.

4. **Given** I submit the settings form with an empty group name,
   **When** Zod validation runs (shared schema from `@squademy/shared`),
   **Then** an inline error appears: "Group name is required." and the form is not submitted.

## Tasks / Subtasks

- [x] **Task 1: Database schema — exercise schedule fields on `groups` table** (AC: 3)
  - [x] Prisma `Group` model has `exerciseDeadlineDay Int? @map("exercise_deadline_day")` and `exerciseDeadlineTime String? @map("exercise_deadline_time")`
  - [x] Migration applied

- [x] **Task 2: Shared schemas and validation constants** (AC: 2, 3, 4)
  - [x] `VALIDATION.DEADLINE_DAY_MIN` (0) and `DEADLINE_DAY_MAX` (6) in `packages/shared/src/constants/validation.ts`
  - [x] `groupSettingsSchema` Zod schema in `packages/shared/src/schemas/group.ts` — validates name (required, 1–100 chars), description (optional, max 500), exerciseDeadlineDay (int 0–6 nullable), exerciseDeadlineTime (HH:MM regex nullable)
  - [x] `GroupSettingsInput` type exported

- [x] **Task 3: Backend — `PATCH /groups/:id` endpoint** (AC: 1, 2, 3)
  - [x] `UpdateGroupDto` in `apps/api/src/groups/dto/update-group.dto.ts` implements `GroupSettingsInput` with class-validator decorators
  - [x] `GroupsService.update(id, dto)` calls `prisma.group.update()` with passthrough DTO
  - [x] `GroupsController.update()` at `PATCH :id` with `@UseGuards(GroupAdminGuard)`
  - [x] Returns `{ ok: true, data: group }`

- [x] **Task 4: Backend — `GET /groups/:id` returns schedule data** (AC: 1)
  - [x] `GroupsService.findById(id)` returns full group including `exerciseDeadlineDay` and `exerciseDeadlineTime`
  - [x] Protected by `GroupMemberGuard`

- [x] **Task 5: Frontend — settings page and form** (AC: 1, 2, 3, 4)
  - [x] Server page: `apps/web/src/app/(dashboard)/group/[groupId]/settings/page.tsx` — renders `<GroupSettingsView>`
  - [x] `GroupSettingsView`: loads group via `useGroup(groupId)`, checks admin role, passes initialValues to form
  - [x] `GroupSettingsForm` (admin mode): RHF + zodResolver(`groupSettingsSchema`), fields for name (Input), description (Textarea), deadline day (Select with day names + "No schedule" clear option), deadline time (Input type="time", conditionally shown)
  - [x] `GroupSettingsForm` (non-admin mode): read-only display of name, description, schedule text
  - [x] Uses `useUpdateGroup(groupId)` mutation hook; success triggers `toast.success("Settings saved.")` + `router.refresh()`
  - [x] Error handling: field-level errors via `form.setError()`, root errors for server/network failures

- [x] **Task 6: Frontend — `useUpdateGroup` hook with cache invalidation** (AC: 2)
  - [x] `useUpdateGroup(groupId)` in `apps/web/src/hooks/api/use-group-queries.ts`
  - [x] On success: invalidates `queryKeys.groups.detail(groupId)` — group layout header auto-updates
  - [x] Also needs to invalidate `queryKeys.groups.myGroups` if name changed (for dashboard card refresh)

- [x] **Task 7: Frontend — exercise schedule display on group home page** (AC: 3)
  - [x] `GroupOverview` component at `apps/web/src/app/(dashboard)/group/[groupId]/_components/group-overview.tsx`
  - [x] Conditionally renders: "Weekly exercise deadline: Every {DayName} at {HH:MM}" when both `exerciseDeadlineDay` and `exerciseDeadlineTime` are set

- [x] **Task 8: Frontend — group layout tab navigation includes Settings** (AC: 1)
  - [x] `GroupLayoutShell` includes "Settings" tab linking to `/group/[groupId]/settings`
  - [x] Shows group name as `<h1>` in layout header, automatically updated via React Query

- [x] **Task 9: Tests** (AC: 1–4)
  - [x] Frontend: `group-settings-form.test.tsx` — 10 tests covering:
    - Pre-populated name and description
    - "No schedule" when deadline day is null
    - Time input appears when day selected
    - Empty name validation prevents submit
    - Disabled button + "Saving..." during submit
    - Success toast on save
    - Field-level and root error handling
    - Network error handling
    - Schedule payload correctness
    - Read-only view for non-admin
  - [x] Run `yarn test`, `yarn lint`, `yarn build` to verify all pass

## Dev Notes

### Implementation Status

This story was implemented alongside earlier group management work. All tasks and verification gates are now complete.

### Existing File Map

```
packages/shared/src/
├── schemas/group.ts              # groupSettingsSchema, GroupSettingsInput
├── constants/validation.ts       # DEADLINE_DAY_MIN, DEADLINE_DAY_MAX

apps/api/src/groups/
├── groups.controller.ts          # PATCH :id (GroupAdminGuard)
├── groups.service.ts             # update(id, dto) → prisma.group.update()
├── dto/update-group.dto.ts       # class-validator DTO implements GroupSettingsInput

apps/web/src/app/(dashboard)/group/[groupId]/
├── settings/
│   ├── page.tsx                  # Server page → <GroupSettingsView>
│   └── _components/
│       ├── group-settings-view.tsx     # Admin check, loads group, passes to form
│       ├── group-settings-form.tsx     # RHF + Zod, admin form / non-admin read-only
│       └── group-settings-form.test.tsx # 10 test cases
├── _components/
│   ├── group-overview.tsx        # Shows exercise schedule on home page
│   └── group-layout-shell.tsx    # Tab navigation including Settings

apps/web/src/hooks/api/
├── use-group-queries.ts          # useGroup(), useUpdateGroup() with cache invalidation
```

### Cache Invalidation Note

`useUpdateGroup` now invalidates both `queryKeys.groups.detail(groupId)` and `queryKeys.groups.myGroups` on success, so dashboard group cards reflect name changes immediately.

### Codebase Patterns Used

- **Form pattern**: `useForm<GroupSettingsInput>({ resolver: zodResolver(groupSettingsSchema) })` with `mode: "onSubmit"` (default)
- **Conditional field**: `useWatch()` for `exerciseDeadlineDay` to show/hide time input
- **Select clear**: "No schedule" `SelectItem` with `value="clear"` resets day to null and clears time
- **Non-admin read-only**: Same component renders static text instead of form when `isAdmin === false`
- **Toast feedback**: Uses `sonner` `toast.success()` for save confirmation (deviation from "no toasts" MVP guideline — already established pattern in settings)

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.4 ACs]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 3.2 groups schema, Section 3.1 NestJS stack]
- [Source: `packages/shared/src/schemas/group.ts` — groupSettingsSchema]
- [Source: `apps/api/src/groups/dto/update-group.dto.ts` — UpdateGroupDto]
- [Source: `apps/api/src/groups/groups.service.ts` — update method]
- [Source: `apps/web/src/hooks/api/use-group-queries.ts` — useUpdateGroup hook]
- [Source: `apps/web/src/app/(dashboard)/group/[groupId]/_components/group-overview.tsx` — schedule display]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- `yarn test` (root) — initially failed on `@squademy/web` page suites due Jest ESM parse of `next-intl`.
- Added Jest runtime mock for `next-intl` in `apps/web/jest.setup.ts` and reran verification.
- Final verification runs:
  - `yarn test` (root) — PASS (all suites passing)
  - `yarn lint` (root) — PASS
  - `yarn build` (root) — PASS

### Completion Notes List

- All implementation tasks completed as part of prior group management work.
- Settings page fully functional with admin/non-admin views, exercise scheduling, and comprehensive test suite (10 tests).
- Exercise schedule displayed on group home page.
- Resolved verification blocker by stabilizing Jest runtime handling for `next-intl` in web tests.
- Completed final verification gate: `yarn test`, `yarn lint`, and `yarn build` all pass at monorepo root.

### File List

- `packages/shared/src/schemas/group.ts`
- `packages/shared/src/constants/validation.ts`
- `packages/database/prisma/schema.prisma`
- `apps/api/src/groups/groups.controller.ts`
- `apps/api/src/groups/groups.service.ts`
- `apps/api/src/groups/dto/update-group.dto.ts`
- `apps/web/src/app/(dashboard)/group/[groupId]/settings/page.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-view.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.test.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/_components/group-overview.tsx`
- `apps/web/src/hooks/api/use-group-queries.ts`
- `apps/web/jest.config.cjs`
- `apps/web/jest.setup.ts`
- `apps/api/src/groups/groups.controller.spec.ts`

## Senior Developer Review (AI)

**Review Date:** 2026-03-30
**Review Outcome:** Approve (after fixes)
**Findings:** 0 Critical, 4 Medium, 3 Low

### Action Items

- [x] [M1][Medium] `useUpdateGroup` missing `queryKeys.groups.myGroups` invalidation — dashboard stale after name change
- [ ] [M2][Medium] `UpdateGroupDto` requires `name` on PATCH — violates REST partial-update semantics (deferred — design debt)
- [ ] [M3][Medium] `GroupsService.update()` passes raw DTO to Prisma without field selection (deferred — design debt)
- [x] [M4][Medium] `exerciseDeadlineTime` regex accepts invalid times like "25:99" — tightened to `([01]\d|2[0-3]):[0-5]\d`
- [ ] [L1][Low] Zod schema indentation inconsistency on `exerciseDeadlineTime` (deferred — cosmetic)
- [x] [L2][Low] Select controlled/uncontrolled warning in tests — fixed initial value from `undefined` to `""`
- [x] [L3][Low] No backend unit tests for PATCH update — added 4 tests to `groups.controller.spec.ts`

## Senior Developer Review 2 (AI)

**Review Date:** 2026-03-30
**Review Outcome:** Approve
**Findings:** 0 Critical, 4 Medium (1 new + 3 carried), 2 Low (1 new + 1 carried)

### Action Items

- [x] [M1-R2][Medium] AC1 guard mismatch: Epic spec says `GroupAdminGuard`, implementation uses `GroupMemberGuard` — epic spec corrected (implementation was correct)
- [ ] [M2][Medium] `UpdateGroupDto` requires `name` on PATCH — violates REST partial-update semantics (carried — design debt)
- [ ] [M3][Medium] `GroupsService.update()` passes raw DTO to Prisma without field selection (carried — design debt)
- [ ] [M4-R2][Medium] Zod `groupSettingsSchema` allows `""` for `exerciseDeadlineTime` but backend rejects it — frontend `onSubmit` normalizes to `null` (deferred — low risk, frontend handles it)
- [ ] [L1][Low] Zod schema indentation inconsistency on `exerciseDeadlineTime` (carried — cosmetic)
- [x] [L2-R2][Low] `DAY_NAMES` duplicated in `group-settings-form.tsx` and `group-overview.tsx` — extracted to `@squademy/shared` constant

## Change Log

- 2026-03-30: Completed final verification subtask and moved story to review. Added Jest support/mocking for `next-intl` in web test runtime so full monorepo `test/lint/build` gates pass.
- 2026-03-30: Code review completed. Fixed 4 issues (M1, M4, L2, L3). Deferred 3 issues (M2, M3, L1) as design debt/cosmetic. All gates pass.
- 2026-03-30: Final verification gate passed — `yarn test` (82 tests, 19 suites), `yarn lint`, `yarn build` all PASS. Status → review.
- 2026-03-30: Code review 2 completed. Fixed M1-R2 (epic spec guard mismatch) and L2-R2 (DAY_NAMES deduplication to shared). Deferred M4-R2 (Zod empty string). Carried M2, M3, L1.
