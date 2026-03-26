# Story 2.4: Group Settings & Exercise Scheduling

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Group Admin,
I want to configure my group's name, description, and weekly exercise schedule,
so that members know what the group is about and when exercises are due.

## Acceptance Criteria

1. **Given** I navigate to the Group Settings page (`/group/[groupId]/settings`),
   **When** the page loads,
   **Then** the current group name, description, and exercise schedule settings are pre-populated.

2. **Given** I update the group name or description and click Save,
   **When** the mutation runs,
   **Then** the `groups` table is updated via NestJS API,
   **And** a success indicator appears inline,
   **And** the updated name is reflected immediately in the group layout header.

3. **Given** I configure the weekly exercise schedule (deadline day and time),
   **When** I save the settings,
   **Then** the `groups` table stores the schedule configuration,
   **And** the schedule is displayed in the group home page for all members to see.

4. **Given** I submit the settings form with an empty group name,
   **When** Zod validation runs,
   **Then** an inline error appears: "Group name is required." and the form is not submitted.

## Tasks / Subtasks

- [x] **Task 1: Add exercise schedule columns to `groups` table via migration** (AC: 1, 3)
  - [x] Apply Prisma migration:
    - Migration name: `add_exercise_schedule_to_groups`
    - SQL:
      ```sql
      ALTER TABLE groups
        ADD COLUMN exercise_deadline_day smallint CHECK (exercise_deadline_day BETWEEN 0 AND 6),
        ADD COLUMN exercise_deadline_time time without time zone;
      ```
      (0 = Sunday, 1 = Monday … 6 = Saturday; both nullable by default)
  - [x] Regenerate TypeScript types: run `prisma generate` → types available via `@squademy/database`
  - [x] Verify `database.ts` `Groups.Row` now includes `exercise_deadline_day: number | null` and `exercise_deadline_time: string | null`

- [x] **Task 2: Create group settings Zod schema** (AC: 2, 3, 4)
  - [x] Create `src/app/api/groups/[groupId]/group-settings-schema.ts`:
    ```typescript
    import { z } from "zod";

    export const groupSettingsSchema = z.object({
      name: z
        .string()
        .trim()
        .min(1, "Group name is required.")
        .max(100, "Group name must be 100 characters or less."),
      description: z
        .string()
        .trim()
        .max(500, "Description must be 500 characters or less.")
        .optional()
        .or(z.literal("")),
      exercise_deadline_day: z
        .number()
        .int()
        .min(0)
        .max(6)
        .nullable()
        .optional(),
      exercise_deadline_time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format.")
        .nullable()
        .optional(),
    });

    export type GroupSettingsInput = z.infer<typeof groupSettingsSchema>;
    ```

- [x] **Task 3: Create PATCH `/api/groups/[groupId]` route** (AC: 2, 3, 4)
  - [x] Create `src/app/api/groups/[groupId]/route.ts` with `PATCH` handler following strict route order:
    1. **Auth:** verify JWT via `getCurrentUser()` → 401 if no user
    2. **Admin guard:** Query `group_members` where `group_id = groupId AND user_id = user.id AND role = 'admin'` → 403 if not found
    3. **Parse:** `request.json().catch(() => null) as GroupSettingsInput | null`
    4. **Validate:** `groupSettingsSchema.safeParse(body)` → 400 with `{ message, field }` on failure
    5. **Mutation:** `createAdminClient().from("groups").update({...}).eq("id", groupId)` — use admin client because RLS UPDATE policy on `groups` may not be established for admin role yet
    6. **Response:** `{ ok: true, group: { id, name, description, exercise_deadline_day, exercise_deadline_time } }` with 200
  - [x] Handle 404 (group not found or not admin) gracefully — return 404 if group row doesn't exist
  - [x] Normalize `description`: empty string → `null` (reuse `toNullableDescription` pattern from `group-schema.ts`)
  - [x] Normalize schedule: if `exercise_deadline_day` is null/undefined → store null; same for time
  - [x] Create `src/app/api/groups/[groupId]/route.test.ts`:
    - [x] 401 when unauthenticated
    - [x] 403 when caller is not group admin
    - [x] 404 when group does not exist
    - [x] 400 when name is empty string
    - [x] 200 successful update of name + description only (no schedule)
    - [x] 200 successful update with exercise_deadline_day = 1 and exercise_deadline_time = "23:59"
    - [x] 200 successful update clearing schedule (null values)

