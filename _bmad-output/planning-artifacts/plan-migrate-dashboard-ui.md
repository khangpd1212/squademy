# Plan: UI Migration — Claymorphism → Dashboard Design System

**Generated:** 2026-05-08
**Status:** Approved
**Scope:** Full UI redesign — globals.css, layout, all components, dashboard pages

---

## Overview

Current design uses a **claymorphism** language (light mode, pastel purple/teal/pink, puffy 3D shadows, 20px border radius). Target design is a **dark-themed cloud-platform dashboard** (glass panels, backdrop-blur, blue primary `#0C5CAB`, clean/sharp, Vercel/GitHub-inspired aesthetic).

| Aspect | Claymorphism (Current) | Dashboard (Target) |
|--------|----------------------|-------------------|
| Theme | Light (`oklch(1 0 0)`) | Dark (`#09090b`) |
| Primary | Purple pastel `oklch(0.75 0.15 280)` | Blue `#0C5CAB` |
| Secondary | Teal `oklch(0.85 0.1 180)` | — (monochrome) |
| Accent | Pink `oklch(0.82 0.18 340)` | — (primary-driven) |
| Success | Soft green | `#10b981` |
| Warning | Soft amber | `#f59e0b` |
| Danger | Soft red | `#ef4444` |
| Surface | White + pastel layers | `#09090b` + glass layers |
| Card style | Puffy 3D clay (dual-shadow) | Glass panel (backdrop-blur, subtle border) |
| Shadows | 8px/16px dual shadow | Layered soft shadows |
| Radius | 20px (clay), 28px (lg) | 8px–12px (clean) |
| Fonts | Nunito (heading), Inter (body), Fira Code (mono) | **Same — unchanged** |
| 8pt grid | No | Yes |

**Layout preserved:** Sidebar left + Header top + Content (same structure, restyled).

---

## Files to Modify

Total: ~40 files across 6 phases.

---

## Phase 1 — Foundation

**File:** `apps/web/src/app/globals.css`

- Remove all claymorphism tokens:
  - `--radius-clay`, `--radius-clay-lg`, `--radius-clay-xl`, `--radius-clay-full`
  - `--shadow-clay-outer`, `--shadow-clay-inner`, `--shadow-clay-subtle`, `--shadow-clay-hover`, `--shadow-clay-pressed`, `--shadow-clay-focus`
  - `--clay-shadow-dark`, `--clay-shadow-light`, `--clay-focus-ring`
  - `--clay-surface-1`, `--clay-surface-2`, `--clay-surface-3`, `--clay-surface-elevated`
  - `--clay-primary`, `--clay-primary-hover`, `--clay-primary-active`, `--clay-primary-foreground`
  - `--clay-secondary`, `--clay-secondary-hover`, `--clay-secondary-active`, `--clay-secondary-foreground`
  - `--clay-accent`, `--clay-accent-hover`, `--clay-accent-active`, `--clay-accent-foreground`
  - `--clay-success`, `--clay-success-foreground`, `--clay-warning`, `--clay-warning-foreground`
  - `--clay-error`, `--clay-error-foreground`, `--clay-info`, `--clay-info-foreground`
  - `--clay-transition-fast`, `--clay-transition-base`, `--clay-transition-slow`, `--clay-transition-bounce`
  - `--clay-border-subtle`, `--clay-border-base`, `--clay-border-focus`
- Remove `.sq-card`, `.sq-btn`, `.sq-input`, `.sq-btn-green` classes
- Remove all `.clay-*` component classes (`.clay-card`, `.clay-btn`, `.clay-input`, `.clay-surface`, `.clay-badge`, `.clay-avatar`, `.clay-dialog`, `.clay-tooltip`, `.clay-separator`, `.clay-pill`)
- Add new dashboard tokens:
  - `--dash-radius`: `0.5rem` (8px) base, `0.75rem` (12px) lg
  - `--dash-glass`: `rgba(255, 255, 255, 0.03)` base, various opacity levels
  - `--dash-surface`: `#09090b` base, `#111113`, `#18181b` layers
  - `--dash-primary`: `#0C5CAB`, hover/active variants
  - `--dash-success`: `#10b981`, `--dash-warning`: `#f59e0b`, `--dash-danger`: `#ef4444`
  - `--dash-border`: `rgba(255, 255, 255, 0.06)` subtle, `rgba(255, 255, 255, 0.1)` base
  - `--dash-shadow-sm`, `--dash-shadow-md`, `--dash-shadow-lg`, `--dash-shadow-xl`
  - `--dash-text`: `#fafafa` primary, `#a1a1aa` muted, `#71717a` subtle
