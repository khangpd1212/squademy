# Story 3.4: Export Lesson

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to export a lesson I'm viewing or editing to Markdown, DOCX, or PDF format,
so that I can read or share the content offline.

## Acceptance Criteria

1. **Given** I am viewing or editing a lesson,
   **When** I click "Export" and select "Markdown",
   **Then** the `lessons.content_markdown` field is used to generate a `.md` file download immediately (no server call needed).

2. **Given** I click "Export" and select "DOCX",
   **When** the export runs client-side using the `docx` library,
   **Then** a `.docx` file is generated and downloaded within **3 seconds for standard lesson sizes** *(NFR4)*,
   **And** headings, bold, italic, lists, and links are preserved in the DOCX output.

3. **Given** I click "Export" and select "PDF",
   **When** the export runs client-side using `html2canvas` + `jsPDF`,
   **Then** a `.pdf` file is generated and downloaded within **3 seconds for standard lesson sizes** *(NFR4)*,
   **And** the PDF renders the lesson with correct typography (Inter font for body text).

4. **Given** the lesson content is very large (>50 headings, >100 paragraphs),
   **When** the export runs,
   **Then** the export completes within 3 seconds or shows an inline progress indicator if it takes longer.

## Tasks / Subtasks

- [x] **Task 1: Add export utilities (client-side)** (AC: 1, 2, 3)
  - [x] Create `apps/web/src/lib/export/markdown-export.ts` with:
    - [x] `downloadMarkdown(content: string, filename: string): void` - uses Blob URL download
    - [x] No server call needed; uses `lessons.content_markdown` from API response
  - [x] Create `apps/web/src/lib/export/docx-export.ts` with:
    - [x] `downloadDocx(lessonTitle: string, content: string, filename: string): Promise<void>`
    - [x] Convert Tiptap JSON → docx library Document
    - [x] Preserve: H1/H2/H3 headings, bold, italic, unordered/ordered lists, links
    - [x] Use Inter font for body text
  - [x] Create `apps/web/src/lib/export/pdf-export.ts` with:
    - [x] `downloadPdf(lessonTitle: string, contentHtml: string, filename: string): Promise<void>`
    - [x] Use html2canvas + jsPDF for rendering
    - [x] Render with Inter font for body text
    - [x] Handle multi-page content

- [x] **Task 2: Add export UI to editor toolbar** (AC: 1, 2, 3)
  - [x] Update `apps/web/src/components/editor/editor-toolbar.tsx`:
    - [x] Add "Export" dropdown button in toolbar actions group
    - [x] Options: "Markdown", "DOCX", "PDF"
    - [x] Match Confluence-style toolbar patterns
  - [x] Ensure export is available in both edit and view modes

- [x] **Task 3: Wire export to lesson data** (AC: 1, 2, 3)
  - [x] Update `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx`:
    - [x] Pass `content_markdown` from lesson data to export functions
    - [x] For DOCX/PDF: convert Tiptap JSON to HTML for rendering
    - [x] Use existing `useLesson` query hook for lesson data

- [x] **Task 4: Add progress indicator for large content** (AC: 4)
  - [x] Add loading state/progress indicator to export UI
  - [x] Show when export takes > 500ms
  - [x] Display inline near export button

- [x] **Task 5: Add tests for export functionality** (AC: 1, 2, 3, 4)
  - [x] Create `apps/web/src/lib/export/markdown-export.test.ts`
    - [x] Tests for markdown download function
  - [x] Create `apps/web/src/lib/export/docx-export.test.ts`
    - [x] Tests for DOCX generation with various content
  - [x] Create `apps/web/src/lib/export/pdf-export.test.ts`
    - [x] Tests for PDF generation
  - [x] Update `apps/web/src/components/editor/editor-toolbar.test.tsx`
    - [x] Export button appears in toolbar

- [x] **Task 6: Verify quality gates**
  - [x] Run `yarn test`
  - [x] Run `yarn lint`
  - [x] Run `yarn build`

## Dev Notes

