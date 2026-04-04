# Story 3.6: Delete Draft Lesson

Status: review

## Story

As a Contributor,
I want to delete my draft lessons that I no longer need,
so that I can keep my lesson list clean and focused.

## Acceptance Criteria

1. **Given** I am viewing my lessons in `/studio/lessons`,
   **When** I hover over a lesson with status `draft` or `rejected`,
   **Then** a delete icon button appears on the right side of the lesson row.

2. **Given** I click the delete icon on a draft/rejected lesson,
   **When** the action executes,
   **Then** a confirmation dialog appears: "Delete this lesson? This cannot be undone."
   **And** the dialog shows the lesson title for clarity.

3. **Given** I confirm the deletion,
   **When** `DELETE /lessons/:lessonId` (ResourceOwnerGuard) executes,
   **Then** `lessons.is_deleted` is set to `true` via Prisma,
   **And** `queryKeys.lessons.myLessons` is invalidated so the list refetches without the deleted lesson,
   **And** I see a toast confirmation: "Lesson deleted."

4. **Given** I click "Cancel" in the confirmation dialog,
   **When** the action executes,
   **Then** the dialog closes and no deletion occurs.

5. **Given** I am viewing a lesson with status `in_review` or `published`,
   **When** I hover over that lesson row,
   **Then** no delete icon appears — published/in-review lessons cannot be deleted by the author.

## Tasks / Subtasks

- [x] **Task 1: Shared — add LESSON_DELETE_FAILED + LESSON_DELETE_NOT_ALLOWED error codes** (AC: 3, 5)
   - [x] Add `LESSON_DELETE_FAILED: "LESSON_DELETE_FAILED"` to `ErrorCode` in `packages/shared/src/constants/index.ts`
   - [x] Add `LESSON_DELETE_NOT_ALLOWED: "LESSON_DELETE_NOT_ALLOWED"` to `ErrorCode` (for REVIEW/PUBLISHED status rejection)
   - [x] Add corresponding error messages in `ErrorMessage` map (if exists)

- [x] **Task 2: Backend — `DELETE /lessons/:id` endpoint** (AC: 3, 5)
  - [x] Add `@Delete(":id")` route to `LessonsController` in `apps/api/src/lessons/lessons.controller.ts`
  - [x] Add `deleteLesson(id: string)` method to `LessonsService` in `apps/api/src/lessons/lessons.service.ts`

- [x] **Task 3: Frontend — `useDeleteLesson` hook** (AC: 3)
  - [x] Add `useDeleteLesson()` to `apps/web/src/hooks/api/use-lesson-queries.ts`

- [x] **Task 4: Frontend — delete button in lesson list item** (AC: 1, 5)
  - [x] Update `apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.tsx`

- [x] **Task 5: Frontend — delete confirmation dialog** (AC: 2, 4)
  - [x] Create `apps/web/src/app/(dashboard)/studio/lessons/_components/delete-lesson-dialog.tsx`

- [x] **Task 6: Frontend — integrate dialog into lesson list** (AC: 1, 2, 3, 4)
  - [x] Update `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.tsx`

- [x] **Task 7: Tests** (AC: 1–5)
  - [x] Backend: Add tests to `apps/api/src/lessons/lessons.controller.spec.ts`
  - [x] Frontend: Create `apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.test.tsx`
  - [x] Frontend: Create `apps/web/src/app/(dashboard)/studio/lessons/_components/delete-lesson-dialog.test.tsx`
  - [x] Run `yarn test`, `yarn lint`, `yarn build` to verify all pass

## Dev Notes

### Critical: Lesson Deletion Rules

Only lessons with status `DRAFT` or `REJECTED` can be deleted by the author. This is because:
- `REVIEW` lessons are pending editorial review — deletion would disrupt the editorial queue
- `PUBLISHED` lessons are live content — they should be soft-deleted by Editors (Story 4.4) not by authors

### Existing Patterns to Follow

**Controller pattern** (from `lessons.controller.ts`):
```typescript
@Delete(":id")
@UseGuards(ResourceOwnerGuard)
async delete(@Param("id") id: string) {
  await this.lessonsService.deleteLesson(id);
  return { ok: true };
}
```

