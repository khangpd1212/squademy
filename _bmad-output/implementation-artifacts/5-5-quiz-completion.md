---
id: 5.5
key: 5-5-quiz-completion
title: Quiz Completion
status: completed
epic: epic-5
priority: high
created: 2026-04-20
updated: 2026-04-21
---

# Story 5.5: Quiz Completion

## Story

**As a** Learner,
**I want** to complete quizzes attached to lessons or personal practice tests,
**So that** I can test my knowledge and get immediate feedback on my answers.

## Dependencies

- Story 5-3 (Flashcard Practice Session) — provides practice UI patterns and session handling
- Story 5-4 (Spaced Repetition) — provides SRS progress tracking (for practice test integration)
- Database schema for `Exercise`, `ExerciseQuestion`, `ExerciseSubmission` — **created if not exists**

## Assumptions

- **Online-only** — Unlike flashcard practice, quizzes require internet for server-side evaluation and scoring. No offline-first support.

---

## Acceptance Criteria

### Quiz Loading

1. [AC-1] **Given** I open a quiz linked to a lesson or a personal practice test, **when** the quiz loads via `GET /exercises/:exerciseId`, **then** questions are presented one at a time (per story: one-at-a-time for all quizzes)
2. [AC-2] **Given** questions are loaded, **when** rendering, **then** question types are rendered appropriately: MCQ (radio buttons), Fill in the Blank (text input), Cloze (inline blanks), Dictation (audio player + text input), IPA to Word (IPA display + text input)

### Authorization

2a. [AC-2a] **Given** I try to access a `group_challenge` exercise, **when** the exercise loads, **then** I must be a group member (via `GroupMemberGuard`)
2b. [AC-2b] **Given** I am not a group member, **when** I access the `group_challenge`, **then** a 403 error shows: "You must be a group member to access this challenge"

### Answer Evaluation

3. [AC-3] **Given** I answer a question and tap "Check" (or auto-check for MCQ), **when** the answer is evaluated client-side, **then** correct/incorrect feedback is shown immediately with color (green/red) — optimistic UI (NFR1: <200ms)
4. [AC-4] **Given** I submit an incorrect answer, **when** feedback is shown, **then** the correct answer is revealed for incorrect responses
5. [AC-4b] **Given** I submit a text answer (fill_blank, cloze, dictation, ipa_to_word), **when** evaluated, **then** answers are compared **case-insensitive** and **trimmed** before comparison

### Quiz Submission

6. [AC-5] **Given** I complete all questions in the quiz, **when** I tap "Submit", **then** `POST /exercises/:exerciseId/submissions` (JwtAuthGuard) creates an `exercise_submissions` row via Prisma with my answers as JSONB
7. [AC-6] **Given** submission is created, **when** displayed, **then** a results summary screen shows: score percentage, questions correct/total, time taken
8. [AC-6b] **Given** I start the quiz, **when** I interact with the first question input, **then** a timer starts counting seconds
9. [AC-6c] **Given** the timer is running, **when** I submit, **then** `timeTaken` is calculated as seconds from timer start to submission

### Offline Handling

10. [AC-10] **Given** I am offline, **when** I try to submit quiz, **then** an error message shows: "Internet connection required to submit quiz"

### Group Challenge Focus Mode

11. [AC-7] **Given** I am taking a Group Challenge exercise (type = `group_challenge`), **when** the exercise loads, **then** Focus Mode is activated: the browser attempts fullscreen via Fullscreen API, **but** if denied, continue without fullscreen (no error shown)
12. [AC-8] **Given** Focus Mode is active, **when** displayed, **then** a visible "Focus Mode Active" indicator is shown during the exercise

13. [AC-9] **Given** I navigate away from the browser tab during a Group Challenge exercise, **when** the `visibilitychange` event fires, **then** a `{ type: 'blur', timestamp: '...' }` entry is appended to `focus_events` in the submission
14. [AC-10] **Given** I return to the tab after navigating away, **when** the page regains focus, **then** a warning banner appears: "Tab switch detected. Your activity is being logged." and auto-dismisses after 3 seconds

---

## Technical Analysis

### Database Schema (TO BE CREATED IF NOT EXISTS)

**Location:** `packages/database/prisma/schema.prisma`

```prisma
model Exercise {
  id          String   @id @default(uuid())
  title       String
  type        String   // 'practice_test', 'group_challenge'
  groupId     String?
  lessonId    String?
  createdById String
  questions   ExerciseQuestion[]
  submissions ExerciseSubmission[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([groupId])
}

model ExerciseQuestion {
  id         String   @id @default(uuid())
  exerciseId String
  type       String   // 'mcq', 'fill_blank', 'cloze', 'dictation', 'ipa_to_word'
  prompt     String
  options    Json?    // Array for MCQ: [{ label, value }]
  answers    Json?    // Array for Cloze/multiple: [{ blankIndex, answer }] or single answer
  audioUrl   String?
  ipa        String?
  order      Int
  exercise   Exercise @relation(fields: [exerciseId], references: [id])

  @@index([exerciseId])
}

model ExerciseSubmission {
  id           String   @id @default(uuid())
  exerciseId  String
  userId      String
  answers     Json     // [{ questionId, answer, isCorrect }]
  score       Float?
  correctCount Int?
  totalCount  Int?
  timeTaken   Int      // Seconds
  focusEvents Json?   // [{ type: 'blur' | 'focus', timestamp }]
  submittedAt DateTime @default(now())

  @@index([exerciseId, userId])
}
```

