# Story 10-1-convert-website-to-claymorphism-light-mode

Status: ready-for-dev

## Story

As a Squademy user,
I want the entire website to render in a consistent light-mode Claymorphism design,
so that I experience a soft, playful, 3D-like "puffy clay" aesthetic across all pages and components without dark mode distractions.

## Acceptance Criteria

1. **Given** the website loads on any page, **when** I inspect the DOM, **then** no `.dark` class is applied to `<html>` and no `dark:` Tailwind utilities produce any visual effect.
2. **Given** the `globals.css` file, **when** I review the `@custom-variant dark` rule, **then** it is removed entirely (no dark variant registered).
3. **Given** the `.dark { ... }` CSS block in `globals.css`, **when** I review the file, **then** the entire block is removed (all shadcn dark overrides AND claymorphism dark overrides).
4. **Given** the `providers.tsx` ThemeProvider, **when** I inspect the config, **then** `defaultTheme="light"` and `enableSystem` is removed (hardcoded to light, no system detection).
5. **Given** any UI component file, **when** I search for `dark:`, **then** zero matches are found across all files in `src/`.
6. **Given** the `:root` light-mode CSS variables, **when** I review the values, **then** they align with Claymorphism design tokens (soft purple primary, warm foreground, white/off-white surfaces) as defined in the typeui.sh spec.
7. **Given** prose/markdown content renders, **when** I view a lesson, **then** text is dark-on-light (no `prose-invert` applied).
8. **Given** the avatar component renders, **when** I inspect the overlay, **then** `mix-blend-darken` is always applied (no `dark:after:mix-blend-lighten` switch).
9. **Given** the Sonner toaster renders, **when** a notification appears, **then** it uses light-mode styling (no `useTheme` hook).
10. **Given** `yarn lint` runs, **when** all files are checked, **then** no lint errors are reported in modified files.
11. **Given** `yarn build` runs, **when** the build completes, **then** no CSS variable reference warnings (no `bg-(--clay-*)` unresolved tokens).

## Tasks / Subtasks

- [ ] Task 1: Remove dark mode infrastructure (AC: 2, 3, 4, 11)
  - [ ] Subtask 1.1: Remove `@custom-variant dark (&:where(.dark, .dark *));` from `globals.css` line 5
  - [ ] Subtask 1.2: Delete entire `.dark { ... }` block (lines 177-253) from `globals.css` — includes all shadcn dark overrides AND claymorphism dark overrides
  - [ ] Subtask 1.3: Update `providers.tsx` — change `defaultTheme="system"` → `defaultTheme="light"`, remove `enableSystem`
  - [ ] Subtask 1.4: Remove `suppressHydrationWarning` from `<html>` tag in `layout.tsx` (no longer needed since theme is fixed)

- [ ] Task 2: Update light-mode CSS tokens to align with Claymorphism spec (AC: 6, 11)
  - [ ] Subtask 2.1: Update `:root` `--foreground` from `oklch(0.145 0 0)` to `oklch(0.2 0.02 280)` — slightly warmer, matches clay body text
  - [ ] Subtask 2.2: Update `:root` `--primary` from `oklch(0.205 0 0)` (near-black) to `oklch(0.75 0.15 280)` — soft purple per Claymorphism spec
  - [ ] Subtask 2.3: Update `:root` `--primary-foreground` from `oklch(0.985 0 0)` to `oklch(0.2 0.05 280)` — dark purple text on primary button
  - [ ] Subtask 2.4: Update `:root` `--secondary` from `oklch(0.97 0 0)` to `oklch(0.85 0.1 180)` — soft teal per Claymorphism spec
  - [ ] Subtask 2.5: Update `:root` `--secondary-foreground` from `oklch(0.205 0 0)` to `oklch(0.2 0.05 180)` — dark teal text
  - [ ] Subtask 2.6: Update `:root` `--muted` from `oklch(0.97 0 0)` to `oklch(0.96 0.02 280)` — slightly warmer muted surface
  - [ ] Subtask 2.7: Update `:root` `--muted-foreground` from `oklch(0.556 0 0)` to `oklch(0.55 0.02 280)` — slightly purple-tinted muted text
  - [ ] Subtask 2.8: Update `:root` `--accent` from `oklch(0.97 0 0)` to `oklch(0.82 0.18 340)` — soft pink per Claymorphism spec
  - [ ] Subtask 2.9: Update `:root` `--accent-foreground` from `oklch(0.205 0 0)` to `oklch(0.2 0.05 340)` — dark pink text
  - [ ] Subtask 2.10: Update `:root` `--ring` from `oklch(0.708 0 0)` to `oklch(0.7 0.15 280 / 50%)` — purple focus ring matching clay focus
  - [ ] Subtask 2.11: Remove `dark:` variants from `.sq-btn-green` component class in `globals.css` — change `@apply bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400` to `@apply bg-emerald-600 text-white hover:bg-emerald-700`

