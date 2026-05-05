# Claymorphism UI Migration Plan

---
type: implementation-plan
status: complete
created: 2026-05-04
completed: 2026-05-05
scope: all-phases (43 files)
output-path: apps/web/src/components/
---

## Goal

Migrate all 20 UI primitives + 3 layout components + 20+ feature components from flat/minimal design to **claymorphism** design system — soft, puffy, 3D-like, playful surfaces — without breaking:
- Component functionality, behavior, accessibility
- Layout structure (sizes, positions)
- Light/dark mode parity
- Existing test suites

## Migration Principles

1. **Class-only changes** — modify Tailwind classes in component files, NOT props/API/behavior
2. **Token-driven** — use `--clay-*` CSS variables already defined in `globals.css`
3. **Utility-first** — leverage `.clay-*` classes in `@layer components` where applicable
4. **Backward compatible** — keep `sq-*` classes intact (deprecate later)
5. **Phase-gated** — complete + verify each phase before next
6. **No test changes** — tests should pass because API/behavior unchanged

---

## Phase 1: Foundation Components (✅ COMPLETE — 5 files)

> Core primitives that every other component depends on. **Already migrated.**

### 1.1 `button.tsx` — ✅ Done

Actual state: `bg-(clay-primary) text-white shadow-(shadow-clay-subtle) hover:shadow-(shadow-clay-pressed) hover:bg-(clay-primary-hover) active:shadow-(shadow-clay-inner) active:bg-(clay-primary-active)`

### 1.2 `input.tsx` — ✅ Done

Actual state: `border-2 border-[oklch(0_0_0/8%)] shadow-(shadow-clay-inner) focus-visible:shadow-(shadow-clay-focus) disabled:bg-(clay-surface-3) disabled:shadow-none`

### 1.3 `card.tsx` — ✅ Done

Actual state: `shadow-(shadow-clay-subtle) ring-0` (root), `rounded-t-[min(var(--radius-clay),16px)]` (header), `rounded-b-[min(var(--radius-clay),16px)] bg-(clay-surface-3)` (footer)

### 1.4 `badge.tsx` — ✅ Done

Actual state: `bg-(clay-primary) text-white shadow-(shadow-clay-pressed)` (default), `bg-(clay-secondary) shadow-(shadow-clay-pressed)` (secondary), `border-2 border-(clay-border-base) bg-(clay-surface-1) shadow-(shadow-clay-subtle)` (outline)

### 1.5 `separator.tsx` — ✅ Done

Actual state: `bg-[oklch(0_0_0/8%)]` already applied

---

## Phase 2: Overlay & Form Components (✅ MOSTLY COMPLETE — 2 files remaining)

### 2.1 `textarea.tsx` — ✅ Done

Actual state: `border-2 border-[oklch(0_0_0/8%)] shadow-(shadow-clay-inner) focus-visible:shadow-(shadow-clay-focus) disabled:bg-(clay-surface-3) disabled:shadow-none`

### 2.2 `dialog.tsx` — ✅ Done

Actual state: `rounded-[min(var(--radius-clay-lg),24px)] shadow-(shadow-clay-hover) ring-0` (content), `bg-(clay-surface-3)` (footer)

### 2.3 `sheet.tsx` — ⚠️ Needs Update

| Change | From | To |
|--------|------|----|
| Content bg | `bg-background` | `bg-(clay-surface-elevated)` |
| Content border | none | `border-[var(--clay-border-base)]` |
| Shadow | `shadow-(shadow-clay-hover)` | ✅ Already correct |
| Side panels | missing border | `data-[side=left]:border-[var(--clay-border-base)] data-[side=right]:border-[var(--clay-border-base)] data-[side=bottom]:border-[var(--clay-border-base)]` |

**File:** `apps/web/src/components/ui/sheet.tsx`

### 2.4 `select.tsx` — ⚠️ Needs Update

| Change | From | To |
|--------|------|----|
| Trigger border | `border-2 border-[oklch(0_0_0/8%)]` ✅ | Already correct |
| Content bg | `bg-popover` | `bg-(clay-surface-elevated)` |
| Content ring | `ring-0` ✅ | Already correct |
| Content shadow | `shadow-(shadow-clay-hover)` ✅ | Already correct |
| Item focus | `focus:bg-(clay-surface-2) focus:shadow-(shadow-clay-pressed)` ✅ | Already correct |

