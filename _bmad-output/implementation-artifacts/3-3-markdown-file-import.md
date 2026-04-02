# Story 3.3: Markdown File Import

Status: ready-for-dev

## Story

As a Contributor,
I want to import an existing Markdown file into the lesson editor,
so that I can reuse content I've already written without manual copy-paste reformatting.

## Acceptance Criteria

1. **Given** I am in the lesson editor and click "Import Markdown",  
   **When** I select a valid `.md` file (≤ 250KB),  
   **Then** the Markdown content is parsed client-side and converted to Tiptap ProseMirror JSON,  
   **And** the editor is populated within **≤ 1 second on a standard dev machine** *(Chrome, average CPU, no throttling)*, 
   **And** a preview of the parsed content is shown before confirming the import.
👉 **Testability:**
- Unit test: parse function ≤ 50ms for a 50KB file  
- Integration: full flow ≤ 1s for a 250KB file (with mocked timing)

2. **Given** I confirm the import,  
   **When** the action executes,  
   **Then** the editor's existing content is replaced with the imported content,  
   **And** auto-save triggers immediately, persisting the imported content via `PATCH /lessons/:lessonId`.

3. **Given** I select a file that is not a `.md` file,  
   **When** the file picker validates the selection,  
   **Then** an inline error appears: "Only .md files are supported for import.",  
   **And** the import is not executed.

4. **Given** the Markdown file contains headings, bold, italic, lists, blockquotes, and links,  
   **When** the file is parsed,  
   **Then** all standard Markdown elements are correctly converted to their Tiptap equivalents.

## Tasks / Subtasks

- [ ] **Task 1: Add markdown import utility (client-side parse only)** (AC: 1, 4)
  - [ ] Create `apps/web/src/components/editor/markdown-import.ts` with:
    - [ ] `parseMarkdownToTiptap(markdown: string): Record<string, unknown>`
    - [ ] Minimal, deterministic parser for AC scope: headings (`#`..`###`), bold, italic, unordered/ordered lists, blockquote, links, paragraphs
    - [ ] Graceful fallback: unknown syntax becomes paragraph text (no throw)
  - [ ] Keep utility dependency-free unless parser complexity is too high
  - [ ] If dependency needed, prefer a free OSS package (no paid APIs, no cloud conversion)

- [ ] **Task 2: Add import UI flow to editor toolbar** (AC: 1, 3)
  - [ ] Update `apps/web/src/components/editor/editor-toolbar.tsx`:
    - [ ] Add "Import Markdown" trigger button in insert actions group
    - [ ] Open file picker restricted to `.md,text/markdown`
    - [ ] Validate extension and MIME type defensively
    - [ ] Show inline validation error on invalid selection (exact AC message)
  - [ ] Keep interaction in current Confluence-style toolbar pattern

- [ ] **Task 3: Add preview-before-confirm dialog/panel** (AC: 1)
  - [ ] Create `apps/web/src/components/editor/markdown-import-dialog.tsx`:
    - [ ] Show parsed preview before applying
    - [ ] Buttons: `Cancel`, `Replace content`
    - [ ] Display parser errors or empty-file state inline
  - [ ] Preview can render simplified text/HTML snapshot; it must represent parsed content, not raw markdown only

- [ ] **Task 4: Wire import action into lesson editor instance** (AC: 1, 2, 4)
  - [ ] Update `apps/web/src/components/editor/lesson-editor.tsx`:
    - [ ] Expose/import callback so parent can receive parsed JSON draft before apply
    - [ ] On confirm, call `editor.commands.setContent(parsedJson, false)`
  - [ ] Ensure imported content respects existing editor extensions (StarterKit + Link + custom nodes)

- [ ] **Task 5: Trigger immediate save after confirmed import** (AC: 2)
  - [ ] Update `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx`:
    - [ ] Add explicit `handleMarkdownImportConfirm(parsedJson, markdownText?)`
    - [ ] Replace editor content
    - [ ] Cancel pending debounce timer
    - [ ] Trigger immediate `PATCH /lessons/:lessonId` save (reuse existing mutation flow)
  - [ ] Keep title unchanged unless parser extracts a title intentionally (not required in AC)