- [ ] Task 3: Strip `dark:` classes from UI component primitives (AC: 5, 10)
  - [ ] Subtask 3.1: `src/components/ui/button.tsx` — remove 4 `dark:` class segments (lines 9, 15, 19, 21)
  - [ ] Subtask 3.2: `src/components/ui/input.tsx` — remove 4 `dark:` class segments (line 12)
  - [ ] Subtask 3.3: `src/components/ui/textarea.tsx` — remove 3 `dark:` class segments (line 10)
  - [ ] Subtask 3.4: `src/components/ui/badge.tsx` — remove 3 `dark:` class segments (lines 8, 16, 20)
  - [ ] Subtask 3.5: `src/components/ui/select.tsx` — remove 4 `dark:` class segments (line 44)
  - [ ] Subtask 3.6: `src/components/ui/tabs.tsx` — remove 5 `dark:` class segments (lines 61-63)
  - [ ] Subtask 3.7: `src/components/ui/avatar.tsx` — remove `dark:after:mix-blend-lighten`, ensure `after:mix-blend-darken` is always applied (line 20)
  - [ ] Subtask 3.8: `src/components/ui/dropdown-menu.tsx` — remove 1 `dark:` class segment (line 91)
  - [ ] Subtask 3.9: `src/components/ui/sonner.tsx` — remove `useTheme` import, remove `useTheme()` call, hardcode `theme="light"` in Toaster props

- [ ] Task 4: Strip `dark:` classes from page/feature components (AC: 5, 7, 10)
  - [ ] Subtask 4.1: `src/app/(dashboard)/dashboard/_components/group-card.tsx` — remove 3 `dark:` role badge colors (lines 12, 14, 16)
  - [ ] Subtask 4.2: `src/app/(dashboard)/dashboard/_components/dashboard-view.tsx` — remove 1 `dark:` notification style (line 69)
  - [ ] Subtask 4.3: `src/app/(dashboard)/group/[groupId]/_components/group-layout-shell.tsx` — remove 1 `dark:` tab text color (line 83)
  - [ ] Subtask 4.4: `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-page-client.tsx` — remove 3 `dark:` skeleton bg colors (lines 16-18)
  - [ ] Subtask 4.5: `src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx` — remove `dark:prose-invert` (line 191) + 7 `dark:` skeleton/text/border classes (lines 229-231, 239, 254, 263, 323)
  - [ ] Subtask 4.6: `src/app/(dashboard)/review/lesson/[lessonId]/page.tsx` — remove `dark:prose-invert` (line 57)
  - [ ] Subtask 4.7: `src/app/(dashboard)/settings/_components/profile-form.tsx` — remove 1 `dark:` success text color (line 201)
  - [ ] Subtask 4.8: `src/app/(dashboard)/group/[groupId]/settings/_components/add-member-dialog.tsx` — remove 1 `dark:` confirmation text color (line 113)
  - [ ] Subtask 4.9: `src/app/(dashboard)/group/[groupId]/flashcards/[deckId]/page.tsx` — remove 1 `dark:` offline banner style (line 310)