- Keep shadcn base CSS variable structure but update values for dark theme
- `:root` block defaults to dark values; add `light` class override for potential light mode support

**File:** `apps/web/src/components/providers.tsx`
- Change `defaultTheme="light"` → `defaultTheme="dark"`

---

## Phase 2 — Layout Components

### 2.1 `apps/web/src/components/layout/sidebar.tsx`

- Background: `bg-(--dash-surface) border-r border-(--dash-border-subtle)`
- Brand area: logo + app name "Squademy" with icon
- Nav items:
  - Default: `text-(--dash-text-muted) hover:text-(--dash-text) hover:bg-(--dash-glass-hover)`
  - Active: `bg-(--dash-glass-active) text-(--dash-text) border-l-2 border-(--dash-primary)`
- Icons: lucide, `size-4`, `text-(--dash-text-muted)`
- Width: `w-64` desktop, collapsible to `w-16` icon-only
- Scrollbar: thin, styled

### 2.2 `apps/web/src/components/layout/header.tsx`

- Background: `bg-(--dash-glass)/80 backdrop-blur-xl border-b border-(--dash-border-subtle)`
- Height: `h-14`, sticky top-0, z-30
- Left: mobile hamburger button (`md:hidden`)
- Center: search bar (input with search icon, `max-w-sm`, `bg-(--dash-glass-hover)`)
- Right: notification bell (`Button variant="ghost"` with badge), user avatar dropdown

### 2.3 `apps/web/src/components/layout/mobile-nav.tsx`

- Background: `bg-(--dash-glass) backdrop-blur-lg border-t border-(--dash-border-subtle)`
- Fixed bottom, `md:hidden`
- Items: 5–7 main navigation icons
- Active: `text-(--dash-primary)` with top dot indicator

### 2.4 `apps/web/src/app/(dashboard)/layout.tsx`

- Adjust wrapper if sidebar collapsible logic is needed
- Keep current structure: sidebar + flex-1 column (header + main)

---

## Phase 3 — shadcn/ui Components

All 19 UI components use current clay tokens. Each needs updating to dashboard tokens.

### 3.1 `button.tsx`
- Base: `rounded-(--dash-radius) text-sm font-medium transition-all`
- Default variant: `bg-(--dash-primary) text-white hover:bg-(--dash-primary-hover) active:bg-(--dash-primary-active)`
- Outline: `border border-(--dash-border) bg-transparent hover:bg-(--dash-glass-hover)`
- Ghost: `hover:bg-(--dash-glass-hover)`
- Destructive: `bg-(--dash-danger)/10 text-(--dash-danger) hover:bg-(--dash-danger)/20`
- Link: `text-(--dash-primary) underline-offset-4`
- Sizes: `h-8 px-3` default, `h-9 px-4` lg, `h-7 px-2` sm, `size-8` icon

### 3.2 `card.tsx`
- Base: `rounded-(--dash-radius-lg) bg-(--dash-glass) border border-(--dash-border-subtle) shadow-(--dash-shadow-sm) backdrop-blur-md`
- Header/Footer: matching glass surface
- Title: `text-base font-medium text-(--dash-text)`
- Description: `text-sm text-(--dash-text-muted)`

### 3.3 `input.tsx`
- Base: `h-8 rounded-(--dash-radius) border border-(--dash-border) bg-(--dash-glass-hover) px-2.5`
- Focus: `border-(--dash-primary) ring-2 ring-(--dash-primary)/20`
- Placeholder: `text-(--dash-text-subtle)`
- Disabled: `opacity-50 bg-(--dash-glass)`

### 3.4 `dialog.tsx`
- Overlay: `bg-black/60 backdrop-blur-sm`
- Content: `rounded-(--dash-radius-lg) bg-(--dash-surface) border border-(--dash-border) shadow-(--dash-shadow-xl)`
- Animation: fade + zoom via base-ui/animate

### 3.5 `sheet.tsx`
- Background: `bg-(--dash-surface) border-l border-(--dash-border)`
- Overlay: `bg-black/60`

