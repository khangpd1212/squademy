# Story 2.1: Create & Configure a Group

Status: done

## Story

As a logged-in user,
I want to create a new learning group with a name and description,
so that I can invite my classmates and organize our study activities in one place.

## Acceptance Criteria

1. **Given** I am logged in and navigate to the "Create Group" screen,
   **When** I submit a valid group name (required) and optional description,
   **Then** a new `groups` row is created with a unique `invite_code` slug auto-generated,
   **And** a `group_members` row is created with my `user_id` and `role = 'admin'`,
   **And** I am redirected to the new group's home page at `/group/[groupId]`.

2. **Given** I submit the Create Group form with an empty group name,
   **When** Zod validation runs,
   **Then** an inline error appears: "Group name is required." and the form is not submitted.

3. **Given** I am on the group home page after creation,
   **When** the page loads,
   **Then** an empty state is shown: "Your group is ready! Invite members to get started.",
   **And** a prominent "Invite Members" CTA button is visible.

## Tasks / Subtasks

- [x] **Task 1: Database schema migration — add `description` column to `groups` table** (AC: 1)
  - [x] Create Supabase migration: `ALTER TABLE groups ADD COLUMN description text;`
  - [x] Update `src/types/database.ts` — add `description` to `groups.Row`, `groups.Insert`, `groups.Update`
  - [x] Add RLS policies for `groups` table: authenticated users can INSERT; group admin can UPDATE; group members can SELECT

- [x] **Task 2: Create group API route** (AC: 1, 2)
  - [x] Create `src/app/api/groups/route.ts` with `POST` handler
  - [x] Create shared Zod schema `src/app/api/groups/group-schema.ts` (`name` required, 1–100 chars; `description` optional, max 500 chars)
  - [x] In POST handler: validate body → generate `invite_code` via `nanoid(customAlphabet)` → insert `groups` row → insert `group_members` row (role: admin) → return `{ id, name, invite_code }`
  - [x] Use server Supabase client (`createClient` from `@/lib/supabase/server`) with user session for auth context
  - [x] Handle uniqueness conflict on `invite_code` — retry with new code on constraint violation (max 3 retries)
  - [x] Return proper error responses: `400` for validation, `401` for unauthenticated, `500` for server error

- [x] **Task 3: Install `nanoid` dependency** (AC: 1)
  - [x] Run `npm install nanoid`
  - [x] Use `customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)` for URL-safe, human-readable invite codes

- [x] **Task 4: Create Group UI — form page** (AC: 1, 2)
  - [x] Create `src/app/(dashboard)/groups/create/page.tsx` (server component wrapper)
  - [x] Create `src/app/(dashboard)/groups/create/_components/create-group-form.tsx` (client component)
  - [x] Form uses `react-hook-form` + `zodResolver` with shared schema from `group-schema.ts`
  - [x] Fields: Group Name (`sq-input`, required), Description (`textarea`, optional)
  - [x] Submit button: `sq-btn-green` ("Create Group"), disabled while submitting
  - [x] On success: `router.push(\`/group/\${data.id}\`)`
  - [x] On error: inline field errors via `form.setError()` and general errors via `submitError` state
  - [x] Follow exact form patterns from `src/app/(dashboard)/settings/_components/profile-form.tsx`

- [x] **Task 5: Add "Create Group" navigation entry** (AC: 1)
  - [x] Add "Create Group" link/button in sidebar (`src/components/layout/sidebar.tsx`)
  - [x] Add entry point in mobile nav if applicable (`src/components/layout/mobile-nav.tsx`)
  - [x] Use `Plus` icon from `lucide-react`

- [x] **Task 6: Group home page — empty state** (AC: 3)
  - [x] Update `src/app/(dashboard)/group/[groupId]/page.tsx` to fetch group data and member count from Supabase
  - [x] If group has no content and few members, show empty state card: "Your group is ready! Invite members to get started." with a prominent "Invite Members" CTA (`sq-btn-green`)
  - [x] "Invite Members" CTA links to `/group/[groupId]/members` (Story 2.2 will implement the invite flow; CTA is a placeholder link for now)
  - [x] Show group name as `<h1>` and description (if present) as `text-muted-foreground` paragraph