### Backend API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/exercises/:exerciseId` | JwtAuthGuard | Get exercise with questions |
| GET | `/exercises/:exerciseId/submissions` | JwtAuthGuard | Get user's submissions for this exercise |
| POST | `/exercises/:exerciseId/submissions` | JwtAuthGuard | Submit quiz answers |

### Frontend Requirements

- Quiz page: `apps/web/src/app/(dashboard)/exercise/[exerciseId]/page.tsx`
- Question components: `apps/web/src/components/quiz/questions/`
- Results component: `apps/web/src/components/quiz/results-summary.tsx`
- Focus mode hooks: `apps/web/src/hooks/use-focus-mode.ts`

---

## Tasks / Subtasks

### Phase 1: Database Schema & Backend (PRIORITY)

- [x] **Task 1: Database Schema** — SKIP if exists, else CREATE (AC: 5, 9)
  - [x] 1.1: Check existing schema for Exercise models
  - [x] 1.2: If NOT exists, add to schema.prisma
  - [x] 1.3: Run `yarn db:generate` if schema created

- [x] **Task 2: Backend — GET /exercises/:exerciseId** (AC: 1, 2, 2a, 2b)
  - [x] 2.1: Create ExercisesController with GET endpoint
  - [x] 2.2: Add ExerciseService to fetch exercise with questions ordered by `order`
  - [x] 2.3: Add JwtAuthGuard
  - [x] 2.4: Check group membership if exercise.type = 'group_challenge'

- [x] **Task 3: Backend — POST /exercises/:exerciseId/submissions** (AC: 5, 6, 9)
  - [x] 3.1: Add POST endpoint for submissions
  - [x] 3.2: Implement answer evaluation (score calculation)
  - [x] 3.3: Store answers with isCorrect flags, score, timeTaken, focus_events
  - [x] 3.4: Add JwtAuthGuard

- [x] **Task 4: Backend — GET /exercises/:exercIseId/submissions** (New AC)
  - [x] 4.1: Allow user to see their submission history for an exercise
  - [x] 4.2: Return latest submission for results summary

### Phase 2: Frontend Quiz UI

- [x] **Task 5: Frontend — Quiz Page** (AC: 1, 6b, 6c, 10)
  - [x] 5.1: Create `apps/web/src/app/(dashboard)/exercise/[exerciseId]/page.tsx`
  - [x] 5.2: Add API hook to fetch exercise data
  - [x] 5.3: Add timer state (starts on first input interaction)
  - [x] 5.4: Add offline check before submit
  - [x] 5.5: Navigation guard (warn if leaving with unsaved answers)

- [x] **Task 6: Frontend — Question Components** (AC: 2, 3, 4, 5)
  - [x] 6.1: Create MCQ question component (radio buttons)
  - [x] 6.2: Create Fill in the Blank component (text input)
  - [x] 6.3: Create Cloze question component (numbered inline inputs)
  - [x] 6.4: Create Dictation component (audio player + text input)
  - [x] 6.5: Create IPA to Word component (IPA display + text input)
  - [x] 6.6: Implement case-insensitive, trimmed evaluation

- [x] **Task 7: Frontend — Results Summary** (AC: 6)
  - [x] 7.1: Create results summary component
  - [x] 7.2: Display score %, correct/total, time taken
  - [x] 7.3: Show per-question breakdown (optional: expandable)

### Phase 3: Group Challenge Focus Mode

- [x] **Task 8: Focus Mode Implementation** (AC: 7, 8, 11, 12)
  - [x] 8.1: Detect exercise type = 'group_challenge'
  - [x] 8.2: Attempt fullscreen (graceful fallback if denied)
  - [x] 8.3: Add "Focus Mode Active" indicator

- [x] **Task 9: Focus Event Tracking** (AC: 9, 14)
  - [x] 9.1: Add visibilitychange event listener
  - [x] 9.2: Track tab switches with timestamps
  - [x] 9.3: Add warning banner on return (auto-dismiss 3s)
  - [x] 9.4: Include focus_events in submission payload

---

## Technical Requirements

### API Endpoints Detail

