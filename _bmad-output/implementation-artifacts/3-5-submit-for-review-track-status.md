# Story 3.5: Submit for Review & Track Status

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Contributor,
I want to submit my draft lesson for editorial review and track its status,
so that I know when my lesson is live or if I need to revise it based on editor feedback.

## Acceptance Criteria

1. **Given** I have a lesson with `status = 'draft'` in the editor,
   **When** I click "Submit for Review",
   **Then** `PATCH /lessons/:lessonId/submit` (ResourceOwnerGuard) updates `lessons.status` to `'review'` via Prisma,
   **And** the "Submit for Review" button is replaced with a "In Review" status badge,
   **And** the editor toolbar is disabled (read-only) while the lesson is in review.

2. **Given** my lesson status is `'review'`,
   **When** I view the lesson in `/studio/lessons`,
   **Then** the lesson row shows an "In Review" orange badge,
   **And** I cannot edit the lesson content while it is in review.

3. **Given** an Editor approves my lesson,
   **When** the status updates to `'published'`,
   **Then** the lesson row in my studio shows a "Published" green badge,
   **And** I receive a notification (Epic 7) that my lesson is live.

4. **Given** an Editor rejects my lesson with feedback,
   **When** the status updates to `'rejected'`,
   **Then** the lesson row shows a "Rejected" red badge,
   **And** clicking the lesson opens the editor again with the editor's feedback visible (as comments, implemented in Epic 4),
   **And** the editor toolbar is re-enabled so I can revise and resubmit.

5. **Given** I have revised a rejected lesson and click "Resubmit for Review",
   **When** the action executes,
   **Then** `lessons.status` is updated back to `'review'` via NestJS API,
   **And** the editor is locked again pending the next editorial review.

## Tasks / Subtasks

- [x] **Task 1: Add submit endpoint in NestJS API** (AC: 1)
  - [x] Create `PATCH /lessons/:lessonId/submit` endpoint in lessons controller
  - [x] Add ResourceOwnerGuard validation
  - [x] Update lessons.status to 'review' via Prisma
  - [x] Return updated lesson with status

- [x] **Task 2: Unified submit/resubmit endpoint** (AC: 5)
  - [x] Single `PATCH /lessons/:id/submit` handles both `draft -> review` and `rejected -> review`
  - [x] Validates current status is 'draft' or 'rejected' (throws `LESSON_INVALID_STATUS_FOR_SUBMIT` otherwise)
  - [x] No separate resubmit endpoint needed -- same submit() service method covers both transitions

- [x] **Task 3: Update lesson list UI with status badges** (AC: 2, 3, 4)
  - [x] Created `apps/web/src/lib/status-styles.ts` with `STATUS_STYLES` record mapping all 4 statuses to labels + Tailwind classes
  - [x] `LessonListItem` component shows status badge with `STATUS_STYLES[lesson.status]`
  - [x] `StudioLessonsView` renders lesson list via `useMyLessons()` query which includes `status` field

- [x] **Task 4: Update lesson editor with submit/resubmit UI** (AC: 1, 4, 5)
  - [x] `lesson-editor-view.tsx` shows "Submit for Review" button when `lesson.status === 'draft'`
  - [x] Shows "Resubmit for Review" button when `lesson.status === 'rejected'`
  - [x] Shows status badge (via `STATUS_STYLES`) for all statuses
  - [x] Both buttons share `handleSubmit()` which calls `submitLesson.mutate(lessonId)`
  - [x] Loading state: button text changes to "Submitting..." when `submitLesson.isPending`

- [x] **Task 5: Add lesson status query** (AC: 2, 3, 4)
  - [x] `useMyLessons()` returns `MyLessonItem` with `status: LessonStatus` field
  - [x] `useLesson()` returns `LessonDetail` with `status: LessonStatus` field
  - [x] Backend `findAllByAuthor` and `findOneById` both select `status` field

- [x] **Task 6: Wire up API mutations** (AC: 1, 5)
  - [x] Created `useSubmitLesson()` mutation hook in `use-lesson-queries.ts`
  - [x] Calls `PATCH /lessons/${lessonId}/submit`
  - [x] On success: updates query cache via `setQueryData` for detail + invalidates `myLessons` list

- [x] **Task 7: Handle read-only mode in editor** (AC: 1, 2)
  - [x] `isReadOnly = lesson?.status === 'review' || lesson?.status === 'published'`
  - [x] Title input gets `readOnly={isReadOnly}` attribute
  - [x] `LessonEditor` receives `editable={!isReadOnly}` prop -- disables Tiptap editing
  - [x] Backend `update()` also enforces: throws `LESSON_NOT_EDITABLE` if status is review or published

- [x] **Task 8: Add tests** (AC: 1-5)
  - [x] Controller tests: `lessons.controller.spec.ts` -- submit endpoint guard verification, success/error cases
  - [x] Service tests: `lessons.service.spec.ts` -- submit() covers draft->review, rejected->review, invalid status, not found, DB error
  - [x] Component tests: `lesson-editor-view.test.tsx` -- submit button visibility, resubmit button, read-only mode, status badges, pending state

- [x] **Task 9: Quality gates**
  - [x] Run `yarn test`
  - [x] Run `yarn lint`
  - [x] Run `yarn build`

## Dev Notes

### Implementation Summary

