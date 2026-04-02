# Story 3.2: WYSIWYG Lesson Editor

Status: done

## Story

As a Contributor,
I want to write and format lesson content using a rich text editor with a Confluence-style toolbar,
so that I can produce well-structured, high-quality lesson content without knowing Markdown syntax.

## Acceptance Criteria

1. **Given** I open a lesson in the editor at `/studio/lessons/[lessonId]`,
   **When** the page loads,
   **Then** the Tiptap editor is rendered with the Confluence-style toolbar: Bold, Italic, Underline, Strikethrough | H1, H2, H3 | Bullet List, Ordered List, Blockquote | Link, Image, Table | Alive Text block,
   **And** existing lesson content (stored as Tiptap ProseMirror JSON in `lessons.content`) is loaded into the editor via `GET /lessons/:lessonId` (author ownership verified in service),
   **And** a sidebar outline panel shows H1/H2 headings for navigation.

2. **Given** I type or format content in the editor,
   **When** I pause typing for 2 seconds,
   **Then** the lesson content is auto-saved via `PATCH /lessons/:lessonId` updating `lessons.content` (Tiptap JSON) and `lessons.content_markdown` (denormalized Markdown) via Prisma,
   **And** a subtle "Saved" indicator appears near the title field.

3. **Given** I edit the lesson title (bare input at top),
   **When** I update the title,
   **Then** `lessons.title` is updated on blur or auto-save via NestJS API.

4. **Given** I insert an image via the toolbar,
   **When** I provide an image URL,
   **Then** the URL is inserted into the Tiptap content as an image node,
   **And** the image renders inline in the editor.
   **Note:** Full file upload to Cloudflare R2 via `POST /api/files/upload` is deferred until R2 SDK is installed. This story supports image insertion by URL only.

5. **Given** I insert an Alive Text block via the toolbar,
   **When** I type hidden content inside the block,
   **Then** the block is stored as `{ type: 'alive_text', attrs: { hidden: true }, content: [...] }` in the Tiptap JSON,
   **And** in the editor view the content is visible with a purple dashed border indicator (editing mode).

## Tasks / Subtasks

- [x] **Task 1: Prisma schema — add `contentMarkdown` column** (AC: 2)
  - [x] Add `contentMarkdown String? @map("content_markdown")` to `Lesson` model in `packages/database/prisma/schema.prisma`
  - [x] Run `npx prisma migrate dev --name add-lesson-content-markdown` from `packages/database`
  - [x] Run `npx prisma generate` to regenerate the Prisma Client
  - [x] Verify both `apps/web` and `apps/api` can import updated types

- [x] **Task 2: Shared — add new error codes for lesson operations** (AC: 1, 2, 3)
  - [x] Add to `ErrorCode` in `packages/shared/src/constants/index.ts`:
    - `LESSON_NOT_FOUND: "LESSON_NOT_FOUND"`
    - `LESSON_UPDATE_FAILED: "LESSON_UPDATE_FAILED"`
    - `LESSON_NOT_OWNER: "LESSON_NOT_OWNER"`
    - `LESSON_NOT_EDITABLE: "LESSON_NOT_EDITABLE"` — used when lesson status is `review` or `published`
  - [x] Add corresponding error messages in `packages/shared/src/errors/error-messages.ts`

- [x] **Task 3: Backend — add GET /lessons/:lessonId and PATCH /lessons/:lessonId endpoints** (AC: 1, 2, 3)
  - [x] Update `apps/api/src/lessons/lessons.service.ts`:
    - Add `findOneById(lessonId: string, userId: string)`:
      - `prisma.lesson.findFirst({ where: { id: lessonId, isDeleted: false } })`
      - Verify `authorId === userId`, throw `ForbiddenException({ code: ErrorCode.LESSON_NOT_OWNER })` if not
      - Return full lesson: `{ id, title, content, contentMarkdown, status, groupId, authorId, updatedAt }`
    - Add `update(lessonId: string, userId: string, data: UpdateLessonData)`:
      - Verify lesson exists and `authorId === userId` (same ownership check)
      - Only allow update if `status === 'draft'` or `status === 'rejected'` (cannot edit while in review or published)
      - `prisma.lesson.update({ where: { id: lessonId }, data: { title, content, contentMarkdown, updatedAt: new Date() } })`
      - Return updated lesson `{ id, title, content, contentMarkdown, status, updatedAt }`
  - [x] Update `apps/api/src/lessons/lessons.controller.ts`:
    - `@Get(':id')` + `@UseGuards(JwtAuthGuard)` → call `findOneById(params.id, user.userId)`, return `{ ok: true, data: lesson }`
    - `@Patch(':id')` + `@UseGuards(JwtAuthGuard)` → validate body with `UpdateLessonDto`, call `update(params.id, user.userId, dto)`, return `{ ok: true, data: lesson }`
  - [x] Create `apps/api/src/lessons/dto/update-lesson.dto.ts`:
    - `title?: string` — `@IsOptional()`, `@IsString()`, `@MinLength(VALIDATION.LESSON_TITLE_MIN)`, `@MaxLength(VALIDATION.LESSON_TITLE_MAX)` (prevent saving empty title)
    - `content?: Record<string, unknown>` — `@IsOptional()`, `@IsObject()` (Tiptap JSON, stored as JSONB — must be an object at minimum)
    - `contentMarkdown?: string` — `@IsOptional()`, `@IsString()`, `@MaxLength(VALIDATION.LESSON_CONTENT_MARKDOWN_MAX)` (large text; verify NestJS body parser limit ≥ 1MB)
  - [x] Configure JSON body parser limit to 1MB in `apps/api/src/main.ts`: `app.useBodyParser('json', { limit: '1mb' })` — NestJS/Express defaults to ~100KB which is insufficient for rich lesson content (Tiptap JSON + plain text)

