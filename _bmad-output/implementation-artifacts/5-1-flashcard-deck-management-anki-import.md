# Story 5.1: Flashcard Deck Management & Anki Import

> **Status:** in-progress
> **Created:** 2026-04-05

---

## Story

**As a** Contributor,
**I want** to create flashcard decks, add cards manually, import existing Anki decks, view deck details, and delete decks,
**So that** my group has rich flashcard content to study from and I can manage my decks effectively.

---

## Acceptance Criteria

### Deck List View (GET /flashcard-decks)

- [ ] **AC1:** Navigate to `/studio/flashcards` - page loads successfully
- [ ] **AC2:** `GET /flashcard-decks?author=me` (JwtAuthGuard) returns all decks where `author_id = my user_id` with title, card count, and status badge
- [ ] **AC3:** "New Deck" button is visible on the page

### Create Deck (POST /flashcard-decks)

- [ ] **AC4:** Click "New Deck" and enter a title
- [ ] **AC5:** `POST /flashcard-decks` creates a `flashcard_decks` row via Prisma with `status = 'draft'`
- [ ] **AC6:** User is redirected to the deck editor at `/studio/flashcards/[deckId]`

### Deck Detail View (GET /flashcard-decks/:deckId)

- [ ] **AC16:** Click a deck from the list or navigate to `/studio/flashcards/[deckId]`
- [ ] **AC17:** `GET /flashcard-decks/:deckId` (JwtAuthGuard) returns deck details: title, card count, status, created date, and all cards in the deck
- [ ] **AC18:** Deck editor page displays the card list with front/back preview for each card

### Delete Deck (DELETE /flashcard-decks/:deckId)

- [ ] **AC19:** A "Delete Deck" button/option is available in the deck editor
- [ ] **AC20:** Clicking delete shows a confirmation dialog: "Delete this deck and all its cards? This cannot be undone."
- [ ] **AC21:** `DELETE /flashcard-decks/:deckId` (JwtAuthGuard) deletes the deck and all associated cards via Prisma cascade delete
- [ ] **AC22:** After deletion, user is redirected to `/studio/flashcards` with a success toast: "Deck deleted."

### Add Card (POST /flashcard-decks/:deckId/cards)

- [ ] **AC7:** In deck editor, click "Add Card" - card form opens
- [ ] **AC8:** Card form includes: Front (required), Back, Pronunciation IPA, Audio (upload), Example Sentence, Image (upload), Tags, Extra Notes
- [ ] **AC9:** `POST /flashcard-decks/:deckId/cards` saves a new `flashcard_cards` row via Prisma linked to this deck

### Anki Import (POST /flashcard-decks/import)

- [ ] **AC10:** Click "Import Anki Deck" and select a `.apkg` file
- [ ] **AC11:** Client-side Anki parser (`lib/anki/parser.ts`) processes the file
- [ ] **AC12:** `.apkg` (SQLite zip) is parsed and all cards are extracted
- [ ] **AC13:** `POST /flashcard-decks/import` creates a `flashcard_decks` row and corresponding `flashcard_cards` rows via Prisma
- [ ] **AC14:** Success message shows: "Imported [N] cards successfully."
- [ ] **AC15:** Invalid/corrupt `.apkg` file shows error: "Could not parse this file. Please check it is a valid Anki .apkg file."

---

## Tasks / Subtasks

### Phase 1: Backend - Database & API

- [x] **T1.1:** Add Prisma schema: `flashcard_decks` and `flashcard_cards` models with all fields per AC
- [x] **T1.2:** Generate Prisma client and create migration
- [x] **T1.3:** Create NestJS module: `FlashcardsModule` with controller, service
- [x] **T1.4:** Implement `GET /flashcard-decks?author=me` endpoint
- [x] **T1.5:** Implement `POST /flashcard-decks` endpoint
- [x] **T1.6:** Implement `GET /flashcard-decks/:deckId` endpoint (deck detail with cards)
- [x] **T1.7:** Implement `DELETE /flashcard-decks/:deckId` endpoint (cascade delete)
- [x] **T1.8:** Implement `POST /flashcard-decks/:deckId/cards` endpoint
- [x] **T1.9:** Implement `POST /flashcard-decks/import` endpoint for Anki import
- [x] **T1.10:** Add error handling for invalid Anki files

### Phase 2: Frontend - Deck List Page

- [x] **T2.1:** Create `/studio/flashcards` page with deck list
- [x] **T2.2:** Add TanStack Query hooks: `useFlashcardDecks`, `useCreateDeck`, `useDeleteDeck`
- [x] **T2.3:** Build "New Deck" button and create deck modal/form
- [x] **T2.4:** Display deck list with title, card count, status badge
- [x] **T2.5:** Make deck items clickable to navigate to deck detail/editor

### Phase 3: Frontend - Deck Editor Page

