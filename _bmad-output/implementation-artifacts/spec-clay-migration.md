---
title: 'Clay Design System Migration'
type: 'feature'
created: '2026-05-05'
status: 'draft'
context: ['/Users/np/Desktop/squademy/AGENTS.md']
---

<!-- Target: ~1500 tokens. Above 1600 = high risk of context rot.
      Never over-specify "how" — use boundaries + examples instead.
      Cohesive cross-layer stories stay in ONE file.
      IMPORTANT: Remove all HTML comments when filling this template. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Squademy's UI components use default shadcn/ui styling without clay design system consistency. The project has clay tokens defined in `globals.css` (`--radius-clay`, `--shadow-clay-*`, `--clay-surface-*`, `--clay-primary`) but components aren't using them consistently.

**Approach:** Migrate 43 existing components across 5 phases to use clay design tokens and utility classes. Each phase builds on the previous — foundation first, then overlays, complex components, layout, and finally feature components. Use `@layer components` clay utility classes with `cn()` for conditional classes.

## Boundaries & Constraints

**Always:** INVARIANT_RULES
- Use `bg-(--clay-surface-1)` etc. for clay surfaces (NOT `bg-background`)
- Use `shadow-clay-outer shadow-clay-inner` for clay shadow effects
- Use `rounded-(--radius-clay)` etc. for clay radius values
- Use `hover:shadow-clay-hover` for interactive clay hover states
- Use `active:shadow-clay-pressed` for pressed states
- Use `cn()` from `@/lib/utils` for all conditional class merging
- Preserve existing `cva` variant structures — only change class strings
- Components in `ui-custom/` inherit patterns from `ui/` base components

**Ask First:** DECISIONS_REQUIRING_HUMAN_APPROVAL
- Changing component API or props interface
- Removing existing functionality
- Changing CSS variable values in `globals.css`

**Never:** NON_GOALS_AND_FORBIDDEN_APPROACHES
- Do NOT modify `globals.css` clay token definitions
- Do NOT add new animation/transition effects (already in CSS vars)
- Do NOT create new components — only restyle existing ones
- Do NOT modify `sq-*` deprecated classes (backward compat only)
- Do NOT change component behavior — only visual styling

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Light mode render | Component mounted, theme = light | Clay surface colors, shadows visible per design | N/A |
| Dark mode render | Component mounted, theme = dark | Clay surfaces adapt via `oklch` dark mode values | N/A |
| Hover state | Mouse hover on interactive element | `shadow-clay-hover` applied, smooth transition | N/A |
| Active/pressed state | Mouse down on button | `shadow-clay-pressed` applied | N/A |
| Focus visible | Keyboard focus | `shadow-clay-focus` ring visible | N/A |

</frozen-after-approval>

## Code Map

<!-- Agent-populated during planning. Annotated paths prevent blind codebase searching. -->

Foundation (Phase 1):
- `apps/web/src/components/ui/button.tsx` -- Core button with clay shadows + radius
- `apps/web/src/components/ui/input.tsx` -- Input fields with clay surface styling
- `apps/web/src/components/ui/card.tsx` -- Card surfaces with clay outer/inner shadows
- `apps/web/src/components/ui/badge.tsx` -- Badge/pill with clay-full radius
- `apps/web/src/components/ui/separator.tsx` -- Divider (minimal clay changes)

Overlay/Form (Phase 2):
- `apps/web/src/components/ui/textarea.tsx` -- Multi-line input with clay surface
- `apps/web/src/components/ui/dialog.tsx` -- Modal overlay with clay-lg radius + shadows
- `apps/web/src/components/ui/sheet.tsx` -- Side panel with clay-lg radius
- `apps/web/src/components/ui/select.tsx` -- Dropdown with clay surface popover
- `apps/web/src/components/ui/dropdown-menu.tsx` -- Menu items with clay surface
- `apps/web/src/components/ui/tooltip.tsx` -- Small popup with clay-subtle shadow