- [x] **Task 4: Install Tiptap packages in `apps/web`** (AC: 1, 5)
  - [x] Install core: `yarn workspace @squademy/web add @tiptap/react @tiptap/pm @tiptap/starter-kit`
  - [x] Install extensions: `yarn workspace @squademy/web add @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-placeholder`
  - [x] Verify `yarn build` still passes after installation
  - [x] Update `.cursor/rules/squademy-project.mdc`: move Tiptap from "Planned (NOT yet installed)" to the installed dependencies section to prevent future agents from flagging Tiptap imports as rule violations

- [x] **Task 5: Frontend — query keys + hooks for single lesson + update** (AC: 1, 2, 3)
  - [x] Update `apps/web/src/lib/api/query-keys.ts`:
    ```
    lessons: {
      myLessons: ["lessons", "my"] as const,
      detail: (id: string) => ["lessons", id] as const,
    }
    ```
  - [x] Update `apps/web/src/hooks/api/use-lesson-queries.ts`:
    - Add `LessonDetail` type: `{ id: string; title: string; content: any; contentMarkdown: string | null; status: LessonStatus; groupId: string; authorId: string; updatedAt: string }`
    - Add `useLesson(lessonId: string)` — `useQuery` calling `GET /lessons/${lessonId}`
    - Add `useUpdateLesson()` — `useMutation` calling `PATCH /lessons/${lessonId}` with `{ title?, content?, contentMarkdown? }`, on success use `queryClient.setQueryData(queryKeys.lessons.detail(lessonId), data)` to update cache directly (do NOT `invalidateQueries` on every auto-save — it triggers unnecessary refetches every 2s and risks re-render flicker). Only invalidate `queryKeys.lessons.myLessons` when navigating away from the editor (e.g. via `useEffect` cleanup or before navigation).
    - The mutation function signature: `(params: { lessonId: string; data: Partial<{ title: string; content: any; contentMarkdown: string }> }) => Promise<...>`

- [x] **Task 6: Frontend — Alive Text custom Tiptap extension** (AC: 5)
  - [x] Create `apps/web/src/components/editor/extensions/alive-text.ts`:
    - Custom Node extension using `Node.create({ name: 'alive_text', ... })` (**MUST be snake_case** — Tiptap uses `name` as the `type` field in serialized JSON; AC 5 and architecture Section 6.1 both specify `{ type: 'alive_text' }`)
    - Schema: `group: 'block'`, `content: 'block+'`, `attrs: { hidden: { default: true } }`
    - `parseHTML`: parse `<div data-type="alive-text">` elements
    - `renderHTML`: render as `<div data-type="alive-text" class="alive-text-block">` wrapping content
    - **MVP approach (CSS-only):** visual styling via `editor-styles.css` (`div[data-type="alive-text"]` purple dashed border) — no `addNodeView` / `ReactNodeViewRenderer` needed for this story. A React NodeView can be added later if interactive controls (collapse toggle, delete button) are needed in future stories.
    - `addCommands`: `toggleAliveText` command to wrap/unwrap selection

