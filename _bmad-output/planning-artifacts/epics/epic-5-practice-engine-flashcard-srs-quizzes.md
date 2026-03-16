# Epic 5: Practice Engine — Flashcard SRS & Quizzes

Learners can study flashcards with a mobile-optimized offline-first swipe interface, SM-2 spaced repetition scheduling, quiz completion, and inline card editing during study sessions.

### Story 5.1: Flashcard Deck Management & Anki Import

As a Contributor,
I want to create flashcard decks, add cards manually, and import existing Anki decks,
So that my group has rich flashcard content to study from.

**Acceptance Criteria:**

**Given** I navigate to `/studio/flashcards`
**When** the page loads
**Then** all flashcard decks where `author_id = my user_id` are listed with title, card count, and status badge
**And** a "New Deck" button is visible

**Given** I click "New Deck" and enter a title
**When** the deck is created
**Then** a `flashcard_decks` row is created with `status = 'draft'`
**And** I am redirected to the deck editor at `/studio/flashcards/[deckId]`

**Given** I am in the deck editor and click "Add Card"
**When** the card form opens
**Then** I can fill in: Front (required), Back, Pronunciation IPA, Audio (upload), Example Sentence, Image (upload), Tags, Extra Notes
**And** submitting saves a new `flashcard_cards` row linked to this deck

**Given** I click "Import Anki Deck" and select a `.apkg` file
**When** the client-side Anki parser (`lib/anki/parser.ts`) processes the file
**Then** the `.apkg` (SQLite zip) is parsed and all cards are extracted
**And** a new `flashcard_decks` row and corresponding `flashcard_cards` rows are inserted into Supabase
**And** a success message shows: "Imported [N] cards successfully."

**Given** I upload an `.apkg` file that is corrupt or not a valid Anki file
**When** the parser fails
**Then** an inline error appears: "Could not parse this file. Please check it is a valid Anki .apkg file."

---

### Story 5.2: Flashcard Practice Session (Swipe UI + Offline-First)

As a Learner,
I want to study flashcards with a Tinder-style swipe interface that works offline,
So that I can practice anywhere, even without an internet connection.

**Acceptance Criteria:**

**Given** I open a flashcard deck for the first time
**When** the practice session starts
**Then** the deck's cards are downloaded from Supabase and cached in Dexie.js (IndexedDB)
**And** subsequent opens of the same deck load cards from IndexedDB without any network request

**Given** I am in a practice session
**When** a card is shown
**Then** only the Front side is visible
**And** on mobile: tap the card center to flip; swipe left = Again, swipe right = Good (after flip only)
**And** on desktop: Space key = flip; ← key = Again, → key = Good (arrow keys disabled until card is flipped)
**And** keyboard hints ("← Again | Space Flip | → Good") are shown faded below the card on desktop

**Given** I flip a card (tap/Space)
**When** the flip animation plays
**Then** Framer Motion renders a 3D rotateY 180° spring animation
**And** the Back side content is revealed (meaning, IPA, example sentence, audio play button)

**Given** I grade a card as "Again" (swipe left / ← key)
**When** the grade is recorded
**Then** the card animates off-screen to the left
**And** the grade result is queued in Dexie `gradeQueue` if offline, or sent to Supabase immediately if online

**Given** I grade a card as "Good" (swipe right / → key)
**When** the grade is recorded
**Then** the card animates off-screen to the right with a green flash feedback

**Given** I complete all cards in the session
**When** the last card is graded
**Then** a Session Summary screen is shown: accuracy %, cards reviewed, current combo streak
**And** a "Keep Going" (study-ahead) CTA and a "Done" CTA are presented

**Given** I am offline during a session
**When** grade results accumulate in Dexie `gradeQueue`
**Then** on reconnect, `lib/dexie/sync.ts` flushes the queue to Supabase `srs_progress`
**And** an "Offline — changes will sync" banner is shown subtly at the top while offline

---

### Story 5.3: Spaced Repetition Scheduling (SM-2)