Complex (Phase 3):
- `apps/web/src/components/ui/tabs.tsx` -- Tab list with clay surface active state
- `apps/web/src/components/ui/table.tsx` -- Data table with clay-header surfaces
- `apps/web/src/components/ui/sonner.tsx` -- Toast notification with clay-card styling
- `apps/web/src/components/ui/skeleton.tsx` -- Loading placeholder with clay-surface-2
- `apps/web/src/components/ui/status-badge.tsx` -- Status pill with clay-radius-xl
- `apps/web/src/components/ui/number-input/` -- Numeric input with clay surface

Layout (Phase 4):
- `apps/web/src/components/layout/sidebar.tsx` -- Nav sidebar with clay surfaces
- `apps/web/src/components/layout/header.tsx` -- Top header with clay surface
- `apps/web/src/components/layout/mobile-nav.tsx` -- Mobile nav with clay-sheet

Feature Components (Phase 5):
Editor:
- `apps/web/src/components/editor/lesson-editor.tsx` -- Main editor = clay card + toolbar
- `apps/web/src/components/editor/editor-toolbar.tsx` -- Toolbar buttons = clay btns
- `apps/web/src/components/editor/outline-panel.tsx` -- Panel = clay surface
- `apps/web/src/components/editor/link-popover.tsx` -- Inherits dialog (Phase 2)
- `apps/web/src/components/editor/image-url-dialog.tsx` -- Inherits dialog (Phase 2)

Lessons:
- `apps/web/src/components/lessons/alive-text-reveal.tsx` -- Text highlight = clay pill
- `apps/web/src/components/lessons/paragraph-comment-trigger.tsx` -- Trigger = clay pill btn
- `apps/web/src/components/lessons/paragraph-reaction-trigger.tsx` -- Reactions = clay pills
- `apps/web/src/components/lessons/comment-thread.tsx` -- Thread = clay card surfaces
- `apps/web/src/components/lessons/remove-lesson-button.tsx` -- Inherits clay btn destructive

Studio:
- `apps/web/src/components/studio/lessons/_components/studio-lessons-view.tsx` -- List items = clay cards
- `apps/web/src/components/studio/lessons/_components/lesson-list-item.tsx` -- Item = clay card row
- `apps/web/src/components/studio/lessons/_components/new-lesson-dialog.tsx` -- Inherits dialog
- `apps/web/src/components/studio/lessons/_components/delete-lesson-dialog.tsx` -- Inherits dialog
- `apps/web/src/components/studio/lessons/[lessonId]/_components/save-indicator.tsx` -- Badge = clay badge

Dashboard & Group:
- `apps/web/src/components/dashboard/_components/group-card.tsx` -- Card = clay elevated card
- `apps/web/src/components/dashboard/_components/pending-invitations.tsx` -- Items = clay surface rows
- `apps/web/src/components/group/[groupId]/_components/group-overview.tsx` -- Surface = clay card
- `apps/web/src/components/group/[groupId]/_components/group-layout-shell.tsx` -- Inherits layout (Phase 4)

Auth Forms:
- `apps/web/src/app/(auth)/login/_components/login-form.tsx` -- Form wrapper = clay card
- `apps/web/src/app/(auth)/register/_components/register-form.tsx` -- Same as login

Custom Select:
- `apps/web/src/components/ui-custom/select.tsx` -- Wrapper inherits Phase 2.4 styles

## Tasks & Acceptance

**Execution:**

Phase 1 — Foundation (30-45m, 5 files):
- [x] `apps/web/src/components/ui/button.tsx` -- Add `rounded-(--radius-clay)` + `shadow-clay-outer shadow-clay-inner` + hover/pressed states -- Foundation for all interactive elements
- [x] `apps/web/src/components/ui/input.tsx` -- Add `bg-(--clay-surface-1) border-(--clay-shadow-dark) rounded-(--radius-clay)` -- Form field clay styling
- [x] `apps/web/src/components/ui/card.tsx` -- Add `bg-(--clay-surface-2) shadow-clay-outer shadow-clay-inner rounded-(--radius-clay-lg)` -- Card surfaces
- [x] `apps/web/src/components/ui/badge.tsx` -- Add `rounded-(--radius-clay-xl) bg-(--clay-primary)` -- Pill badges
- [x] `apps/web/src/components/ui/separator.tsx` -- Add `bg-(--clay-shadow-dark)` -- Subtle dividers

