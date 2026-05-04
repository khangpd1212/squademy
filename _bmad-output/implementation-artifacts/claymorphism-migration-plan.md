# Claymorphism UI Migration Plan

---
type: implementation-plan
status: pending-approval
created: 2026-05-04
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

## Phase 1: Foundation Components (30-45 min, 5 files)

> Core primitives that every other component depends on. Change here cascades.

### 1.1 `button.tsx` — Medium

| Change | From | To |
|--------|------|----|
| Base radius | `rounded-lg` | `rounded-[min(var(--radius-clay),16px)]` |
| Size xs/sm | `rounded-[min(var(--radius-md),10px)]` | `rounded-[min(var(--radius-lg),12px)]` |
| Default variant | `bg-primary text-primary-foreground` | `bg-[var(--clay-primary)] text-white shadow-[var(--shadow-clay-subtle)] hover:shadow-[var(--shadow-clay-pressed)] hover:bg-[var(--clay-primary-hover)] active:shadow-[var(--shadow-clay-inner)] active:bg-[var(--clay-primary-active)]` |
| Destructive | `bg-destructive/10` | `bg-[var(--clay-error)]/10 shadow-[var(--shadow-clay-subtle)] hover:bg-[var(--clay-error)]/20` |
| Focus ring | `focus-visible:ring-3` | `focus-visible:shadow-[var(--shadow-clay-focus)]` |
| Disabled | `disabled:opacity-50` | add `disabled:shadow-none` |

**File:** `apps/web/src/components/ui/button.tsx`

### 1.2 `input.tsx` — Easy

| Change | From | To |
|--------|------|----|
| Radius | `rounded-lg` | `rounded-[min(var(--radius-clay),14px)]` |
| Border | `border border-input` | `border-2 border-[oklch(0_0_0/8%)]` |
| Inner depth | none | `shadow-[var(--shadow-clay-inner)]` |
| Focus | `focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:shadow-[var(--shadow-clay-focus)]` |
| Disabled | `disabled:bg-input/50` | `disabled:shadow-none disabled:bg-[var(--clay-surface-3)]` |

**File:** `apps/web/src/components/ui/input.tsx`

### 1.3 `card.tsx` — Easy

| Change | From | To |
|--------|------|----|
| Root radius | `rounded-xl` | `rounded-[min(var(--radius-clay),16px)]` |
| Ring → Shadow | `ring-1 ring-foreground/10` | `shadow-[var(--shadow-clay-subtle)] ring-0` |
| Header | `rounded-t-xl` | `rounded-t-[min(var(--radius-clay),16px)]` |
| Footer | `rounded-b-xl` | `rounded-b-[min(var(--radius-clay),16px)]` |
| Footer bg | `bg-muted/50` | `bg-[var(--clay-surface-3)]` |

**File:** `apps/web/src/components/ui/card.tsx`

### 1.4 `badge.tsx` — Easy

| Change | From | To |
|--------|------|----|
| Already pill | `rounded-4xl` | ✅ Keep |
| Default variant | `bg-primary text-primary-foreground` | `bg-[var(--clay-primary)] text-white shadow-[var(--shadow-clay-pressed)]` |
| Secondary | `bg-secondary` | `bg-[var(--clay-secondary)] shadow-[var(--shadow-clay-pressed)]` |
| Outline | `border-border` | `border-2 border-[var(--clay-border-base)] bg-[var(--clay-surface-1)] shadow-[var(--shadow-clay-subtle)]` |
| Destructive | `bg-destructive/10` | `bg-[var(--clay-error)]/15 shadow-[var(--shadow-clay-pressed)]` |

**File:** `apps/web/src/components/ui/badge.tsx`

### 1.5 `separator.tsx` — Trivial

- Minimal change — clay separators remain thin lines
- Optional: `bg-[oklch(0_0_0/8%)]` for consistency

**File:** `apps/web/src/components/ui/separator.tsx`

---

## Phase 2: Overlay & Form Components (45-60 min, 6 files)

### 2.1 `textarea.tsx` — Easy

- Same pattern as `input.tsx`: clay radius, inner shadow, clay focus
- Add `min-h-24` → keep, just change surface styling

**File:** `apps/web/src/components/ui/textarea.tsx`

### 2.2 `dialog.tsx` — Medium

| Change | From | To |
|--------|------|----|
| Content radius | `rounded-xl` | `rounded-[min(var(--radius-clay-lg),24px)]` |
| Content ring | `ring-1 ring-foreground/10` | `shadow-[var(--shadow-clay-hover)] ring-0` |
| Overlay | `bg-black/10 backdrop-blur-xs` | ✅ Keep — clay overlay still frosted |
| Footer | `rounded-b-xl` | `rounded-b-[min(var(--radius-clay-lg),24px)]` |

**File:** `apps/web/src/components/ui/dialog.tsx`

### 2.3 `sheet.tsx` — Easy

- Content border → `border-[var(--clay-border-base)]`
- Shadow: `shadow-lg` → `shadow-[var(--shadow-clay-hover)]`