**File:** `apps/web/src/components/ui/select.tsx` — Only `bg-popover` → `bg-(clay-surface-elevated)` needed

### 2.5 `dropdown-menu.tsx` — ✅ Done

Actual state: `rounded-[min(var(--radius-clay),14px)] bg-popover shadow-(shadow-clay-hover) ring-0`, `focus:bg-(clay-surface-2) focus:shadow-(shadow-clay-pressed)`

### 2.6 `tooltip.tsx` — ✅ Done

Actual state: `rounded-[min(var(--radius-clay),12px)] bg-(clay-surface-elevated) shadow-(shadow-clay-subtle) border-2 border-(clay-border-base)`

---

## Phase 3: Complex Components (✅ COMPLETE — 6 files)

### 3.1 `tabs.tsx` — ✅ Done!

Actual state: `bg-(clay-surface-3) rounded-[min(var(--radius-clay),16px)] p-1 shadow-(shadow-clay-inner)` (list), `data-active:bg-(clay-surface-elevated) data-active:shadow-(shadow-clay-subtle) data-active:rounded-md` (trigger active), line variant unchanged ✅

### 3.2 `table.tsx` — ✅ Done!

Actual state: `border-b-2 border-(clay-border-base)` (header), `hover:bg-(clay-surface-2) hover:shadow-(shadow-clay-pressed)` (row), `bg-(clay-surface-3)` (footer), `data-[state=selected]:bg-(clay-surface-3) data-[state=selected]:shadow-(shadow-clay-inner)` (selected)

### 3.3 `sonner.tsx` — ✅ Done!

Actual state: `--normal-bg: var(--clay-surface-elevated)`, `--normal-border: var(--clay-border-base)`, `--border-radius: var(--radius-clay)`, `box-shadow: var(--shadow-clay-hover)` all applied via inline style

### 3.4 `skeleton.tsx` — ✅ Done!

Actual state: `rounded-[min(var(--radius-clay),12px)]` already applied

### 3.5 `status-badge.tsx` — ✅ Done!

Actual state: `bg-(clay-surface-3) text-muted-foreground shadow-(shadow-clay-pressed)` (draft), `bg-(clay-warning)/20 text-(clay-warning-foreground)` (review), `bg-(clay-success)/20 text-(clay-success-foreground)` (published), `bg-(clay-error)/20 text-(clay-error-foreground)` (rejected/deleted)

### 3.6 `number-input/index.tsx` — ✅ Done!

Inherits Phase 1.2 `input.tsx` clay styles automatically ✅

---

## Phase 4: Layout Components (✅ COMPLETE — 3 files)

### 4.1 `layout/sidebar.tsx` — ✅ Done!

Actual state: `bg-(clay-surface-2) border-(clay-border-base)`, nav items `hover:bg-(clay-surface-2) hover:shadow-(shadow-clay-pressed)`, active `bg-(clay-surface-elevated) shadow-(shadow-clay-inner)`

### 4.2 `layout/header.tsx` — ✅ Done!

Actual state: `bg-(clay-surface-elevated) shadow-(shadow-clay-subtle)` (header surface)

### 4.3 `layout/mobile-nav.tsx` — ✅ Done!

Actual state: `bg-(clay-surface-elevated)` (mobile nav surface)

---

## Phase 5: Feature Components (✅ IN PROGRESS — 19/23 files)

### 5.1 Editor Components (✅ COMPLETE — 5 files)

| Component | File | Change |
|-----------|------|--------|
| Lesson Editor | `editor/lesson-editor.tsx` | Surface → clay card, toolbar buttons → clay btns |
| Toolbar | `editor/editor-toolbar.tsx` | Buttons → clay btns, panel → clay surface |
| Outline Panel | `editor/outline-panel.tsx` | Panel → clay surface, items → clay hover |
| Link Popover | `editor/link-popover.tsx` | Inherits dialog (Phase 2.2) |
| Image URL Dialog | `editor/image-url-dialog.tsx` | Inherits dialog (Phase 2.2) |

### 5.2 Lesson Components (✅ COMPLETE — 5 files)