**Service pattern** (soft-delete with status check):
```typescript
async deleteLesson(id: string) {
  const lesson = await this.prisma.lesson.findFirst({
    where: { id, isDeleted: false },
  });
  if (!lesson) {
    throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
  }
  if (lesson.status === LESSON_STATUS.REVIEW || lesson.status === LESSON_STATUS.PUBLISHED) {
    throw new BadRequestException({ code: ErrorCode.LESSON_DELETE_NOT_ALLOWED });
  }
  try {
    await this.prisma.lesson.update({
      where: { id },
      data: { isDeleted: true },
    });
  } catch {
    throw new BadRequestException({ code: ErrorCode.LESSON_DELETE_FAILED });
  }
}
```

**Hook pattern** (from `useSubmitLesson`):
```typescript
export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const result = await apiRequest(`/lessons/${lessonId}`, { method: "DELETE" });
      if (!result.data) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
    },
  });
}
```

**Dialog pattern** (base-ui `DialogTrigger` with `render` prop — matches `delete-group-section.tsx`):
```typescript
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
```

**Hover reveal pattern** (from delete-group-section):
```typescript
<Button
  variant="ghost"
  size="icon"
  className="opacity-0 group-hover:opacity-100 transition-opacity"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### Available shadcn Components

Already installed: `dialog`, `button`

### Testing Standards

- **Backend**: Mock `PrismaService` with `findFirst`, `lesson.update`
- **Frontend**: Mock `global.fetch`, mock `sonner` (`toast`)
  - `jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))`
- **Colocated tests**: `*.test.tsx` next to source files

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md` — Story 3.1 ACs, lesson status]
- [Source: `_bmad-output/implementation-artifacts/3-1-lesson-list-content-studio-navigation.md` — Lesson list patterns, hook structure]
- [Source: `_bmad-output/implementation-artifacts/2-6-delete-group.md` — Delete confirmation dialog patterns, danger zone UX]
- [Source: `apps/api/src/lessons/lessons.controller.ts` — Controller route patterns, ResourceOwnerGuard usage]
- [Source: `apps/api/src/lessons/lessons.service.ts` — Prisma service patterns, status checks]
- [Source: `apps/web/src/hooks/api/use-lesson-queries.ts` — Mutation hook patterns, cache invalidation]
- [Source: `apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.tsx` — Current list item structure]
- [Source: `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.tsx` — View component structure]
- [Source: `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/delete-group-section.tsx` — Confirmation dialog pattern]
- [Source: `packages/shared/src/constants/index.ts` — ErrorCode enum, LESSON_STATUS]
- [Source: `packages/database/prisma/schema.prisma` — Lesson model, isDeleted field]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Implemented error codes LESSON_DELETE_FAILED and LESSON_DELETE_NOT_ALLOWED in shared package
- Added DELETE /lessons/:id endpoint with ResourceOwnerGuard
- Added deleteLesson method to LessonsService with status validation
- Added useDeleteLesson hook with query invalidation
- Added delete button to LessonListItem with hover reveal
- Created DeleteLessonDialog component with confirmation
- Integrated dialog into StudioLessonsView
- Fixed syntax error in lesson-list-item.tsx
- Fixed lint error for unescaped quotes in delete-lesson-dialog.tsx
- All tests pass: API (77), Web (142)
- Build and lint pass
- Definition-of-done validation completed: all 5 ACs satisfied, all 7 tasks/subtasks complete, regression suite passes (219 tests total), lint and build clean

### File List

- packages/shared/src/constants/index.ts (modified)
- packages/shared/src/errors/error-messages.ts (modified)
- apps/api/src/lessons/lessons.controller.ts (modified)
- apps/api/src/lessons/lessons.service.ts (modified)
- apps/api/src/lessons/lessons.controller.spec.ts (modified)
- apps/web/src/hooks/api/use-lesson-queries.ts (modified)
- apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.tsx (modified)
- apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.test.tsx (created)
- apps/web/src/app/(dashboard)/studio/lessons/_components/delete-lesson-dialog.tsx (created)
- apps/web/src/app/(dashboard)/studio/lessons/_components/delete-lesson-dialog.test.tsx (created)
- apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.tsx (modified)

## Change Log

- 2026-04-05: Implemented Story 3.6 - Delete Draft Lesson (AC 1-5)