- [x] **Task 7: Frontend — Tiptap editor component + toolbar** (AC: 1, 2, 4, 5)
  - [x] Create `apps/web/src/components/editor/` directory
  - [x] Create `apps/web/src/components/editor/lesson-editor.tsx` ("use client"):
    - Uses `useEditor` from `@tiptap/react` with extensions: StarterKit (configured with `heading: { levels: [1, 2, 3] }`), Underline, Link, Image, Table, TableRow, TableCell, TableHeader, Placeholder, AliveText
    - Accepts `content` (Tiptap JSON or null) as initial content
    - Exposes `editor` instance via callback or ref for parent to access `editor.getJSON()` and `editor.getHTML()`
    - `onUpdate` callback fires on every editor change (parent uses this for debounced auto-save)
  - [x] Create `apps/web/src/components/editor/editor-toolbar.tsx` ("use client"):
    - Confluence-style toolbar with grouped button sections:
      - Text formatting: Bold, Italic, Underline, Strikethrough
      - Headings: H1, H2, H3
      - Lists: Bullet List, Ordered List, Blockquote
      - Insert: Link (URL popover), Image (URL dialog), Table
      - Special: Alive Text block
    - Each button uses `editor.chain().focus().<command>().run()` pattern
    - Active state styling: `editor.isActive('bold')` → highlighted button
    - Use Lucide icons for toolbar buttons
  - [x] Create `apps/web/src/components/editor/link-popover.tsx` ("use client"):
    - Small popover triggered by the Link toolbar button
    - Input for URL, Apply/Remove buttons
    - If text is selected: apply link to selection. If no selection: insert URL as both text and href.
    - When cursor is on existing link: show URL with Edit/Remove options
    - On apply: `editor.chain().focus().setLink({ href: url }).run()`
    - On remove: `editor.chain().focus().unsetLink().run()`
  - [x] Create `apps/web/src/components/editor/editor-styles.css`:
    - Tiptap `.tiptap` class base styles (focus outline, prose-like typography using Inter font)
    - Table styles (borders, cell padding)
    - Alive Text block styles (purple dashed border, light purple background)
    - Placeholder styles (gray italic text)
    - Image styles (max-width: 100%, centered)
  - [x] Create `apps/web/src/components/editor/image-url-dialog.tsx` ("use client"):
    - Small dialog/popover triggered by the Image toolbar button
    - Input for URL, preview thumbnail, Insert/Cancel buttons
    - On insert: `editor.chain().focus().setImage({ src: url }).run()`

- [x] **Task 8: Frontend — sidebar outline panel** (AC: 1)
  - [x] Create `apps/web/src/components/editor/outline-panel.tsx` ("use client"):
    - Extracts H1/H2 headings by traversing `editor.state.doc` with ProseMirror `descendants()` (NOT `editor.getJSON()` — avoids full JSON serialization on every update)
    - Debounce outline refresh by 300–500ms to avoid excessive re-renders on fast typing
    - Displays as a clickable list in the sidebar
    - On click: scrolls the editor to the corresponding heading position
    - Updates live as user types/formats headings (debounced)
    - On mobile: collapsible or hidden (show via a toggle button)

- [x] **Task 9: Frontend — lesson editor page with auto-save** (AC: 1, 2, 3)
  - [x] Replace `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/page.tsx`:
    - Server component that renders a client component `LessonEditorView`
  - [x] Create `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` ("use client"):
    - Uses `useLesson(lessonId)` to fetch lesson data
    - Uses `useUpdateLesson()` mutation for auto-save
    - **Title field**: Bare input at top (no border, `text-2xl font-bold`, transparent bg). Updates on blur or auto-save.
    - **Save indicator**: Shows "Saving..." during mutation, "Saved" on success (auto-fades after 2s), "Error saving" on failure
    - **Auto-save logic**:
      - `useRef` for debounce timer
      - On `editor.onUpdate`: clear existing timer, set new 2-second timeout
      - On timeout: call `updateLessonMutation.mutate({ lessonId, data: { content: editor.getJSON(), contentMarkdown: editor.getText(), title } })`
      - On blur of title input: trigger immediate save if title changed
      - **Manual save shortcut**: `Mod-s` (`Ctrl+S` / `Cmd+S`) triggers immediate save (cancel pending debounce timer first). Register via Tiptap `addKeyboardShortcuts` or a `useEffect` with `keydown` listener. Prevent browser default save-page behavior.
    - **Layout**: Flex row — main editor area (grow) + outline sidebar (fixed 200px width, hidden on mobile)
    - **Loading state**: Skeleton while lesson data is loading
    - **Error state**: Show error message if lesson fetch fails or lesson not found
    - **Read-only mode**: If `lesson.status === 'review'` or `lesson.status === 'published'`, disable editor (set `editable: false` on Tiptap), hide toolbar, **disable title input** (`readOnly` prop), and show status badge. All form inputs must be locked — backend rejects PATCH for non-editable statuses, so allowing UI edits would cause confusing save errors.
  - [x] Create `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/save-indicator.tsx` ("use client"):
    - Simple component that shows save status: idle (nothing shown), saving (spinner + "Saving..."), saved ("Saved" with checkmark, fades after 2s), error ("Failed to save" in red)