**File:** `apps/web/src/components/ui/sheet.tsx`

### 2.4 `select.tsx` — Medium

| Change | From | To |
|--------|------|----|
| Trigger radius | `rounded-lg` | `rounded-[min(var(--radius-clay),14px)]` |
| Trigger border | `border-input` | `border-2 border-[oklch(0_0_0/8%)]` |
| Content popup | `rounded-lg shadow-md ring-1` | `rounded-[min(var(--radius-clay),14px)] shadow-[var(--shadow-clay-hover)] ring-0` |
| Item focus | `focus:bg-accent` | `focus:bg-[var(--clay-surface-2)] focus:shadow-[var(--shadow-clay-pressed)]` |

**File:** `apps/web/src/components/ui/select.tsx`

### 2.5 `dropdown-menu.tsx` — Medium

- Same patterns as select for popup content
- Menu items: focus → clay pressed effect
- Submenu: same clay radius + shadow

**File:** `apps/web/src/components/ui/dropdown-menu.tsx`

### 2.6 `tooltip.tsx` — Medium

| Change | From | To |
|--------|------|----|
| Content radius | `rounded-md` | `rounded-[min(var(--radius-clay),12px)]` |
| Content bg | `bg-foreground` | `bg-[var(--clay-surface-elevated)] text-foreground shadow-[var(--shadow-clay-subtle)] border-2 border-[var(--clay-border-base)]` |
| Arrow | `rounded-[2px]` | `rounded-sm shadow-[var(--shadow-clay-pressed)]` |

**File:** `apps/web/src/components/ui/tooltip.tsx`

---

## Phase 3: Complex Components (60-90 min, 6 files)

### 3.1 `tabs.tsx` — Hard

| Change | From | To |
|--------|------|----|
| List (default) | `bg-muted rounded-lg p-[3px]` | `bg-[var(--clay-surface-3)] rounded-[min(var(--radius-clay),16px)] p-1 shadow-[var(--shadow-clay-inner)]` |
| List (line variant) | `bg-transparent gap-1` | ✅ Keep — line variant incompatible with clay |
| Trigger active | `data-active:bg-background data-active:shadow-sm` | `data-active:bg-[var(--clay-surface-elevated)] data-active:shadow-[var(--shadow-clay-subtle)] data-active:rounded-md` |
| After indicator | `after:bg-foreground` | Hide for default (shadow replaces underline) |

**File:** `apps/web/src/components/ui/tabs.tsx`

### 3.2 `table.tsx` — Medium

| Change | From | To |
|--------|------|----|
| Header border | `[&_tr]:border-b` | `border-b-2 border-[var(--clay-border-base)]` |
| Row hover | `hover:bg-muted/50` | `hover:bg-[var(--clay-surface-2)] hover:shadow-[var(--shadow-clay-pressed)]` |
| Footer | `bg-muted/50` | `bg-[var(--clay-surface-3)]` |
| Selected | `data-[state=selected]:bg-muted` | `data-[state=selected]:bg-[var(--clay-surface-3)] data-[state=selected]:shadow-[var(--shadow-clay-inner)]` |

**File:** `apps/web/src/components/ui/table.tsx`

### 3.3 `sonner.tsx` — Medium

| Change | From | To |
|--------|------|----|
| Toast radius | `--border-radius: var(--radius)` | `--border-radius: var(--radius-clay)` |
| Toast bg | `--normal-bg: var(--popover)` | `--normal-bg: var(--clay-surface-elevated)` |
| Toast border | `--normal-border: var(--border)` | `--normal-border: var(--clay-border-base)` |
| Toast shadow | none | `box-shadow: var(--shadow-clay-hover)` via inline style |
| Success/Error | default | Override with `--clay-success`, `--clay-error` tokens |

**File:** `apps/web/src/components/ui/sonner.tsx`

### 3.4 `skeleton.tsx` — Easy

- Radius: `rounded-md` → `rounded-[min(var(--radius-clay),12px)]`
- Pulse animation: ✅ Keep

**File:** `apps/web/src/components/ui/skeleton.tsx`

### 3.5 `status-badge.tsx` — Easy

| Status | From | To |
|--------|------|----|
| draft | `bg-zinc-100 text-zinc-700` | `bg-[var(--clay-surface-3)] text-muted-foreground shadow-[var(--shadow-clay-pressed)]` |
| review | `bg-amber-100 text-amber-700` | `bg-[var(--clay-warning)]/20 text-[var(--clay-warning-foreground)]` |
| published | `bg-emerald-100 text-emerald-700` | `bg-[var(--clay-success)]/20 text-[var(--clay-success-foreground)]` |
| rejected/deleted | `bg-red-100 text-red-700` | `bg-[var(--clay-error)]/20 text-[var(--clay-error-foreground)]` |

**File:** `apps/web/src/components/ui/status-badge.tsx`

### 3.6 `number-input/index.tsx` — Trivial

