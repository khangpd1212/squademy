# Epic 3: Content Studio — Lesson & Flashcard Creation

Contributors can create lessons with a WYSIWYG Markdown editor, import Markdown files, export lessons to Markdown/DOCX/PDF, submit drafts to the editorial queue, and track submission status.

> **API Convention:** All client API calls use `browser-client.ts` calling NestJS directly
> via `NEXT_PUBLIC_API_URL`. Paths below are NestJS endpoints (e.g. `POST /groups` means
> `${NEXT_PUBLIC_API_URL}/groups`). Cron routes (`/api/cron/`*) are Vercel cron handlers
> on Next.js.

### Story 3.1: Lesson List & Content Studio Navigation

As a Contributor,
I want to see all my lessons and their statuses, and create new ones from the Content Studio,
So that I can manage my contributions to the group curriculum in one place.

**Acceptance Criteria:**

**Given** I navigate to `/studio/lessons`
**When** the page loads
**Then** `GET /lessons?author=me` (JwtAuthGuard) returns all lessons where `author_id = my user_id` with title, status badge (Draft / In Review / Published / Rejected), and last updated date
**And** a "New Lesson" button is prominently displayed

**Given** I click "New Lesson"
**When** the action executes
**Then** `POST /lessons` creates a new `lessons` row via Prisma with `status = 'draft'` and a placeholder title
**And** I am redirected to the lesson editor at `/studio/lessons/[lessonId]`

**Given** I have no lessons yet
**When** the page loads
**Then** an empty state is shown: "You haven't created any lessons yet. Start contributing!" with a "New Lesson" CTA

**Given** I am a Member (not Contributor or Editor)
**When** I navigate to `/studio/lessons`
**Then** the page is accessible — all members can contribute lessons per the dual-role model

---

### Story 3.2: WYSIWYG Lesson Editor

As a Contributor,
I want to write and format lesson content using a rich text editor with a Confluence-style toolbar,
So that I can produce well-structured, high-quality lesson content without knowing Markdown syntax.

**Acceptance Criteria:**

**Given** I open a lesson in the editor at `/studio/lessons/[lessonId]`
**When** the page loads
**Then** the Tiptap editor is rendered with the Confluence-style toolbar: Bold, Italic, Underline, Strikethrough | H1, H2, H3 | Bullet List, Ordered List, Blockquote | Link, Image, Table | Alive Text block
**And** existing lesson content (stored as Tiptap ProseMirror JSON in `lessons.content`) is loaded into the editor via `GET /lessons/:lessonId` (ResourceOwnerGuard)
**And** a sidebar outline panel shows H1/H2 headings for navigation

**Given** I type or format content in the editor
**When** I pause typing for 2 seconds
**Then** the lesson content is auto-saved via `PATCH /lessons/:lessonId` updating `lessons.content` (Tiptap JSON) and `lessons.content_markdown` (denormalized Markdown) via Prisma
**And** a subtle "Saved" indicator appears near the title field

**Given** I edit the lesson title (bare input at top)
**When** I update the title
**Then** `lessons.title` is updated on blur or auto-save via NestJS API

**Given** I insert an image via the toolbar
**When** I select an image file (JPG/PNG, max 5MB)
**Then** the image is uploaded to Cloudflare R2 via a planned Next.js Route Handler `POST /api/files/upload`
**And** the R2 URL is inserted into the Tiptap content as an image node
**And** the image renders inline in the editor

**Given** I insert an Alive Text block via the toolbar
**When** I type hidden content inside the block
**Then** the block is stored as `{ type: 'alive_text', attrs: { hidden: true }, content: [...] }` in the Tiptap JSON
**And** in the editor view the content is visible (editing mode)
**And** in the published lesson view the content renders as animated purple pulsing dots

---

### Story 3.3: Markdown File Import ✅ IMPLEMENTED

As a Contributor,
I want to import an existing Markdown file into the lesson editor,
So that I can reuse content I've already written without manual copy-paste reformatting.

**Acceptance Criteria:**

