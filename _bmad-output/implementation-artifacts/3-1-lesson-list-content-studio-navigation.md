# Story 3.1: Lesson List & Content Studio Navigation

Status: done

## Story

As a Contributor,
I want to see all my lessons and their statuses, and create new ones from the Content Studio,
so that I can manage my contributions to the group curriculum in one place.

## Acceptance Criteria

1. **Given** I navigate to `/studio/lessons`,
   **When** the page loads,
   **Then** `GET /lessons?author=me` (JwtAuthGuard) returns all lessons where `author_id = my user_id` with title, status badge (Draft / In Review / Published / Rejected), and last updated date,
   **And** a "New Lesson" button is prominently displayed.

2. **Given** I click "New Lesson",
   **When** the action executes,
   **Then** a group selector appears (if I belong to multiple groups) or auto-selects my only group,
   **And** `POST /lessons` creates a new `lessons` row via Prisma with `status = 'draft'` and a placeholder title ("Untitled Lesson"),
   **And** I am redirected to the lesson editor at `/studio/lessons/[lessonId]`.

3. **Given** I have no lessons yet,
   **When** the page loads,
   **Then** an empty state is shown: "You haven't created any lessons yet. Start contributing!" with a "New Lesson" CTA.

4. **Given** I am a Member (not Contributor or Editor),
   **When** I navigate to `/studio/lessons`,
   **Then** the page is accessible — all members can contribute lessons per the dual-role model.

## Tasks / Subtasks

- [x] **Task 1: Shared — add REJECTED to LESSON_STATUS + lesson error codes** (AC: 1, 2)
  - [x] Update `LESSON_STATUS` in `packages/shared/src/constants/index.ts` to add `REJECTED: "rejected"` (architecture spec includes it, shared constants currently omit it)
  - [x] Export `LessonStatus` type: `(typeof LESSON_STATUS)[keyof typeof LESSON_STATUS]`
  - [x] Add `LESSON_CREATE_FAILED: "LESSON_CREATE_FAILED"` to `ErrorCode` in `packages/shared/src/constants/index.ts`
  - [x] Add corresponding error message in `ErrorMessage` map

- [x] **Task 2: Backend — create LessonsModule** (AC: 1, 2)
  - [x] Create `apps/api/src/lessons/` module directory
  - [x] Create `lessons.module.ts` with `LessonsController` and `LessonsService` providers
  - [x] Register `LessonsModule` in `app.module.ts` imports
  - [x] Create `lessons.service.ts`:
    - `findAllByAuthor(userId: string)` — `prisma.lesson.findMany({ where: { authorId: userId, isDeleted: false, group: { isDeleted: false } }, select: { id, title, status, groupId, updatedAt, group: { select: { name } } }, orderBy: { updatedAt: "desc" } })`
    - `create(authorId: string, groupId: string)` — `prisma.lesson.create({ data: { authorId, groupId, title: "Untitled Lesson", status: LESSON_STATUS.DRAFT } })` — returns `{ id, title, status, groupId }`
  - [x] Create `lessons.controller.ts`:
    - `@Controller("lessons")` with global prefix `/api` (Nest globalPrefix)
    - `GET /lessons?author=me` → `@Get()` + `@UseGuards(JwtAuthGuard)` — extract `user.userId` via `@CurrentUser()`, call `findAllByAuthor(user.userId)`, return `{ ok: true, data: lessons }`
    - `POST /lessons` → `@Post()` + `@UseGuards(JwtAuthGuard)` — validate body `{ groupId }`, verify user is an active member of the group via Prisma `groupMember.findFirst({ where: { userId, groupId, isDeleted: false } })`, call `create(user.userId, groupId)`, return `{ ok: true, data: { id, title, status, groupId } }`
  - [x] Create `create-lesson.dto.ts`:
    - `groupId: string` — `@IsNotEmpty()`, `@IsUuid()`, `@MaxLength(36)`

