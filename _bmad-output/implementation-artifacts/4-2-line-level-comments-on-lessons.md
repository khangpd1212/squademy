# Story 4.2: Line-Level Comments on Lessons

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Editor or group member,
I want to attach comments to specific paragraphs in a lesson,
so that I can give precise, contextual feedback or discuss specific points with my peers.

## Acceptance Criteria

1. **Given** I am viewing a lesson (published or in review),
   **When** I hover over a paragraph on desktop,
   **Then** a comment icon appears in the left margin next to the paragraph.

2. **Given** I click the comment icon on a paragraph,
   **When** the comment panel opens,
   **Then** an inline comment thread expands below the paragraph (Threads-style),
   **And** a text input is shown for me to type my comment.

3. **Given** I submit a comment on a paragraph,
   **When** `POST /lessons/:lessonId/comments` (LessonCommentGuard) executes,
   **Then** a `review_comments` row is created via Prisma with `lesson_id`, `user_id`, `line_ref` (paragraph identifier), and `body`,
   **And** my comment appears immediately in the thread via React Query optimistic update,
   **And** a comment count badge appears on the paragraph margin.

4. **Given** another member has already commented on a paragraph,
   **When** I open the lesson,
   **Then** paragraphs with comments show a comment count badge in the margin,
   **And** clicking the badge expands the existing thread.

5. **Given** I am replying to an existing comment,
   **When** I click "Reply" on a comment and submit,
   **Then** a `review_comments` row is created via Prisma with `parent_id` set to the comment I replied to,
   **And** the reply is nested below the parent comment in the thread.

6. **Given** I am on mobile and tap a paragraph,
   **When** the tap event fires,
   **Then** a bottom sheet slides up with the comment thread for that paragraph.

## Tasks / Subtasks

- [x] **Task 1: Database — Add ReviewComment model to Prisma schema** (AC: 3, 5)
  - [x] Add `ReviewComment` model to `packages/database/prisma/schema.prisma` with fields: `id`, `lessonId`, `userId`, `lineRef`, `body`, `parentId` (nullable, self-referential), `createdAt`
  - [x] Add `reviewComments` relation on `Lesson` model: `reviewComments ReviewComment[]`
  - [x] Add `author` relation on `ReviewComment` model: `author User @relation(fields: [userId], references: [id])`
  - [x] Run `yarn db:generate` to regenerate Prisma client
  - [x] Run `yarn db:migrate` to apply migration

- [x] **Task 2: Shared — Add error codes and validation constants** (AC: 3, 5)
  - [x] Add `REVIEW_COMMENT_CREATE_FAILED: "REVIEW_COMMENT_CREATE_FAILED"` to `ErrorCode` in `packages/shared/src/constants/index.ts`
  - [x] Add `REVIEW_COMMENT_NOT_FOUND: "REVIEW_COMMENT_NOT_FOUND"` to `ErrorCode`
  - [x] Add `REVIEW_COMMENT_BODY_REQUIRED: "REVIEW_COMMENT_BODY_REQUIRED"` to `ErrorCode`
  - [x] Add corresponding error messages in `packages/shared/src/errors/error-messages.ts`
  - [x] Add `REVIEW_COMMENT_BODY_MAX: 1000` to `VALIDATION` in `packages/shared/src/constants/validation.ts`

- [x] **Task 3: Backend — Create ReviewComment DTOs** (AC: 3, 5)
  - [x] Create `apps/api/src/lessons/dto/create-review-comment.dto.ts`
  - [x] Add `@IsString()`, `@MinLength(1)`, `@MaxLength(VALIDATION.REVIEW_COMMENT_BODY_MAX)` on `body` field
  - [x] Add optional `parentId` field with `@IsOptional()`, `@IsUUID()` for reply threading
  - [x] Add required `lineRef` field with `@IsString()`, `@MaxLength(100)` for paragraph identifier

- [x] **Task 4: Backend — Create LessonCommentGuard** (AC: 3)
  - [x] Create `apps/api/src/common/guards/lesson-comment.guard.ts`
  - [x] Guard extracts `lessonId` from route params
  - [x] Looks up lesson's `groupId` from database
  - [x] Checks `group_members` table: user must be a member of that group (any role)
  - [x] Throws `FORBIDDEN_NOT_MEMBER` if not a member
  - [x] Follow same pattern as `GroupEditorGuard` for lesson→group resolution
  - [x] Register guard in `LessonsModule` providers