- Wraps `Input` component — inherits Phase 1.2 changes automatically
- No direct style changes needed

**File:** `apps/web/src/components/ui/number-input/index.tsx`

---

## Phase 4: Layout Components (45-60 min, 3 files)

### 4.1 `layout/sidebar.tsx`

- Surface bg → `bg-[var(--clay-surface-2)]`
- Nav items hover → clay pressed effect
- Active nav item → `shadow-[var(--shadow-clay-inner)] bg-[var(--clay-surface-elevated)]`
- Borders → `border-[var(--clay-border-base)]`

**File:** `apps/web/src/components/layout/sidebar.tsx`

### 4.2 `layout/header.tsx`

- Surface → `bg-[var(--clay-surface-elevated)] shadow-[var(--shadow-clay-subtle)]`
- Bottom border → clay border style

**File:** `apps/web/src/components/layout/header.tsx`

### 4.3 `layout/mobile-nav.tsx`

- Surface → clay elevated style
- Nav items → clay pressed/hover effects
- Bottom safe area → keep, just style surface

**File:** `apps/web/src/components/layout/mobile-nav.tsx`

---

## Phase 5: Feature Components (90-120 min, 23 files)

### 5.1 Editor Components (5 files)

| Component | File | Change |
|-----------|------|--------|
| Lesson Editor | `editor/lesson-editor.tsx` | Surface → clay card, toolbar buttons → clay btns |
| Toolbar | `editor/editor-toolbar.tsx` | Buttons → clay btns, panel → clay surface |
| Outline Panel | `editor/outline-panel.tsx` | Panel → clay surface, items → clay hover |
| Link Popover | `editor/link-popover.tsx` | Inherits dialog (Phase 2.2) |
| Image URL Dialog | `editor/image-url-dialog.tsx` | Inherits dialog (Phase 2.2) |

### 5.2 Lesson Components (5 files)

| Component | File | Change |
|-----------|------|--------|
| Alive Text Reveal | `lessons/alive-text-reveal.tsx` | Text highlight → clay pill |
| Comment Trigger | `lessons/paragraph-comment-trigger.tsx` | Trigger → clay pill button |
| Reaction Trigger | `lessons/paragraph-reaction-trigger.tsx` | Reactions → clay pills |
| Comment Thread | `lessons/comment-thread.tsx` | Thread → clay card surfaces |
| Remove Button | `lessons/remove-lesson-button.tsx` | Inherits clay btn destructive |

### 5.3 Studio Components (5 files)

| Component | File | Change |
|-----------|------|--------|
| Lessons View | `studio/lessons/_components/studio-lessons-view.tsx` | List items → clay cards |
| Lesson List Item | `studio/lessons/_components/lesson-list-item.tsx` | Item → clay card row |
| New Lesson Dialog | `studio/lessons/_components/new-lesson-dialog.tsx` | Inherits dialog (Phase 2.2) |
| Delete Lesson Dialog | `studio/lessons/_components/delete-lesson-dialog.tsx` | Inherits dialog (Phase 2.2) |
| Save Indicator | `studio/lessons/[lessonId]/_components/save-indicator.tsx` | Badge → clay badge |

### 5.4 Dashboard & Group (4 files)

| Component | File | Change |
|-----------|------|--------|
| Group Card | `dashboard/_components/group-card.tsx` | Card → clay elevated card |
| Pending Invitations | `dashboard/_components/pending-invitations.tsx` | Items → clay surface rows |
| Group Overview | `group/[groupId]/_components/group-overview.tsx` | Surface → clay card |
| Group Layout Shell | `group/[groupId]/_components/group-layout-shell.tsx` | Inherits layout (Phase 4) |

### 5.5 Auth Forms (2 files)

| Component | File | Change |
|-----------|------|--------|
| Login Form | `(auth)/login/_components/login-form.tsx` | Form wrapper → clay card, inputs → clay |
| Register Form | `(auth)/register/_components/register-form.tsx` | Same as login |

### 5.6 Custom Select (1 file)

| Component | File | Change |
|-----------|------|--------|
| Custom Select | `ui-custom/select.tsx` | Wrapper — inherits Phase 2.4 styles |

---

## File Inventory

| Phase | Category | Files | Effort | Risk |
|-------|----------|-------|--------|------|
| 1 | Foundation | `button`, `input`, `card`, `badge`, `separator` | 30-45m | 🟢 Low |
| 2 | Overlay/Form | `textarea`, `dialog`, `sheet`, `select`, `dropdown-menu`, `tooltip` | 45-60m | 🟡 Medium |
| 3 | Complex | `tabs`, `table`, `sonner`, `skeleton`, `status-badge`, `number-input` | 60-90m | 🟡 Medium |
| 4 | Layout | `sidebar`, `header`, `mobile-nav` | 45-60m | 🟢 Low |
| 5 | Feature | 23 files (editor, lessons, studio, dashboard, auth, custom) | 90-120m | 🟢 Low (inherit) |
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