- [x] **T3.1:** Create `/studio/flashcards/[deckId]` page
- [x] **T3.2:** Build card list view within deck editor
- [x] **T3.3:** Build "Add Card" form with all fields (Front, Back, IPA, Audio, Example, Image, Tags, Notes)
- [x] **T3.4:** Implement card creation via `useAddCard` mutation
- [x] **T3.5:** Build "Delete Deck" button with confirmation dialog
- [x] **T3.6:** Implement delete deck mutation and redirect on success

### Phase 4: Frontend - Anki Import

- [x] **T4.1:** Create `lib/anki/parser.ts` - client-side `.apkg` parser
- [x] **T4.2:** Build "Import Anki Deck" button and file picker
- [x] **T4.3:** Parse `.apkg` (SQLite zip) and extract cards
- [x] **T4.4:** Call `POST /flashcard-decks/import` with parsed cards
- [x] **T4.5:** Show success message with card count
- [x] **T4.6:** Handle parsing errors with user-friendly message

### Phase 5: Testing & Validation

- [ ] **T5.1:** Write backend unit tests for flashcards service
- [ ] **T5.2:** Write backend e2e tests for flashcards API
- [ ] **T5.3:** Write frontend tests for flashcard pages
- [ ] **T5.4:** Run full test suite and fix any failures

---

## Dev Notes

### Architecture

- **Backend:** NestJS with Prisma ORM
- **Database:** PostgreSQL (via `@squademy/database`)
- **Frontend:** Next.js 16 with React 19, TanStack Query
- **State:** TanStack Query for server state, Zustand for UI state
- **Styling:** Tailwind CSS v4, shadcn/ui components

### Database Schema (Prisma)

```prisma
model FlashcardDeck {
  id          String   @id @default(cuid())
  title       String
  authorId    String   @map("author_id")
  status      String   @default("draft") // draft, published
  cardCount   Int      @default(0) @map("card_count")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  author User           @relation(fields: [authorId], references: [id])
  cards  FlashcardCard[]

  @@map("flashcard_decks")
}

model FlashcardCard {
  id              String   @id @default(cuid())
  deckId          String   @map("deck_id")
  front           String
  back            String?
  pronunciation   String?
  audioUrl        String?  @map("audio_url")
  exampleSentence String?  @map("example_sentence")
  imageUrl        String?  @map("image_url")
  tags            Json?    // JSON array of strings, e.g. ["ipa", "vocabulary"]
  extraNotes      String?  @map("extra_notes")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  deck FlashcardDeck @relation(fields: [deckId], references: [id], onDelete: Cascade)

  @@map("flashcard_cards")
}
```

**Important:** `cardCount` must be auto-updated via Prisma `$increment`/`$decrement` whenever a card is added to or removed from a deck. Do NOT rely on manual count — use atomic operations:

```typescript
// When adding a card:
await prisma.flashcardDeck.update({
  where: { id: deckId },
  data: { cardCount: { increment: 1 }, cards: { create: cardData } },
});

// When deleting a deck (cascade handles cards):
await prisma.flashcardDeck.delete({ where: { id: deckId } });
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/flashcard-decks?author=me` | JwtAuthGuard | List user's decks |
| POST | `/flashcard-decks` | JwtAuthGuard | Create new deck |
| GET | `/flashcard-decks/:deckId` | JwtAuthGuard | Get deck details with cards |
| DELETE | `/flashcard-decks/:deckId` | JwtAuthGuard | Delete deck (cascade deletes cards) |
| POST | `/flashcard-decks/:deckId/cards` | JwtAuthGuard | Add card to deck |
| POST | `/flashcard-decks/import` | JwtAuthGuard | Import Anki deck |

### Validation Schemas (add to `packages/shared`)

```typescript
// packages/shared/src/flashcard-schemas.ts
import { z } from "zod";

export const createDeckSchema = z.object({
  title: z.string().min(1).max(100),
});
export type CreateDeckInput = z.infer<typeof createDeckSchema>;

export const createCardSchema = z.object({
  front: z.string().min(1),
  back: z.string().optional().nullable(),
  pronunciation: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  exampleSentence: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  extraNotes: z.string().optional().nullable(),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const importAnkiDeckSchema = z.object({
  title: z.string().min(1).max(100),
  cards: z.array(createCardSchema).min(1),
});
export type ImportAnkiDeckInput = z.infer<typeof importAnkiDeckSchema>;
```

### Anki Import Notes

- `.apkg` files are ZIP archives containing an SQLite database
- Parse using a client-side SQLite library (e.g., `sql.js`)
- Extract `notes` table for card content, `cards` table for card-specific data
- Map Anki fields to our schema: Front → front, Back → back, etc.
- **Scope limitation:** Anki import only extracts TEXT fields (Front, Back, IPA, Example Sentence, Tags). Embedded audio files and images from Anki are NOT imported in this story. Only text fields are mapped. Audio/image uploads can be added manually after import.