| Component | File | Change |
|-----------|------|--------|
| Alive Text Reveal | `lessons/alive-text-reveal.tsx` | Text highlight → clay pill |
| Comment Trigger | `lessons/paragraph-comment-trigger.tsx` | Trigger → clay pill button |
| Reaction Trigger | `lessons/paragraph-reaction-trigger.tsx` | Reactions → clay pills |
| Comment Thread | `lessons/comment-thread.tsx` | Thread → clay card surfaces |
| Remove Button | `lessons/remove-lesson-button.tsx` | Inherits clay btn destructive |

### 5.3 Studio Components (✅ COMPLETE — 5 files)

| Component | File | Change |
|-----------|------|--------|
| Lessons View | `studio/lessons/_components/studio-lessons-view.tsx` | List items → clay cards |
| Lesson List Item | `studio/lessons/_components/lesson-list-item.tsx` | Item → clay card row |
| New Lesson Dialog | `studio/lessons/_components/new-lesson-dialog.tsx` | Inherits dialog (Phase 2.2) |
| Delete Lesson Dialog | `studio/lessons/_components/delete-lesson-dialog.tsx` | Inherits dialog (Phase 2.2) |
| Save Indicator | `studio/lessons/[lessonId]/_components/save-indicator.tsx` | Badge → clay badge |

### 5.4 Dashboard & Group (✅ COMPLETE — 4 files)

| Component | File | Change |
|-----------|------|--------|
| Group Card | `dashboard/_components/group-card.tsx` | Card → clay elevated card |
| Pending Invitations | `dashboard/_components/pending-invitations.tsx` | Items → clay surface rows |
| Group Overview | `group/[groupId]/_components/group-overview.tsx` | Surface → clay card |
| Group Layout Shell | `group/[groupId]/_components/group-layout-shell.tsx` | Inherits layout (Phase 4) |

### 5.5 Auth Forms (✅ COMPLETE — 2 files)

| Component | File | Change |
|-----------|------|--------|
| Login Form | `(auth)/login/_components/login-form.tsx` | Form wrapper → `clay-card p-6`, error → `clay-error` |
| Register Form | `(auth)/register/_components/register-form.tsx` | Same pattern as login form |

### 5.6 Custom Select (✅ COMPLETE — 1 file)

| Component | File | Change |
|-----------|------|--------|
| Custom Select | `ui-custom/select.tsx` | Wrapper — inherits Phase 2.4 styles (no changes needed) |

---

## File Inventory

| Phase | Category | Files | Effort | Risk |
|-------|----------|-------|--------|------|
| 1 | Foundation | `button`, `input`, `card`, `badge`, `separator` | 30-45m | 🟢 Low |
| 2 | Overlay/Form | `textarea`, `dialog`, `sheet`, `select`, `dropdown-menu`, `tooltip` | 45-60m | 🟡 Medium |
| 3 | Complex | `tabs`, `table`, `sonner`, `skeleton`, `status-badge`, `number-input` | 60-90m | 🟡 Medium |
| 4 | Layout | `sidebar`, `header`, `mobile-nav` | 45-60m | 🟢 Low |
| 5 | Feature | 23/23 files completed (editor, lessons, studio, dashboard, auth, custom-select) | ~0m remaining | 🟢 Low (inherit) |
| **Total** | | **43 files** | **~4-6 hours** | **🟡 Medium** |

---

## Verification Gates (After Each Phase)

```bash
# 1. Visual check
yarn dev          # Open browser, verify light + dark mode
                  # Check: radius, shadows, colors, hover/active states

# 2. Test suite
yarn test         # All component tests must pass
                  # Note: No test changes expected (API unchanged)

# 3. Lint
yarn lint         # No lint errors
```

## Rollback Strategy

If any phase breaks functionality:
1. `git checkout apps/web/src/components/ui/<file>.tsx` — revert individual file
2. No database migrations involved — safe to rollback per-file
3. `globals.css` clay tokens are additive — removing component classes doesn't break tokens

## Dependencies

- `globals.css` clay tokens already defined ✅ (Phase 0 complete)
- `@layer components` clay utility classes already defined ✅
- `cn()` utility available in all components ✅
- `cva` variants structure preserved in all migrations ✅

## Out of Scope

- `sq-*` classes — deprecated but NOT removed (backward compat)
- Animation polish — bounce transitions already in CSS vars, component-level fine-tuning later
- Mobile-specific clay adjustments — handled by existing responsive breakpoints
- New component creation — only restyle existing
