# Plan: Notion-like Editor UI/UX for Lesson Editor

## Overview

Thay đổi UI/UX của editor lesson từ Confluence-style toolbar trên cùng sang Notion-like inline controls:
1. **Bubble Menu** - Menu nổi lên khi chọn đoạn text
2. **Block Picker** - Slash commands (`/`) để chọn loại block
3. **Gutter Add Button** - Dấu `+` ở đầu mỗi paragraph (tùy chọn)

---

## Current State

### Existing Architecture
- **Editor**: TipTap v3 (ProseMirror) via `@tiptap/react`
- **Extensions**: StarterKit, Underline, Link, Image, Table, Placeholder, AliveText, Markdown
- **UI Components**: shadcn/ui (Button, DropdownMenu, Dialog) via `@base-ui/react`
- **Toolbar Location**: `EditorToolbar` component ở trên cùng editor

### Files Modified Already (if any)
- `apps/web/src/components/editor/lesson-editor.tsx`
- `apps/web/src/components/editor/editor-bubble-menu.tsx` (NEW)
- `apps/web/src/components/editor/editor-block-picker.tsx` (NEW)
- `apps/web/package.json` (added: `@tiptap/extension-bubble-menu`, `@tiptap/extension-floating-menu`)

---

## Implementation Plan

### Phase 1: Dependencies

**Package to install:**
```bash
yarn workspace @squademy/web add @tiptap/extension-bubble-menu @tiptap/extension-floating-menu
```

**Note**: These extensions have peer dependencies:
- `@floating-ui/dom`
- `@tiptap/core`
- `@tiptap/pm`

These should already be available via existing `@tiptap/react` dependency.

---

### Phase 2: Bubble Menu Component

**File**: `apps/web/src/components/editor/editor-bubble-menu.tsx`

**Purpose**: Floating menu appears above text when user selects a range.

**Features**:
- Bold, Italic, Underline, Strikethrough, Inline Code buttons
- Link button with LinkPopover integration
- Heading dropdown menu (H1, H2, H3, Text)
- Bullet List, Numbered List, Quote in dropdown
- Uses shadcn/ui `DropdownMenu` for consistent styling

**Styling**:
- Matches existing `--dash-*` CSS variables
- Uses `EditorToolbar`'s `ToolbarButton` pattern for consistency
- Dark glass panel: `bg-(--dash-surface-2)`, `backdrop-blur-xl`, `border-(--dash-border-subtle)`

**Integration Point**: Wrapped inside `<EditorContent>` wrapper in `lesson-editor.tsx`

---

### Phase 3: Block Picker (Slash Commands)

**File**: `apps/web/src/components/editor/editor-block-picker.tsx`

**Purpose**: Show command palette when user types `/` at start of paragraph.

**Features**:
- Search/filter as user types after `/`
- Keyboard navigation: ↑↓ arrows, Enter to select, Esc to dismiss
- Block items with: icon, label, description
- Search includes keywords (e.g. "h1" finds Heading 1)

**Block Types Available**:
| Block | Command | Action |
|-------|---------|--------|
| Text | `/text` | `setParagraph()` |
| Heading 1 | `/h1` or `/heading1` | `toggleHeading({ level: 1 })` |
| Heading 2 | `/h2` or `/heading2` | `toggleHeading({ level: 2 })` |
| Heading 3 | `/h3` or `/heading3` | `toggleHeading({ level: 3 })` |
| Bullet List | `/bullet` or `/list` | `toggleBulletList()` |
| Numbered List | `/numbered` or `/1.` | `toggleOrderedList()` |
| Quote | `/quote` or `/blockquote` | `toggleBlockquote()` |
| Code Block | `/code` or `/snippet` | `toggleCodeBlock()` |
| Divider | `/divider` or `/hr` or `/line` | `setHorizontalRule()` |
| Table | `/table` or `/grid` | `insertTable({ rows: 3, cols: 3 })` |

**Behavior**:
- Auto-shows when cursor at empty paragraph after `/`
- Auto-hides when text selected or space typed (non-slash)
- Selected index resets when search query changes

**Integration Point**: Uses `FloatingMenu` from `@tiptap/extension-floating-menu` positioned `bottom-start`

---

### Phase 4: Editor Integration

**File**: `apps/web/src/components/editor/lesson-editor.tsx`

**Changes Required**:
1. **Imports**: Add `EditorBubbleMenu` and `EditorBlockPicker`
2. **Wrapper Structure**: Wrap `<EditorContent>` in relative container so floating menus position correctly
3. **Conditional Render**: Only render menus when `editor` exists AND NOT in view mode

**Before**:
```tsx
<EditorContent
  editor={editor}
  className="flex-1 bg-(--dash-surface-1) overflow-y-auto"
/>
```

**After**:
```tsx
<div className="relative flex-1">
  <EditorContent
    editor={editor}
    className="h-full bg-(--dash-surface-1) overflow-y-auto"
  />
  {editor && (
    <>
      <EditorBubbleMenu editor={editor} />
      <EditorBlockPicker editor={editor} />
    </>
  )}
</div>
```