- [x] **Task 3: Frontend — query keys + hooks** (AC: 1, 2)
  - [x] Add `lessons` section to `apps/web/src/lib/api/query-keys.ts`:
    ```
    lessons: {
      myLessons: ["lessons", "my"] as const,
    }
    ```
  - [x] Create `apps/web/src/hooks/api/use-lesson-queries.ts` ("use client"):
    - `MyLessonItem` type: `{ id: string; title: string; status: string; groupId: string; updatedAt: string; group: { name: string } }`
    - `useMyLessons()` — `useQuery` calling `GET /lessons?author=me`
    - `useCreateLesson()` — `useMutation` calling `POST /lessons` with `{ groupId }`, on success invalidate `queryKeys.lessons.myLessons`, return new lesson `{ id, ... }`
  - [x] Add export to `apps/web/src/hooks/api/index.ts`
  - [x] Add export to `apps/web/src/hooks/index.ts` (if barrel exists)

- [x] **Task 4: Frontend — lesson list page + components** (AC: 1, 3, 4)
  - [x] Create `apps/web/src/app/(dashboard)/studio/lessons/_components/` directory
  - [x] Create `studio-lessons-view.tsx` ("use client") — main view component:
    - Uses `useMyLessons()` hook
    - Header: "My Lessons" title + "New Lesson" button (right-aligned)
    - Renders `LessonListItem` for each lesson
    - Shows `EmptyLessonState` when `data.length === 0`
    - Shows skeleton loading state while fetching (use `import { Skeleton } from "@/components/ui/skeleton"` — already installed via shadcn)
  - [x] Create `lesson-list-item.tsx` ("use client"):
    - Card-style row: lesson title, group name badge, status pill, last updated date (relative time)
    - Status pill colors: Draft → `zinc` (neutral), In Review → `orange/amber`, Published → `emerald/green`, Rejected → `red`
    - Entire row is clickable — links to `/studio/lessons/[lessonId]` (placeholder page, will be editor in story 3.2)
  - [x] Create `empty-lesson-state.tsx`:
    - Illustration placeholder (Lucide `FileText` or `BookOpen` icon, large and centered)
    - Text: "You haven't created any lessons yet. Start contributing!"
    - "New Lesson" CTA button (primary)
  - [x] Create `new-lesson-dialog.tsx` ("use client"):
    - Dialog triggered by "New Lesson" button
    - If user has 1 group → auto-select, show "Create in {groupName}?" confirmation
    - If user has multiple groups → show group selector (simple Select dropdown of user's groups)
    - On confirm: call `createLessonMutation`, on success `router.push(/studio/lessons/${newLesson.id})`
    - Uses `useMyGroups()` from existing `use-group-queries.ts` to fetch user's groups
    - Loading/error states during creation
  - [x] Update `apps/web/src/app/(dashboard)/studio/lessons/page.tsx` to render `StudioLessonsView`

- [x] **Task 5: Frontend — lesson editor placeholder page** (AC: 2)
  - [x] Create `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/page.tsx`
    - Server component that renders a placeholder: "Lesson Editor — Coming in Story 3.2"
    - Shows the lessonId from params so navigation works end-to-end
    - This will be replaced by the Tiptap editor in story 3.2

- [x] **Task 6: Tests** (AC: 1–4)
  - [x] Backend: Create `apps/api/src/lessons/lessons.controller.spec.ts`:
    - `GET /lessons?author=me` → returns list of user's lessons
    - `POST /lessons` → creates lesson and returns data
    - `POST /lessons` with invalid group → returns error
  - [x] Backend: Create `apps/api/src/lessons/lessons.service.spec.ts`:
    - `findAllByAuthor` returns filtered, ordered lessons
    - `create` creates a draft lesson with placeholder title
    - `create` fails if user is not a member of the group
  - [x] Frontend: Create `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.test.tsx`:
    - Renders lesson list with correct status badges
    - Shows empty state when no lessons
    - Shows loading skeleton initially
  - [x] Frontend: Create `apps/web/src/app/(dashboard)/studio/lessons/_components/new-lesson-dialog.test.tsx`:
    - Opens dialog on button click
    - Shows group selector for multi-group users
    - Auto-selects for single-group users
    - Creates lesson and redirects on success
  - [x] Run `yarn test`, `yarn lint`, `yarn build` to verify all pass

## Dev Notes

### Prisma Schema — Current State vs Architecture Spec

The current `Lesson` model in `packages/database/prisma/schema.prisma` has these fields:

```
id, groupId, authorId, title, content (Json?), status (default: LESSON_STATUS.DRAFT),
editorFeedback, isDeleted, createdAt, updatedAt
```

**Missing from Prisma (vs architecture spec):**
- `contentMarkdown` (text) — denormalized markdown for export. **NOT needed for story 3.1** — add in story 3.2 when the editor is built.
- `sortOrder` (int) — position in Learning Path. **NOT needed for story 3.1** — add in story 4.3 or 4.5.

**No Prisma migration needed for story 3.1.** The existing schema supports all ACs.

### LESSON_STATUS in Shared Constants

Current state in `packages/shared/src/constants/index.ts`:
```typescript
export const LESSON_STATUS = {
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
} as const;
```

**Missing:** `REJECTED: "rejected"` — required by the architecture spec and epic ACs (status badge for rejected lessons). Add it.

### Backend — New LessonsModule

This is the **first NestJS module for Epic 3**. Follow existing module patterns from `GroupsModule` and `MembersModule`:

**Controller pattern** (from `groups.controller.ts`):
```typescript
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";

@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findMyLessons(@CurrentUser() user: JwtPayload) {
    const lessons = await this.lessonsService.findAllByAuthor(user.userId);
    return { ok: true, data: lessons };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLessonDto,
  ) {
    const lesson = await this.lessonsService.create(user.userId, dto.groupId);
    return { ok: true, data: lesson };
  }
}
```

**Service pattern:**
```typescript
@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByAuthor(userId: string) {
    return this.prisma.lesson.findMany({
      where: { authorId: userId, isDeleted: false, group: { isDeleted: false } },
      select: {
        id: true,
        title: true,
        status: true,
        groupId: true,
        updatedAt: true,
        group: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(authorId: string, groupId: string) {
    // Verify user is an active member of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: { userId: authorId, groupId, isDeleted: false },
    });
    if (!membership) {
      throw new ForbiddenException("You are not a member of this group");
    }
    // Verify group is not soft-deleted
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, isDeleted: false },
    });
    if (!group) {
      throw new NotFoundException("Group not found");
    }
    return this.prisma.lesson.create({
      data: {
        authorId,
        groupId,
        title: "Untitled Lesson",
        status: "LESSON_STATUS.DRAFT,
      },
      select: { id: true, title: true, status: true, groupId: true },
    });
  }
}
```

**DTO:**
```typescript
import { IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class CreateLessonDto {
  @IsNotEmpty()
  @IsUUID()
  @MaxLength(36)
  groupId: string;
}
```

### Group Membership Verification

The `POST /lessons` endpoint MUST verify the user is an **active** member of the target group. Use `prisma.groupMember.findFirst({ where: { userId, groupId, isDeleted: false } })`. Do NOT use any group-level guard (like `GroupMemberGuard`) because the groupId comes from the request body, not the URL params — the existing guard expects `params.groupId`.

Also verify the group is not soft-deleted (`isDeleted: false`).

### Frontend — Query Key Pattern

Follow the existing pattern in `query-keys.ts`:
```typescript
lessons: {
  myLessons: ["lessons", "my"] as const,
},
```

### Frontend — Hook Pattern

Follow `use-group-queries.ts` as the template:
```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";
import { ApiError } from "@/lib/api/api-error";

export type MyLessonItem = {
  id: string;
  title: string;
  status: string;
  groupId: string;
  updatedAt: string;
  group: { name: string };
};

export function useMyLessons() {
  return useQuery({
    queryKey: queryKeys.lessons.myLessons,
    queryFn: async () => {
      const result = await apiRequest<MyLessonItem[]>("/lessons?author=me");
      if (!result.data) {
        throw new ApiError({ message: result.message ?? "Failed to fetch lessons", code: result.code, status: result.status });
      }
      return result.data;
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const result = await apiRequest<{ id: string; title: string; status: string; groupId: string }>("/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!result.data) {
        throw new ApiError({ message: result.message ?? "Failed to create lesson", code: result.code, status: result.status });
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
    },
  });
}
```

### Frontend — New Lesson Dialog (Group Selection)

Since lessons are group-scoped but the Content Studio is user-level, the "New Lesson" flow must handle group selection:

1. **Single group user:** Auto-select the only group. Show a brief confirmation: "Create lesson in {groupName}?" → [Create] / [Cancel]
2. **Multi-group user:** Show a Select dropdown listing user's groups (from `useMyGroups()` hook already available in `use-group-queries.ts`)
3. **No groups:** Show message: "You need to join a group before creating lessons." with a link to the dashboard

Use shadcn `Dialog` + `Select` components. Follow the dialog pattern from `delete-group-section.tsx`:
```typescript
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
```

### Frontend — Status Badge Colors

Map lesson statuses to visual badges. Follow the UX spec's feedback patterns:

| Status | Badge Text | Badge Style |
|--------|-----------|-------------|
| `draft` | Draft | `bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300` (neutral) |
| `review` | In Review | `bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400` (warning/pending) |
| `published` | Published | `bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400` (success) |
| `rejected` | Rejected | `bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400` (error) |

Use inline pill-style badges (no shadcn Badge component — use plain `<span>` with utility classes). This aligns with the UX spec's pill badge system.

### Frontend — Relative Time Display

For "last updated" dates, use a simple relative time formatter. Since `date-fns` or `timeago.js` are NOT installed, implement a small utility or use `Intl.RelativeTimeFormat`. Place it in `apps/web/src/lib/utils.ts` as a `formatRelativeTime(date: string | Date): string` function.

### Frontend — Component File Structure

```
apps/web/src/app/(dashboard)/studio/lessons/
├── page.tsx                            # UPDATE: render StudioLessonsView
├── [lessonId]/
│   └── page.tsx                        # NEW: placeholder for editor (story 3.2)
└── _components/
    ├── studio-lessons-view.tsx         # NEW: main view (list + header + empty state)
    ├── studio-lessons-view.test.tsx    # NEW: tests
    ├── lesson-list-item.tsx            # NEW: single lesson row
    ├── empty-lesson-state.tsx          # NEW: empty state
    ├── new-lesson-dialog.tsx           # NEW: group selector + create
    └── new-lesson-dialog.test.tsx      # NEW: tests
```

### Backend — File Structure

```
apps/api/src/lessons/
├── lessons.module.ts                   # NEW: module definition
├── lessons.controller.ts              # NEW: GET /lessons, POST /lessons
├── lessons.service.ts                 # NEW: findAllByAuthor, create
├── lessons.controller.spec.ts         # NEW: controller tests
├── lessons.service.spec.ts            # NEW: service tests
└── dto/
    └── create-lesson.dto.ts           # NEW: { groupId }
```

### Sidebar Navigation — Already Configured

The sidebar already has links to `/studio/lessons` and `/studio/exercises` (verified in `components/layout/sidebar.tsx`). No navigation changes needed.

### `GET /lessons?author=me` — Backend Query Param Handling

`?author=me` is a frontend convention; backend ignores it and uses `user.userId` from JWT directly.

### User Extraction — `@CurrentUser()` Decorator

All controllers use the existing `@CurrentUser()` decorator (NOT `@Request()`). Import from `../common/decorators/current-user.decorator`. The `JwtPayload` interface has `userId` and `email` — there is no `id` property.

```typescript
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";

@Get()
@UseGuards(JwtAuthGuard)
async findMyLessons(@CurrentUser() user: JwtPayload) {
  // user.userId — NOT user.id
}
```

### Cross-Story Context — What's Coming Next

- **Story 3.2** (WYSIWYG Lesson Editor): Will install Tiptap, create the `[lessonId]/page.tsx` editor, add auto-save, add `contentMarkdown` to Prisma schema. The placeholder page created here will be replaced.
- **Story 3.5** (Submit for Review): Will add `PATCH /lessons/:lessonId/submit` to change status to `review`. The status badges built here will be used.
- **Story 4.1** (Editor Review Queue): Will reuse the lesson status system. Ensure status values are consistent.

### Existing `useMyGroups` Hook

The `use-group-queries.ts` already exports `useMyGroups()` which returns the user's groups. Use this in the New Lesson dialog to populate the group selector. The return type `MyGroupItem` includes `{ id, name, role, memberCount, lastActivityAt }`.

### Testing Standards

Follow patterns from story 2-6:
- **Backend:** Mock `PrismaService` with specific model methods (`lesson.findMany`, `lesson.create`, `groupMember.findFirst`, `group.findFirst`)
- **Frontend:** Use `renderWithQueryClient()` from `@/test-utils/render-with-query-client` for components using TanStack Query
- **Mock `global.fetch`** for API call tests
- **Mock `next/navigation`** (`useRouter` for `push`)
- **Colocated tests:** `*.test.tsx` next to source files

### Project Structure Notes

- Alignment with architecture spec Section 2.2: `studio/lessons/page.tsx` for list, `studio/lessons/[lessonId]/page.tsx` for editor — matches exactly
- No conflicts with existing routes or components
- New `LessonsModule` follows the modular pattern of existing NestJS modules

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md` — Story 3.1 ACs]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR13, FR14, FR17, FR18 (Content Studio requirements)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 2.2 (directory structure), Section 3.1 (NestJS modules), Section 3.2 (lessons schema), Section 3.3 (authorization matrix)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Zone 3B Creator Studio, Step 12 UX Consistency Patterns (pill badges, button hierarchy)]
- [Source: `_bmad-output/project-context.md` — API client patterns, hook patterns, testing patterns, file naming conventions]
- [Source: `_bmad-output/implementation-artifacts/2-6-delete-group.md` — Previous story patterns (dialog, hooks, tests, cache invalidation)]
- [Source: `packages/database/prisma/schema.prisma` — Lesson model definition]
- [Source: `packages/shared/src/constants/index.ts` — LESSON_STATUS, ErrorCode]
- [Source: `apps/web/src/lib/api/query-keys.ts` — Query key patterns]
- [Source: `apps/web/src/hooks/api/use-group-queries.ts` — useMyGroups hook, mutation patterns]
- [Source: `apps/web/src/components/layout/sidebar.tsx` — Studio navigation already configured]
- [Source: `apps/web/src/app/(dashboard)/studio/lessons/page.tsx` — Current placeholder page]

## Dev Agent Record

### Agent Model Used

claude-4.6-sonnet-medium-thinking

### Debug Log References

None — implementation completed without significant debugging issues.

### Completion Notes List

- All 6 tasks implemented as specified. No deviations from the story requirements.
- `LESSON_STATUS.REJECTED` and `LessonStatus` type added to shared constants; `LESSON_CREATE_FAILED` error code + message added.
- `LessonsModule` (controller, service, DTO) created following existing NestJS module patterns from `GroupsModule`. Registered in `app.module.ts`.
- `GET /lessons?author=me` ignores the query param and uses `user.userId` from JWT (as documented in Dev Notes).
- `POST /lessons` verifies active group membership and non-deleted group before creating the lesson; throws `ForbiddenException` / `NotFoundException` on failures.
- Frontend query key `lessons.myLessons`, hooks `useMyLessons` and `useCreateLesson` created following `use-group-queries.ts` pattern.
- All UI components created: `StudioLessonsView`, `LessonListItem`, `EmptyLessonState`, `NewLessonDialog`.
- `formatRelativeTime` utility added to `apps/web/src/lib/utils.ts` using `Intl.RelativeTimeFormat` (no external dependency needed).
- `NewLessonDialog` handles 0/1/multi-group cases as specified. Uses `useMyGroups()` for group data.
- Lesson editor placeholder page created at `[lessonId]/page.tsx` — will be replaced by Tiptap editor in Story 3.2.
- All backend and frontend tests written and passing. `yarn test`, `yarn lint`, and `yarn build` all pass.

### File List

**Modified:**
- `packages/shared/src/constants/index.ts`
- `packages/shared/src/errors/error-messages.ts`
- `apps/api/src/app.module.ts`
- `apps/web/src/app/(dashboard)/studio/lessons/page.tsx`
- `apps/web/src/lib/api/query-keys.ts`
- `apps/web/src/hooks/api/index.ts`
- `apps/web/src/lib/utils.ts`

**Created:**
- `apps/api/src/lessons/lessons.module.ts`
- `apps/api/src/lessons/lessons.controller.ts`
- `apps/api/src/lessons/lessons.service.ts`
- `apps/api/src/lessons/lessons.controller.spec.ts`
- `apps/api/src/lessons/lessons.service.spec.ts`
- `apps/api/src/lessons/dto/create-lesson.dto.ts`
- `apps/web/src/hooks/api/use-lesson-queries.ts`
- `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.test.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/_components/empty-lesson-state.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/_components/new-lesson-dialog.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/_components/new-lesson-dialog.test.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/page.tsx`