Phase 2 — Overlay/Form (45-60m, 6 files):
- [x] `apps/web/src/components/ui/textarea.tsx` -- Same pattern as input.tsx -- Multi-line clay inputs
- [x] `apps/web/src/components/ui/dialog.tsx` -- Add `rounded-(--radius-clay-lg) shadow-clay-outer shadow-clay-inner` + overlay clay -- Modal dialogs
- [x] `apps/web/src/components/ui/sheet.tsx` -- Same as dialog with side-specific adjustments -- Side panels
- [x] `apps/web/src/components/ui/select.tsx` -- Popover trigger + content with clay surfaces -- Dropdown selects
- [x] `apps/web/src/components/ui/dropdown-menu.tsx` -- Menu content with `bg-(--clay-surface-1) shadow-clay-outer` -- Context menus
- [x] `apps/web/src/components/ui/tooltip.tsx` -- Add `bg-(--clay-surface-1) shadow-clay-subtle rounded-(--radius-clay)` -- Small popups

Phase 3 — Complex (60-90m, 6 files):
- [x] `apps/web/src/components/ui/tabs.tsx` -- Tab list surface + active tab clay styling -- Tab navigation
- [x] `apps/web/src/components/ui/table.tsx` -- Header rows with clay-surface-2, cells with clay-surface-1 -- Data tables
- [x] `apps/web/src/components/ui/sonner.tsx` -- Toast with clay card styling + shadow-clay-outer -- Notifications
- [x] `apps/web/src/components/ui/skeleton.tsx` -- Replace bg-muted with `bg-(--clay-surface-2)` -- Loading states
- [x] `apps/web/src/components/ui/status-badge.tsx` -- Use `rounded-(--radius-clay-xl) bg-(--clay-surface-1)` -- Status indicators
- [x] `apps/web/src/components/ui/number-input/` -- Input wrapper with clay surface styling -- Numeric inputs

Phase 4 — Layout (45-60m, 3 files):
- [x] `apps/web/src/components/layout/sidebar.tsx` -- Nav items with clay card surfaces + active states -- Main sidebar
- [x] `apps/web/src/components/layout/header.tsx` -- Header bar with clay-surface-1 bg -- Top header
- [x] `apps/web/src/components/layout/mobile-nav.tsx` -- Sheet content with clay-lg surface -- Mobile navigation

Phase 5 — Feature Components (90-120m, 23 files):
- [x] `apps/web/src/components/editor/lesson-editor.tsx` -- Surface → clay card, toolbar buttons → clay btns
- [x] `apps/web/src/components/editor/editor-toolbar.tsx` -- Buttons → clay btns, panel → clay surface
- [x] `apps/web/src/components/editor/outline-panel.tsx` -- Panel → clay surface, items → clay hover
- [x] `apps/web/src/components/editor/link-popover.tsx` -- Inherits dialog styles (Phase 2)
- [x] `apps/web/src/components/editor/image-url-dialog.tsx` -- Inherits dialog styles (Phase 2)
- [x] `apps/web/src/components/lessons/alive-text-reveal.tsx` -- Text highlight → clay pill
- [x] `apps/web/src/components/lessons/paragraph-comment-trigger.tsx` -- Trigger → clay pill button
- [x] `apps/web/src/components/lessons/paragraph-reaction-trigger.tsx` -- Reactions → clay pills
- [x] `apps/web/src/components/lessons/comment-thread.tsx` -- Thread → clay card surfaces
- [x] `apps/web/src/components/lessons/remove-lesson-button.tsx` -- Inherits clay btn destructive
- [x] `apps/web/src/app/(dashboard)/studio/lessons/_components/studio-lessons-view.tsx` -- List items → clay cards
- [x] `apps/web/src/app/(dashboard)/studio/lessons/_components/lesson-list-item.tsx` -- Item → clay card row
- [x] `apps/web/src/app/(dashboard)/studio/lessons/_components/new-lesson-dialog.tsx` -- Inherits dialog (Phase 2)
- [x] `apps/web/src/app/(dashboard)/studio/lessons/_components/delete-lesson-dialog.tsx` -- Inherits dialog (Phase 2)
- [x] `apps/web/src/app/(dashboard)/studio/lessons/[lessonId]/_components/save-indicator.tsx` -- Badge → clay badge
- [x] `apps/web/src/app/(dashboard)/dashboard/_components/group-card.tsx` -- Card → clay elevated card
- [x] `apps/web/src/app/(dashboard)/dashboard/_components/pending-invitations.tsx` -- Items → clay surface rows
- [x] `apps/web/src/app/(dashboard)/group/[groupId]/_components/group-overview.tsx` -- Surface → clay card
- [x] `apps/web/src/app/(dashboard)/group/[groupId]/_components/group-layout-shell.tsx` -- Inherits layout (Phase 4)
- [x] `apps/web/src/app/(auth)/login/_components/login-form.tsx` -- Form wrapper → clay card, inputs → clay
- [x] `apps/web/src/app/(auth)/register/_components/register-form.tsx` -- Same as login
- [x] `apps/web/src/components/ui-custom/select.tsx` -- Wrapper inherits Phase 2.4 styles

