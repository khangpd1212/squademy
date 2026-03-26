# Story 3.2: WYSIWYG Lesson Editor

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Contributor,
I want to write and format lesson content using a rich text editor with a Confluence-style toolbar,
so that I can produce well-structured, high-quality lesson content without knowing Markdown syntax.

## Acceptance Criteria

1. **Given** I open a lesson in the editor at `/studio/lessons/[lessonId]`
   **When** the page loads
   **Then** the Tiptap editor is rendered with toolbar controls for text style, headings, lists, quote, link, image, table, and Alive Text block
   **And** existing lesson JSON content from `lessons.content` is loaded
   **And** an outline sidebar shows H1/H2 headings.

2. **Given** I type or format content
   **When** I pause for 2 seconds
   **Then** content auto-saves to `lessons.content` (JSON) and `lessons.content_markdown` (denormalized markdown)
   **And** a subtle "Saved" indicator appears near title field.

3. **Given** I edit lesson title
   **When** title changes on blur or autosave
   **Then** `lessons.title` is updated
   **And** browser tab title reflects new title.

4. **Given** I insert image from toolbar
   **When** I select JPG/PNG <= 5MB
   **Then** file uploads via `/api/files/upload`
   **And** returned URL is inserted as image node
   **And** image renders inline in editor.

5. **Given** I insert Alive Text block
   **When** I type hidden content
   **Then** node stores as structured alive-text JSON
   **And** content is visible in editor mode
   **And** published view renders animated purple dots.

## Tasks / Subtasks

- [ ] **Task 1: Implement lesson editor route and data loading** (AC: 1, 2, 3)
  - [ ] Create `src/app/(dashboard)/studio/lessons/[lessonId]/page.tsx` with auth + ownership/member checks.
  - [ ] Load lesson record fields: `id`, `title`, `status`, `content`, `content_markdown`, `updated_at`.
  - [ ] Provide editor state and lock/read-only flags based on status.

- [ ] **Task 2: Integrate Tiptap v3 editor shell** (AC: 1, 5)
  - [ ] Add editor component `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor.tsx`.
  - [ ] Configure required extensions for toolbar contract.
  - [ ] Add custom `alive_text` node schema and serializer.
  - [ ] Build heading outline extractor from document tree.

- [ ] **Task 3: Add autosave pipeline and save state UX** (AC: 2, 3)
  - [ ] Implement 2s debounced autosave mutation.
  - [ ] Persist both JSON (`content`) and markdown (`content_markdown`) in one flow.
  - [ ] Persist title via blur and include title in autosave payload.
  - [ ] Add save state indicator (`saving`, `saved`, `error`).

- [ ] **Task 4: Add image upload integration** (AC: 4)
  - [ ] Validate file type/size client-side before upload.
  - [ ] Upload via `/api/files/upload`.
  - [ ] Insert URL into Tiptap image node on success.
  - [ ] Show actionable error states on failed upload.

- [ ] **Task 5: Tests and regression safety** (AC: 1, 2, 3, 4, 5)
  - [ ] Unit tests for extension config and alive-text serialization.
  - [ ] Component tests for autosave debounce and title persistence.
  - [ ] Integration tests for image validation + upload flow.
  - [ ] Verify read-only behavior for non-editable statuses in preparation for Story 3.5.

## Dev Notes

### Story Context and Intent

- This is the core authoring experience for Epic 3 and must be production-safe before import/export/review stories.
- Keep the editor stable and predictable; avoid shipping partial extension behavior.
- Persisting both JSON and markdown is mandatory to support Story 3.4 export.

### Previous Story Intelligence (3.1)

- Reuse Story 3.1 navigation path and lesson-creation assumptions (`/studio/lessons` -> `/studio/lessons/[lessonId]`).
- Continue same status vocabulary (`draft`, `review`, `published`, `rejected`) for future lock rules.

### Technical Requirements

- Use Zod validation for API payload boundaries and explicit error messages.
- Keep editor autosave idempotent and conflict-safe (latest timestamp/version wins strategy).
- Avoid excessive writes while typing; 2-second debounce is required guardrail.

### Architecture Compliance

- Follow environment-specific Supabase client usage (`client` vs `server` vs `admin`).
- Keep implementation under App Router route segments and `_components` conventions.
- Do not leak service-role key or privileged operations into client components.

### Library / Framework Requirements

- If adding Tiptap, use v3-compatible APIs and package set; avoid v2 syntax.
- Keep Next.js App Router patterns and React 19 compatibility.
- For file upload API usage, preserve existing server route conventions and auth checks.

### File Structure Requirements

Expected touched files:

- `src/app/(dashboard)/studio/lessons/[lessonId]/page.tsx` (new)
- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor.tsx` (new)
- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-toolbar.tsx` (new)
- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-outline.tsx` (new)
- `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor.test.tsx` (new)
- `src/app/api/studio/lessons/[lessonId]/route.ts` (new or update)
- `src/app/api/studio/lessons/[lessonId]/route.test.ts` (new)

### Testing Requirements

- Validate editor initialization from stored JSON.
- Validate autosave writes JSON + markdown together.
- Validate image upload constraints and inline insertion behavior.
- Validate alive-text node round-trip (serialize/deserialize/render).

### Latest Technical Information

- Recommended baseline during implementation:
  - Next.js 16 App Router conventions
  - React 19 patched line
  - Supabase SSR + JS patch-level updates
  - Tiptap v3 (if newly added)
- If introducing new deps, lock to stable patches and verify compatibility with current Next/React versions.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-content-studio-lesson-flashcard-creation.md`]
- [Source: `_bmad-output/planning-artifacts/prd.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/3-1-lesson-list-content-studio-navigation.md`]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- Multi-agent context synthesis executed for epic, architecture, and latest-tech extraction.

### Completion Notes List

- Story context prepared for implementation; no product code changes applied in this step.

### File List

- `_bmad-output/implementation-artifacts/3-2-wysiwyg-lesson-editor.md`

## Change Log

- 2026-03-19: Created Story 3.2 ready-for-dev context with editor-specific guardrails.