**Backend changes:**
- `apps/api/src/lessons/lessons.controller.ts` -- Added `submit()` endpoint with `@Patch(':id/submit')` + `@UseGuards(ResourceOwnerGuard)`
- `apps/api/src/lessons/lessons.service.ts` -- Added `submit(lessonId)` method:
  - Validates lesson exists (throws `LESSON_NOT_FOUND`)
  - Validates status is `draft` or `rejected` (throws `LESSON_INVALID_STATUS_FOR_SUBMIT`)
  - Updates status to `review` via Prisma
  - Throws `LESSON_SUBMIT_FAILED` on DB error
- `apps/api/src/lessons/lessons.service.ts` -- `update()` method now blocks edits when status is `review` or `published` (throws `LESSON_NOT_EDITABLE`)
- `apps/api/src/lessons/lessons.controller.spec.ts` -- Added guard metadata tests + submit endpoint tests
- `apps/api/src/lessons/lessons.service.spec.ts` -- Added comprehensive submit() tests (6 test cases)

**Frontend changes:**
- `apps/web/src/lib/status-styles.ts` -- New `STATUS_STYLES` record with 4 status entries:
  - `draft`: gray badge
  - `review`: amber "In Review" badge
  - `published`: emerald "Published" badge
  - `rejected`: red "Rejected" badge
- `apps/web/src/hooks/api/use-lesson-queries.ts` -- Added:
  - `useSubmitLesson()` mutation hook
  - `MyLessonItem` type includes `status: LessonStatus`
  - `LessonDetail` type includes `status: LessonStatus`
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` -- Full implementation:
  - Imports `useSubmitLesson`, `STATUS_STYLES`, `LESSON_STATUS`
  - `handleSubmit()` calls `submitLesson.mutate(lessonId)`
  - `canSubmit` / `canResubmit` booleans control button visibility
  - `isReadOnly` disables editor for review/published statuses
  - Status badge always shown in header
  - "Submit for Review" / "Resubmit for Review" buttons with pending state
- `apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.tsx` -- Shows status badge via `STATUS_STYLES`
- `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.tsx` -- Uses `useMyLessons()` which includes status
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.test.tsx` -- 20 test cases covering:
  - Loading/error states
  - Editable vs read-only for each status
  - Submit button visibility and click behavior
  - Resubmit button visibility and click behavior
  - Status badge rendering for all 4 statuses
  - Pending submit state

**Schema changes:**
- `packages/database/prisma/schema.prisma` -- Added `contentMarkdown` field to Lesson model (supports Story 3.3/3.4, used by editor auto-save)

### Design Decisions

1. **Unified submit endpoint**: Instead of separate `submit` and `resubmit` endpoints, a single `PATCH /lessons/:id/submit` handles both `draft -> review` and `rejected -> review` transitions. The service validates the current status and rejects invalid transitions. This reduces API surface and keeps the frontend simple (one mutation hook).

2. **Status styles centralized**: `STATUS_STYLES` in `status-styles.ts` provides a single source of truth for badge labels and Tailwind classes, used by both the lesson list and the editor header.

3. **Backend-enforced read-only**: The `update()` service method throws `LESSON_NOT_EDITABLE` for review/published statuses, providing server-side protection even if the frontend is bypassed.

4. **Cache invalidation strategy**: `useSubmitLesson` onSuccess uses `setQueryData` for the detail query (immediate UI update) AND `invalidateQueries` for the list query (refreshes status badge in lesson list).

### Critical Guardrails (Do Not Break)

- Keep current editor route and file structure:
  - `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/*`
  - NestJS lessons controller at `apps/api/src/lessons/`
- Do NOT implement editorial feedback/comments -- that belongs to Epic 4.
- Do NOT implement notifications -- Epic 7 handles that.
- ResourceOwnerGuard must prevent editing by non-owners.
- Editor toolbar must be disabled (not hidden) when in review status.

### Project Structure Notes

- Frontend: Next.js 16 with app router
- Backend: NestJS 11 with Prisma
- Database: Lessons table has `status` field (String, default 'draft') + `contentMarkdown` field
- API: Direct NestJS calls via `browser-client.ts`

### API Convention

All client API calls use `browser-client.ts` calling NestJS directly via `NEXT_PUBLIC_API_URL`. Endpoints:
- `PATCH /lessons/:lessonId/submit` - Submit for review (handles both draft and rejected -> review)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md#Story-3.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-2.1]
- [Source: AGENTS.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- 2026-04-04: Implemented Story 3.5 Submit for Review & Track Status -- all 9 tasks complete.
  - Backend: `PATCH /lessons/:id/submit` endpoint with ResourceOwnerGuard, unified submit/resubmit, status validation
  - Frontend: Submit/Resubmit buttons, status badges, read-only mode, `useSubmitLesson` mutation hook
  - Tests: 6 service tests, 5 controller tests, 20 component tests
  - All quality gates pass (yarn test, yarn lint, yarn build)

### File List

- `apps/api/src/lessons/lessons.controller.ts` -- submit endpoint
- `apps/api/src/lessons/lessons.service.ts` -- submit() method, update() read-only enforcement
- `apps/api/src/lessons/lessons.controller.spec.ts` -- submit endpoint tests
- `apps/api/src/lessons/lessons.service.spec.ts` -- submit() service tests
- `apps/web/src/lib/status-styles.ts` -- STATUS_STYLES record (new file)
- `apps/web/src/hooks/api/use-lesson-queries.ts` -- useSubmitLesson hook, MyLessonItem/LessonDetail types
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` -- submit/resubmit UI, read-only mode
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.test.tsx` -- component tests
- `apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.tsx` -- status badge in list
- `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.tsx` -- lesson list with status
- `packages/database/prisma/schema.prisma` -- contentMarkdown field added
