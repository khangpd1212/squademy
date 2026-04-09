---
id: 5.3
key: 5-3-flashcard-practice-session-swipe-ui-offline-first
title: Flashcard Practice Session (Swipe UI + Offline-First)
status: backlog
epic: epic-5
priority: high
created: 2026-04-09
updated: 2026-04-09
---

# Story 5.3: Flashcard Practice Session (Swipe UI + Offline-First)

## User Story

**As a** Learner,
I want to study flashcards with a Tinder-style swipe interface that works offline,
So that I can practice anywhere, even without an internet connection.

## Dependencies

- Story 5-2 (Group Flashcard Browser) - entry point to practice
- Story 5-1 (Flashcard Deck Management) - cards come from decks

---

## Acceptance Criteria

### Practice Session (Swipe UI)

1. [AC-1] **Given** I start a practice session, **when** the session loads, **then** cards are downloaded via `GET /flashcard-decks/:deckId/cards` and cached in Dexie.js (IndexedDB) for offline use
2. [AC-2] **Given** subsequent opens of the same deck, **when** loading, **then** cards are loaded from IndexedDB without any network request
3. [AC-3] **Given** I am in a practice session, **when** a card is shown, **then** only the Front side is visible
4. [AC-4] **Given** I am on mobile and view a card, **when** I tap the card center, **then** the card flips with a 3D rotateY animation (Framer Motion)
5. [AC-5] **Given** I flip a card, **when** the flip animation plays, **then** Framer Motion renders a 3D rotateY 180deg spring animation
6. [AC-6] **Given** I flip a card, **when** the flip completes, **then** the Back side content is revealed (meaning, IPA, example sentence, audio play button)
7. [AC-7] **Given** I am on mobile and the card is flipped, **when** I swipe left, **then** the card is graded as "Again" and animates off-screen to the left
8. [AC-8] **Given** I am on mobile and the card is flipped, **when** I swipe right, **then** the card is graded as "Good" and animates off-screen to the right with green flash feedback
9. [AC-9] **Given** I am on desktop and view a card, **when** I press Space, **then** the card flips
10. [AC-10] **Given** I am on desktop and the card is flipped, **when** I press Arrow Left, **then** the card is graded as "Again" (keys disabled until flip)
11. [AC-11] **Given** I am on desktop and the card is flipped, **when** I press Arrow Right, **then** the card is graded as "Good"
12. [AC-12] **Given** I am on desktop, **when** the card is shown, **then** keyboard hints are shown faded below the card: "Space to flip, ← → to grade"

### Grade Recording

13. [AC-13] **Given** I grade a card as "Again" (swipe left / Arrow Left), **when** the grade is recorded, **then** the grade result is queued in Dexie `gradeQueue` if offline, or sent to NestJS API via `POST /srs-progress` immediately if online
14. [AC-14] **Given** I grade a card as "Good" (swipe right / Arrow Right), **when** the grade is recorded, **then** the grade is sent to API or queued similarly

### Offline Support

15. [AC-15] **Given** I am offline during a session, **when** I grade cards, **then** grades are queued in Dexie `gradeQueue`
16. [AC-16] **Given** I am offline and grades accumulate in Dexie `gradeQueue`, **when** I reconnect, **then** `lib/dexie/sync.ts` flushes the queue to NestJS API via `POST /srs-progress/batch`
17. [AC-17] **Given** I am offline, **when** viewing the flashcards page or practice session, **then** an "Offline — changes will sync" banner is shown subtly at the top

### Session Summary

18. [AC-18] **Given** I complete all cards in the session, **when** the last card is graded, **then** a Session Summary screen is shown with: accuracy %, cards reviewed
19. [AC-19] **Given** the session ends, **when** summary is shown, **then** "Continue" (study more) and "Done" buttons are presented

---

## Tasks / Subtasks

- [ ] Task 1: Frontend - Practice Session Page (AC: 1-3)
  - [ ] 1.1: Create `/group/[groupId]/flashcards/[deckId]/page.tsx`
  - [ ] 1.2: Fetch cards via `useFlashcardCards` hook
  - [ ] 1.3: Implement Dexie.js caching for offline
- [ ] Task 2: Card Display & Flip (AC: 4-6)
  - [ ] 2.1: Implement card component with Front/Back
  - [ ] 2.2: Add Framer Motion 3D rotateY flip animation
  - [ ] 2.3: Render Back side content (meaning, IPA, audio)
- [ ] Task 3: Swipe Gestures (AC: 7-8)
  - [ ] 3.1: Add @use-gesture/react for swipe handling
  - [ ] 3.2: Implement "Again" (swipe left) and "Good" (swipe right)
  - [ ] 3.3: Add card exit animations
- [ ] Task 4: Keyboard Controls (AC: 9-12)
  - [ ] 4.1: Implement Space to flip
  - [ ] 4.2: Implement Arrow Left/Right for grading
  - [ ] 4.3: Disable arrow keys until card is flipped
  - [ ] 4.4: Add keyboard hints UI
- [ ] Task 5: Grade Recording (AC: 13-14)
  - [ ] 5.1: Create `useGradeCard` mutation
  - [ ] 5.2: Implement offline queue in Dexie
- [ ] Task 6: Session Summary (AC: 18-19)
  - [ ] 6.1: Calculate accuracy % and cards reviewed
  - [ ] 6.2: Create summary UI component
  - [ ] 6.3: Implement "Continue" and "Done" buttons

---

## Technical Requirements

### Frontend Routes

```
apps/web/src/app/(dashboard)/group/[groupId]/flashcards/[deckId]/
└── page.tsx                            # Practice session page
```

### Component Structure

```
group/[groupId]/flashcards/_components/
├── flashcard-practice-session.tsx      # Main practice component
├── flashcard-card.tsx                  # Single card with flip
├── flashcard-card-front.tsx            # Front side
├── flashcard-card-back.tsx             # Back side
├── session-summary.tsx                 # Summary after completion
└── keyboard-hints.tsx                  # Desktop keyboard hints
```

### API Endpoints

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/flashcard-decks/:deckId/cards` | JwtAuthGuard | Get cards for practice |
| POST | `/srs-progress` | JwtAuthGuard | Save grade result |
| POST | `/srs-progress/batch` | JwtAuthGuard | Batch save grades (offline sync) |

### Dexie.js Schema

```typescript
// lib/dexie/flashcards.ts
interface FlashcardDB {
  decks: {
    id: string;
    cards: FlashcardCard[];
    cachedAt: number;
  };
  gradeQueue: {
    id?: number;
    deckId: string;
    cardId: string;
    grade: number; // 0=Again, 1=Good
    createdAt: number;
  };
}
```

### Key Libraries

- **Dexie.js**: Offline storage for cards and grade queue
- **Framer Motion**: 3D flip animation (rotateY 180deg spring)
- **@use-gesture/react**: Swipe gesture handling

---

## Dev Notes

### Project Structure Alignment

- Cards cached in IndexedDB on first load
- Serve from cache on subsequent opens
- Only load Dexie.js on flashcard routes (per architecture)

### Architecture Notes

- Grade queue stored locally, synced on reconnect
- Session state managed with Zustand or React state

### Testing Standards

- Component tests for FlashcardCard, PracticeSession, SessionSummary
- E2E test: flip → grade → complete flow

### References

- Epic 5: `_bmad-output/planning-artifacts/epics/epic-5-practice-engine-flashcard-srs-quizzes.md`
- Story 5-2: `5-2-group-flashcard-browser.md` (browser entry point)
- Dexie setup: `_bmad-output/planning-artifacts/architecture.md` (section on Dexie.js)

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List