- [ ] Task 5: Strip `dark:` classes from editor components (AC: 5, 10)
  - [ ] Subtask 5.1: `src/components/editor/editor-toolbar.tsx` — remove 2 `dark:` button styles (lines 54, 449)
  - [ ] Subtask 5.2: `src/components/editor/outline-panel.tsx` — remove 2 `dark:` text colors (lines 81, 82)

- [ ] Task 6: Strip `dark:` classes from library files (AC: 5, 10)
  - [ ] Subtask 6.1: `src/lib/status-styles.ts` — remove all 5 `dark:` status color variants (lines 7, 12, 17, 22, 27)

- [ ] Task 7: Verify and validate (AC: 1, 7, 8, 9, 10, 11)
  - [ ] Subtask 7.1: Run `yarn lint` — confirm no lint errors
  - [ ] Subtask 7.2: Run `yarn build` — confirm build succeeds with no CSS variable warnings
  - [ ] Subtask 7.3: Run `yarn test` — confirm all existing tests pass
  - [ ] Subtask 7.4: Manual verification — run `yarn dev`, open browser, verify:
    - All pages render in light mode (no dark backgrounds)
    - Prose content is readable (dark text on white)
    - Avatar overlays use darken blend mode
    - Toast notifications render in light mode
    - Clay shadows and surfaces are visible and correct
    - No `dark:` classes remain in any file (verify with `rg "dark:" apps/web/src/`)

## Dev Notes

### Project Context
This story is a **design enforcement** story — it removes dark mode entirely and locks the entire application to light mode with Claymorphism design tokens. This is NOT a component migration story (that was already done in `spec-clay-migration.md`). This is about **removing dark mode infrastructure** and **aligning light-mode tokens** with the typeui.sh Claymorphism spec.

### Why Light Mode Only
- The Claymorphism design aesthetic (soft 3D "puffy clay" shapes) works best in light mode where shadows and depth are visible
- Dark mode shadows are harder to perceive and reduce the clay 3D effect
- Simplifies the codebase by removing ~30% of CSS classes related to dark mode
- Consistent brand experience — no theme-switching fragmentation

### Critical Files Being Modified (24 files total)

**CSS/Theme (2 files):**
- `apps/web/src/app/globals.css` — main stylesheet (remove dark variant, update tokens)
- `apps/web/src/components/providers.tsx` — theme provider config

**HTML/Layout (1 file):**
- `apps/web/src/app/layout.tsx` — root layout (remove suppressHydrationWarning)