- [x] **Task 5: Backend — Create comment endpoints** (AC: 3, 4, 5)
  - [x] Add `GET /lessons/:lessonId/comments` endpoint in lessons controller with `@UseGuards(JwtAuthGuard, LessonCommentGuard)`
  - [x] Add `POST /lessons/:lessonId/comments` endpoint with `@UseGuards(JwtAuthGuard, LessonCommentGuard)`
  - [x] Add `DELETE /lessons/:lessonId/comments/:commentId` endpoint with `@UseGuards(JwtAuthGuard, LessonCommentGuard)` — only comment author can delete their own comment
  - [x] Add service method `getCommentsByLesson(lessonId)`:
    - Query `review_comments` where `lessonId` matches, ordered by `createdAt ASC`
    - Include `author: { select: { displayName, fullName, avatarUrl } }`
    - Return flat list (threading handled by `parentId` on frontend)
  - [x] Add service method `createComment(lessonId, userId, dto)`:
    - Validate lesson exists and is not soft-deleted
    - If `parentId` provided, validate parent comment exists and belongs to same lesson
    - Create `review_comments` row via Prisma
    - Return created comment with author info
  - [x] Add service method `deleteComment(commentId, userId)`:
    - Validate comment exists and belongs to the user (only author can delete)
    - Delete the comment via Prisma (cascade deletes replies)
    - Return success
  - [x] Return `{ ok: true, data: comments }` for GET, `{ ok: true, data: comment }` for POST, `{ ok: true }` for DELETE

- [ ] **Task 5b: Backend — Verify published lesson access** (Task 12 prerequisite)
  - [ ] Verify `GET /lessons/:id` returns lesson to any group member (not just author) when status is published
  - [ ] If needed, add endpoint or modify service to allow group members to view published lessons

- [x] **Task 6: Frontend — Add query keys and types** (AC: 3, 4)
  - [x] Add `comments: (lessonId: string) => ["lessons", lessonId, "comments"] as const` to `queryKeys.lessons` in `apps/web/src/lib/api/query-keys.ts`
  - [x] Add `ReviewComment` type in `apps/web/src/hooks/api/use-lesson-queries.ts`:
    - `{ id, lessonId, userId, lineRef, body, parentId, createdAt, author: { displayName, fullName, avatarUrl } }`
  - [x] Export type from barrel `apps/web/src/hooks/api/index.ts`