- [x] **Task 7: Update group layout to show group name** (AC: 3)
  - [x] In `src/app/(dashboard)/group/[groupId]/layout.tsx`, fetch group name from Supabase and display it above the tab nav
  - [x] Add loading skeleton while fetching

- [x] **Task 8: Tests** (AC: 1, 2, 3)
  - [x] API route tests: `src/app/api/groups/route.test.ts`
    - Authenticated POST with valid data → 201 with group object
    - POST with empty name → 400 with validation error
    - Unauthenticated POST → 401
  - [x] Form component test: `src/app/(dashboard)/groups/create/_components/create-group-form.test.tsx`
    - Renders form fields
    - Shows validation error on empty submit
    - Calls API and redirects on success (mock `fetch` and `router.push`)
  - [x] Run `npm test`, `npm run lint`, `npm run build` to verify

## Dev Notes

### Existing Codebase Intelligence

**Form patterns (MUST follow):**
- Client components use `"use client"` directive
- `useForm()` from `react-hook-form` with `zodResolver(schema)`, `mode: "onSubmit"`
- `form.register("fieldName")` for binding, `form.formState.errors.fieldName?.message` for inline errors
- `form.setError(field, { type: "server", message })` for API field errors
- `submitError` state for general server errors
- `isSaving` state for submit button disabled state
- Success feedback is inline, not toast (no toasts in MVP)
- API calls via `fetch("/api/...", { method: "POST", body: JSON.stringify(...) })`

**Server component patterns:**
- Settings page (`src/app/(dashboard)/settings/page.tsx`) shows the pattern: create server Supabase client → get user → redirect if no user → fetch data → pass to client form component
- Group pages use `params: Promise<{ groupId: string }>` and `await params` (Next.js 16 async params)

**API route patterns:**
- Parse and validate with `schema.safeParse(await request.json())`
- Return `NextResponse.json({ message, field }, { status })` for errors
- Use server Supabase client for all DB operations

**Supabase patterns:**
- Browser: `createClient()` from `@/lib/supabase/client` (sync)
- Server: `createClient()` from `@/lib/supabase/server` (async, uses cookies)
- All DB operations go through Supabase client, no custom REST layer

**UI patterns:**
- Cards: `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` from shadcn
- Inputs: `sq-input` class (border 1.5px, radius 10px, purple focus ring)
- Buttons: `sq-btn-green` for primary actions
- Error text: `text-xs text-destructive`
- Success text: `text-emerald-600 dark:text-emerald-400`