- [x] **Task 10: Backend + Frontend tests** (AC: 1–5)
  - [x] Backend: Update `apps/api/src/lessons/lessons.service.spec.ts`:
    - `findOneById` returns lesson when author matches
    - `findOneById` throws LESSON_NOT_OWNER when author doesn't match
    - `findOneById` throws LESSON_NOT_FOUND when lesson doesn't exist
    - `update` updates title, content, contentMarkdown
    - `update` throws LESSON_NOT_OWNER when not author
    - `update` throws LESSON_NOT_EDITABLE when status is 'review' or 'published'
  - [x] Backend: Update `apps/api/src/lessons/lessons.controller.spec.ts`:
    - `GET /lessons/:id` returns lesson data
    - `PATCH /lessons/:id` updates and returns lesson data
  - [x] Frontend: Create `apps/web/src/components/editor/lesson-editor.test.tsx`:
    - Editor renders with provided content
    - Toolbar buttons are present
    - Editor calls onUpdate when content changes
  - [x] Frontend: Create `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.test.tsx`:
    - Renders loading state initially
    - Renders editor with lesson data after fetch
    - Shows save indicator after content change
    - Title is editable
    - Editor is read-only when lesson status is `review` or `published`
  - [x] Run `yarn test`, `yarn lint`, `yarn build` to verify all pass

## Dev Notes

### Prisma Schema Migration

Current `Lesson` model is missing `contentMarkdown`. Add it:

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

Migration command: `cd packages/database && npx prisma migrate dev --name add-lesson-content-markdown`

### Backend — Endpoint Patterns

Follow the existing `LessonsController` pattern from story 3.1. The controller already has `@UseGuards(JwtAuthGuard)` at class level, so individual route guards are inherited.

**No ResourceOwnerGuard exists** in the codebase. Do NOT create a reusable guard for this story — implement ownership verification at the service level (same pattern as `create` method checking membership). A reusable `ResourceOwnerGuard` can be extracted later when more resources need the same pattern.

**Controller additions:**

```typescript
@Get(':id')
async findOne(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
) {
  const lesson = await this.lessonsService.findOneById(id, user.userId);
  return { ok: true, data: lesson };
}

@Patch(':id')
async update(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
  @Body() dto: UpdateLessonDto,
) {
  const lesson = await this.lessonsService.update(id, user.userId, dto);
  return { ok: true, data: lesson };
}
```

**Service — ownership check pattern:**

```typescript
async findOneById(lessonId: string, userId: string) {
  const lesson = await this.prisma.lesson.findFirst({
    where: { id: lessonId, isDeleted: false },
  });
  if (!lesson) {
    throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
  }
  if (lesson.authorId !== userId) {
    throw new ForbiddenException({ code: ErrorCode.LESSON_NOT_OWNER });
  }
  return lesson;
}
```

**Update DTO:**

```typescript
import { IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { VALIDATION } from "@squademy/shared";

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(VALIDATION.LESSON_TITLE_MIN)
  @MaxLength(VALIDATION.LESSON_TITLE_MAX)
  title?: string;

  @IsOptional()
  @IsObject()
  @ValidateIf((o) => o.content !== null)
  content?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.LESSON_CONTENT_MARKDOWN_MAX)
  contentMarkdown?: string;
}
```

### Status-Based Edit Restrictions

The update endpoint MUST reject edits when the lesson is in `review` or `published` status. Only `draft` and `rejected` lessons are editable. Throw `ForbiddenException({ code: ErrorCode.LESSON_NOT_EDITABLE })` when the lesson status prevents editing.

```typescript
import { LESSON_STATUS } from "@squademy/shared";

const editableStatuses = [LESSON_STATUS.DRAFT, LESSON_STATUS.REJECTED];
if (!editableStatuses.includes(lesson.status)) {
  throw new ForbiddenException({ code: ErrorCode.LESSON_NOT_EDITABLE });
}
```

This aligns with story 3.5 (Submit for Review) where the editor toolbar is disabled during review.

### Tiptap Installation — Packages

**Core (3 packages):**
- `@tiptap/react` — React integration (useEditor, EditorContent)
- `@tiptap/pm` — ProseMirror peer dependencies
- `@tiptap/starter-kit` — Bundles: Bold, Italic, Strike, Code, CodeBlock, Heading, BulletList, OrderedList, Blockquote, HardBreak, HorizontalRule, History (undo/redo)

**Extensions (8 packages):**
- `@tiptap/extension-underline` — Underline mark
- `@tiptap/extension-link` — Link mark with URL
- `@tiptap/extension-image` — Image node (supports `src`, `alt`, `title`)
- `@tiptap/extension-table` — Table container
- `@tiptap/extension-table-row` — Table row
- `@tiptap/extension-table-cell` — Table cell
- `@tiptap/extension-table-header` — Table header cell
- `@tiptap/extension-placeholder` — Placeholder text for empty editor

