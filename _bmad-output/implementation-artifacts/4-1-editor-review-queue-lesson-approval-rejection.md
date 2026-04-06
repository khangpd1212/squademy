# Story 4.1: Editor Review Queue & Lesson Approval/Rejection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Editor,
I want to see a queue of lessons pending review and approve or reject them with feedback,
So that I can maintain the quality of our group's curriculum efficiently.

## Acceptance Criteria

1. **Given** I am an Editor and navigate to `/review/lesson`,
   **When** the page loads,
   **Then** `GET /lessons/review-queue` returns all `lessons` with `status = LESSON_STATUS.REVIEW` for groups where I am an editor/admin, with contributor name, lesson title, and submission date,
   **And** lessons are sorted oldest-first (review queue order).

2. **Given** I click on a pending lesson to review it,
   **When** the review page opens at `/review/lesson/[lessonId]`,
   **Then** the lesson content is rendered in a distraction-free read-only layout (no navigation sidebar, full-width content),
   **And** an "Approve & Publish" (primary green) button and a "Request Changes" (destructive red) button are shown at the top.

3. **Given** I click "Approve & Publish",
   **When** `PATCH /lessons/:lessonId/approve` (GroupEditorGuard) executes,
   **Then** `lessons.status` is updated to `LESSON_STATUS.PUBLISHED` via Prisma,
   **And** the lesson appears in the group's learning path,
   **And** I am returned to the review queue,
   **And** the lesson count in the queue decreases by one.

4. **Given** I click "Request Changes" and submit feedback text,
   **When** `PATCH /lessons/:lessonId/reject` (GroupEditorGuard) executes with feedback body,
   **Then** `lessons.status` is updated to `LESSON_STATUS.REJECTED` via Prisma,
   **And** `lessons.editorFeedback` is saved with my feedback text,
   **And** I am returned to the review queue.

5. **Given** I have no pending lessons in my queue,
   **When** the review queue page loads,
   **Then** an empty state is shown: "All caught up! No lessons pending review."

## Tasks / Subtasks

- [x] **Task 0: Backend — Create GroupEditorGuard** (AC: 3, 4)
  - [x] Create `apps/api/src/common/guards/group-editor.guard.ts`
  - [x] Guard extracts `lessonId` from route params, looks up lesson's `groupId`
  - [x] Checks `group_members` table: user must be member with role `editor` or `admin`
  - [x] Throws `FORBIDDEN_NOT_MEMBER` if not a member, or custom error if not editor/admin
  - [x] Guard uses PrismaService to look up lesson and membership

- [x] **Task 1: Backend — Add error codes** (AC: 3, 4)
  - [x] Add `LESSON_APPROVE_FAILED: "LESSON_APPROVE_FAILED"` to `ErrorCode` in `packages/shared/src/constants/index.ts`
  - [x] Add `LESSON_REJECT_FAILED: "LESSON_REJECT_FAILED"` to `ErrorCode`
  - [x] Add `LESSON_NOT_IN_REVIEW: "LESSON_NOT_IN_REVIEW"` (for approve/reject when status != review)
  - [x] Added corresponding error codes

- [x] **Task 2: Backend — Review queue API endpoint** (AC: 1)
  - [x] Add `GET /lessons/review-queue` endpoint in lessons controller
  - [x] Add service method `findReviewQueue(userId)`:
    - Find all groups where user has role `editor` or `admin` (query `group_members`)
    - Query lessons where `status = LESSON_STATUS.REVIEW` AND `groupId IN (editorGroups)` AND `isDeleted = false`
    - Include author: `author: { select: { displayName: true, fullName: true } }`
    - Sort by `createdAt` ascending (oldest first)
  - [x] Return: `{ id, title, status, createdAt, author: { displayName, fullName }, group: { name } }`

- [x] **Task 3: Backend — Reject DTO** (AC: 4)
  - [x] Create `apps/api/src/lessons/dto/reject-lesson.dto.ts`
  - [x] Add `@IsString()`, `@MinLength(1)`, `@MaxLength(500)` validation on `feedback` field
  - [x] Use `VALIDATION` constant from `@squademy/shared` (PROFILE_FIELD_MAX)

- [x] **Task 4: Backend — Approve endpoint** (AC: 3)
  - [x] Add `PATCH /lessons/:lessonId/approve` endpoint in lessons controller
  - [x] Add `@UseGuards(GroupEditorGuard)` to verify editor role
  - [x] Add service method `approveLesson(lessonId)`:
    - Validate lesson exists and `status === LESSON_STATUS.REVIEW` (throw `LESSON_NOT_IN_REVIEW` otherwise)
    - Update `status` to `LESSON_STATUS.PUBLISHED` via Prisma
    - Return updated lesson with select: `{ id, title, status, groupId, authorId }`
  - [x] Return `{ ok: true, data: lesson }`

