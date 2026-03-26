# Story 3.1: Lesson List & Content Studio Navigation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Contributor,
I want to see all my lessons and their statuses, and create new ones from the Content Studio,
so that I can manage my contributions to the group curriculum in one place.

## Acceptance Criteria

1. **Given** I navigate to `/studio/lessons`
   **When** the page loads
   **Then** all lessons where `author_id = my user_id` are listed with title, status badge (Draft / In Review / Published / Rejected), and last updated date
   **And** a "New Lesson" button is prominently displayed.

2. **Given** I click "New Lesson"
   **When** the action executes
   **Then** a new `lessons` row is created with `status = 'draft'` and a placeholder title
   **And** I am redirected to the lesson editor at `/studio/lessons/[lessonId]`.

3. **Given** I have no lessons yet
   **When** the page loads
   **Then** an empty state is shown: "You haven't created any lessons yet. Start contributing!" with a "New Lesson" CTA.

4. **Given** I am a Member (not Contributor or Editor)
   **When** I navigate to `/studio/lessons`
   **Then** the page is accessible (dual-role contribution model).

## Tasks / Subtasks

- [ ] **Task 1: Build lesson studio list route shell** (AC: 1, 3, 4)
  - [ ] Create `src/app/(dashboard)/studio/lessons/page.tsx` with server auth guard and member access check.
  - [ ] Query `lessons` scoped by `author_id = auth.uid()` and `is_deleted = false`, ordered by `updated_at DESC`.
  - [ ] Select only list-safe columns (`id`, `title`, `status`, `updated_at`) to avoid loading heavy content blobs.
  - [ ] Render empty state with exact CTA copy when no rows returned.

- [ ] **Task 2: Build list UI and status badges** (AC: 1)
  - [ ] Add segment-local component `src/app/(dashboard)/studio/lessons/_components/lesson-list.tsx`.
  - [ ] Render status badge mapping for `draft`, `review`, `published`, `rejected` using existing badge semantics.
  - [ ] Show lesson title + relative/absolute updated timestamp.

- [ ] **Task 3: Implement New Lesson create flow** (AC: 2)
  - [ ] Add `POST` route at `src/app/api/studio/lessons/route.ts`.
  - [ ] Validate payload with Zod `safeParse()`; set placeholder title if empty.
  - [ ] Insert lesson with `status = 'draft'`, `author_id = current user`.
  - [ ] Return created `lessonId` then redirect client to `/studio/lessons/[lessonId]`.

- [ ] **Task 4: Add guardrails and tests** (AC: 1, 2, 3, 4)
  - [ ] Route tests: unauthorized (401), non-member (403), valid creation (200/201).
  - [ ] Page/component tests: populated list, empty state, status badge rendering, new lesson CTA.
  - [ ] Verify member-only access is allowed (not contributor/editor restricted).

## Dev Notes

### Story Context and Intent

- This story is the entry point for the Epic 3 content loop and unlocks all later lesson authoring flows.
- Keep user experience low-friction: list first, create fast, redirect immediately.
- Do not introduce review logic here beyond status display (submission workflow is Story 3.5).

### Cross-Story Dependencies

- Unblocks Story 3.2 editor by creating lesson shell and navigation path.
- Provides status surface consumed by Story 3.5 transitions (`draft/review/published/rejected`).
- Should avoid coupling to Story 3.4 export and Story 3.3 import internals.

### Technical Requirements

- Use current project stack only: Next.js App Router + React + TypeScript strict + NestJS API.
- API implementation sequence: auth -> validate -> authorize -> mutate -> response.
- Use `safeParse()` in API boundaries (not `parse()`).
- Keep queries narrow and indexed fields first (`author_id`, `updated_at`) for list performance.

### Architecture Compliance

- Keep API clients context-correct:
  - browser client in client components only
  - server client in server route/page code
  - admin/service-role only in server for privileged operations
- Respect RLS and group membership checks; no client-side privilege bypass.
- Keep route/file conventions: App Router `route.ts`, segment `_components`, kebab-case filenames.

### Library / Framework Requirements

- Next.js proxy conventions are already in place; do not introduce legacy `middleware.ts`.
- Keep compatibility with React 19 + Next 16 conventions currently used by repository.
- No new dependency is required for Story 3.1.

### File Structure Requirements

Expected touched files:

- `src/app/(dashboard)/studio/lessons/page.tsx` (new)
- `src/app/(dashboard)/studio/lessons/_components/lesson-list.tsx` (new)
- `src/app/(dashboard)/studio/lessons/_components/lesson-list.test.tsx` (new)
- `src/app/api/studio/lessons/route.ts` (new)
- `src/app/api/studio/lessons/route.test.ts` (new)

### Testing Requirements

- Unit/UI tests: Jest + Testing Library for list/empty state/new CTA behavior.
- API tests: direct route handler tests with mocked API clients.
- Validate no regression to existing dashboard navigation and auth flow.

### Latest Technical Information

- Keep Next.js 16 App Router patterns and avoid deprecated middleware naming.
- Keep auth checks server-side (NestJS JwtAuthGuard) and never trust client session for authorization.
- Prefer patch-level dependency updates only when story implementation requires it.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md`]
- [Source: `_bmad-output/planning-artifacts/prd.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- Multi-agent context synthesis executed for epic, architecture, and latest-tech extraction.

### Completion Notes List

- Story context prepared for implementation; no product code changes applied in this step.

### File List

- `_bmad-output/implementation-artifacts/3-1-lesson-list-content-studio-navigation.md`

## Change Log

- 2026-03-19: Created Story 3.1 ready-for-dev context with implementation guardrails.