```
GET /exercises/:exerciseId
  - Returns: { id, title, type, groupId?, lessonId?, questions: [...] }
  - Questions: [{ id, type, prompt, options?, audioUrl?, ipa?, order }]
  - Auth: JwtAuthGuard
  - Group check: if type='group_challenge', verify group membership (403 if fail)

POST /exercises/:exerciseId/submissions
  - Body: { answers: [{ questionId, answer }], timeTaken, focusEvents? }
  - Returns: { id, score, correctCount, totalCount, timeTaken }
  - Auth: JwtAuthGuard
  - Offline: return 400 "Internet connection required"

GET /exercises/:exerciseId/submissions
  - Returns: [{ id, score, timeTaken, submittedAt }]
  - Auth: JwtAuthGuard
```

### Focus Mode Implementation

```typescript
// Focus tracking hook
const useFocusMode = (exerciseType: string) => {
  const focusEvents = useRef<{ type: string; timestamp: string }[]>([]);

  useEffect(() => {
    if (exerciseType !== 'group_challenge') return;

    const handleVisibility = () => {
      if (document.hidden) {
        focusEvents.current.push({ type: 'blur', timestamp: new Date().toISOString() });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [exerciseType]);

  return focusEvents;
};

// Fullscreen with graceful fallback
const tryFullscreen = async () => {
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    // Silently fail - fullscreen is nice-to-have, not required
  }
};
```

### Text Answer Evaluation

```typescript
const evaluateAnswer = (userAnswer: string, correctAnswer: string): boolean => {
  const normalized = userAnswer.trim().toLowerCase();
  const correct = correctAnswer.trim().toLowerCase();
  return normalized === correct;
};
```

### Timer Implementation

```typescript
const [timerSeconds, setTimerSeconds] = useState(0);
const timerStarted = useRef(false);

const startTimer = () => {
  if (!timerStarted.current) {
    timerStarted.current = true;
    setInterval(() => setTimerSeconds(s => s + 1), 1000);
  }
};
```

### Question Types to Support

| Type | UI Component | Answer Format |
|------|-------------|---------------|
| mcq | Radio buttons | `{ questionId, answer: optionValue }` |
| fill_blank | Text input | `{ questionId, answer: string }` |
| cloze | Inline text inputs | `{ questionId, answer: [string, string, ...] }` |
| dictation | Audio + text input | `{ questionId, answer: string }` |
| ipa_to_word | IPA display + text input | `{ questionId, answer: string }` |

---

## Dev Notes

### Source References

- Epic 5 requirements: [Source: _bmad-output/planning-artifacts/epics/epic-5-practice-engine-flashcard-srs-quizzes.md#Story-5.5]
- Database schema: [Source: packages/database/prisma/schema.prisma]
- Story 5-3 (practice session): [Source: _bmad-output/implementation-artifacts/5-3-flashcard-practice-session-swipe-ui-offline-first.md]
- Story 5-4 (SRS): [Source: _bmad-output/implementation-artifacts/5-4-spaced-repetition-scheduling-sm-2.md]

### Implementation Order

1. **Database first** — create schema if not exists
2. **Backend API** — GET exercise with auth, POST submission with scoring
3. **Frontend Quiz UI** — page, question components, timer
4. **Focus Mode** — last (group_challenge specific only)

### Key Fixes Applied

- **Fixed:** Schema now has proper `answers` JSON array for Cloze
- **Fixed:** Added authorization AC (group membership check)
- **Fixed:** Added offline note (online-only, unlike flashcard)
- **Fixed:** Added text evaluation (case-insensitive, trimmed)
- **Fixed:** Added timer logic (start on first interaction)
- **Fixed:** Added fullscreen graceful fallback
- **Fixed:** Added submission history endpoint

### Key Points

- Reuse patterns from Story 5-3 (practice session UI components, animations)
- Client-side evaluation for immediate feedback (<200ms NFR)
- Focus mode is ONLY for `group_challenge` type exercises
- Timer starts on first input interaction, not page load

---

## Dev Agent Record

### Agent Model Used

big-pickle (opencode) + adversarial review

### Review Fixes Applied

1. Schema created with proper `answers` array for Cloze
2. Added AC-2a, AC-2b for authorization
3. Added AC-10 for offline handling
4. Added AC-4b, AC-6b, AC-6c for edge cases
5. Fixed Cloze answer format: `string[]` not `{ blankIndex: string }`
6. Added fullscreen graceful fallback note
7. Added AC-10: Offline check before submission ("Internet connection required to submit quiz")
8. Added DictationQuestion component with audio player
9. Fixed backend DTO to accept string[] for cloze questions

### Debug Log References

### Completion Notes List

- Backend exercises module was already fully implemented
- Frontend quiz page with all question types already implemented
- Added missing offline check (AC-10)
- Added missing audio player for dictation questions
- Fixed AnswerDto to accept string[] for cloze question answers
- TypeScript compilation passes
- Lint passes with minor warnings (unused vars)

### File List

- apps/api/src/exercises/dto/submit-answer.dto.ts (updated - answer type now accepts string[])
- apps/web/src/app/(dashboard)/exercise/[exerciseId]/page.tsx (updated - added DictationQuestion, offline check)