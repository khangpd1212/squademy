---
id: 5.6
key: 5-6-inline-flashcard-editing-during-study
title: Inline Flashcard Editing During Study
status: ready-for-dev
epic: epic-5
priority: high
created: 2026-04-22
updated: 2026-04-22
---

# Story 5.6: Inline Flashcard Editing During Study

## Story

**As a** Learner,
**I want** to edit a flashcard's content directly while studying it,
**So that** I can fix errors or add personal context without interrupting my study flow.

**Context:**
- Flashcards are shared from Editor's deck (read-only in DB)
- Learner has personal copy in Dexie (editable)
- When Editor updates deck → auto-merge (preserve learner's notes)

---

## Acceptance Criteria

### Inline Editing

1. [AC-1] **Given** I am in a flashcard practice session viewing any card
   **When** I click the "Edit" icon on the card
   **Then** the card fields (Front, Back, IPA, Tags, Extra Notes) become editable inline

2. [AC-2] **Given** I make changes and click "Save"
   **When** the action executes
   **Then** the Dexie local copy is updated immediately
   **And** the card returns to study-mode view
   **And** my practice session continues (no re-grade)

3. [AC-3] **Given** I click "Cancel" while editing
   **When** the action executes
   **Then** no changes are saved and the card returns to previous content

4. [AC-4] **Given** I clear the Front field (required) and try to save
   **When** validation runs
   **Then** inline error: "Front side is required." and save is blocked

### Deck Ownership & Personalization

5. [AC-5] **Given** I access a shared deck for the first time
   **When** the deck loads
   **Then** a personal copy is created in Dexie (editable)
   **And** `sourceId` links to the original deck

6. [AC-6] **Given** I edit a card in my personal copy
   **When** the edit saves
   **Then** the change is ONLY in Dexie (not sent to server)
   **And** the shared deck remains unchanged

7. [AC-7] **Given** the Editor updates the shared deck
   **When** I open the deck next time
   **Then** auto-merge occurs:
   - New cards from source → added to personal
   - Edited cards in source → updated (learner notes preserved)
   - Removed cards → removed from display (kept in Dexie for history)

---

## Data Model

### Dexie Schema

```typescript
interface PersonalDeck {
  id: string;                    // "deckId_personal"
  sourceId: string;             // Reference to shared deck
  title: string;
  cards: PersonalCard[];
  sourceVersion: number;
  syncedAt: Date;
}

interface PersonalCard {
  id: string;
  sourceId: string;             // Link to shared card (null if learner-created)
  front: string;
  back: string;
  ipa?: string;
  tags?: string[];
  customNotes: string;          // Learner's personal annotations
  ease: number;
  interval: number;
  nextReview: Date;
}
```

### API - Sync Endpoints

```
GET /flashcard-decks/:deckId
  - Returns shared deck with cards

POST /flashcard-decks/:deckId/copy
  - Creates personal copy in Dexie (server-side tracking optional)
  - Returns: { personalDeckId, cards[] }
```

---

## Auto-Merge Logic

```typescript
async function autoMergeDeck(deckId: string) {
  const source = await apiRequest(`/flashcard-decks/${deckId}`);
  const personal = await dexie.decks.get(`${deckId}_personal`);
  
  if (source.version <= personal.sourceVersion) return; // No update needed
  
  // Merge cards: preserve learner's customNotes
  const mergedCards = source.cards.map(sc => {
    const existing = personal.cards.find(c => c.sourceId === sc.id);
    return {
      ...sc,
      sourceId: sc.id,
      customNotes: existing?.customNotes ?? "",
      ease: existing?.ease ?? 2.5,
      interval: existing?.interval ?? 0,
      nextReview: existing?.nextReview ?? calculateNext(sc.ease, sc.interval),
    };
  });
  
  await dexie.decks.update(personal.id, {
    cards: mergedCards,
    sourceVersion: source.version,
  });
}
```

---

## Tasks

### Phase 1: Core Data Model

- [ ] **Task 1: Dexie Schema** - Add PersonalDeck, PersonalCard types
- [ ] **Task 2: Copy Logic** - Create personal copy on first access
- [ ] **Task 3: Auto-Merge** - Sync changes from shared deck

### Phase 2: Inline Editing UI

- [ ] **Task 4: Edit Mode UI** - Inline fields, Save/Cancel buttons
- [ ] **Task 5: Validation** - Front required check
- [ ] **Task 6: Session Preservation** - Continue after edit

### Phase 3: Edge Cases

- [ ] **Task 7: Offline Handling** - Queue edits for sync when online
- [ ] **Task 8: Conflict Resolution** - If source deleted while editing

---

## Dev Notes

### References

- Story 5-3 (Flashcard Practice Session): practice session UI patterns
- Dexie integration: offline-first architecture from Story 5-3
- Source deck: read-only, cannot be modified by learner

### Key Architecture

```
Source Deck (Server) ────────────────────────── Editor owns
    │                                          │
    │  copy on first access                     │
    ↓                                          │
Personal Deck (Dexie) ───────────────────────── Learner owns
    │ (editable)                                 │
    │                                            │
    ├──► Edit card → Dexie only                  │
    ├──► Editor update → Auto-merge             │
    └──► Personal notes preserved on merge      │
```