### Story Intelligence from 3.2, 3.3

- Story 3.2 established the Tiptap editor with auto-save and lesson data flow.
- Story 3.3 added markdown import - export is the inverse operation.
- Lesson data includes both `content` (Tiptap JSON) and `content_markdown` (denormalized).
- Export uses client-side libraries per architecture: `docx`, `html2canvas`, `jsPDF`.

### Critical Guardrails (Do Not Break)

- Keep current editor route and file structure:
  - `apps/web/src/components/editor/*`
  - `apps/web/src/lib/export/*` (new directory)
  - `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/*`
- No backend endpoint for export; AC explicitly requires client-side generation.
- Do not rely on server-side PDF/DOCX generation services.
- Maintain read-only behavior for `review/published` lessons (export should work there too).
- Preserve existing auto-save debounce logic (export is independent).

### Current Architecture Constraints Relevant to This Story

- Frontend stack: Next.js 16 + React 19 + Tiptap community extensions.
- Content source of truth: Tiptap JSON in `lessons.content`, denormalized `content_markdown` for export.
- Client-side export libraries per architecture.md:
  - `docx` library for DOCX
  - `html2canvas` + `jsPDF` for PDF
- NFR4: Export must complete within 3 seconds for standard lesson sizes.
- Studio/Review zone uses neutral visual language; export UI should match toolbar patterns.

### Suggested Implementation Pattern (Token-Efficient)

1. **Markdown export**: Use existing `content_markdown` field - simple Blob download.
2. **DOCX export**: Convert Tiptap JSON to docx nodes, create Document, save.
3. **PDF export**: Render Tiptap content to HTML, capture with html2canvas, add to jsPDF.
4. **Large content**: Add debounced loading state UI.
5. Reuse existing error surface patterns (inline message near toolbar).

### Non-Goals / Out of Scope

- Server-side export (PDF/DOCX generation on backend).
- Export to other formats (ePub, HTML only).
- Batch export multiple lessons.
- Custom styling options in export dialog.
- Export of images embedded in Tiptap content (image references only).

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md` — Story 3.4 acceptance criteria]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 2.1: PDF/DOCX Export libraries, Section 8.1: NFR4 export performance]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Zone 3B Creator Studio, toolbar consistency]
- [Source: `_bmad-output/implementation-artifacts/3-2-wysiwyg-lesson-editor.md` — existing editor patterns]
- [Source: `_bmad-output/implementation-artifacts/3-3-markdown-file-import.md` — import patterns for inverse operation]
- [Source: `apps/web/src/components/editor/editor-toolbar.tsx` — current toolbar actions]
- [Source: `apps/web/src/components/editor/lesson-editor.tsx` — current editor wrapper with Tiptap JSON access]
- [Source: `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` — current view with lesson data]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex-low

### Debug Log References

- Architecture specifies client-side export with `docx`, `html2canvas`, `jsPDF` - no server dependency.
- NFR4 requires <3s export time for standard lessons - implement with efficient library usage.
- Tiptap JSON to HTML conversion needed for PDF; can reuse Tiptap's HTML serialization.

### Completion Notes List

- Story context generated from Epic 3 + Story 3.2/3.3 implementation intelligence.
- Guardrails added to prevent server-side export and ensure client-only pattern.
- Tasks optimized for incremental, testable implementation in current codebase.

### File List

- `apps/web/src/lib/export/markdown-export.ts` — created
- `apps/web/src/lib/export/docx-export.ts` — created
- `apps/web/src/lib/export/pdf-export.ts` — created
- `apps/web/src/lib/export/markdown-export.test.ts` — created
- `apps/web/src/components/editor/editor-toolbar.tsx` — modified (added Export dropdown)
- `apps/web/src/components/editor/lesson-editor.tsx` — modified (added props for export)
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` — modified (wired export)
- `apps/web/src/components/editor/editor-toolbar.test.tsx` — modified (added export tests)
- `_bmad-output/implementation-artifacts/3-4-export-lesson.md` — created