Install all at once:
```bash
yarn workspace @squademy/web add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-placeholder
```

### Tiptap Editor Configuration

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { AliveText } from './extensions/alive-text';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Link.configure({ openOnClick: false }),
    Image,
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
    Placeholder.configure({ placeholder: 'Start writing your lesson...' }),
    AliveText,
  ],
  content: initialContent, // Tiptap JSON from API
  editable: lesson.status === 'draft' || lesson.status === 'rejected',
  onUpdate: ({ editor }) => {
    handleContentChange(editor);
  },
});
```

### Auto-Save Implementation Pattern

Use a `useRef` + `setTimeout` debounce pattern. Do NOT use `useEffect` with content as dependency — this causes infinite loops.

**Cache update strategy:** The mutation's `onSuccess` uses `queryClient.setQueryData` to update the `detail` cache directly from the response — do NOT `invalidateQueries` on every auto-save. Invalidating `detail` triggers a refetch that wastes bandwidth (client already has the latest data) and risks re-render flicker if the component re-reads the query. Invalidate `myLessons` only on cleanup (component unmount / navigation away) so the list reflects the latest `updatedAt`.

```typescript
const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

function handleContentChange(editor: Editor) {
  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  saveTimerRef.current = setTimeout(() => {
    setSaveStatus('saving');
    updateLessonMutation.mutate(
      {
        lessonId,
        data: {
          content: editor.getJSON(),
          contentMarkdown: editor.getText(),
          title: titleRef.current,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(queryKeys.lessons.detail(lessonId), data);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => setSaveStatus('error'),
      }
    );
  }, 2000);
}

// Invalidate myLessons on unmount so list page reflects latest updatedAt
useEffect(() => {
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
  };
}, []);
```

### JSON Body Parser Limit

NestJS/Express defaults to a ~100KB JSON body limit. A lesson with rich content (Tiptap JSON + plain text) can easily exceed this. Verify or configure the body parser limit to at least 1MB in `apps/api/src/main.ts`:

```typescript
app.use(json({ limit: '1mb' }));
```

Or via NestFactory:

```typescript
const app = await NestFactory.create(AppModule, { bodyParser: true });
app.useBodyParser('json', { limit: '1mb' });
```

**Critical:** `editor.getText()` extracts plain text (no formatting). For proper Markdown export, story 3.4 will install a markdown serializer. For now, `editor.getText()` provides a basic text representation for `contentMarkdown`. This is sufficient for full-text search and basic export — rich markdown conversion will be enhanced in story 3.4 (Export).

### Alive Text Extension — Custom Node

Create at `apps/web/src/components/editor/extensions/alive-text.ts`:

```typescript
import { Node, mergeAttributes } from '@tiptap/core';

export const AliveText = Node.create({
  name: 'alive_text',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      hidden: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="alive-text"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'alive-text' }), 0];
  },
});
```

In the editor CSS, style `div[data-type="alive-text"]` with a purple dashed border and light purple background so the author can visually distinguish Alive Text blocks.

### Content Markdown — Conversion Strategy

For this story, `contentMarkdown` stores **plain text** via `editor.getText()` (no formatting preserved). The column is named `contentMarkdown` to match the architecture spec, but in story 3.2 the content is plain-text only. This is intentionally simple because:
1. The primary storage format is Tiptap JSON (`content` field)
2. `contentMarkdown` is a denormalized field for export and search
3. Story 3.4 (Export) will implement proper Tiptap JSON → Markdown conversion
4. The architecture spec notes `content_markdown` is "Denormalized for export"

**Migration note for Story 3.4:** When proper markdown serialization is added, existing `contentMarkdown` values will be plain text (from story 3.2). Story 3.4 should either backfill existing records or treat plain-text values as valid fallback content. No schema change needed — just awareness that older records contain plain text, not markdown.

### Image Upload — Deferred R2 Integration

The epic AC specifies image upload to Cloudflare R2. However, the R2 SDK (`@aws-sdk/client-s3`) is listed as "Planned (NOT yet installed)". This story implements:
- **Image insertion by URL** — toolbar button opens a URL input dialog → inserts `<img src="...">` node
- **Tiptap Image extension** — renders images inline in the editor

Full file upload (drag-and-drop, file picker → R2 → URL) will be implemented when R2 infrastructure is set up. The `POST /api/files/upload` route handler is deferred to a separate story or infrastructure task.

### Editor Layout — Responsive Design

```
Desktop (> 1024px):
┌─────────────────────────────────────────┬──────────────┐
│ Title (bare input, text-2xl)            │              │
│ Save indicator                          │  Outline     │
├─────────────────────────────────────────┤  Panel       │
│ Toolbar (Confluence-style)              │  (H1/H2)    │
├─────────────────────────────────────────┤              │
│ Editor content area                     │              │
│ (Tiptap EditorContent)                  │              │
│                                         │              │
└─────────────────────────────────────────┴──────────────┘