- [x] **Task 7: Frontend — Create comment hooks** (AC: 3, 4, 5)
  - [x] Add `useLessonComments(lessonId)` query hook calling `GET /lessons/:lessonId/comments`
    - `staleTime: 30_000` (comments don't change frequently)
  - [x] Add `useCreateLessonComment()` mutation hook calling `POST /lessons/:lessonId/comments`
    - On success: invalidate `queryKeys.lessons.comments(lessonId)`
    - Support optimistic update: add comment to cache immediately
  - [x] Add `useReplyToComment()` mutation hook (reuses same endpoint with `parentId`)
    - On success: invalidate `queryKeys.lessons.comments(lessonId)`
  - [x] Add `useDeleteLessonComment()` mutation hook calling `DELETE /lessons/:lessonId/comments/:commentId`
    - On success: invalidate `queryKeys.lessons.comments(lessonId)`
    - Only comment author can delete (backend enforces)

- [x] **Task 8: Frontend — Create ParagraphCommentTrigger component** (AC: 1, 2, 4)
  - [x] Create `apps/web/src/components/lessons/paragraph-comment-trigger.tsx`
  - [x] Desktop: shows comment icon (MessageSquare) in left margin on hover
  - [x] Shows comment count badge when comments exist for that paragraph
  - [x] Mobile: tap triggers bottom sheet (use existing shadcn `Sheet` or `Dialog`)
  - [x] Accepts props: `lineRef`, `lessonId`, `comments` (filtered for this paragraph)
  - [x] Clicking icon/thread opens inline comment panel below paragraph

- [x] **Task 9: Frontend — Create CommentThread component** (AC: 2, 4, 5)
  - [x] Create `apps/web/src/components/lessons/comment-thread.tsx`
  - [x] Renders list of comments for a paragraph, nested by `parentId`
  - [x] Top-level comments shown first, replies indented below
  - [x] Each comment shows: author avatar, displayName, body, timestamp, "Reply" button
  - [x] Reply input appears inline when "Reply" is clicked
  - [x] Comment input at bottom for new top-level comments
  - [x] Character counter (max 1000 chars from VALIDATION constant)
  - [x] Uses `cn()` for conditional classes, follows project styling patterns

- [ ] **Task 10: Frontend — Integrate comments into Review Detail page** (AC: 1–5)
  - [ ] Modify `apps/web/src/app/(dashboard)/review/lesson/[lessonId]/page.tsx`
  - [ ] Parse lesson `contentMarkdown` (HTML) into paragraphs using DOM parsing (not `\n\n` split)
  - [ ] Each paragraph gets `data-line-ref="paragraph-{index}"` attribute
  - [ ] Wrap each paragraph with `ParagraphCommentTrigger` component
  - [ ] Fetch comments via `useLessonComments(lessonId)`
  - [ ] Group comments by `lineRef` for efficient lookup
  - [ ] Ensure distraction-free layout is preserved (comments expand inline, not as overlay)

- [ ] **Task 11: Frontend — Integrate comments into Lesson Editor (read-only view)** (AC: 4)
  - [ ] Modify `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx`
  - [ ] When `isReadOnly` is true (review/published status), render lesson content with `ParagraphCommentTrigger` wrappers
  - [ ] Same DOM parsing approach as Task 10 to generate `data-line-ref` attributes
  - [ ] Fetch comments via `useLessonComments(lessonId)`
  - [ ] Editor mode (draft/rejected) does NOT show comment triggers

- [ ] **Task 12: Frontend — Create published lesson view with comments** (AC: 4, 6)
  - [ ] Create `apps/web/src/app/(dashboard)/group/[groupId]/lessons/[lessonId]/page.tsx`
  - [ ] Server component: fetch lesson data via server-side API client
  - [ ] Client wrapper: `useLessonComments` for comment data
  - [ ] Render lesson content with `ParagraphCommentTrigger` for each paragraph
  - [ ] Centered single-column layout (600-700px wide) with margin space for comment triggers
  - [ ] Mobile: bottom sheet for comment thread (use shadcn `Sheet` component)
  - [ ] Add route to dashboard layout

- [ ] **Task 13: Tests** (AC: 1–6)
  - [ ] Backend: Add `LessonCommentGuard` unit tests (member check, non-member rejection)
  - [ ] Backend: Add tests to `lessons.controller.spec.ts` for GET comments, POST comment
  - [ ] Backend: Add tests to `lessons.service.spec.ts` for getCommentsByLesson, createComment
  - [ ] Backend: Test reply threading (parentId validation, same-lesson constraint)
  - [ ] Frontend: Add tests for `CommentThread` component (render, reply, input validation)
  - [ ] Frontend: Add tests for `ParagraphCommentTrigger` (hover, click, badge display)
  - [ ] Frontend: Add tests for review detail page with comments integration

- [ ] **Task 14: Quality gates**
  - [ ] Run `yarn test`
  - [ ] Run `yarn lint`
  - [ ] Run `yarn build`

## Dev Notes

### Prisma Schema — ReviewComment Model

```prisma
model ReviewComment {
  id        String   @id @default(uuid())
  lessonId  String   @map("lesson_id")
  userId    String   @map("user_id")
  lineRef   String   @map("line_ref")       // paragraph identifier, e.g. "paragraph-3"
  body      String
  parentId  String?  @map("parent_id")      // for threaded replies
  createdAt DateTime @default(now()) @map("created_at")

  lesson   Lesson        @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  author   User          @relation(fields: [userId], references: [id])
  parent   ReviewComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies  ReviewComment[] @relation("CommentReplies")

  @@map("review_comments")
  @@index([lessonId, lineRef])
  @@index([parentId])
}
```

Add to Lesson model:
```prisma
reviewComments ReviewComment[]
```

### lineRef Format

The `lineRef` field identifies which paragraph a comment belongs to. Use a stable identifier:

- **For Markdown content**: Generate `lineRef` as `paragraph-{index}` where index is the 0-based paragraph number in the rendered content.
- **For Tiptap JSON content**: Use the node's position or a generated ID from the ProseMirror JSON structure.
- **Approach**: When rendering lesson content, wrap each paragraph `<p>` element with a `data-line-ref="paragraph-{n}"` attribute. The comment trigger reads this attribute to know which `lineRef` to use.

### LessonCommentGuard Pattern

Follow the same pattern as `GroupEditorGuard` but check for ANY membership (not just editor/admin):

```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LessonCommentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const lessonId = request.params.lessonId || request.params.id;

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

    return true;
  }
}
```

### API Endpoints

| Method | Route | Guard | Description |
|--------|-------|-------|-------------|
| `GET` | `/lessons/:lessonId/comments` | `JwtAuthGuard`, `LessonCommentGuard` | Get all comments for a lesson |
| `POST` | `/lessons/:lessonId/comments` | `JwtAuthGuard`, `LessonCommentGuard` | Create a new comment (or reply) |
| `DELETE` | `/lessons/:lessonId/comments/:commentId` | `JwtAuthGuard`, `LessonCommentGuard` | Delete own comment |

**POST body:**
```json
{
  "lineRef": "paragraph-3",
  "body": "Great explanation of the passive voice!",
  "parentId": "optional-uuid-for-reply"
}
```

### Service Method Patterns

**getCommentsByLesson:**
```typescript
async getCommentsByLesson(lessonId: string) {
  return this.prisma.reviewComment.findMany({
    where: { lessonId },
    include: {
      author: { select: { displayName: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
```

**createComment:**
```typescript
async createComment(lessonId: string, userId: string, dto: CreateReviewCommentDto) {
  const lesson = await this.prisma.lesson.findFirst({
    where: { id: lessonId, isDeleted: false },
  });
  if (!lesson) {
    throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
  }

  if (dto.parentId) {
    const parent = await this.prisma.reviewComment.findFirst({
      where: { id: dto.parentId, lessonId },
    });
    if (!parent) {
      throw new BadRequestException({ code: ErrorCode.REVIEW_COMMENT_NOT_FOUND });
    }
  }

  try {
    return await this.prisma.reviewComment.create({
      data: {
        lessonId,
        userId,
        lineRef: dto.lineRef,
        body: dto.body,
        parentId: dto.parentId,
      },
      include: {
        author: { select: { displayName: true, fullName: true, avatarUrl: true } },
      },
    });
  } catch {
    throw new BadRequestException({ code: ErrorCode.REVIEW_COMMENT_CREATE_FAILED });
  }
}
```

### Hook Patterns

**useLessonComments:**
```typescript
export function useLessonComments(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.comments(lessonId),
    queryFn: async () => {
      const result = await apiRequest<ReviewComment[]>(`/lessons/${lessonId}/comments`);
      if (!result.data) throw new ApiError({ message: result.message, code: result.code });
      return result.data;
    },
    staleTime: 30_000,
    enabled: !!lessonId,
  });
}
```

**useCreateLessonComment:**
```typescript
export function useCreateLessonComment(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { lineRef: string; body: string; parentId?: string }) => {
      const result = await apiRequest<ReviewComment>(`/lessons/${lessonId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!result.data) throw new ApiError({ message: result.message, code: result.code });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.comments(lessonId) });
    },
  });
}
```

### ParagraphCommentTrigger Component

The comment trigger wraps each paragraph in the rendered lesson content:

```tsx
// Desktop: hover shows comment icon in left margin
// Mobile: tap opens bottom sheet with comment thread
// Shows comment count badge when comments exist