### 3.6 `badge.tsx`
- Default: `bg-(--dash-primary) text-white`
- Secondary: `bg-(--dash-glass-active) text-(--dash-text-muted)`
- Destructive: `bg-(--dash-danger)/15 text-(--dash-danger)`
- Outline: `border border-(--dash-border) text-(--dash-text-muted)`
- Border radius: `rounded-full`
- Size: `h-5 px-2 text-xs`

### 3.7 `dropdown-menu.tsx`
- Content: `rounded-(--dash-radius) bg-(--dash-surface) border border-(--dash-border) shadow-(--dash-shadow-lg)`
- Item: `hover:bg-(--dash-glass-hover)`
- Separator: `bg-(--dash-border)`

### 3.8 `tabs.tsx`
- List (default): `bg-(--dash-glass-hover) rounded-(--dash-radius) p-0.5`
- Trigger (default variant): `rounded-(--dash-radius-sm) data-active:bg-(--dash-glass) data-active:text-(--dash-text)`
- List (line variant): `border-b border-(--dash-border) rounded-none bg-transparent`
- Trigger (line variant): `data-active:text-(--dash-primary) data-active:after:bg-(--dash-primary)`

### 3.9 `select.tsx`
- Trigger: `rounded-(--dash-radius) border border-(--dash-border) bg-(--dash-glass-hover)`
- Popover: `rounded-(--dash-radius) bg-(--dash-surface) border border-(--dash-border) shadow-(--dash-shadow-lg)`
- Item: `hover:bg-(--dash-glass-hover)`

### 3.10 `textarea.tsx`
- Base: `rounded-(--dash-radius) border border-(--dash-border) bg-(--dash-glass-hover) px-2.5 py-2`
- Focus: `border-(--dash-primary) ring-2 ring-(--dash-primary)/20`

### 3.11 `separator.tsx`
- Color: `bg-(--dash-border)`

### 3.12 `tooltip.tsx`
- Content: `rounded-(--dash-radius) bg-(--dash-surface-elevated) border border-(--dash-border) shadow-(--dash-shadow-md)`
- Arrow: themed

### 3.13 `sonner.tsx`
- Toast bg: `var(--dash-surface-elevated)`
- Border: `var(--dash-border)`
- Border radius: `var(--dash-radius-lg)`
- Box shadow: `var(--dash-shadow-lg)`

### 3.14 `avatar.tsx`
- Border: `ring-2 ring-(--dash-border)`
- Fallback: `bg-(--dash-glass-hover) text-(--dash-text-muted)`

### 3.15 `skeleton.tsx`
- Base: `animate-pulse rounded-(--dash-radius) bg-(--dash-glass-active)`

### 3.16 `table.tsx`
- Header: `border-b border-(--dash-border) text-(--dash-text-muted) text-xs font-medium`
- Row: `border-b border-(--dash-border-subtle) hover:bg-(--dash-glass-hover)`

### 3.17 `label.tsx`
- Font: `text-sm font-medium text-(--dash-text)`

### 3.18 `empty.tsx`
- Container: `rounded-(--dash-radius-lg) border border-dashed border-(--dash-border) bg-(--dash-glass)`
- Icon: `text-(--dash-text-muted)`

### 3.19 `status-badge.tsx`
- Colors: `--dash-primary` for info, `--dash-success` for success, `--dash-warning` for warning, `--dash-danger` for error

---

## Phase 4 — Dashboard Page Components

### 4.1 `apps/web/src/app/(dashboard)/dashboard/_components/dashboard-view.tsx`
- Update Skeleton to use dashboard skeleton style
- Container: `max-w-5xl mx-auto space-y-6`
- Title: `text-2xl font-semibold text-(--dash-text)`

### 4.2 `apps/web/src/app/(dashboard)/dashboard/_components/group-card.tsx`
- Replace `clay-card clay-card-elevated` → glass card
- Replace `clay-pill` → new badge
- Role badge colors: `bg-(--dash-primary)/10 text-(--dash-primary)` for admin, etc.
- Hover: `translateY(-2px) shadow-(--dash-shadow-md)`

### 4.3 `apps/web/src/app/(dashboard)/dashboard/_components/pending-invitations.tsx`
- Replace `clay-card` → glass card
- Replace `clay-surface` + `clay-border-base` → dashboard surface + border
- Button variants updated via new button component

### 4.4 `apps/web/src/app/(dashboard)/dashboard/_components/empty-state.tsx`
- Replace dashed border card with glass empty state
- Icon container: `bg-(--dash-glass-hover)`

---

## Phase 5 — Other Pages (Token Swap)

