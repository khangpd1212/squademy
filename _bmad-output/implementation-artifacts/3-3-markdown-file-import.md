# Story 3.3: Markdown File Import

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Contributor,
I want to import an existing Markdown file into the lesson editor,
so that I can reuse content I've already written without manual copy-paste reformatting.

## Acceptance Criteria

1. **Given** I am in the lesson editor and click "Import Markdown"
   **When** I select a valid `.md` file
   **Then** content is parsed client-side and converted to Tiptap ProseMirror JSON
   **And** editor is populated within 1 second
   **And** preview is shown before confirmation.

2. **Given** I confirm import
   **When** import executes
   **Then** existing editor content is replaced
   **And** autosave triggers immediately to persist imported content.

3. **Given** I select non-`.md` file
   **When** validation runs
   **Then** inline error appears: "Only .md files are supported for import."
   **And** import is blocked.

4. **Given** markdown has headings, emphasis, lists, quotes, links
   **When** parser runs
   **Then** those elements map correctly to Tiptap equivalents.

## Tasks / Subtasks

- [ ] **Task 1: Add import command and UI entry** (AC: 1, 3)
  - [ ] Add "Import Markdown" action in editor toolbar/menu in Story 3.2 components.
  - [ ] Implement file picker restricted to `.md`.
  - [ ] Validate MIME/extension and show exact inline error copy on invalid files.

- [ ] **Task 2: Build markdown conversion pipeline** (AC: 1, 4)
  - [ ] Convert markdown text -> normalized AST -> Tiptap JSON.
  - [ ] Ensure deterministic mapping for headings, bold, italic, lists, blockquotes, links.
  - [ ] Preserve unsupported syntax safely (fallback text nodes, not hard failure).

- [ ] **Task 3: Add preview + confirm flow** (AC: 1, 2)
  - [ ] Render parsed preview before replacing current content.
  - [ ] Require explicit confirm before document replacement.
  - [ ] On confirm, apply one editor transaction that replaces document root.

- [ ] **Task 4: Persist imported content and UX states** (AC: 2)
  - [ ] Trigger immediate autosave after import commit.
  - [ ] Show save state updates (`saving` -> `saved` / `error`).
  - [ ] Provide cancel path to keep current content untouched.

- [ ] **Task 5: Test matrix and performance checks** (AC: 1, 2, 3, 4)
  - [ ] Parser mapping tests for core markdown syntax.
  - [ ] UI tests for invalid file error, preview confirm/cancel, content replacement.
  - [ ] Performance assertion for representative markdown input <= 1 second parse+hydrate target.

## Dev Notes

### Story Context and Intent

- This story focuses on conversion quality and safe replacement UX, not collaborative editing.
- Preserve trust: user should always preview before replacement to avoid accidental data loss.
- Import should compose with existing autosave pipeline from Story 3.2.

### Previous Story Intelligence (3.2)

- Reuse editor extension config and content schema to avoid parser/editor mismatches.
- Reuse save state indicator and mutation flow already defined in Story 3.2.
- Keep Alive Text node behavior stable; do not generate malformed custom nodes from import.

### Technical Requirements

- Perform conversion fully client-side for responsiveness and lower server load.
- Validate file input before parsing and fail fast with explicit user feedback.
- Avoid blocking main thread for large files where practical (defer/microtask/chunking if needed).

### Architecture Compliance

- Keep import logic in studio editor client components; do not add unnecessary server endpoints.
- Maintain App Router + segment `_components` conventions.
- Ensure any persistence call still routes through existing authenticated save endpoints.

### Library / Framework Requirements

- Use markdown parser libraries that are compatible with current Next.js + React stack.
- Keep output schema aligned with Tiptap v3 document shape used by Story 3.2.
- No server-side markdown conversion required for this story.

### File Structure Requirements

Expected touched files:

- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-toolbar.tsx` (update)
- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/markdown-import-dialog.tsx` (new)
- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/markdown-import-dialog.test.tsx` (new)
- `src/lib/editor/markdown-to-tiptap.ts` (new)
- `src/lib/editor/markdown-to-tiptap.test.ts` (new)

### Testing Requirements

- Conversion tests for expected markdown coverage.
- UI tests for invalid extension, preview, confirm replacement, cancel rollback.
- Regression tests ensuring autosave still writes both JSON and markdown correctly after import.

### Latest Technical Information

- Keep dependency selection conservative; choose stable parser packages with active maintenance.
- Ensure imported markdown remains compatible with export expectations in Story 3.4 (round-trip quality).

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md`]
- [Source: `_bmad-output/planning-artifacts/prd.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/3-2-wysiwyg-lesson-editor.md`]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- Multi-agent context synthesis executed for epic, architecture, and latest-tech extraction.

### Completion Notes List

- Story context prepared for implementation; no product code changes applied in this step.

### File List

- `_bmad-output/implementation-artifacts/3-3-markdown-file-import.md`

## Change Log

- 2026-03-19: Created Story 3.3 ready-for-dev context with import conversion guardrails.