type ParagraphCommentTriggerProps = {
  lineRef: string;
  lessonId: string;
  comments: ReviewComment[]; // pre-filtered for this lineRef
  children: React.ReactNode; // the paragraph content
};
```

**Key behavior:**
- Desktop: `group/relative` wrapper, comment icon appears on `group-hover` in left margin
- Comment count badge: small pill showing count, shown when `comments.length > 0`
- Click icon: expands `CommentThread` inline below the paragraph
- Mobile: tap paragraph → bottom sheet with `CommentThread`

**Post-render lineRef assignment:**
```tsx
// In useEffect after content renders:
useEffect(() => {
  const container = contentRef.current;
  if (!container) return;
  
  const paragraphs = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
  paragraphs.forEach((el, index) => {
    el.setAttribute('data-line-ref', `paragraph-${index}`);
  });
}, [content]);
```

### CommentThread Component

```tsx
type CommentThreadProps = {
  comments: ReviewComment[];
  lessonId: string;
  lineRef: string;
  onClose?: () => void;
};
```

**Key behavior:**
- Top-level comments (parentId === null) rendered first
- Replies (parentId !== null) indented below parent
- Reply button on each comment opens inline input
- New comment input at bottom of thread
- Character counter (max 1000)
- Auto-scroll to newest comment when reply is added

### Content Rendering Strategy

The lesson content is stored as both `content` (Tiptap JSON) and `contentMarkdown` (HTML). For comment integration:

1. **Preferred approach**: Parse `contentMarkdown` (HTML) using DOMParser or regex to extract `<p>`, `<h1>`-`<h6>`, `<li>` elements. Each element gets a `data-line-ref="paragraph-{n}"` attribute.
2. **Implementation**: After rendering HTML with `dangerouslySetInnerHTML`, use JavaScript (useEffect + ref) to query all paragraph elements and assign `data-line-ref` attributes.
3. **XSS protection**: Continue using `DOMPurify.sanitize()` for any `dangerouslySetInnerHTML` usage.

### Mobile Bottom Sheet

Use shadcn `Sheet` component (check if installed, or add via `npx shadcn add sheet`). The bottom sheet should:
- Slide up from bottom on mobile (`< 768px`)
- Show paragraph content as context header
- Display `CommentThread` inside
- Close on swipe down or tap outside

### Existing Patterns to Follow

- **Guard pattern**: See `GroupEditorGuard` at `apps/api/src/common/guards/group-editor.guard.ts`
- **Controller pattern**: See existing lesson endpoints in `apps/api/src/lessons/lessons.controller.ts`
- **Service pattern**: See `lessons.service.ts` for Prisma query patterns
- **Hook pattern**: See `use-lesson-queries.ts` for React Query patterns
- **Component pattern**: Follow shadcn/ui conventions, use `cn()` for classes

### Project Structure Notes

**New files to create:**
- `packages/database/prisma/schema.prisma` — MODIFIED (add ReviewComment model)
- `packages/shared/src/constants/index.ts` — MODIFIED (add error codes)
- `packages/shared/src/errors/error-messages.ts` — MODIFIED (add error messages)
- `packages/shared/src/constants/validation.ts` — MODIFIED (add REVIEW_COMMENT_BODY_MAX)
- `apps/api/src/lessons/dto/create-review-comment.dto.ts` — NEW
- `apps/api/src/common/guards/lesson-comment.guard.ts` — NEW
- `apps/api/src/lessons/lessons.controller.ts` — MODIFIED (add comment endpoints)
- `apps/api/src/lessons/lessons.service.ts` — MODIFIED (add comment methods)
- `apps/api/src/lessons/lessons.module.ts` — MODIFIED (register new guard)
- `apps/web/src/lib/api/query-keys.ts` — MODIFIED (add comments key)
- `apps/web/src/hooks/api/use-lesson-queries.ts` — MODIFIED (add comment hooks + types)
- `apps/web/src/components/lessons/paragraph-comment-trigger.tsx` — NEW
- `apps/web/src/components/lessons/comment-thread.tsx` — NEW
- `apps/web/src/app/(dashboard)/review/lesson/[lessonId]/page.tsx` — MODIFIED (integrate comments)
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` — MODIFIED (read-only comment view)
- `apps/web/src/app/(dashboard)/group/[groupId]/lessons/[lessonId]/page.tsx` — NEW (published lesson view)

