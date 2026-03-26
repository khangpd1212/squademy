# Story 3.4: Export Lesson

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to export a lesson I am viewing or editing to Markdown, DOCX, or PDF format,
so that I can read or share the content offline.

## Acceptance Criteria

1. **Given** I choose "Markdown" export
   **When** export runs
   **Then** `lessons.content_markdown` is downloaded immediately as `.md`
   **And** no server call is required.

2. **Given** I choose "DOCX" export
   **When** export runs client-side with `docx`
   **Then** `.docx` downloads within 3 seconds for standard lesson size
   **And** headings, bold, italic, lists, links are preserved.

3. **Given** I choose "PDF" export
   **When** export runs client-side with `html2canvas` + `jsPDF`
   **Then** `.pdf` downloads within 3 seconds for standard lesson size
   **And** output typography remains correct.

4. **Given** lesson content is very large
   **When** export duration exceeds normal threshold
   **Then** user sees inline progress indicator until export completes.

## Tasks / Subtasks

- [ ] **Task 1: Add unified export menu to lesson surfaces** (AC: 1, 2, 3)
  - [ ] Add export trigger in lesson editor and viewer contexts.
  - [ ] Provide options for Markdown, DOCX, PDF with clear labels.
  - [ ] Ensure menu remains keyboard accessible.

- [ ] **Task 2: Implement Markdown export path** (AC: 1)
  - [ ] Generate blob from `content_markdown` and trigger download client-side.
  - [ ] Add sane filename strategy (slug + timestamp/version).
  - [ ] Handle empty markdown safely (disable export or show message).

- [ ] **Task 3: Implement DOCX export path** (AC: 2)
  - [ ] Map lesson model to `docx` document structure.
  - [ ] Preserve core semantic formatting (headings, lists, emphasis, links).
  - [ ] Keep generation on client and measure standard-content runtime.

- [ ] **Task 4: Implement PDF export path** (AC: 3, 4)
  - [ ] Render printable HTML container for capture.
  - [ ] Convert with `html2canvas` then compose PDF with `jsPDF`.
  - [ ] Ensure typography and spacing remain readable.
  - [ ] Show progress UI when processing large documents.

- [ ] **Task 5: Add quality gates and performance checks** (AC: 2, 3, 4)
  - [ ] Verify <= 3 second target on representative lesson size baseline.
  - [ ] Add tests for format options and invocation paths.
  - [ ] Add regression checks for export on both editor and view pages.

## Dev Notes

### Story Context and Intent

- Export supports portability and distribution of learning content without backend processing overhead.
- Client-side implementation is intentional for cost control and responsiveness.
- Export should be reliable and deterministic for a fixed lesson snapshot.

### Previous Story Intelligence (3.3)

- Reuse markdown fidelity assumptions from import/conversion story for better round-trip outcomes.
- Reuse lesson data loading path from editor/view pages to avoid duplicate fetch logic.

### Technical Requirements

- Keep all export processing client-side unless a future story explicitly introduces server jobs.
- Avoid blocking UI for long operations; show progress and prevent duplicate clicks.
- Do not mutate lesson content during export operation.

### Architecture Compliance

- Keep files under studio route conventions and shared lib utilities under `src/lib`.
- Do not add paid or server-heavy export services (zero-OPEX direction).
- Ensure any added libraries are compatible with current Next.js/React build targets.

### Library / Framework Requirements

- For DOCX path, use a maintained `docx` package version compatible with current TS target.
- For PDF path, use `html2canvas` + `jsPDF` with browser-safe APIs only.
- Keep fallback behavior for browsers with limited canvas memory.

### File Structure Requirements

Expected touched files:

- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/export-menu.tsx` (new)
- `src/lib/export/export-markdown.ts` (new)
- `src/lib/export/export-docx.ts` (new)
- `src/lib/export/export-pdf.ts` (new)
- `src/lib/export/export-utils.ts` (new)
- `src/lib/export/export-docx.test.ts` (new)
- `src/lib/export/export-pdf.test.ts` (new)

### Testing Requirements

- Unit tests for markdown/docx/pdf transformation utilities.
- UI tests for export menu and disabled/progress states.
- Performance sampling during CI/dev script for standard and large content cases.

### Latest Technical Information

- Prefer stable, maintained versions of `docx`, `html2canvas`, and `jsPDF`.
- Keep implementation compatible with current Next.js App Router hydration and React rendering model.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md`]
- [Source: `_bmad-output/planning-artifacts/prd.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/3-3-markdown-file-import.md`]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- Multi-agent context synthesis executed for epic, architecture, and latest-tech extraction.

### Completion Notes List

- Story context prepared for implementation; no product code changes applied in this step.

### File List

- `_bmad-output/implementation-artifacts/3-4-export-lesson.md`

## Change Log

- 2026-03-19: Created Story 3.4 ready-for-dev context with client-side export guardrails.