- [ ] **Task 6: Add tests for parser + UI behavior** (AC: 1, 2, 3, 4)
  - [ ] Create `apps/web/src/components/editor/markdown-import.test.ts`
    - [ ] Parses headings/bold/italic/lists/blockquote/links to expected JSON shape
    - [ ] Handles unsupported markdown without throwing
  - [ ] Update `apps/web/src/components/editor/lesson-editor.test.tsx`
    - [ ] Import trigger appears in toolbar
    - [ ] Invalid file shows inline error
  - [ ] Update `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.test.tsx`
    - [ ] Confirm import replaces content and triggers immediate save mutation
    - [ ] Debounce timer is cleared before immediate save

- [ ] **Task 7: Verify quality gates**
  - [ ] Run `yarn test`
  - [ ] Run `yarn lint`
  - [ ] Run `yarn build`

## Dev Notes

### Story Intelligence from 3.2

- Story 3.2 already established a working Tiptap editor stack, 2-second auto-save debounce, and lesson PATCH mutation.
- Import must reuse this pipeline, not create a parallel save path.
- Existing save strategy (`setQueryData` for detail, invalidate list on unmount) should stay intact.

### Critical Guardrails (Do Not Break)

- Keep current editor route and file structure:
  - `apps/web/src/components/editor/*`
  - `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/*`
- Do not add backend endpoint for markdown import; AC explicitly requires client-side parse.
- Do not rely on paid/hosted Tiptap conversion APIs (`@tiptap-pro/extension-import`, cloud conversion endpoints).
- Maintain read-only behavior for `review/published` lessons (import should be unavailable or disabled there).
- Preserve existing keyboard save shortcut (`Ctrl/Cmd+S`) and debounce logic.

### Current Architecture Constraints Relevant to This Story

- Frontend stack: Next.js 16 + React 19 + Tiptap community extensions.
- Content source of truth remains Tiptap JSON in `lessons.content`.
- `contentMarkdown` is already denormalized and currently plain text from editor for MVP; keep consistency with existing save behavior unless explicit conversion enhancement is required.
- Studio/Review zone uses neutral visual language; import UI should match current toolbar and dialog style.

### Suggested Implementation Pattern (Token-Efficient)

1. Parse markdown text into a constrained intermediate structure (block + inline marks).
2. Convert structure to Tiptap JSON (`doc -> content[]`).
3. Preview generated structure (not raw source only).
4. On confirm: `setContent(...)` then immediate mutation save.
5. Reuse existing error surface patterns (inline message near toolbar/dialog).

### Non-Goals / Out of Scope

- Full CommonMark compliance.
- Tables/code fences/math conversion.
- Image upload from markdown file references.
- Server-side conversion service.
- New lesson title derivation from first heading.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md` — Story 3.3 acceptance criteria]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR15 markdown import preview in 1 second]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Tiptap editor structure, route placement, bundle constraints]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Zone 3B Creator Studio, toolbar consistency]
- [Source: `_bmad-output/implementation-artifacts/3-2-wysiwyg-lesson-editor.md` — existing editor, autosave, and testing patterns]
- [Source: `apps/web/src/components/editor/lesson-editor.tsx` — current editor wrapper]
- [Source: `apps/web/src/components/editor/editor-toolbar.tsx` — current toolbar actions]
- [Source: `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` — current save flow]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex-low

### Debug Log References

- Web research indicates Tiptap's turnkey markdown import path is tied to paid conversion tooling; this story must remain client-side OSS-only for zero-OPEX alignment.

### Completion Notes List

- Story context generated from Epic 3 + Story 3.1/3.2 implementation intelligence.
- Guardrails added to prevent wrong-library and wrong-architecture choices.
- Tasks optimized for incremental, testable implementation in current codebase.

### File List

- `_bmad-output/implementation-artifacts/3-3-markdown-file-import.md` — created