- [x] **Task 5: Backend — Reject endpoint** (AC: 4)
  - [x] Add `PATCH /lessons/:lessonId/reject` endpoint in lessons controller
  - [x] Add `@UseGuards(GroupEditorGuard)` to verify editor role
  - [x] Accept `@Body() dto: RejectLessonDto`
  - [x] Add service method `rejectLesson(lessonId, feedback)`:
    - Validate lesson exists and `status === LESSON_STATUS.REVIEW` (throw `LESSON_NOT_IN_REVIEW` otherwise)
    - Update `status` to `LESSON_STATUS.REJECTED` AND `editorFeedback: feedback` via Prisma
    - Return updated lesson with select: `{ id, title, status, groupId, authorId, editorFeedback }`
  - [x] Return `{ ok: true, data: lesson }`

- [x] **Task 6: Frontend — Add review queue query key** (AC: 1)
  - [x] Update `apps/web/src/lib/api/query-keys.ts`:
    - Add `reviewQueue: ["lessons", "review"] as const`

- [x] **Task 7: Frontend — Review queue page** (AC: 1, 5)
  - [x] Create `apps/web/src/app/(dashboard)/review/lesson/page.tsx`
  - [x] Add route in dashboard layout
  - [x] Implement `useReviewQueue()` query hook calling `GET /lessons/review-queue`
  - [x] Show lesson cards with contributor name, title, submission date
  - [x] Implement empty state: "All caught up! No lessons pending review."
  - [x] Add loading and error states

- [x] **Task 8: Frontend — Review detail page** (AC: 2)
  - [x] Create `apps/web/src/app/(dashboard)/review/lesson/[lessonId]/page.tsx`
  - [x] Implement distraction-free layout (no sidebar)
  - [x] Fetch lesson detail via existing `useLesson()` query
  - [x] Show "Approve & Publish" green button
  - [x] Show "Request Changes" red button

- [x] **Task 9: Frontend — Approve action** (AC: 3)
  - [x] Add `useApproveLesson()` mutation hook calling `PATCH /lessons/:lessonId/approve`
  - [x] On success: invalidate `queryKeys.lessons.reviewQueue`, show toast, redirect to queue

- [x] **Task 10: Frontend — Reject action with feedback** (AC: 4)
  - [x] Add `useRejectLesson()` mutation hook calling `PATCH /lessons/:lessonId/reject`
  - [x] Create feedback input dialog (textarea, required, max 500 chars)
  - [x] On success: invalidate `queryKeys.lessons.reviewQueue`, show toast, redirect to queue

- [x] **Task 11: Frontend — Add review routes to navigation** (AC: 1)
  - [x] Add Review menu item in sidebar (only for Editor/Admin roles)
  - [x] Use existing role-checking pattern from group context

- [x] **Task 12: Tests** (AC: 1–5)
  - [x] Backend: Add `GroupEditorGuard` unit tests
  - [x] Backend: Add tests to `lessons.controller.spec.ts` for review-queue, approve, reject
  - [x] Backend: Add tests to `lessons.service.spec.ts` for findReviewQueue, approveLesson, rejectLesson
  - [x] Frontend: Add tests for review queue page (list, empty state)
  - [x] Frontend: Add tests for review detail page (buttons, feedback dialog)

- [x] **Task 13: Quality gates**
  - [x] Run `yarn test`
  - [x] Run `yarn lint`
  - [x] Run `yarn build`

- [x] **Task 14: Code review fixes**
  - [x] Fix TOCTOU race condition in approveLesson/rejectLesson (conditional update)
  - [x] Fix XSS vulnerability — sanitize dangerouslySetInnerHTML with DOMPurify
  - [x] Add explicit JwtAuthGuard to review-queue endpoint
  - [x] Add findReviewDetail endpoint + useReviewLesson hook (fix authorId leak)

## Dev Notes

### Critical: GroupEditorGuard (NEW — does not exist yet)

This guard must be created before Tasks 4 and 5 can be implemented.

**Logic:**
1. Extract `lessonId` from route params (`@Param("id")`)
2. Look up the lesson's `groupId` from the database
3. Check `group_members` table: user must have `role = 'editor'` or `role = 'admin'` for that group
4. If not a member → throw `FORBIDDEN_NOT_MEMBER`
5. If member but not editor/admin → throw `FORBIDDEN_NOT_ADMIN` (or create new error code `FORBIDDEN_NOT_EDITOR`)

**File:** `apps/api/src/common/guards/group-editor.guard.ts`