- [x] **Task 4: Build `GroupSettingsForm` client component** (AC: 1, 2, 3, 4)
  - [x] Create `src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.tsx`
    - [x] Mark `"use client"` on first line
    - [x] Accept props: `groupId: string`, `initialValues: GroupSettingsInput`, `isAdmin: boolean`
    - [x] Use `useForm<GroupSettingsInput>({ resolver: zodResolver(groupSettingsSchema), defaultValues: initialValues })`
    - [x] Fields:
      - `name` — text input (required)
      - `description` — textarea (optional, max 500 chars)
      - `exercise_deadline_day` — `<select>` with options: `"" → "No schedule"`, `0 → "Sunday"`, `1 → "Monday"`, ..., `6 → "Saturday"`
      - `exercise_deadline_time` — `<input type="time">` visible only when `exercise_deadline_day` is not null/empty
    - [x] On submit: `fetch(\`/api/groups/\${groupId}\`, { method: "PATCH", body: JSON.stringify(data) })`
    - [x] On success: show sonner `toast.success("Settings saved.")` + call `router.refresh()` (Next.js router from `next/navigation`)
    - [x] On API error: `form.setError("name", { message: responseBody.message })` for name field errors; otherwise `form.setError("root", ...)`
    - [x] Save button: disabled + shows "Saving…" text during pending state (use `form.formState.isSubmitting`)
    - [x] If `!isAdmin`: render read-only view (no form, no save button) — display values as plain text
  - [x] Create `src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.test.tsx`:
    - [x] Renders pre-populated name and description
    - [x] Shows "No schedule" when `exercise_deadline_day` is null
    - [x] Shows time input when deadline day is selected
    - [x] Inline error shown for empty name on submit attempt
    - [x] Save button shows disabled/loading during submit
    - [x] Success toast triggered on successful save
    - [x] API error sets field error on name
    - [x] Non-admin renders read-only (no save button, no inputs)

- [x] **Task 5: Update settings page server component** (AC: 1, 2, 3)
  - [x] Update `src/app/(dashboard)/group/[groupId]/settings/page.tsx`:
    - [x] Auth guard: `getCurrentUser()` from `@/lib/api/client` → redirect to `/login` if no user
    - [x] Fetch group: `apiClient("/groups/{groupId}")` via server-side client
    - [x] Fetch caller role: `apiClient("/groups/{groupId}/members/me")` via server-side client
    - [x] If caller is not a group member → redirect to `/group/[groupId]`
    - [x] Render heading "Group Settings" + `<GroupSettingsForm>` with pre-populated values
    - [x] Pass `isAdmin: callerRole === "admin"` prop
    - [x] Story 2-5 (Delete Group) will add a separate section below — leave a `{/* Delete Group section — Story 2.5 */}` placeholder comment

- [x] **Task 6: Display schedule on group home page** (AC: 3)
  - [x] Update `src/app/(dashboard)/group/[groupId]/page.tsx`:
    - [x] Add `exercise_deadline_day, exercise_deadline_time` to existing groups SELECT
    - [x] Add a schedule display section: "Weekly exercise deadline: Every {dayName} at {time}" if both fields are set; otherwise render nothing (no empty state text needed — schedule is optional)
    - [x] Day mapping helper (inline): `['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day]`

- [x] **Task 7: Quality gates**
  - [x] Run `npm test` — all suites pass (including regressions for members/invite)
  - [x] Run `npm run lint` — no errors
  - [x] Run `npm run build` — build succeeds

## Dev Notes

### Story Context and Intent

- The settings page (`/group/[groupId]/settings`) is a **stub** — returns `<div>Group settings will appear here.</div>`. This story replaces it with a full implementation.
- Two new columns need to be added to `groups` via migration: `exercise_deadline_day` (smallint, nullable) and `exercise_deadline_time` (time, nullable). The current `database.ts` does NOT include these — **migration + type regen is the critical first step**.
- Story 2-5 (Delete Group) will add a "Danger Zone" delete section to this same settings page. Design the page layout so that section can be appended below `<GroupSettingsForm>`.
- Non-admin members can view settings but cannot edit (read-only form with no save button).

### Previous Story Intelligence (2-3)

Proven patterns from Story 2-3 to reuse:
- Server page component fetches data + passes to client component (e.g., `members/page.tsx` → `<MemberManagementList />`)
- API route order: auth → admin check → parse body → safeParse → mutate → return `{ ok: true, ... }`
- `createAdminClient()` for privileged mutations (avoid RLS gaps)
- Inline error messages using `form.setError()` + sonner toast for success
- `router.refresh()` to re-trigger Server Component data fetch (updates group layout header name after rename)

