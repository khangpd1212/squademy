# Epic 6: Exercise Studio & Peer-Review Loop

Contributors can create exercises using templates and macros. The system performs a weekly derangement shuffle to assign exercises. Members complete assigned exercises, creators grade with line-level feedback, threaded debates resolve disagreements, and disputes are escalated and resolved by Editors.

### Story 6.1: Exercise Studio — Create Exercise with Templates

As a Contributor,
I want to create exercises using pre-built question type templates,
So that I can quickly produce well-formatted group challenges or personal practice tests.

**Acceptance Criteria:**

**Given** I navigate to `/studio/exercises`
**When** the page loads
**Then** my existing exercises are listed with title, type badge (Group Challenge / Personal Practice), week cycle, and status
**And** a "New Exercise" button is visible

**Given** I click "New Exercise" and choose "Group Challenge" or "Personal Practice"
**When** the exercise is created
**Then** an `exercises` row is created with the appropriate `type` and current `week_cycle`
**And** I am redirected to the exercise editor at `/studio/exercises/[exerciseId]`

**Given** I am in the exercise editor and click a template button in the toolbar
**When** I select MCQ, Fill in the Blank, Cloze Test, Matching, True/False/Not Given, Paragraph Writing, or Alive Text Block
**Then** a pre-formatted question block is inserted into the Tiptap editor with placeholder content
**And** each question block has a color-coded header gradient and a delete button (FR22)

**Given** I paste quiz content from an external source (e.g. ChatGPT output)
**When** I trigger "Auto-Format Pasted Content"
**Then** the pasted text is reformatted to match the platform's question template structure (FR20)
**And** the formatted questions are inserted as properly structured question blocks

**Given** I finish editing and click "Save"
**When** the auto-save or manual save runs
**Then** `exercises.content` (Tiptap JSON) is persisted to Supabase
**And** the exercise is listed with "Draft" status in my exercise list

---

### Story 6.2: Flashcard Macro Exercise Generator

As a Contributor,
I want to auto-generate quiz questions from my group's flashcard decks,
So that I can create exercises quickly without manually retyping flashcard content.

**Acceptance Criteria:**

**Given** I am in the exercise editor and click "Flashcard Macro"
**When** the macro picker opens
**Then** I can select a flashcard deck or filter by unit/tags from my group's published decks

**Given** I select a deck and choose a question type: Word→Definition, Sound→Word, IPA→Word, or Word→Free-text Sentence
**When** I click "Generate"
**Then** the system generates question blocks from the selected flashcard data (FR21)
**And** the generated questions are inserted into the exercise editor as properly formatted question blocks
**And** I can review, edit, or delete individual generated questions before saving

**Given** the selected deck has no cards matching the chosen filter
**When** generation runs
**Then** an inline message appears: "No cards found matching this filter. Try a different deck or tag."

---

### Story 6.3: Weekly Exercise Submission & Derangement Shuffle

As a group member,
I want to submit my weekly exercise before the deadline so the system can assign me a peer's exercise to complete,
So that our group's mandatory reciprocal practice loop can run each week.

**Acceptance Criteria:**

**Given** it is a new week cycle (Monday 00:00 per cron schedule)
**When** the weekly-start cron runs at `/api/cron/weekly-start`
**Then** a new `week_cycle` is registered in the system
**And** all group members with `type = 'group_challenge'` exercises are expected to submit before the deadline

**Given** I have a drafted Group Challenge exercise
**When** I click "Submit Exercise"
**Then** the exercise `type` is confirmed as `group_challenge` and it is linked to the current `week_cycle`
**And** the exercise is marked as submitted and locked for editing
**And** my submission appears in the group's exercise list as "Submitted"

**Given** the weekly deadline passes (Saturday 23:59 per cron schedule)
**When** the weekly-shuffle cron runs at `/api/cron/weekly-shuffle`
**Then** the derangement algorithm (`lib/shuffle/derangement.ts`) runs on all submitted group challenge exercises for the week
**And** `exercise_assignments` rows are created — each member receives exactly one exercise created by another member (no self-assignment)
**And** no member receives their own exercise (derangement guarantee)

**Given** only 1 member submitted an exercise (edge case)
**When** the shuffle runs
**Then** no assignment is created for that week (solo mode — shuffle requires minimum 2 participants)

**Given** exactly 2 members submitted exercises (edge case)
**When** the shuffle runs
**Then** member A receives member B's exercise and member B receives member A's exercise (only valid derangement for n=2)

---

### Story 6.4: Complete & Submit Assigned Exercise

As a group member,
I want to open and complete the exercise assigned to me by the peer-review shuffle,
So that I fulfil my weekly accountability obligation and contribute to my peer's learning loop.

**Acceptance Criteria:**

**Given** I have been assigned an exercise via the derangement shuffle
**When** I navigate to my group's exercises page
**Then** my assigned exercise is prominently shown with creator name, title, and deadline
**And** a "Start Exercise" button is visible