**Pattern** (follow existing guard style):
```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ErrorCode, GROUP_ROLES } from "@squademy/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GroupEditorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const lessonId = request.params.id;

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isDeleted: false },
      select: { groupId: true },
    });
    if (!lesson) {
      throw new ForbiddenException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    const membership = await this.prisma.groupMember.findFirst({
      where: { userId, groupId: lesson.groupId, isDeleted: false },
    });
    if (!membership) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN_NOT_MEMBER });
    }
    if (membership.role !== GROUP_ROLES.EDITOR && membership.role !== GROUP_ROLES.ADMIN) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN_NOT_ADMIN });
    }

    return true;
  }
}
```

### Review Queue Behavior

- **Endpoint**: `GET /lessons/review-queue` (dedicated, NOT the existing `GET /lessons` which is author-scoped)
- **Sorting**: Oldest-first (`createdAt` ASC) ensures editors review in submission order (FIFO)
- **Filtering**: Only lessons with `status = LESSON_STATUS.REVIEW` for groups where current user is editor/admin
- **Empty State**: Show "All caught up! No lessons pending review." when queue is empty

### Distraction-Free Layout

The review page at `/review/lesson/[lessonId]` must:
- Hide sidebar navigation
- Use full-width content area
- Center lesson content for readability (600-700px max-width)
- Fixed action buttons at top (not sticky)

### Existing Patterns to Follow

**Controller pattern** (from existing lessons controller):
```typescript
@Get("review-queue")
@UseGuards(JwtAuthGuard)
async findReviewQueue(@CurrentUser() user: JwtPayload) {
  const lessons = await this.lessonsService.findReviewQueue(user.userId);
  return { ok: true, data: lessons };
}

@Patch(":id/approve")
@UseGuards(GroupEditorGuard)
async approve(@Param("id") id: string) {
  const lesson = await this.lessonsService.approveLesson(id);
  return { ok: true, data: lesson };
}

@Patch(":id/reject")
@UseGuards(GroupEditorGuard)
async reject(@Param("id") id: string, @Body() dto: RejectLessonDto) {
  const lesson = await this.lessonsService.rejectLesson(id, dto.feedback);
  return { ok: true, data: lesson };
}
```

**Service pattern — review queue**:
```typescript
async findReviewQueue(userId: string) {
  // Find groups where user is editor or admin
  const memberships = await this.prisma.groupMember.findMany({
    where: {
      userId,
      isDeleted: false,
      role: { in: [GROUP_ROLES.EDITOR, GROUP_ROLES.ADMIN] },
    },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);
  if (groupIds.length === 0) return [];

  return this.prisma.lesson.findMany({
    where: {
      groupId: { in: groupIds },
      status: LESSON_STATUS.REVIEW,
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      author: { select: { displayName: true, fullName: true } },
      group: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
```

**Service pattern — approve**:
```typescript
async approveLesson(id: string) {
  const lesson = await this.prisma.lesson.findFirst({
    where: { id, isDeleted: false },
  });
  if (!lesson) {
    throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
  }
  if (lesson.status !== LESSON_STATUS.REVIEW) {
    throw new BadRequestException({ code: ErrorCode.LESSON_NOT_IN_REVIEW });
  }
  try {
    return await this.prisma.lesson.update({
      where: { id },
      data: { status: LESSON_STATUS.PUBLISHED },
      select: { id: true, title: true, status: true, groupId: true, authorId: true },
    });
  } catch {
    throw new BadRequestException({ code: ErrorCode.LESSON_APPROVE_FAILED });
  }
}
```

**Service pattern — reject**:
```typescript
async rejectLesson(id: string, feedback: string) {
  const lesson = await this.prisma.lesson.findFirst({
    where: { id, isDeleted: false },
  });
  if (!lesson) {
    throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
  }
  if (lesson.status !== LESSON_STATUS.REVIEW) {
    throw new BadRequestException({ code: ErrorCode.LESSON_NOT_IN_REVIEW });
  }
  try {
    return await this.prisma.lesson.update({
      where: { id },
      data: { status: LESSON_STATUS.REJECTED, editorFeedback: feedback },
      select: { id: true, title: true, status: true, groupId: true, authorId: true, editorFeedback: true },
    });
  } catch {
    throw new BadRequestException({ code: ErrorCode.LESSON_REJECT_FAILED });
  }
}
```

**Hook pattern**:
```typescript
export function useApproveLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const result = await apiRequest(`/lessons/${lessonId}/approve`, { method: "PATCH" });
      if (!result.data) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lessons.reviewQueue });
      toast.success("Lesson published successfully");
    },
  });
}
```