Files created in Story 2-3 (DO NOT modify unless adding regression test coverage):
- `src/app/api/groups/[groupId]/members/[memberId]/member-role-schema.ts`
- `src/app/api/groups/[groupId]/members/[memberId]/route.ts` (DELETE)
- `src/app/api/groups/[groupId]/members/[memberId]/role/route.ts` (PATCH)
- `src/app/(dashboard)/group/[groupId]/members/_components/member-management-list.tsx`
- `src/app/(dashboard)/group/[groupId]/members/page.tsx`

### Technical Requirements

- **Stack:** Next.js 16 + React 19 + TypeScript strict + Zod v4 + React Hook Form + shadcn/ui + NestJS API
- **No new packages needed** — all dependencies are installed
- **Zod v4 API:** Use `z.infer<typeof schema>` (NOT `z.TypeOf`); `safeParse()` in API routes (NOT `parse()`)
- **Path alias:** Always use `@/*` (maps to `./src/*`). Never use relative `../../` paths
- **Form schema file naming:** `group-settings-schema.ts` (kebab-case), export both schema and inferred type
- **Route PATCH order:** 1. auth 2. guard 3. parse 4. validate 5. mutate 6. respond

### Architecture Compliance

- **Migration first:** `exercise_deadline_day` and `exercise_deadline_time` must exist in Postgres AND in `database.ts` before writing any API/component code that references them
- **Migration tool:** Use `prisma migrate dev` for local development
- **Type regen:** After migration, run `prisma generate` → types available via `@squademy/database`
- **Update operations:** Handled by NestJS GroupsModule service with Prisma, protected by GroupAdminGuard.
- **Proxy not middleware:** `src/proxy.ts` handles auth redirects — do NOT create `middleware.ts`
- **Tailwind v4:** No `tailwind.config.js` — all config in `globals.css`

### File Structure Requirements

Expected new/modified files:

| File | Action |
|------|--------|
| `src/types/database.ts` | Regenerate after migration |
| `src/app/api/groups/[groupId]/route.ts` | **New** — PATCH handler |
| `src/app/api/groups/[groupId]/group-settings-schema.ts` | **New** — Zod schema |
| `src/app/api/groups/[groupId]/route.test.ts` | **New** — route tests |
| `src/app/(dashboard)/group/[groupId]/settings/page.tsx` | **Update** — replace stub |
| `src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.tsx` | **New** — client form |
| `src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.test.tsx` | **New** — form tests |
| `src/app/(dashboard)/group/[groupId]/page.tsx` | **Update** — add schedule display |

### Testing Requirements

- **Jest + Testing Library** (`jest.config.cjs`, `jsdom` environment)
- **API route tests:** import handler directly, mock `@/lib/api/client` and API responses
- **Component tests:** mock `fetch` + `next/navigation` (`useRouter`), assert form behavior
- **Regression gate:** `members` and `invite` existing tests must remain green

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.4]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Sections 2.2, 3.2 (Groups & Membership schema), 3.3 (RLS), 4.1]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/2-3-member-role-management.md`]
- [Source: `src/app/(dashboard)/group/[groupId]/settings/page.tsx`]
- [Source: `src/app/api/groups/group-schema.ts`]
- [Source: `src/app/api/groups/route.ts`]
- [Source: `src/types/database.ts`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Applied Prisma migration `add_exercise_schedule_to_groups`.
- Regenerated Prisma TypeScript database types via `prisma generate`.
- Verified quality gates: `npm test`, `npm run lint`, `npm run build`.

### Completion Notes List

- Implemented group settings schema, API PATCH route, and route tests for auth/admin/validation/schedule updates.
- Built `GroupSettingsForm` with admin editing, non-admin read-only mode, inline errors, success toast, and refresh.
- Replaced settings page stub with full server-side loading/auth/membership guards and form rendering.
- Added schedule display on group home page when both day and time are configured.
- Updated `groups` type definitions with `exercise_deadline_day` and `exercise_deadline_time`.

### File List

- src/types/database.ts
- src/app/api/groups/[groupId]/group-settings-schema.ts
- src/app/api/groups/[groupId]/route.ts
- src/app/api/groups/[groupId]/route.test.ts
- src/app/(dashboard)/group/[groupId]/settings/page.tsx
- src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.tsx
- src/app/(dashboard)/group/[groupId]/settings/_components/group-settings-form.test.tsx
- src/app/(dashboard)/group/[groupId]/page.tsx

### Change Log

- 2026-03-19: Implemented Story 2.4 group settings and exercise scheduling end-to-end with migration, API, UI, tests, and quality gate validation.