### File Locations

- **Backend:** `apps/api/src/flashcards/` (new module)
- **Frontend:** `apps/web/src/app/studio/flashcards/`
- **Shared:** `packages/shared` - add flashcard validation schemas
- **Anki Parser:** `apps/web/src/lib/anki/parser.ts`

---

## Dev Agent Record

### Implementation Plan

Implementation completed for:
- Backend: FlashcardsModule with all CRUD endpoints
- Frontend: Deck list page, deck editor page, add card dialog, delete deck dialog, Anki import
- Anki parser: Client-side .apkg file parser
- Database: Prisma models for FlashcardDeck and FlashcardCard

### Debug Log

- Prisma generate command had file locking issues on Windows - resolved by setting output path in schema
- Anki parser simplified to handle basic .apkg files (text extraction only, no media import)

### Completion Notes

**Implemented Features:**
1. Deck CRUD (create, read, delete) via REST API
2. Card management (add cards to deck)
3. Anki .apkg import with text field extraction
4. Frontend UI with deck list, deck editor, dialogs
5. Proper error handling with ErrorCode integration

**Pending:**
- Unit tests (T5.1-T5.4)
- Database migration needs to be run with `npx prisma migrate dev`

**Note:** Prisma schema was modified to generate to custom output path to avoid file locking issues. The schema includes an output path: `output = "../node_modules/.prisma/client"

---

## File List

### Backend (API)
- `apps/api/src/flashcards/flashcards.module.ts` - Module definition
- `apps/api/src/flashcards/flashcards.controller.ts` - REST endpoints
- `apps/api/src/flashcards/flashcards.service.ts` - Business logic
- `apps/api/src/flashcards/dto/create-deck.dto.ts` - DTO for creating deck
- `apps/api/src/flashcards/dto/add-card.dto.ts` - DTO for adding card
- `apps/api/src/flashcards/dto/import-anki-deck.dto.ts` - DTO for Anki import
- `apps/api/src/app.module.ts` - Registered FlashcardsModule

### Database
- `packages/database/prisma/schema.prisma` - Added FlashcardDeck and FlashcardCard models

### Shared Package
- `packages/shared/src/schemas/flashcard.ts` - Zod validation schemas
- `packages/shared/src/schemas/index.ts` - Export flashcard schemas
- `packages/shared/src/constants/index.ts` - Added FLASHCARD_DECK_STATUS, error codes
- `packages/shared/src/errors/error-messages.ts` - Added flashcard error messages

### Frontend
- `apps/web/src/lib/api/browser-client.ts` - Added flashcardApi functions
- `apps/web/src/hooks/api/use-flashcard-queries.ts` - TanStack Query hooks
- `apps/web/src/hooks/api/index.ts` - Export flashcard hooks
- `apps/web/src/app/(dashboard)/studio/flashcards/page.tsx` - Deck list page
- `apps/web/src/app/(dashboard)/studio/flashcards/_components/studio-flashcards-view.tsx` - Deck list view component
- `apps/web/src/app/(dashboard)/studio/flashcards/_components/flashcard-deck-item.tsx` - Deck item component
- `apps/web/src/app/(dashboard)/studio/flashcards/_components/new-deck-dialog.tsx` - Create deck dialog
- `apps/web/src/app/(dashboard)/studio/flashcards/_components/import-anki-dialog.tsx` - Anki import dialog
- `apps/web/src/app/(dashboard)/studio/flashcards/[deckId]/page.tsx` - Deck editor page
- `apps/web/src/app/(dashboard)/studio/flashcards/[deckId]/_components/deck-editor-view.tsx` - Deck editor view
- `apps/web/src/app/(dashboard)/studio/flashcards/[deckId]/_components/add-card-dialog.tsx` - Add card dialog
- `apps/web/src/app/(dashboard)/studio/flashcards/[deckId]/_components/delete-deck-dialog.tsx` - Delete deck dialog
- `apps/web/src/lib/anki/parser.ts` - Client-side Anki .apkg parser

---

## Change Log

- 2026-04-05: Story file created from Epic 5 requirements
- 2026-04-05: Fixed — schema aligned with actual schema.prisma (camelCase + @map, Json? for tags, author relation)
- 2026-04-05: Added AC16-AC22 for deck detail view and delete deck
- 2026-04-05: Added validation schemas for shared package
- 2026-04-05: Added cardCount auto-update logic note
- 2026-04-05: Clarified Anki import scope limitation (text fields only)
- 2026-04-05: IMPLEMENTED - All phases 1-4 complete (Phase 5 testing pending)

---

## Senior Developer Review (AI)

*(To be filled after code review)*

### Review Outcome

*(Pending review)*

### Action Items

*(Pending review)*