**Reject hook with feedback**:
```typescript
export function useRejectLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, feedback }: { lessonId: string; feedback: string }) => {
      const result = await apiRequest(`/lessons/${lessonId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (!result.data) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lessons.reviewQueue });
      toast.success("Changes requested");
    },
  });
}
```

### Available shadcn Components

Already installed: `dialog`, `button`, `badge`, `card`, `avatar`, `skeleton`, `toast` (sonner)

### Project Structure Notes

- Frontend: Next.js 16 with app router
- Backend: NestJS 11 with Prisma
- API: Direct NestJS calls via `browser-client.ts`

### API Convention

All client API calls use `browser-client.ts` calling NestJS directly via `NEXT_PUBLIC_API_URL`. Endpoints:
- `GET /lessons/review-queue` — Fetch review queue (all groups where user is editor)
- `PATCH /lessons/:lessonId/approve` — Approve and publish
- `PATCH /lessons/:lessonId/reject` — Reject with feedback body `{ feedback: string }`

### Data Model (from Prisma schema)

```prisma
model Lesson {
  id              String   @id @default(uuid())
  groupId         String   @map("group_id")
  authorId        String   @map("author_id")
  title           String
  content         Json?
  contentMarkdown String?  @map("content_markdown")
  status          String   @default("draft")
  editorFeedback  String?  @map("editor_feedback")
  isDeleted       Boolean  @default(false) @map("is_deleted")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  group     Group      @relation(fields: [groupId], references: [id], onDelete: Cascade)
  author    User       @relation(fields: [authorId], references: [id])
  exercises Exercise[]

  @@map("lessons")
}
```

### Critical Guardrails (Do Not Break)

- **GroupEditorGuard**: Must check both membership AND editor/admin role — create this guard first
- **Review queue endpoint**: Use `GET /lessons/review-queue`, NOT modify existing `GET /lessons` (which is author-scoped)
- **Author visibility**: Editors should see contributor name (join with users table via `author` relation)
- **No soft-delete impact**: Query should exclude `isDeleted: true` lessons
- **Feedback required**: Reject action must require feedback text (validated via DTO, min 1 char)
- **Status validation**: Both approve and reject must verify lesson is currently `review` status (throw `LESSON_NOT_IN_REVIEW` otherwise)

### Testing Standards

Follow patterns from Story 3.5/3.6:
- Guard tests: test membership check, role check, rejection cases
- Controller tests: test guards, success, error cases
- Service tests: test all status transitions, error handling, empty group list
- Component tests: test button visibility, form validation, empty states

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- 2026-04-05: Implemented Story 4.1 Editor Review Queue - Core functionality complete
  - Backend: GroupEditorGuard, error codes, review queue endpoint, approve/reject endpoints
  - Frontend: Review queue page, review detail page, useReviewQueue/useApproveLesson/useRejectLesson hooks
  - Tasks 0-10 complete (pending: Task 11 sidebar nav, Task 12 tests, Task 13 quality gates)

- 2026-04-05: Code review autofix — 4 issues resolved
  - Fixed TOCTOU race condition in approveLesson/rejectLesson using conditional Prisma update
  - Fixed XSS vulnerability — added DOMPurify.sanitize() for dangerouslySetInnerHTML
  - Added explicit JwtAuthGuard to review-queue endpoint
  - Added GET /lessons/review/:id endpoint + useReviewLesson hook (fixes authorId leak, shows author name)

### File List

- `apps/api/src/common/guards/group-editor.guard.ts` - NEW: Editor guard for lesson approve/reject
- `apps/api/src/lessons/lessons.module.ts` - MODIFIED: Added PrismaModule import
- `apps/api/src/lessons/lessons.service.ts` - MODIFIED: Added findReviewQueue, approveLesson, rejectLesson methods
- `apps/api/src/lessons/lessons.controller.ts` - MODIFIED: Added review-queue, approve, reject endpoints
- `apps/api/src/lessons/dto/reject-lesson.dto.ts` - NEW: DTO for reject with feedback validation
- `packages/shared/src/constants/index.ts` - MODIFIED: Added LESSON_APPROVE_FAILED, LESSON_REJECT_FAILED, LESSON_NOT_IN_REVIEW
- `apps/web/src/lib/api/query-keys.ts` - MODIFIED: Added reviewQueue key
- `apps/web/src/hooks/api/use-lesson-queries.ts` - MODIFIED: Added useReviewQueue, useApproveLesson, useRejectLesson hooks
- `apps/web/src/app/(dashboard)/review/lesson/page.tsx` - NEW: Review queue page
- `apps/web/src/app/(dashboard)/review/lesson/[lessonId]/page.tsx` - NEW: Review detail page with approve/reject
- `apps/api/src/lessons/lessons.controller.ts` - MODIFIED: Added explicit JwtAuthGuard to review-queue, added GET review/:id endpoint
- `apps/api/src/lessons/lessons.service.ts` - MODIFIED: Fixed TOCTOU with conditional updates, added findReviewDetail method
- `apps/web/src/hooks/api/use-lesson-queries.ts` - MODIFIED: Added useReviewLesson hook + ReviewLessonDetail type