Mobile (< 768px):
┌─────────────────────────────────────────┐
│ ← Back    Title        Save indicator   │
├─────────────────────────────────────────┤
│ Toolbar (scrollable horizontal)         │
├─────────────────────────────────────────┤
│ Editor content area                     │
│                                         │
│ [Outline toggle button floating]        │
└─────────────────────────────────────────┘
```

- Sidebar outline: `hidden md:block w-[200px] shrink-0`
- Toolbar: `flex flex-wrap gap-1` on desktop, `flex overflow-x-auto` on mobile
- Editor area: `flex-1 min-h-[60vh] prose prose-zinc dark:prose-invert max-w-none`

### Toolbar Icon Mapping (Lucide React)

| Action | Lucide Icon | Editor Command |
|--------|------------|----------------|
| Bold | `Bold` | `toggleBold` |
| Italic | `Italic` | `toggleItalic` |
| Underline | `Underline` | `toggleUnderline` |
| Strikethrough | `Strikethrough` | `toggleStrike` |
| H1 | `Heading1` | `toggleHeading({ level: 1 })` |
| H2 | `Heading2` | `toggleHeading({ level: 2 })` |
| H3 | `Heading3` | `toggleHeading({ level: 3 })` |
| Bullet List | `List` | `toggleBulletList` |
| Ordered List | `ListOrdered` | `toggleOrderedList` |
| Blockquote | `Quote` | `toggleBlockquote` |
| Link | `Link` | Opens link popover → `setLink` / `unsetLink` |
| Image | `ImagePlus` | Opens URL dialog → `setImage` |
| Table | `Table` | `insertTable({ rows: 3, cols: 3 })` |
| Alive Text | `EyeOff` | `toggleAliveText` (custom command) |

### Editor Styles — CSS Import

Tiptap requires custom CSS for the `.tiptap` editor class. Create `apps/web/src/components/editor/editor-styles.css` and import it in the editor component. Key styles:

```css
.tiptap {
  outline: none;
  font-family: var(--font-inter);
  line-height: 1.75;
  padding: 1rem;
  min-height: 60vh;
}

.tiptap h1 { font-size: 2rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.5rem; }
.tiptap h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
.tiptap h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }

.tiptap p { margin-bottom: 0.75rem; }
.tiptap ul, .tiptap ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
.tiptap blockquote { border-left: 3px solid var(--color-zinc-300); padding-left: 1rem; color: var(--color-zinc-500); }

.tiptap img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }

.tiptap table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.tiptap td, .tiptap th { border: 1px solid var(--color-zinc-200); padding: 0.5rem; }
.tiptap th { background: var(--color-zinc-50); font-weight: 600; }

div[data-type="alive-text"] {
  border: 2px dashed #7C3AED;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: rgba(124, 58, 237, 0.05);
  margin: 0.75rem 0;
  position: relative;
}