**Existing shadcn components available:** `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `separator`, `sheet`, `skeleton`, `sonner`, `table`, `tabs`, `tooltip`

**Missing shadcn components needed:** `textarea` — must install via `npx shadcn@latest add textarea`

### Technical Requirements

**Invite Code Generation:**
- Use `nanoid` package with `customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)` for 12-char URL-safe codes
- Generate server-side only (in API route), never on client
- Handle uniqueness constraint violation with retry (the `invite_code` column has UNIQUE constraint in Supabase)

**Database Schema Gap:**
- The current `src/types/database.ts` is missing `description` field on `groups` table
- Architecture doc specifies: `groups.description text` (nullable)
- Must add this column via Supabase migration AND update the TypeScript types
- Also ensure `groups.Update` includes `description?: string | null` for Story 2.4

**RLS Policies Required for `groups` table:**
- SELECT: group members can read their group (`auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = groups.id)`)
- INSERT: any authenticated user can create a group (`auth.uid() IS NOT NULL`)
- UPDATE: only group admin (`auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = groups.id AND role = 'admin')`)
- DELETE: only group admin (same as UPDATE)

**RLS Policies Required for `group_members` table:**
- SELECT: group members can see other members in their group
- INSERT: server-side only for initial admin row; invite acceptance handled by Story 2.2
- UPDATE: only group admin can change roles
- DELETE: only group admin can remove members (or self-removal)

**Transaction safety:** The group creation (INSERT into `groups` + INSERT into `group_members`) should ideally be atomic. If Supabase doesn't support multi-table transactions from client, handle it in the API route: insert group first, if member insert fails, delete the group.

### File Structure Requirements

```
src/
├── app/
│   ├── api/
│   │   └── groups/
│   │       ├── route.ts                    # POST: create group
│   │       ├── route.test.ts               # API tests
│   │       └── group-schema.ts             # Shared Zod schema
│   └── (dashboard)/
│       ├── groups/
│       │   └── create/
│       │       ├── page.tsx                # Server component wrapper
│       │       └── _components/
│       │           ├── create-group-form.tsx      # Client form component
│       │           └── create-group-form.test.tsx # Form tests
│       └── group/
│           └── [groupId]/
│               ├── layout.tsx              # UPDATE: add group name display
│               └── page.tsx                # UPDATE: add empty state + group data fetch
├── types/
│   └── database.ts                         # UPDATE: add description to groups
```

### Project Structure Notes

- Group creation page at `/groups/create` (under dashboard route group) — NOT under `/group/[groupId]` since there's no groupId yet
- API route at `/api/groups` (plural) for CRUD operations on groups collection
- Shared Zod schema colocated with API route for reuse by form component
- Follow existing pattern: server page → client form component in `_components/`

### Testing Standards

- Framework: Jest + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Test files colocated: `*.test.ts` / `*.test.tsx` next to source files
- Mock `fetch` for API calls in form tests
- Mock `next/navigation` (`useRouter`, `useSearchParams`) for redirect assertions
- Run full suite: `npm test`, `npm run lint`, `npm run build`

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.1 acceptance criteria]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 2.2 Directory Structure, Section 3.2 Database Schema (Groups & Membership), Section 3.3 RLS Summary]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR5 (Group creation), FR6 (invite code generation)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Flow 1 Onboarding, Empty State patterns, Button Hierarchy]
- [Source: `src/app/(dashboard)/settings/_components/profile-form.tsx` — Form pattern reference]
- [Source: `src/app/(auth)/register/_components/register-form.tsx` — API call + redirect pattern]
- [Source: `src/types/database.ts` — Current type definitions (needs description field added)]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

- `npm test -- "src/app/api/groups/route.test.ts" "src/app/(dashboard)/groups/create/_components/create-group-form.test.tsx"`
- `npm test`
- `npm run lint`
- `npm run build`
### Completion Notes List

- Implemented `POST /api/groups` with Zod validation, auth guard, invite code generation, conflict retry, and admin membership bootstrap.
- Added shared group schema for API/form reuse, and created Create Group dashboard page + client form.
- Added Group navigation entries for desktop and mobile.
- Updated group layout and overview page to show group name/description and onboarding empty state with Invite Members CTA.
- Added group route API tests and create-group form tests.
- Added migration for groups `description` column and baseline RLS policies for `groups` and `group_members`.
- Verification complete: full test suite, lint, and production build all passing.
### File List

- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `package.json`
- `package-lock.json`
- `supabase/migrations/20260315_add_groups_description_and_rls_policies.sql`
- `src/types/database.ts`
- `src/app/api/groups/group-schema.ts`
- `src/app/api/groups/route.ts`
- `src/app/api/groups/route.test.ts`
- `src/components/ui/textarea.tsx`
- `src/app/(dashboard)/groups/create/page.tsx`
- `src/app/(dashboard)/groups/create/_components/create-group-form.tsx`
- `src/app/(dashboard)/groups/create/_components/create-group-form.test.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/app/(dashboard)/group/[groupId]/layout.tsx`
- `src/app/(dashboard)/group/[groupId]/page.tsx`
- `src/app/(dashboard)/group/[groupId]/loading.tsx`
- `src/app/globals.css`

## Change Log

- 2026-03-15: Implemented Story 2.1 end-to-end (group creation API, create-group UI, nav entry, group empty state, tests, migration, and verification).