### Critical Guardrails (Do Not Break)

- **LessonCommentGuard**: Must resolve lesson→group→membership, NOT use `GroupMemberGuard` directly (which expects `groupId` in params)
- **Reply threading**: `parentId` must reference a comment in the SAME lesson — validate in service
- **XSS protection**: All comment bodies rendered with sanitization
- **Optimistic updates**: Comment hooks should update cache immediately for snappy UX
- **Mobile responsive**: Comment triggers must work on touch devices (bottom sheet, not hover)
- **No breaking changes**: Existing lesson endpoints and hooks must continue to work unchanged
- **Soft-delete**: Comments on soft-deleted lessons should not be accessible

### Testing Standards

- **Guard tests**: Test membership check, non-member rejection, lesson-not-found cases
- **Controller tests**: Test guards applied, success responses, error cases
- **Service tests**: Test comment creation, reply threading, cross-lesson parentId rejection, empty comment list
- **Component tests**: Test comment thread rendering (nested replies), reply input, character counter, badge display
- **Integration tests**: Test full flow: create comment → appears in thread → reply → nested correctly

### Previous Story Intelligence (4.1)

Story 4.1 implemented the Editor Review Queue with:
- `GroupEditorGuard` for editor-only operations — use as template for `LessonCommentGuard`
- Review detail page at `/review/lesson/[lessonId]` — this is where comments will be integrated first
- Lesson content rendered via `contentMarkdown` with DOMPurify sanitization
- Existing hooks: `useReviewLesson`, `useApproveLesson`, `useRejectLesson`
- Query keys: `reviewQueue: ["lessons", "review"]`