### Files requiring token/class updates:

| File | Current reference | New approach |
|------|-------------------|--------------|
| `group-layout-shell.tsx` | `clay-surface`, `clay-btn`, `rounded-clay` | `bg-(--dash-glass)`, dash tokens |
| `group-overview.tsx` | `clay-card`, `clay-border-base`, `clay-surface-3` | Glass card, dash border |
| `lesson-list-item.tsx` | `clay-surface-2`, `clay-border-base`, `clay-btn`, `clay-pill` | Dash surface, badge |
| `studio-lessons-view.tsx` | `clay-card`, `rounded-clay` | Glass card |
| `register-form.tsx` | `clay-card` | Glass card |
| `login-form.tsx` | `clay-card` | Glass card |
| `delete-lesson-dialog.tsx` | `clay-dialog` | Dash dialog |
| `new-lesson-dialog.tsx` | `clay-dialog` | Dash dialog |
| `save-indicator.tsx` | `clay-pill`, `clay-success-foreground`, `clay-error-foreground` | Badge, dash tokens |
| `editor-toolbar.tsx` | `clay-btn`, `clay-surface`, `clay-surface-*`, `clay-dialog`, `clay-border-base`, `clay-primary` | Dash tokens |
| `lesson-editor.tsx` | `clay-card`, `clay-surface-inset` | Glass card |
| `outline-panel.tsx` | `clay-dialog`, `clay-surface`, `clay-surface-2` | Dash glass |
| `link-popover.tsx` | `clay-dialog`, `clay-input`, `clay-btn` | Dash dialog/input/button |
| `image-url-dialog.tsx` | `clay-dialog`, `clay-input`, `clay-btn`, `rounded-clay` | Dash tokens |
| `comment-thread.tsx` | `clay-card`, `--clay-*` variables | Dash tokens |
| `paragraph-reaction-trigger.tsx` | `clay-pill`, `--clay-*` variables | Badge, dash tokens |
| `paragraph-comment-trigger.tsx` | `clay-btn`, `--clay-*` variables | Dash button/tokens |
| `remove-lesson-button.tsx` | `--clay-destructive` | `--dash-danger` |

---

## Phase 6 — Cleanup & Verify

1. **Remove legacy CSS** — verify no `.clay-*`, `.sq-btn`, `.sq-card`, `.sq-input` remain in `globals.css`
2. **Lint** — `yarn lint` from project root
3. **Build** — `yarn build` to verify no compilation errors
4. **Search for stale references** — grep for `clay`, `sq-` across `apps/web/src/`

---

## Execution Order

```
Phase 1  →  globals.css + providers.tsx
    ↓
Phase 2  →  sidebar.tsx, header.tsx, mobile-nav.tsx, (dashboard)/layout.tsx
    ↓
Phase 3  →  All 19 shadcn/ui components
    ↓
Phase 4  →  Dashboard page components (4 files)
    ↓
Phase 5  →  Other page components (~18 files)
    ↓
Phase 6  →  Cleanup + Verify
```

Phases 1–2 are foundation. Phases 3–5 can be done in any order after Phase 1 is done. Phase 6 is final.

---

## Appendix: Token Mapping

| Old clay token | New dash token | Notes |
|----------------|----------------|-------|
| `--radius-clay` (1.25rem) | `--dash-radius` (0.5rem) | Reduced sharpness |
| `--radius-clay-lg` (1.75rem) | `--dash-radius-lg` (0.75rem) | |
| `--shadow-clay-outer` | `--dash-shadow-md` | Soft, not puffy |
| `--shadow-clay-inner` | _(remove)_ | No inner shadows |
| `--shadow-clay-hover` | `--dash-shadow-lg` | |
| `--shadow-clay-subtle` | `--dash-shadow-sm` | |
| `--clay-primary` | `--dash-primary` | Purple → Blue |
| `--clay-primary-hover` | `--dash-primary-hover` | |
| `--clay-primary-active` | `--dash-primary-active` | |
| `--clay-surface-1` | `--dash-surface` | Pastel → Dark |
| `--clay-surface-elevated` | `--dash-surface-elevated` | |
| `--clay-success` | `--dash-success` | |
| `--clay-warning` | `--dash-warning` | |
| `--clay-error` | `--dash-danger` | |
| `--clay-border-base` | `--dash-border` | |
| `--clay-border-subtle` | `--dash-border-subtle` | |
