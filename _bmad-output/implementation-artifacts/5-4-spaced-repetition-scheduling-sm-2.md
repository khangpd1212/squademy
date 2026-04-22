---
id: 5.4
key: 5-4-spaced-repetition-scheduling-sm-2
title: Spaced Repetition Scheduling (SM-2)
status: done
epic: epic-5
priority: high
created: 2026-04-17
updated: 2026-04-17
---

# Story 5.4: Spaced Repetition Scheduling (SM-2)

## Story

**As a** Learner,
**I want** the system to schedule which cards I should review each day based on my past performance,
**So that** I study efficiently and review cards just before I forget them.

## Dependencies

- Story 5-3 (Flashcard Practice Session) — provides the practice UI and grade handling
- Database schema for `SRSProgress` — already exists in `schema.prisma`

---

## Acceptance Criteria

### SM-2 Algorithm Implementation

1. [AC-1] **Given** I grade a card during a practice session, **when** the SM-2 algorithm runs client-side, **then** the new `ease_factor`, `interval_days`, and `next_review_at` are calculated from the grade (0=Again, 1=Hard, 2=Good, 3=Easy)
2. [AC-2] **Given** the SM-2 calculation completes, **when** online, **then** `srs_progress` is updated via NestJS API `POST /srs-progress` immediately
3. [AC-3] **Given** I am offline, **when** grading, **then** the grade is queued in Dexie `gradeQueue` and synced when online

### Due Cards Query

4. [AC-4] **Given** I navigate to `/group/[groupId]/flashcards/[deckId]` (Daily Mix), **when** the page loads, **then** `GET /srs-progress/due` (JwtAuthGuard) returns cards with `next_review_date <= now()` as today's review batch
5. [AC-5] **Given** due cards are fetched, **when** displaying, **then** the total count of due cards is shown prominently: "12 cards due today"

### Study Ahead

6. [AC-6] **Given** I complete all due cards for today, **when** the session ends, **then** a "You're all caught up!" empty state is shown
7. [AC-7] **Given** the empty state is shown, **when** displayed, **then** a "Study Ahead" button allows loading additional cards beyond today's schedule
8. [AC-8] **Given** I click "Study Ahead", **when** the action executes, **then** `GET /srs-progress/ahead` returns cards with `next_review_date > now()` from any of my group's decks for optional extra practice
9. [AC-9] **Given** I study ahead cards, **when** I grade them, **then** their SRS intervals are updated normally

### Reset on Again

10. [AC-10] **Given** a card has been graded "Again" (grade = 0), **when** SM-2 recalculates, **then** `interval_days` resets to 1 and `repetitions` resets to 0
11. [AC-11] **Given** a card is reset, **when** the session loads, **then** the card re-appears in the current session immediately (within same session if due)

---

## Technical Analysis

### Current State (as of 2026-04-17)

**Backend API (`apps/api/src/srs-progress/`) — ⚠️ PARTIAL:**
- `POST /srs-progress` ✅ exists
- `POST /srs-progress/batch` ✅ exists
- `GET /srs-progress/due` ❌ NOT implemented
- `GET /srs-progress/ahead` ❌ NOT implemented
- **SM-2 algorithm incorrect** — uses simplified logic (grade 0 = interval 1, else = interval 3), NOT proper SM-2

**Database (`packages/database/prisma/schema.prisma`) — ✅ COMPLETE:**
```prisma
model SRSProgress {
  id            String   @id @default(uuid())
  userId        String
  deckId        String
  cardId        String
  grade         Int       @default(0)
  nextReviewDate DateTime?
  lastReviewDate DateTime?
  interval      Int       @default(1)
  easeFactor    Float     @default(2.5)
  createdAt     DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, cardId])
  @@index([userId, nextReviewDate])
}
```