**Acceptance Criteria:**
- Given clay tokens are defined in `globals.css`, when component renders in light mode, then surfaces show clay shadows and radius
- Given theme toggles to dark mode, when component re-renders, then clay `oklch` values adapt correctly
- Given mouse hovers interactive element, when pointer enters, then `shadow-clay-hover` applies with smooth transition
- Given button is pressed, when mouse down, then `shadow-clay-pressed` applies
- Given component renders, when inspected, then no `sq-*` classes remain in new code (backward compat only)
- Given all 43 files migrated, when `yarn test` runs, then all component tests pass unchanged
- Given all 43 files migrated, when `yarn lint` runs, then no lint errors reported

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Do not modify or delete existing entries.
      Each entry records: what finding triggered the change, what was amended, what known-bad state
      the amendment avoids, and any KEEP instructions (what worked well and must survive re-derivation).
      Empty until the first bad_spec loopback. -->

- **Date:** 2026-05-06
  - **Finding:** `lesson-list-item.tsx` line 26 used `hover:shadow-(--shadow-clay-subtle)` which is not a valid clay token per spec (spec only defines `--shadow-clay-hover`, `--shadow-clay-pressed`, `--shadow-clay-focus`, `--shadow-clay-outer`, `--shadow-clay-inner`)
  - **Amended:** Changed to `hover:shadow-clay-hover` to match spec invariant rules
  - **Avoided:** Invalid CSS variable reference that would not produce clay hover effect
  - **KEEP:** All other clay tokens in the file (`rounded-clay-lg`, `bg-(--clay-surface-2)`, `clay-pill`, etc.) are correct

## Design Notes

<!-- Design rationale and golden examples only when non-obvious. Keep examples to 5–10 lines. -->

Clay design tokens are defined in `apps/web/src/app/globals.css` using OKLCH color space:
- Surfaces: `--clay-surface-1` (background), `--clay-surface-2` (lighter), `--clay-surface-elevated` (white)
- Shadows: `--shadow-clay-outer`, `--shadow-clay-inner`, `--shadow-clay-hover`, `--shadow-clay-pressed`, `--shadow-clay-focus`
- Radius: `--radius-clay` (20px cards), `--radius-clay-lg` (28px modals), `--radius-clay-xl` (40px pills), `--radius-clay-full` (9999px full pill)
- Primary: `--clay-primary` (soft purple), `--clay-primary-hover`

Example clay button class pattern:
```tsx
className={cn(
  "rounded-(--radius-clay) shadow-clay-inner",
  "hover:shadow-clay-hover active:shadow-clay-pressed",
  "focus-visible:shadow-clay-focus",
  // ...existing variant classes
)}
```

## Verification

**Commands:**
- `yarn dev` -- expected: open browser, verify light + dark mode for each phase component
- `yarn test` -- expected: all component tests pass (no test changes needed, API unchanged)
- `yarn lint` -- expected: no lint errors in migrated files

**Manual checks (if no CLI):**
- Visual check: open each migrated component in browser, toggle dark/light mode
- Check: radius values (puffy edges), shadow depth (outer + inner), hover/pressed states
- Verify: no `sq-*` classes in new code, backward compat only