**Given** I click "Start Exercise"
**When** the exercise opens
**Then** the questions render in the correct format (MCQ, Fill, Cloze, Dictation, IPA→Word) as authored by the creator
**And** if it is a Group Challenge, Focus Mode activates (tab-switch logging as per Story 5.4)

**Given** I complete all questions and click "Submit Answers"
**When** the submission executes
**Then** an `exercise_submissions` row is created with my `submitter_id`, `exercise_id`, and `answers` JSONB
**And** the creator receives a notification (Epic 7): "Your exercise has been submitted by [name]!"
**And** the exercise is marked as "Submitted" in my assignment list

**Given** I try to submit without answering all required questions
**When** validation runs
**Then** unanswered questions are highlighted in red
**And** an inline message appears: "Please answer all questions before submitting."

---

### Story 6.5: Peer Grading with Line-Level Feedback

As an exercise creator,
I want to grade my peer's submitted answers and provide line-level feedback,
So that my peer receives meaningful, specific guidance on their performance.

**Acceptance Criteria:**

**Given** a peer has submitted answers to my exercise
**When** I navigate to the review queue at `/review/exercise/[submissionId]`
**Then** each question is shown with the peer's answer alongside the correct answer
**And** MCQ questions show an "Auto-graded" tag with the result already computed
**And** Fill-in-the-blank and Free-text questions show ✓ Correct and ✗ Incorrect buttons for manual grading

**Given** I click ✓ Correct or ✗ Incorrect on a manual-grade question
**When** the action is recorded
**Then** a `peer_review_comments` row is created with `question_ref`, `decision` (correct/incorrect), and optional `body` text
**And** the question is marked with a green or red indicator

**Given** I have graded all questions and click "Submit Grade"
**When** the action executes
**Then** the `peer_reviews` row is updated with `status = 'graded'` and `overall_score`
**And** the submitter receives a notification (Epic 7): "Your exercise has been graded!"

**Given** I graded an exercise and want to revise my decision after reflection
**When** I return to the review and update a grade decision
**Then** the `peer_review_comments` decision is updated
**And** `peer_reviews.overall_score` is recalculated (FR39)

---

### Story 6.6: Threaded Debate & Dispute Escalation

As an exercise taker,
I want to debate a grade I disagree with and escalate to an Editor if we can't agree,
So that incorrect exercise questions can be fairly adjudicated.

**Acceptance Criteria:**

**Given** I have received a grade I disagree with
**When** I view my graded submission
**Then** each graded question shows a "Dispute this question" flag button (FR40a)

**Given** I click "Dispute this question" and enter a reason
**When** I submit the dispute
**Then** an `exercise_disputes` row is created with `status = 'open'`, `reporter_id`, `question_ref`, and `reason`
**And** the creator receives a notification: "A dispute has been filed on your exercise."

**Given** a dispute is open on a question
**When** the creator and I view the submission
**Then** a threaded debate panel is shown below the disputed question (FR38)
**And** both parties can post replies — `peer_review_comments` rows with `parent_id` chaining

**Given** both parties agree on an outcome in the debate thread
**When** the creator updates their grade decision
**Then** `exercise_disputes.status` is updated to `'resolved'`
**And** weekly error counts are updated accordingly (FR40c/FR40d)

**Given** the debate remains unresolved and I click "Escalate to Editor"
**When** the escalation executes
**Then** `exercise_disputes` is flagged for editor review
**And** an Editor in the group receives a notification: "A dispute requires your arbitration."

**Given** the weekly exercise period ends (Sunday 23:59 cron)
**When** the weekly-close cron runs at `/api/cron/weekly-close`
**Then** all `exercises` with the closing `week_cycle` have `is_public` set to `true` (FR40e)
**And** these exercises appear in the group's public exercise archive for additional unscored practice

---

### Story 6.7: Editor Arbitration Decision & Error Settlement

As an Editor,
I want to review escalated exercise disputes and issue a binding arbitration decision,
So that dispute outcomes are finalized fairly and weekly error counts are applied correctly (FR40b/FR40c/FR40d).

**Acceptance Criteria:**

**Given** an `exercise_disputes` record is marked for editor review
**When** I navigate to `/review/exercise/[submissionId]`
**Then** I can view the disputed question, the reporter reason, and the full debate thread

**Given** I select "Rule: Creator is wrong"
**When** I submit the arbitration decision
**Then** `exercise_disputes.status` is updated to `'resolved'`
**And** `exercise_disputes.arbitration_decision` is set to `'creator_wrong'`
**And** creator weekly error count is incremented according to FR40c
**And** both creator and taker receive a dispute resolved notification

**Given** I select "Rule: Taker is wrong"
**When** I submit the arbitration decision
**Then** `exercise_disputes.status` is updated to `'resolved'`
**And** `exercise_disputes.arbitration_decision` is set to `'taker_wrong'`
**And** taker weekly error count is incremented according to FR40d
**And** both creator and taker receive a dispute resolved notification

**Given** I am not an Editor in the group
**When** I attempt to submit an arbitration decision
**Then** access is denied by role-based authorization

---