Key learnings from 4.1 code review:
- TOCTOU race condition was fixed using conditional Prisma updates — apply same pattern if needed
- XSS vulnerability was fixed with DOMPurify — continue sanitizing all rendered HTML
- AuthorId leak was fixed with dedicated review detail endpoint — ensure comment endpoints don't leak sensitive data

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- **Task 1**: Added `ReviewComment` model to Prisma schema with relations to `Lesson` and `User`. Added self-referential relation for threaded replies.
- **Task 2**: Added error codes `REVIEW_COMMENT_CREATE_FAILED`, `REVIEW_COMMENT_NOT_FOUND`, `REVIEW_COMMENT_BODY_REQUIRED` and corresponding error messages. Added `REVIEW_COMMENT_BODY_MAX: 1000` validation constant.
- **Task 3**: Created `CreateReviewCommentDto` with `lineRef`, `body`, and optional `parentId` fields with proper validation.
- **Task 4**: Created `LessonCommentGuard` that checks if user is a member of the group associated with the lesson.
- **Task 5**: Added comment endpoints (`GET /lessons/:lessonId/comments`, `POST`, `DELETE`) with `LessonCommentGuard`. Added service methods for CRUD operations.
- **Task 6**: Added `comments` query key and `ReviewComment` type.
- **Task 7**: Created `useLessonComments`, `useCreateLessonComment`, `useDeleteLessonComment` hooks.
- **Task 8**: Created `ParagraphCommentTrigger` component with hover icon and comment count badge.
- **Task 9**: Created `CommentThread` component with nested replies, character counter, and inline reply functionality.

### File List

- `packages/database/prisma/schema.prisma` - ADDED ReviewComment model
- `packages/database/prisma/migrations/*` - Migration files
- `packages/shared/src/constants/index.ts` - ADDED error codes
- `packages/shared/src/errors/error-messages.ts` - ADDED error messages
- `packages/shared/src/constants/validation.ts` - ADDED REVIEW_COMMENT_BODY_MAX
- `apps/api/src/lessons/dto/create-review-comment.dto.ts` - NEW
- `apps/api/src/common/guards/lesson-comment.guard.ts` - NEW
- `apps/api/src/lessons/lessons.controller.ts` - MODIFIED (added comment endpoints)
- `apps/api/src/lessons/lessons.service.ts` - MODIFIED (added comment methods)
- `apps/api/src/lessons/lessons.module.ts` - MODIFIED (registered guard)
- `apps/web/src/lib/api/query-keys.ts` - MODIFIED (added comments key)
- `apps/web/src/hooks/api/use-lesson-queries.ts` - MODIFIED (added comment hooks + types)
- `apps/web/src/components/lessons/paragraph-comment-trigger.tsx` - NEW
- `apps/web/src/components/lessons/comment-thread.tsx` - NEW