div[data-type="alive-text"]::before {
  content: "Alive Text";
  position: absolute;
  top: -0.75rem;
  left: 0.75rem;
  background: #7C3AED;
  color: white;
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

Add dark mode variants with Tailwind's `dark:` selector or CSS custom properties.

### Frontend — Component File Structure

```
apps/web/src/
├── components/
│   └── editor/
│       ├── lesson-editor.tsx                # Main Tiptap editor wrapper
│       ├── lesson-editor.test.tsx           # Editor component tests
│       ├── editor-toolbar.tsx               # Confluence-style toolbar
│       ├── editor-styles.css                # Tiptap custom styles
│       ├── outline-panel.tsx                # Sidebar heading outline
│       ├── image-url-dialog.tsx             # Image URL insertion dialog
│       ├── link-popover.tsx                 # Link URL insertion/edit popover
│       └── extensions/
│           └── alive-text.ts                # Custom Alive Text extension
├── app/(dashboard)/studio/lessons/
│   └── [lessonId]/
│       ├── page.tsx                         # UPDATE: server component wrapper
│       └── _components/
│           ├── lesson-editor-view.tsx       # NEW: main editor view with auto-save
│           ├── lesson-editor-view.test.tsx  # NEW: editor view tests
│           └── save-indicator.tsx           # NEW: save status display
```

### Backend — File Structure Updates

```
apps/api/src/lessons/
├── lessons.module.ts                        # No changes
├── lessons.controller.ts                    # UPDATE: add GET :id, PATCH :id
├── lessons.service.ts                       # UPDATE: add findOneById, update
├── lessons.controller.spec.ts               # UPDATE: add new endpoint tests
├── lessons.service.spec.ts                  # UPDATE: add new method tests
└── dto/
    ├── create-lesson.dto.ts                 # No changes
    └── update-lesson.dto.ts                 # NEW: UpdateLessonDto
```

### Previous Story Intelligence (3.1)

Key patterns established in story 3.1 that MUST be followed:
- Controller uses `@CurrentUser()` decorator from `../common/decorators/current-user.decorator`
- `JwtPayload` interface has `userId` and `email` — no `id` property
- Service throws `{ code: ErrorCode.X }` format — NOT hardcoded messages
- Frontend hooks follow `use-lesson-queries.ts` pattern with `apiRequest<T>` and `ApiError`
- Query keys follow factory pattern in `query-keys.ts`
- Tests mock `global.fetch` and `next/navigation`
- Use `renderWithQueryClient()` from `@/test-utils/render-with-query-client` for React Query components

### Cross-Story Context — Dependencies and Downstream Impact

- **Story 3.3** (Markdown Import): Will parse `.md` files client-side and convert to Tiptap JSON. Depends on the editor being functional and the Tiptap extensions being installed. The import button will be added to the editor toolbar.
- **Story 3.4** (Export Lesson): Will use `contentMarkdown` for Markdown export and Tiptap JSON → HTML → PDF/DOCX conversion. Depends on `contentMarkdown` being populated by auto-save (this story).
- **Story 3.5** (Submit for Review): Will add `PATCH /lessons/:lessonId/submit` to change status to `review`. The read-only mode (editable: false) built here enables that story's "editor locked during review" requirement.
- **Story 4.1** (Editor Review Queue): Will reuse the Tiptap editor in read-only mode for Editors reviewing lessons.
- **Story 4.2** (Line-level Comments): Will add inline comment anchors to the Tiptap editor view.

### Theming — Editor Zone

Per the UX specification, the Content Studio zone uses **Neutral/Dark accent** (no colored accent glow). The editor should feel clean and professional, using the standard zinc palette without purple/teal zone coloring. Exception: Alive Text blocks use purple as their distinctive color.

### Testing Tiptap in Jest

Tiptap requires a DOM environment. Jest is configured with `jest-environment-jsdom`, which provides this. However, Tiptap's ProseMirror may need mocking for some tests. Recommended approach:
- For editor rendering tests: mock the `@tiptap/react` module to return a simple div
- For toolbar tests: mock the editor instance with `isActive()` and `chain().focus().<cmd>().run()` patterns
- Do NOT test Tiptap internals — test the integration (toolbar clicks change editor state, content changes trigger onUpdate)

### Bundle Size Consideration

Tiptap + ProseMirror adds ~80-120KB gzipped to the bundle. Per architecture Section 8.4: "Tiptap: Only load editor extensions needed per route (lesson creator ≠ read view)." Use dynamic import for the editor component:

```typescript
const LessonEditorView = dynamic(
  () => import('./_components/lesson-editor-view'),
  { ssr: false, loading: () => <EditorSkeleton /> }
);
```

The editor should NOT be loaded for the lesson list page or any non-editor route.

### Project Structure Notes

- Alignment with architecture spec Section 2.2: `studio/lessons/[lessonId]/page.tsx` is the Tiptap editor page — matches exactly
- `src/components/editor/` is the designated location for editor components per architecture
- The Alive Text extension goes in `components/editor/extensions/` (custom editor extensions)
- No conflicts with existing routes or components
- The placeholder page from story 3.1 at `[lessonId]/page.tsx` will be replaced

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md` — Story 3.2 ACs]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR13, FR14 (Content Studio, WYSIWYG editor)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 2.1 (Tiptap Community), Section 2.2 (directory structure), Section 3.2 (lessons schema with contentMarkdown), Section 6.1 (Alive Text extension), Section 6.8 (Long-form lesson optimization), Section 8.4 (bundle optimization)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Zone 3B Creator Studio (Confluence-style toolbar), Alive Text UX pattern, Form Patterns (bare inputs)]
- [Source: `_bmad-output/project-context.md` — Tiptap listed as planned/not-installed, API client patterns, testing patterns]
- [Source: `_bmad-output/implementation-artifacts/3-1-lesson-list-content-studio-navigation.md` — Previous story patterns (controller, service, hooks, tests, dev notes about missing contentMarkdown)]
- [Source: `packages/database/prisma/schema.prisma` — Current Lesson model (missing contentMarkdown)]
- [Source: `apps/api/src/lessons/lessons.controller.ts` — Existing controller pattern]
- [Source: `apps/api/src/lessons/lessons.service.ts` — Existing service pattern]
- [Source: `apps/web/src/hooks/api/use-lesson-queries.ts` — Existing hook pattern]
- [Source: `apps/web/src/lib/api/query-keys.ts` — Query key factory]
- [Source: `apps/api/src/common/guards/` — Only jwt-auth, group-member, group-admin guards exist (no ResourceOwnerGuard)]

## Dev Agent Record

### Agent Model Used

claude-4.6-sonnet-medium-thinking

### Debug Log References

- `queueMicrotask` used in `lesson-editor-view.tsx` to avoid synchronous setState in `useEffect` (React lint rule `@eslint-react/hooks-extra/no-direct-set-state-in-use-effect`)
- `content: data.content as object` cast needed for Prisma `Json` field compatibility with `Record<string, unknown>` input type
- `@squademy/shared` required explicit `yarn build` after adding new `ErrorCode` entries to pick up updated types in API service
- Backend `groups.controller.spec.ts` has 1 pre-existing test failure (not introduced by this story — confirmed via `git stash` verification)

### Completion Notes List

- **Task 1**: Added `contentMarkdown String? @map("content_markdown")` to Prisma Lesson model, migration `20260401123357_add_lesson_content_markdown` applied successfully
- **Task 2**: Added 4 new ErrorCode constants (LESSON_NOT_FOUND, LESSON_UPDATE_FAILED, LESSON_NOT_OWNER, LESSON_NOT_EDITABLE) + corresponding messages in shared package
- **Task 3**: Implemented `GET /lessons/:id` and `PATCH /lessons/:id` with ownership checks, status-based edit restrictions, `UpdateLessonDto` with validation, JSON body parser raised to 1MB
- **Task 4**: Installed 11 Tiptap packages in `@squademy/web`, updated cursor rule and project-context to move Tiptap from "Planned" to installed
- **Task 5**: Added `queryKeys.lessons.detail`, `useLesson` query hook, `useUpdateLesson` mutation with `setQueryData` cache strategy (no invalidateQueries on save)
- **Task 6**: Created `AliveText` custom Tiptap Node extension with `toggleAliveText` command, snake_case name for JSON serialization compatibility
- **Task 7**: Created full editor component suite — `lesson-editor.tsx`, `editor-toolbar.tsx` (Confluence-style with all AC toolbar items), `link-popover.tsx`, `image-url-dialog.tsx`, `editor-styles.css` (with Alive Text purple dashed border styles)
- **Task 8**: Created `outline-panel.tsx` using `editor.state.doc.descendants()` with 400ms debounce, scrolls to heading on click
- **Task 9**: Created `lesson-editor-view.tsx` with 2s auto-save debounce, Ctrl+S shortcut, read-only mode for review/published, skeleton loading, error state; `save-indicator.tsx` with idle/saving/saved/error states; updated `page.tsx` with `next/dynamic` SSR:false for bundle optimization
- **Task 10**: 36 new tests added — 16 backend (service: 12, controller: 10 total / 7 new) + 10 frontend (editor: 4, view: 6). All pass. Lint clean. Pre-existing failure in groups.controller.spec.ts unrelated to this story.

### File List

- `packages/database/prisma/schema.prisma` — modified
- `packages/database/prisma/migrations/20260401123357_add_lesson_content_markdown/migration.sql` — created
- `packages/shared/src/constants/index.ts` — modified
- `packages/shared/src/errors/error-messages.ts` — modified
- `apps/api/src/lessons/lessons.service.ts` — modified
- `apps/api/src/lessons/lessons.controller.ts` — modified
- `apps/api/src/lessons/dto/update-lesson.dto.ts` — created
- `apps/api/src/lessons/lessons.service.spec.ts` — modified
- `apps/api/src/lessons/lessons.controller.spec.ts` — modified
- `apps/api/src/main.ts` — modified
- `apps/web/src/lib/api/query-keys.ts` — modified
- `apps/web/src/hooks/api/use-lesson-queries.ts` — modified
- `apps/web/src/lib/utils.ts` — modified (from Story 3.1; unrelated to 3.2)
- `apps/web/src/components/editor/extensions/alive-text.ts` — created
- `apps/web/src/components/editor/lesson-editor.tsx` — created
- `apps/web/src/components/editor/lesson-editor.test.tsx` — created
- `apps/web/src/components/editor/editor-toolbar.tsx` — created
- `apps/web/src/components/editor/editor-styles.css` — created
- `apps/web/src/components/editor/link-popover.tsx` — created
- `apps/web/src/components/editor/image-url-dialog.tsx` — created
- `apps/web/src/components/editor/outline-panel.tsx` — created
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/page.tsx` — modified
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` — created
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.test.tsx` — created
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/save-indicator.tsx` — created
- `_bmad-output/implementation-artifacts/3-2-wysiwyg-lesson-editor.md` — modified (tasks checked, status updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — modified (in-progress → review)
- `_bmad-output/project-context.md` — modified (Tiptap removed from planned)
- `.cursor/rules/squademy-project.mdc` — modified (Tiptap moved from planned to installed)