**Given** I am in the lesson editor and click "Import Markdown"
**When** I select a valid `.md` file
**Then** the Markdown content is parsed client-side and converted to Tiptap HTML
**And** the editor is populated with the parsed content within 1 second of file selection (NFR: FR15)
**And** the content is imported directly (no preview dialog required)

**Given** I confirm the import
**When** the action executes
**Then** the editor's existing content is replaced with the imported content
**And** auto-save triggers immediately, persisting the imported content via `PATCH /lessons/:lessonId`

**Given** I select a file that is not a `.md` file
**When** the file picker validates the selection
**Then** an inline error appears: "Only .md files are supported for import."
**And** the import is not executed

**Given** the Markdown file contains headings, bold, italic, lists, blockquotes, and links
**When** the file is parsed
**Then** all standard Markdown elements are correctly converted to their Tiptap equivalents

**Given** I import a Markdown file
**When** the content is displayed
**Then** in Edit mode: markdown syntax (e.g., `_text_`, `**bold**`) is shown as literal text
**And** in View mode: the content is styled appropriately (italic text, card styles, etc.)

**Implementation Notes:**
- Uses `parseMarkdownToTiptap(text, "literal")` for direct import
- Edit mode: `tiptapDocToHtml()` preserves markdown syntax as text
- View mode: `tiptapDocToViewHtml()` converts to styled HTML
- Custom Tiptap extensions for `blockquoteCard` and `blockquoteTitle` nodes
- View mode styles via CSS: amber card for italic quotes, uppercase for titles

---

### Story 3.4: Export Lesson

As a user,
I want to export a lesson I'm viewing or editing to Markdown, DOCX, or PDF format,
So that I can read or share the content offline.

**Acceptance Criteria:**

**Given** I am viewing or editing a lesson
**When** I click "Export" and select "Markdown"
**Then** the `lessons.content_markdown` field is used to generate a `.md` file download immediately (no server call needed)

**Given** I click "Export" and select "DOCX"
**When** the export runs client-side using the `docx` library
**Then** a `.docx` file is generated and downloaded within 3 seconds for standard lesson sizes (NFR4)
**And** headings, bold, italic, lists, and links are preserved in the DOCX output

**Given** I click "Export" and select "PDF"
**When** the export runs client-side using `html2canvas` + `jsPDF`
**Then** a `.pdf` file is generated and downloaded within 3 seconds for standard lesson sizes (NFR4)
**And** the PDF renders the lesson with correct typography (Inter font for body text)

**Given** the lesson content is very large (>50 headings, >100 paragraphs)
**When** the export runs
**Then** the export completes within 3 seconds or shows an inline progress indicator if it takes longer

---

### Story 3.5: Submit for Review & Track Status

As a Contributor,
I want to submit my draft lesson for editorial review and track its status,
So that I know when my lesson is live or if I need to revise it based on editor feedback.

**Acceptance Criteria:**

**Given** I have a lesson with `status = 'draft'` in the editor
**When** I click "Submit for Review"
**Then** `PATCH /lessons/:lessonId/submit` (ResourceOwnerGuard) updates `lessons.status` to `'review'` via Prisma
**And** the "Submit for Review" button is replaced with a "In Review" status badge
**And** the editor toolbar is disabled (read-only) while the lesson is in review

**Given** my lesson status is `'review'`
**When** I view the lesson in `/studio/lessons`
**Then** the lesson row shows an "In Review" orange badge
**And** I cannot edit the lesson content while it is in review

**Given** an Editor approves my lesson
**When** the status updates to `'published'`
**Then** the lesson row in my studio shows a "Published" green badge
**And** I receive a notification (Epic 7) that my lesson is live

**Given** an Editor rejects my lesson with feedback
**When** the status updates to `'rejected'`
**Then** the lesson row shows a "Rejected" red badge
**And** clicking the lesson opens the editor again with the editor's feedback visible (as comments, implemented in Epic 4)
**And** the editor toolbar is re-enabled so I can revise and resubmit

**Given** I have revised a rejected lesson and click "Resubmit for Review"
**When** the action executes
**Then** `lessons.status` is updated back to `'review'` via NestJS API
**And** the editor is locked again pending the next editorial review

---
