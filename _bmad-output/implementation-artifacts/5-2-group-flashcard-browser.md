---
id: 5.2
key: 5-2-group-flashcard-browser
title: Group Flashcard Browser
status: done
epic: epic-5
priority: high
created: 2026-04-09
updated: 2026-04-09
---

# Story 5.2: Group Flashcard Browser

## User Story

**As a** Group Member,
I want to view available flashcard decks in my group,
So that I can see what study materials the group has prepared.

## Dependencies

- Story 5-1 (Flashcard Deck Management) - must be complete for decks to exist in groups

---

## Acceptance Criteria

### Group Flashcard Browser Page

1. [AC-1] **Given** I navigate to `/group/[groupId]/flashcards`, **when** the page loads, **then** `GET /groups/:groupId/flashcard-decks` (GroupMemberGuard) returns all published flashcard decks in this group
2. [AC-2] **Given** I am on the group flashcards page, **when** decks are loaded, **then** each deck shows: title, card count, description (if any), and a "Practice" button
3. [AC-3] **Given** I click "Practice" on a deck, **when** the deck has cards, **then** I am redirected to the practice session for that deck
4. [AC-4] **Given** I click "Practice" on an empty deck (0 cards), **when** clicked, **then** a toast message shows "This deck has no cards to practice"
5. [AC-5] **Given** no flashcard decks exist in the group, **then** an empty state is shown: "No flashcards yet. Check back later!"

---

## Tasks / Subtasks

- [x] Task 1: Backend API - Group Flashcard Decks Endpoint (AC: 1)
  - [x] 1.1: Add `GET /groups/:groupId/flashcard-decks` endpoint with GroupMemberGuard
  - [x] 1.2: Filter by `status = 'published'`
- [x] Task 2: Frontend - Group Flashcards Page (AC: 2-5)
  - [x] 2.1: Create `/group/[groupId]/flashcards/page.tsx`
  - [x] 2.2: Create `useGroupFlashcardDecks` query hook
  - [x] 2.3: Implement deck list UI with "Practice" buttons
  - [x] 2.4: Handle empty deck case with toast

---

## Technical Requirements

### Frontend Routes

```
apps/web/src/app/(dashboard)/group/[groupId]/flashcards/
├── page.tsx                                 # Deck list page
└── _components/
    ├── group-flashcards-view.tsx            # Deck list client component
    └── flashcard-deck-card.tsx              # Individual deck card
```

### API Endpoints

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/groups/:groupId/flashcard-decks` | GroupMemberGuard | List published decks in group |

### Data Types

```typescript
// API Response - Group Flashcard Deck
type GroupFlashcardDeck = {
  id: string;
  title: string;
  description?: string;
  cardCount: number;
  updatedAt: string;
  author: { id: string; displayName: string };
};
```

### Query Keys (TanStack Query)

```typescript
// Add to query-keys.ts
groupFlashcardDecks: (groupId: string) => ["groups", groupId, "flashcard-decks"] as const,
```

---

## Dev Notes

### Project Structure Alignment

- Follow existing patterns from Story 5-1 for flashcard queries
- Match empty state patterns from other group pages

### Testing Standards

- API endpoint unit tests
- Component tests for FlashcardBrowser, DeckCard

### References

- Epic 5: `_bmad-output/planning-artifacts/epics/epic-5-practice-engine-flashcard-srs-quizzes.md`
- Story 5-1: `5-1-flashcard-deck-management-anki-import.md` (existing)

---

## Dev Agent Record

### Agent Model Used
- Claude ( Sonnet 4 )

### Debug Log References

### Completion Notes List

### File List

**Backend Changes:**
- `apps/api/src/groups/groups.controller.ts` - Added `GET /:id/flashcard-decks` endpoint
- `apps/api/src/groups/groups.module.ts` - Added FlashcardsModule import
- `apps/api/src/flashcards/flashcards.service.ts` - Added `findAllByGroup` method
- `packages/database/prisma/schema.prisma` - Added `description` field to FlashcardDeck
- `apps/api/src/groups/groups.controller.spec.ts` - Updated test to include FlashcardsService mock

**Frontend Changes:**
- `apps/web/src/app/(dashboard)/group/[groupId]/flashcards/page.tsx` - New page
- `apps/web/src/app/(dashboard)/group/[groupId]/flashcards/_components/flashcard-deck-card.tsx` - Deck card component
- `apps/web/src/hooks/api/use-flashcard-queries.ts` - Added `useGroupFlashcardDecks` hook and `GroupFlashcardDeck` type
- `apps/web/src/lib/api/query-keys.ts` - Added `groupFlashcardDecks` query key