---

### Phase 5: Gutter Add Button (Optional Enhancement)

**Purpose**: Notion-style `+` button on hover at start of paragraph

**Implementation Options**:

**Option A**: TipTap NodeView (Recommended)
- Create custom Paragraph node extension
- Render button as decoration on hover
- Click opens same block picker dropdown

**Option B**: CSS-only hover area
- Absolute positioned area on left side
- Only visible on paragraph hover
- Simpler but less precise

**Decision**: This is enhancement. First ship Bubble Menu + Slash Commands, then add gutter button in separate iteration if needed.

---

## Files Affected

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/package.json` | Modified | Add `@tiptap/extension-bubble-menu`, `@tiptap/extension-floating-menu` |
| `apps/web/src/components/editor/lesson-editor.tsx` | Modified | Import and render new menu components |
| `apps/web/src/components/editor/editor-bubble-menu.tsx` | New | Floating text formatting menu |
| `apps/web/src/components/editor/editor-block-picker.tsx` | New | Slash command block picker |

**Toolbar**: Existing `EditorToolbar` remains as fallback/alternative. Users can choose:
- New inline controls (bubble menu + slash commands)
- Old toolbar at top (still available)

---

## Test Coverage Plan

### Unit Tests

**Editor Tests** (`apps/web/src/components/editor/lesson-editor.test.tsx`):
- [ ] Render with bubble menu integration
- [ ] Render with block picker integration

**New Component Tests**:
- [ ] `editor-bubble-menu.test.tsx` - Test button interactions
- [ ] `editor-block-picker.test.tsx` - Test search/filter, keyboard nav

**Integration Tests**:
- [ ] Verify slash `/` triggers block picker
- [ ] Verify text selection triggers bubble menu
- [ ] Verify editor commands execute correctly

---

## Rollback Plan

If issues arise:

1. **Remove imports** from `lesson-editor.tsx`
2. **Delete** `editor-bubble-menu.tsx` and `editor-block-picker.tsx`
3. **Remove packages**: `yarn workspace @squademy/web remove @tiptap/extension-bubble-menu @tiptap/extension-floating-menu`

---

## Acceptance Criteria

### AC 1: Bubble Menu on Text Selection
**Given** user is in edit mode
**When** user selects a range of text with mouse
**Then** a floating formatting menu appears above the selection containing:
- Bold, Italic, Underline, Strikethrough buttons
- Link button
- Heading/Block type dropdown
- Menu uses dark glass styling matching dashboard design system

### AC 2: Slash Command Block Picker
**Given** user is at start of empty paragraph
**When** user types `/`
**Then** a command palette appears showing available block types
**And** when user continues typing, list filters by search term
**And** user can navigate with ↑↓ arrows and select with Enter

### AC 3: Backward Compatible Toolbar
**Given** editor is loaded
**Then** original top toolbar remains visible and functional
**And** user can choose either inline controls or toolbar

### AC 4: Dark Theme Only
**Given** any UI element from this implementation
**Then** it respects existing `--dash-*` CSS variables
**And** matches the cloud-platform dark aesthetic (Vercel/GitHub inspired)

---

## Next Steps

1. [x] Install dependencies
2. [x] Create `editor-bubble-menu.tsx`
3. [x] Create `editor-block-picker.tsx`
4. [ ] Integrate into `lesson-editor.tsx`
5. [ ] Manual testing
6. [ ] Add unit tests
7. [ ] Verify lint + typecheck passes

---

## Technical Notes

### TipTap Menu Extensions

**BubbleMenu** (`@tiptap/extension-bubble-menu`):
- `tippyOptions`: `placement: 'top'`, `offset: [0, 8]`
- `shouldShow`: Check for non-empty selection, not code block, not image/table

**FloatingMenu** (`@tiptap/extension-floating-menu`):
- `tippyOptions`: `placement: 'bottom-start'`, `offset: [0, 8]`
- `shouldShow`: Controlled manually via `isVisible` state

### Keyboard Handling

Both components need their own event listeners because:
- TipTap menus render outside editor DOM
- Need to capture ↑↓ Enter Esc for block picker
- Use `window.addEventListener` with cleanup in effect

### Search Matching

```
Match term against:
1. label (primary)
2. description (secondary)  
3. keywords array (additional aliases like "h1", "ul")
```

All case-insensitive.

---

## Risks & Considerations

| Risk | Mitigation |
|------|------------|
| Peer dependency mismatch with `@floating-ui/dom` | TipTap v3 bundles compatible version; verify types work |
| Menu positioning on mobile | Tippy handles responsive repositioning automatically |
| Keyboard conflicts with editor shortcuts | Only capture when menu visible; Esc always dismisses |
| Z-index conflicts with dialogs | Use `z-50` (TipTap default + shadcn uses same) |
| `/` typed mid-paragraph should not trigger | Check that text before `/` is empty or newline |