**Frontend Practice Session (`apps/web/src/app/(dashboard)/group/[groupId]/flashcards/[deckId]/) — ✅ DONE (Story 5.3):**
- Page exists: `page.tsx`
- Card component: `flashcard-card.tsx`
- Session summary: `session-summary.tsx`
- Swipe + keyboard handling works
- Grade recording works (queued in Dexie, synced via API)

**Frontend MISSING for SM-2:**
- Client-side SM-2 algorithm library (`lib/srs/sm2.ts`)
- `GET /srs-progress/due` hook
- `GET /srs-progress/ahead` hook
- Due cards count display
- Study Ahead feature
- "All caught up" empty state UI

---

## Tasks / Subtasks

### Phase 1: SM-2 Algorithm Library

- [x] **Task 1: Create Client-Side SM-2 Library** (AC: 1, 10, 11)
  - [x] 1.1: Create `apps/web/src/lib/srs/sm2.ts` with SM-2 algorithm
  - [x] 1.2: Implement `calculateSM2(card, grade)` function returning `{ easeFactor, interval, nextReviewDate, repetitions }`
  - [x] 1.3: Handle grades 0-3 mapping to SM-2 quality q (0=Again→0, 1=Hard→2, 2=Good→3, 3=Easy→5)
  - [x] 1.4: Implement reset logic for grade 0 (interval=1, repetitions=0)
  - [x] 1.5: Minimum ease factor 1.3

### Phase 2: Backend Due/Ahead Endpoints

- [x] **Task 2: Backend — Add GET /srs-progress/due** (AC: 4)
  - [x] 2.1: Add `GET /srs-progress/due` endpoint in `srs-progress.controller.ts`
  - [x] 2.2: Add `getDueCards(userId, groupId?)` in `srs-progress.service.ts`
  - [x] 2.3: Return cards where `next_review_date <= now()` ordered by `next_review_date ASC`

- [x] **Task 3: Backend — Add GET /srs-progress/ahead** (AC: 8)
  - [x] 3.1: Add `GET /srs-progress/ahead` endpoint in `srs-progress.controller.ts`
  - [x] 3.2: Add `getAheadCards(userId, groupId?)` in `srs-progress.service.ts`
  - [x] 3.3: Return cards where `next_review_date > now()` for optional practice

- [x] **Task 4: Backend — Fix SM-2 Algorithm in Service** (AC: 2)
  - [x] 4.1: Replace simplified `calculateNextReview`, `calculateInterval`, `calculateEase` with proper SM-2
  - [x] 4.2: Store `repetitions` count for proper SM-2
  - [x] 4.3: Add `repetitions` field to `SRSProgress` upsert

### Phase 3: Frontend Hooks & Integration

- [x] **Task 5: Frontend — Add SRS Query Hooks** (AC: 4, 8)
  - [x] 5.1: Create `apps/web/src/hooks/api/use-srs-progress.ts`
  - [x] 5.2: Add `useDueCards(deckId?)` query hook for `GET /srs-progress/due`
  - [x] 5.3: Add `useAheadCards(deckId?)` query hook for `GET /srs-progress/ahead`
  - [x] 5.4: Add query keys to `query-keys.ts`

- [x] **Task 6: Frontend — Due Cards Count Display** (AC: 5)
  - [x] 6.1: Integrate due cards query into practice session page
  - [x] 6.2: Display "X cards due today" prominently on page load

- [x] **Task 7: Frontend — Study Ahead Feature** (AC: 6, 7, 8, 9)
  - [x] 7.1: Create "All caught up" empty state component
  - [x] 7.2: Add "Study Ahead" button
  - [x] 7.3: Fetch and display ahead cards when clicked
  - [x] 7.4: Ensure ahead cards update SRS normally when graded

### Phase 4: Integration with Practice Session

- [x] **Task 8: Integrate SM-2 into Practice Session** (AC: 1, 2, 3, 10, 11)
  - [x] 8.1: Import SM-2 library in practice session page
  - [x] 8.2: Calculate new SRS values on every grade
  - [x] 8.3: Send calculated values (not just grade) to backend
  - [x] 8.4: Update Dexie cache with new SRS values
  - [x] 8.5: Handle immediate re-appearance for "Again" graded cards

---

## Technical Requirements

### SM-2 Algorithm (per SuperMemo SM-2)

```typescript
// SM-2 Quality grades input:
// 0 = Again (complete blackout)
// 1 = Hard (incorrect, but upon seeing correct answer, remembered)
// 2 = Good (correct with difficulty)
// 3 = Easy (correct with perfect recall)

// SM-2 Formula:
// q = quality (0-5 mapped from grade: 0→0, 1→2, 2→3, 3→5)
// EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
// EF minimum = 1.3
// I(1) = 1, I(2) = 6, I(n) = I(n-1) * EF for n > 2
```

### Backend File Changes

```
apps/api/src/srs-progress/
���── srs-progress.controller.ts    # + GET /due, GET /ahead
├── srs-progress.service.ts     # + getDueCards, getAheadCards, fix SM-2
└── srs-progress.module.ts     # (no changes)
```

### Frontend File Changes

```
apps/web/src/lib/srs/
└── sm2.ts                    # NEW - SM-2 algorithm

apps/web/src/hooks/api/
└── use-srs-progress.ts       # NEW - due/ahead query hooks

apps/web/src/app/(dashboard)/group/[groupId]/flashcards/[deckId]/
└── page.tsx                 # MODIFY - integrate SM-2, due count
```

### API Endpoints Required

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/srs-progress/due` | Get cards due today |
| GET | `/srs-progress/ahead` | Get cards for study ahead |
| POST | `/srs-progress` | ✅ Already exists (needs SM-2 fix) |
| POST | `/srs-progress/batch` | ✅ Already exists |

### Database Schema (Existing)

```prisma
model SRSProgress {
  id              String   @id @default(uuid())
  userId          String
  deckId          String
  cardId          String
  grade           Int      @default(0)
  nextReviewDate  DateTime?
  lastReviewDate  DateTime?
  interval        Int      @default(1)
  easeFactor      Float    @default(2.5)
  repetitions     Int      @default(0)  // NEW - need to add
  createdAt       DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([userId, cardId])
  @@index([userId, nextReviewDate])
}
```

### Testing Requirements

- Unit test SM-2 algorithm with known values
- Test edge cases: grade 0 resets, minimum ease factor 1.3
- Integration test for due cards query
- Test study ahead flow

---

## Dev Notes

### Source References

- Epic 5 requirements: [Source: _bmad-output/planning-artifacts/epics/epic-5-practice-engine-flashcard-srs-quizzes.md#Story-5.4]
- Architecture SM-2: [Source: _bmad-output/planning-artifacts/architecture.md#5.3-SRS-Scheduling-SM-2]
- Database schema: [Source: packages/database/prisma/schema.prisma#model-SRSProgress]
- Story 5.3 (practice session): [Source: _bmad-output/implementation-artifacts/5-3-flashcard-practice-session-swipe-ui-offline-first.md]

### Implementation Order

1. **Backend first** — due/ahead endpoints needed for queries
2. **SM-2 library** — client-side algorithm
3. **Frontend hooks** — integrate with practice session
4. **Study Ahead** — empty state UI

### Key Points

- Story 5.3 practice session is already done — this story extends it with SM-2
- The current `SrsProgressService.calculateNextReview` is completely wrong (always 1 or 3 days) — needs full SM-2
- Need to add `repetitions` field to schema for proper SM-2
- Client-side SM-2 runs on grade, sends full SRS update to backend

---

## Dev Agent Record

### Agent Model Used

big-pickle (opencode)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

1. ✅ **Task 1 (SM-2 Library)**: Created `sm2.ts` with proper SM-2 algorithm implementation. Fixed test expectations to match standard SM-2 (first review: interval=1, second: interval=6, subsequent: interval * EF).

2. ✅ **Task 2 & 3 (Backend Endpoints)**: Verified GET `/srs-progress/due` and GET `/srs-progress/ahead` already implemented. Fixed TypeScript error in `recordGrades` method by using proper transaction callback pattern.

3. ✅ **Task 4 (Backend SM-2)**: Verified SM-2 algorithm in backend service is correct. Fixed `$transaction` usage to properly handle async operations.

4. ✅ **Task 5 (Frontend Hooks)**: Verified `useDueCards` and `useAheadCards` hooks exist. Updated `SRSProgressWithCard` type to include all required card fields.

5. ✅ **Task 6 & 7 (UI Features)**: Refactored practice session page to:
   - Use due cards as primary data source
   - Show "X cards due today" prominently in header
   - Show "You're all caught up!" empty state when no due cards
   - Support Study Ahead mode with "Back to Due Cards" button

6. ✅ **Task 8 (SM-2 Integration)**: Updated `recordGrade` function and Dexie sync to accept SRS values. Fixed lint errors by deriving `currentIndex` from `grades.length`.

### File List

**Modified:**
- `apps/api/src/srs-progress/srs-progress.service.ts` - Fixed transaction pattern
- `apps/web/src/hooks/api/use-srs-progress.ts` - Added missing card fields
- `apps/web/src/types/flashcard.ts` - Added SRS fields to GradeQueueItem
- `apps/web/src/lib/dexie/flashcards.ts` - Added SRS parameter support
- `apps/web/src/lib/dexie/sync.ts` - Added SRS values parameter to recordGrade
- `apps/web/src/app/(dashboard)/group/[groupId]/flashcards/[deckId]/page.tsx` - Full refactor for due cards + study ahead

**Created:**
- `apps/web/src/lib/srs/sm2.ts` - SM-2 algorithm library
- `apps/web/src/lib/srs/sm2.test.ts` - Unit tests for SM-2 algorithm