**UI Components (9 files):**
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/textarea.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/components/ui/tabs.tsx`
- `apps/web/src/components/ui/avatar.tsx`
- `apps/web/src/components/ui/dropdown-menu.tsx`
- `apps/web/src/components/ui/sonner.tsx`

**Editor Components (2 files):**
- `apps/web/src/components/editor/editor-toolbar.tsx`
- `apps/web/src/components/editor/outline-panel.tsx`

**Page Components (9 files):**
- `apps/web/src/app/(dashboard)/dashboard/_components/group-card.tsx`
- `apps/web/src/app/(dashboard)/dashboard/_components/dashboard-view.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/_components/group-layout-shell.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-page-client.tsx`
- `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/lesson-editor-view.tsx`
- `apps/web/src/app/(dashboard)/review/lesson/[lessonId]/page.tsx`
- `apps/web/src/app/(dashboard)/settings/_components/profile-form.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/settings/_components/add-member-dialog.tsx`
- `apps/web/src/app/(dashboard)/group/[groupId]/flashcards/[deckId]/page.tsx`

**Library (1 file):**
- `apps/web/src/lib/status-styles.ts`

### Color Token Mapping

The Claymorphism design spec (typeui.sh) defines these primary colors:

| Token | Current Light Value | New Light Value | Reason |
|-------|-------------------|----------------|--------|
| `--foreground` | `oklch(0.145 0 0)` neutral dark | `oklch(0.2 0.02 280)` warm purple-tinted | Matches clay body text |
| `--primary` | `oklch(0.205 0 0)` near-black | `oklch(0.75 0.15 280)` soft purple | Claymorphism primary brand |
| `--primary-foreground` | `oklch(0.985 0 0)` white | `oklch(0.2 0.05 280)` dark purple | Text on primary button |
| `--secondary` | `oklch(0.97 0 0)` light gray | `oklch(0.85 0.1 180)` soft teal | Claymorphism secondary |
| `--secondary-foreground` | `oklch(0.205 0 0)` near-black | `oklch(0.2 0.05 180)` dark teal | Text on secondary button |
| `--muted` | `oklch(0.97 0 0)` light gray | `oklch(0.96 0.02 280)` warm gray | Warmer muted surface |
| `--muted-foreground` | `oklch(0.556 0 0)` gray | `oklch(0.55 0.02 280)` purple-tinted | Consistent with body |
| `--accent` | `oklch(0.97 0 0)` light gray | `oklch(0.82 0.18 340)` soft pink | Claymorphism accent |
| `--accent-foreground` | `oklch(0.205 0 0)` near-black | `oklch(0.2 0.05 340)` dark pink | Text on accent button |
| `--ring` | `oklch(0.708 0 0)` gray | `oklch(0.7 0.15 280 / 50%)` purple | Matches clay focus ring |

### Existing Clay Tokens (DO NOT MODIFY)

These tokens in `globals.css` are already defined and working correctly. Do NOT change them:
- `--clay-primary`, `--clay-primary-hover`, `--clay-primary-active` (soft purple)
- `--clay-secondary`, `--clay-secondary-hover`, `--clay-secondary-active` (soft teal)
- `--clay-accent`, `--clay-accent-hover`, `--clay-accent-active` (soft pink)
- `--clay-surface-1`, `--clay-surface-2`, `--clay-surface-3`, `--clay-surface-elevated`
- `--clay-shadow-dark`, `--clay-shadow-light`
- `--shadow-clay-outer`, `--shadow-clay-inner`, `--shadow-clay-hover`, `--shadow-clay-pressed`, `--shadow-clay-focus`
- `--clay-border-subtle`, `--clay-border-base`, `--clay-border-focus`
- `--clay-success`, `--clay-warning`, `--clay-error`, `--clay-info`
- All `--radius-clay*` values

### Previous Work Context

The `spec-clay-migration.md` file documents the component migration to use clay tokens (all 5 phases completed). That story applied clay classes to existing components. This story is orthogonal — it removes dark mode and aligns the base shadcn tokens (`--primary`, `--secondary`, etc.) with the Claymorphism palette. The two changes are complementary but independent.

### Testing Standards
- Unit tests: Jest + jsdom, `next/jest` config in `jest.config.cjs`
- Test files colocated with source: `**/?(*.)+(spec|test).ts?(x)`
- Use `@testing-library/user-event` for interactions (NOT `fireEvent`)
- Module alias `@/*` maps to `<rootDir>/src/$1`
- `staleTime: 60_000` configured for TanStack Query
- No real API calls in unit tests — mock `global.fetch`

### Architecture Constraints (from AGENTS.md)
- Next.js 16 (App Router), React 19, TypeScript strict mode
- Tailwind CSS v4 (CSS-first config in `globals.css`)
- shadcn/ui base-nova with `@base-ui/react` primitives
- Zod v4 (NOT v3)
- `cn()` from `@/lib/utils` for conditional class merging
- `@/*` path alias (maps to `./src/*`) — never relative `../../` paths
- Mobile-first responsive design

### Project Structure Notes

All modified files follow the existing project structure. No new files are created, no new directories are added. This is a pure refactoring story — remove `dark:` classes and update CSS variable values.

### References

- [Source: spec-clay-migration.md](../../_bmad-output/implementation-artifacts/spec-clay-migration.md) — clay token migration spec (completed)
- [Source: AGENTS.md](../../AGENTS.md) — project context, technology stack, conventions
- [Source: globals.css](../../apps/web/src/app/globals.css) — current CSS variables and clay tokens
- [Source: architecture.md](../../_bmad-output/planning-artifacts/architecture.md) — frontend stack reference
- [Source: typeui.sh Claymorphism Spec](provided by user) — design system tokens and colors

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

### Change Log