As a Learner,
I want the system to schedule which cards I should review each day based on my past performance,
So that I study efficiently and review cards just before I forget them.

**Acceptance Criteria:**

**Given** I grade a card during a practice session
**When** the SM-2 algorithm in `lib/srs/sm2.ts` runs client-side
**Then** the new `ease_factor`, `interval_days`, and `next_review_at` are calculated from the grade (0=Again, 1=Hard, 2=Good, 3=Easy)
**And** `srs_progress` is updated in Supabase (or queued in Dexie if offline)

**Given** I navigate to `/practice` (Daily Mix)
**When** the page loads
**Then** cards with `next_review_at <= now()` are surfaced as today's review batch
**And** the total count of due cards is shown prominently: "12 cards due today"

**Given** I complete all due cards for today
**When** the session ends
**Then** a "You're all caught up! 🎉" empty state is shown
**And** a "Study Ahead" button allows me to load additional cards beyond today's schedule (FR31a)

**Given** I click "Study Ahead"
**When** the action executes
**Then** cards with `next_review_at > now()` from any of my group's decks are loaded for optional extra practice
**And** grading these ahead-of-schedule cards still updates their SRS intervals normally

**Given** a card has been graded "Again" (grade = 0)
**When** SM-2 recalculates
**Then** `interval_days` resets to 1 and `repetitions` resets to 0
**And** the card re-appears in the current session immediately

---

### Story 5.4: Quiz Completion

As a Learner,
I want to complete quizzes attached to lessons or personal practice tests,
So that I can test my knowledge and get immediate feedback on my answers.

**Acceptance Criteria:**

**Given** I open a quiz linked to a lesson or a personal practice test
**When** the quiz loads
**Then** questions are presented one at a time (or all at once for short quizzes, per UX design)
**And** question types are rendered appropriately: MCQ (radio buttons), Fill in the Blank (text input), Cloze (inline blanks), Dictation (audio player + text input), IPA→Word (IPA display + text input)

**Given** I answer an MCQ question and submit
**When** the answer is evaluated client-side
**Then** correct/incorrect feedback is shown immediately with color (green/red) — optimistic UI (NFR1: <200ms)
**And** the correct answer is revealed for incorrect responses

**Given** I complete all questions in the quiz
**When** I submit the final answer
**Then** an `exercise_submissions` row is created with my answers as JSONB
**And** a results summary screen shows: score percentage, questions correct/total, time taken

**Given** I am taking a Group Challenge exercise (not a personal practice test)
**When** the exercise type is `group_challenge`
**Then** Focus Mode is activated: the browser attempts fullscreen, `visibilitychange` events are logged to the submission's `focus_events` JSONB array
**And** a visible "Focus Mode Active" indicator is shown during the exercise (FR24)

**Given** I navigate away from the browser tab during a Group Challenge exercise
**When** the `visibilitychange` event fires
**Then** a `{ type: 'blur', timestamp: '...' }` entry is appended to `focus_events` in the submission
**And** a warning banner appears when I return: "Tab switch detected. Your activity is being logged."

---

### Story 5.5: Inline Flashcard Editing During Study

As a Learner,
I want to edit a flashcard's content directly while studying it,
So that I can fix errors or add personal context without interrupting my study flow.

**Acceptance Criteria:**

**Given** I am in a flashcard practice session viewing any card
**When** I click the "Edit" icon on the card
**Then** the card fields (Front, Back, IPA, Tags, Extra Notes) become editable inline within the card UI

**Given** I make changes to a card and click "Save"
**When** the mutation runs
**Then** the `flashcard_cards` row is updated in Supabase immediately
**And** the card returns to study-mode view with the updated content
**And** my practice session continues from where I left off (the card is not re-graded)

**Given** I click "Cancel" while editing
**When** the action executes
**Then** no changes are saved and the card returns to its previous content in study-mode view

**Given** I clear the Front field (required) and try to save
**When** validation runs
**Then** an inline error appears: "Front side is required." and the save is not submitted

---
