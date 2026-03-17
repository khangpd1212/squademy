# Squademy — Architecture Decision Record

**Version:** 2.0  
**Date:** 2026-03-12  
**Based on:** PRD v1.0 + UX Design Specification v1.0  
**Constraint:** Zero-OPEX (free-tier infrastructure only)

---

## 1. Overview

Squademy is a **hybrid SPA/MPA** web application with a strict mobile-first paradigm. The architecture is shaped by two hard constraints:

1. **Zero-OPEX** — No paid infrastructure. Every technology choice must operate within free tiers.
2. **Dual Accountability Loop** — Content Loop (lesson contribution → editorial gate) and Practice Loop (exercise creation → derangement shuffle → peer grading) are the core product mechanics. The architecture must serve these loops reliably.

See [Section 12 — Stack Summary](#12-stack-summary) for a full quick-reference table.

---

## 2. Frontend

### 2.1 Full Stack Table

| Component | Technology | Role |
|-----------|-----------|------|
| Framework | **Next.js** (App Router) | Routing, SSR/SSG, Server Components, Route Handlers |
| Internationalization | **next-intl** | Request-scoped locale/messages (`src/i18n/request.ts`), server/client translation APIs, and `NextIntlClientProvider` wiring in root layout |
| Styling | **Tailwind CSS v4** | Utility-first, mobile-first, dark/light mode via class strategy |
| UI Components | **shadcn/ui** | Form, Table, Dialog, Dropdown, Toast — copied into repo for full ownership |
| Forms | **React Hook Form (RHF)** | Form state, minimal re-renders |
| Validation | **Zod** | Shared schema: forms + API boundary |
| Client State | **Zustand** | UI state: flashcard session, quiz in-progress, sidebar open, theme |
| Server State | **TanStack Query** | Data fetching, caching, mutations; `queryFn` calls Supabase client |
| Rich Text | **Tiptap (Community)** | WYSIWYG for Lesson Creator + Exercise Creator (Confluence-style toolbar) |
| Gestures / Animation | **Framer Motion** | Flashcard 3D flip, swipe gestures, Alive Text dissolve, page transitions, micro-interactions |
| Offline Cache | **Dexie.js** | IndexedDB wrapper: cache flashcard decks offline, queue grade results when offline |
| Auth / DB | **@supabase/supabase-js** | Supabase client: query DB, Auth session, Realtime subscriptions |
| Anki Import | **Custom Parser** | Parse `.apkg` (SQLite zip) client-side; extract cards → insert into Supabase |
| PDF/DOCX Export | **Client-side** | `html2canvas` + `jsPDF` for PDF; `docx` library for DOCX (NFR4: client-side, < 3s) |
| SRS Algorithm | **SM-2 variant** | Client-side scheduling; next review interval computed from grade history stored in Dexie + synced to Supabase |
| Icon System | **Lucide React** | Consistent, thin-stroke icons — no emoji in UI |
| Unit Testing | **Jest + Testing Library** | Component and utility unit tests (`next/jest` config, `jsdom` environment) |

### 2.2 Directory Structure (Next.js App Router)

Route groups, private folders (`_components`), and colocation by feature:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                  # Centered form layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard layout (sidebar, header)
│   │   ├── loading.tsx                 # Global dashboard skeleton
│   │   ├── error.tsx                   # Dashboard error boundary
│   │   ├── group/
│   │   │   └── [groupId]/
│   │   │       ├── layout.tsx          # Group layout (tabs, breadcrumb)
│   │   │       ├── page.tsx            # Group home / Learning Path
│   │   │       ├── lessons/page.tsx
│   │   │       ├── exercises/page.tsx
│   │   │       ├── leaderboard/page.tsx
│   │   │       ├── members/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       └── _components/        # Segment-local components
│   │   ├── studio/
│   │   │   ├── lessons/
│   │   │   │   ├── page.tsx            # Lesson list
│   │   │   │   ├── [lessonId]/page.tsx # Tiptap editor
│   │   │   │   └── _components/
│   │   │   ├── exercises/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [exerciseId]/page.tsx
│   │   │   │   └── _components/
│   │   │   └── flashcards/
│   │   │       ├── page.tsx
│   │   │       ├── [deckId]/page.tsx
│   │   │       └── _components/
│   │   ├── practice/
│   │   │   ├── page.tsx                # Daily Mix / deck picker
│   │   │   └── [deckId]/page.tsx       # Flashcard session (offline-first)
│   │   ├── review/
│   │   │   ├── page.tsx                # Review queue (distraction-free)
│   │   │   ├── lesson/[reviewId]/page.tsx
│   │   │   └── exercise/[submissionId]/page.tsx
│   │   └── settings/page.tsx
│   ├── admin/
│   │   ├── layout.tsx                  # Admin-only layout
│   │   ├── page.tsx                    # System health dashboard
│   │   ├── users/page.tsx
│   │   ├── groups/page.tsx
│   │   └── content/page.tsx            # Content moderation queue
│   ├── api/
│   │   ├── auth/callback/route.ts      # Supabase OAuth callback
│   │   ├── files/
│   │   │   ├── upload/route.ts         # Proxy upload → Cloudflare R2
│   │   │   └── signed-url/route.ts     # Generate R2 signed URL
│   │   ├── export/
│   │   │   └── route.ts                # Server-side DOCX fallback if needed
│   │   ├── cron/
│   │   │   ├── reminders/route.ts      # Vercel Cron: email reminders
│   │   │   └── weekly-shuffle/route.ts # Vercel Cron: derangement shuffle + assignment
│   │   └── webhooks/
│   │       └── [...slug]/route.ts      # Optional: external webhook receiver
│   ├── layout.tsx                      # Root layout (fonts, ThemeProvider)
│   ├── page.tsx                        # Landing / redirect to dashboard
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── global-error.tsx
├── components/
│   ├── ui/                             # shadcn components
│   ├── layout/                         # Header, Sidebar, MobileNav, BottomTabBar
│   ├── flashcard/                      # FlashcardCard, FlashcardDeck, SRSController
│   ├── quiz/                           # QuizRunner, MCQ, ClozeTest, Dictation, IPAWord
│   ├── editor/                         # TiptapEditor, toolbar, Alive Text extension
│   ├── peer-review/                    # ReviewLayout, LineComment, DebateThread
│   ├── gamification/                   # StreakBadge, LeaderboardRow, ContributorBadge
│   └── notifications/                  # InAppNotification, NotificationBell
├── hooks/
│   ├── useSupabase.ts
│   ├── useAuth.ts
│   ├── useRealtime.ts
│   ├── useOfflineSync.ts               # Dexie.js sync logic
│   └── useSRS.ts                       # SM-2 next interval calculation
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client (createBrowserClient)
│   │   ├── server.ts                   # Server-only (RSC, Route Handlers)
│   │   └── proxy.ts               # Supabase middleware helpers (imported by proxy)
│   ├── dexie/
│   │   ├── db.ts                       # Dexie schema (decks, cards, gradeQueue)
│   │   └── sync.ts                     # Sync queue → Supabase when online
│   ├── r2/
│   │   └── client.ts                   # S3-compatible R2 operations (server-only)
│   ├── srs/
│   │   └── sm2.ts                      # SM-2 algorithm: ease factor, interval calc
│   ├── anki/
│   │   └── parser.ts                   # .apkg (SQLite zip) → card objects
│   ├── export/
│   │   ├── pdf.ts                      # html2canvas + jsPDF client-side
│   │   └── docx.ts                     # docx library client-side
│   ├── shuffle/
│   │   └── derangement.ts              # Fisher-Yates derangement for peer swap
│   ├── query-client.ts
│   └── utils.ts
├── i18n/
│   └── request.ts                      # next-intl request config (locale + messages)
├── stores/                             # Zustand stores
│   ├── flashcardStore.ts               # Active deck, current card index, session state
│   ├── quizStore.ts                    # Active quiz, answers, timer, focus mode
│   ├── uiStore.ts                      # Sidebar, theme, notifications panel
│   └── offlineStore.ts                 # Online/offline status, sync pending count
├── types/
│   ├── database.ts                     # Supabase generated types (supabase gen types)
│   └── app.ts                          # App-level types (roles, SRS grades, etc.)
├── styles/
│   └── globals.css                     # Tailwind @theme, design tokens
└── proxy.ts                            # Session refresh, admin route guard (Next.js 16 proxy entrypoint)
```

Additional root-level i18n files:

messages/
└── en.json                             # Default translation messages


tests/                                  # Integration/smoke-style repository tests
jest.config.cjs                         # next/jest-based config with @/* alias
jest.setup.ts                           # @testing-library/jest-dom setup


### 2.3 Data Flow

- **Server state (Supabase):** React Query (`useQuery` / `useMutation`). All DB reads/writes go through `queryFn`/`mutationFn` calling Supabase client. Cache invalidation on Realtime events.
- **Auth:** Supabase Auth (session in cookie). `middleware.ts` refreshes session. Server Components and Route Handlers use `createServerClient` for server-side user context.
- **Realtime:** Supabase channel `.on('postgres_changes', ...)` → `queryClient.invalidateQueries(...)` or `setQueryData` for leaderboard and notification badge updates.
- **Offline-first (Flashcards):** Decks downloaded once → stored in Dexie (IndexedDB). Practice runs fully offline. Grade results queued in Dexie `gradeQueue`. On reconnect, `sync.ts` flushes queue to Supabase and updates SRS intervals.
- **Client-only state:** Zustand (current card, quiz answers, sidebar open, theme preference).

### 2.4 Theming — Light / Dark Mode

Using Tailwind CSS v4 class strategy with `@custom-variant dark (&:where(.dark, .dark *))`:

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Background | `zinc-50` | `zinc-950` |
| Card/Surface | `white` | `zinc-900` |
| Border | `zinc-200` | `zinc-800` |
| Text Primary | `zinc-900` | `zinc-100` |
| Text Secondary | `zinc-500` | `zinc-400` |
| Brand Purple | `#7C3AED` (purple-600) | `purple-400` |
| Success/Correct | `emerald-500/600` | `emerald-400/500` |
| Streak/Warning | `amber-700` | `orange-400` |
| Error/Incorrect | `red-500` | `red-400` |

**Zone accent colors:**
- Practice Zone: Purple (`--brand-purple`)
- Grammar Blog / Lesson Zone: Teal (`--brand-teal`, `#0D9488`)
- Studio / Review Zone: Neutral / Dark (no accent glow)

### 2.5 Typography

| Context | Font | Rationale |
|---------|------|-----------|
| Headers / UI General | `Nunito` | Rounded, playful, reduces "study pressure" |
| Body / Reading / Blog | `Inter` | Standard sans-serif, optimal for long-form reading |
| Code / IPA / Keyboard Hints | `Fira Code` | Monospace, activates analytical focus mode |

---

## 3. Backend — Supabase

### 3.1 Supabase Components Used

| Component | Purpose |
|-----------|---------|
| **Postgres** | All structured data: users, groups, lessons, exercises, submissions, reviews, comments, streaks, leaderboard, notifications |
| **Auth** | Email/password + OAuth (Google); JWT + session cookie; `auth.uid()` used in all RLS policies |
| **Realtime** | Leaderboard live updates, in-app notification badge count (postgres_changes subscriptions) |
| **Edge Functions** (optional) | Email sending via Resend/Brevo; complex cron logic if Vercel Cron quota insufficient |
| **RLS (Row Level Security)** | Every table has policies; access controlled by `auth.uid()` + `group_members` role |

### 3.2 Database Schema

#### Auth & Profile

```sql
-- Managed by Supabase Auth
auth.users (id uuid, email, ...)

-- Public profile (PII separated for GDPR tombstoning)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  avatar_url text,        -- R2 URL
  -- PII fields (tombstoned on deletion)
  full_name text,
  school text,
  location text,
  age int,
  created_at timestamptz DEFAULT now()
)
```

#### Groups & Membership

```sql
groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code text UNIQUE,   -- generated slug for invite link
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
)

group_members (
  group_id uuid REFERENCES groups(id),
  user_id uuid REFERENCES profiles(id),
  role text CHECK (role IN ('admin', 'editor', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
)

-- Direct invitations by username
group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  invited_by uuid REFERENCES profiles(id),
  invitee_id uuid REFERENCES profiles(id),
  status text CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now()
)
```

#### Content — Lessons

```sql
lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  author_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  content jsonb,           -- Tiptap ProseMirror JSON
  content_markdown text,   -- Denormalized for export
  status text CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  editor_feedback text,    -- Rejection reason (line-level via review_comments)
  sort_order int,          -- Position in Learning Path
  is_deleted boolean DEFAULT false,  -- Soft delete
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Line-level comments on lessons (editor feedback + social hotspots)
review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id),
  user_id uuid REFERENCES profiles(id),
  line_ref text,           -- e.g., "paragraph-3" or character offset
  body text NOT NULL,
  parent_id uuid REFERENCES review_comments(id),  -- threaded
  created_at timestamptz DEFAULT now()
)

-- Social reactions on lesson paragraphs
lesson_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id),
  user_id uuid REFERENCES profiles(id),
  paragraph_ref text,      -- paragraph identifier
  reaction_type text CHECK (reaction_type IN ('heart', 'thinking', 'bulb')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (lesson_id, user_id, paragraph_ref, reaction_type)
)
```

#### Content — Flashcards

```sql
flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  lesson_id uuid REFERENCES lessons(id) NULL,  -- optional: linked lesson
  author_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  status text CHECK (status IN ('draft', 'review', 'published')),
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

flashcard_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES flashcard_decks(id),
  front text NOT NULL,
  back text,
  pronunciation_ipa text,
  audio_url text,          -- R2 URL
  image_url text,          -- R2 URL
  example_sentence text,
  tags text[],
  extra_notes text,
  sort_order int,
  created_at timestamptz DEFAULT now()
)

-- SRS progress per user per card
srs_progress (
  user_id uuid REFERENCES profiles(id),
  card_id uuid REFERENCES flashcard_cards(id),
  ease_factor float DEFAULT 2.5,   -- SM-2: difficulty multiplier
  interval_days int DEFAULT 1,     -- days until next review
  repetitions int DEFAULT 0,       -- number of successful reviews
  next_review_at timestamptz,
  last_reviewed_at timestamptz,
  PRIMARY KEY (user_id, card_id)
)
```

#### Exercises & Peer Review

```sql
exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  lesson_id uuid REFERENCES lessons(id) NULL,
  creator_id uuid REFERENCES profiles(id),
  title text,
  content jsonb,           -- Tiptap JSON: questions array
  type text CHECK (type IN ('group_challenge', 'personal_practice')),
  week_cycle text,         -- ISO week: "2026-W11"
  scheduled_at timestamptz,
  deadline_at timestamptz,
  is_public boolean DEFAULT false,  -- true after week ends (FR40e)
  created_at timestamptz DEFAULT now()
)

-- Round-robin shuffle assignments (derangement result)
exercise_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid REFERENCES exercises(id),
  assignee_id uuid REFERENCES profiles(id),
  week_cycle text,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (exercise_id, assignee_id)
)

exercise_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid REFERENCES exercises(id),
  submitter_id uuid REFERENCES profiles(id),
  answers jsonb,           -- array of {question_id, answer, auto_grade_result}
  submitted_at timestamptz DEFAULT now()
)

peer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES exercise_submissions(id),
  reviewer_id uuid REFERENCES profiles(id),  -- exercise creator
  status text CHECK (status IN ('pending', 'graded', 'disputed', 'arbitrated')),
  overall_score numeric(5,2),
  reviewed_at timestamptz
)

-- Line-level grading comments + debate threads
peer_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_review_id uuid REFERENCES peer_reviews(id),
  question_ref text,       -- which question this comment refers to
  author_id uuid REFERENCES profiles(id),
  body text NOT NULL,
  decision text CHECK (decision IN ('correct', 'incorrect', NULL)),
  parent_id uuid REFERENCES peer_review_comments(id),  -- threaded debate
  created_at timestamptz DEFAULT now()
)

-- Dispute escalations (FR40a-40d)
exercise_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_review_id uuid REFERENCES peer_reviews(id),
  question_ref text,
  reporter_id uuid REFERENCES profiles(id),
  reason text NOT NULL,
  status text CHECK (status IN ('open', 'resolved')),
  arbiter_id uuid REFERENCES profiles(id) NULL,   -- editor who arbitrates
  arbitration_decision text CHECK (arbitration_decision IN ('creator_wrong', 'taker_wrong', NULL)),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
)
```

#### Gamification

```sql
streaks (
  user_id uuid REFERENCES profiles(id),
  group_id uuid REFERENCES groups(id),
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_activity_at timestamptz,
  PRIMARY KEY (user_id, group_id)
)

-- Weekly error tracking (for dispute scoring)
weekly_errors (
  user_id uuid REFERENCES profiles(id),
  group_id uuid REFERENCES groups(id),
  week_cycle text,
  error_count int DEFAULT 0,
  PRIMARY KEY (user_id, group_id, week_cycle)
)

badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  group_id uuid REFERENCES groups(id),
  badge_type text CHECK (badge_type IN ('first_contribution', 'streak_7', 'streak_30', 'top_contributor', 'editor_approved')),
  awarded_at timestamptz DEFAULT now()
)

-- Leaderboard: materialized view or function-based
-- Computed from: submissions + peer_reviews + streaks + badges
-- Updated via Realtime trigger or periodic recalc
leaderboard (
  group_id uuid REFERENCES groups(id),
  user_id uuid REFERENCES profiles(id),
  total_score int DEFAULT 0,
  week_score int DEFAULT 0,
  rank int,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
)
```

#### Notifications

```sql
notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id),
  type text CHECK (type IN (
    'exercise_assigned',       -- new exercise assigned via shuffle
    'submission_received',     -- creator: peer submitted answers
    'grading_complete',        -- taker: creator graded submission
    'lesson_approved',         -- contributor: lesson published
    'lesson_rejected',         -- contributor: lesson rejected with feedback
    'editor_review_request',   -- editor: new lesson in queue
    'exercise_reminder',       -- deadline approaching
    'grading_reminder',        -- pending grading approaching deadline
    'dispute_opened',          -- creator/taker: dispute filed
    'dispute_resolved',        -- creator/taker: editor arbitrated
    'streak_milestone'         -- streak badge earned
  )),
  reference_id uuid,           -- polymorphic: submission_id, lesson_id, etc.
  reference_type text,         -- 'submission' | 'lesson' | 'dispute' | etc.
  body text,
  is_read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)
```

### 3.3 Row Level Security (RLS) Summary

All tables have RLS enabled. Key policies:

| Table | SELECT | INSERT | UPDATE/DELETE |
|-------|--------|--------|---------------|
| `lessons` | group member | group member | author (own draft); editor (status update) |
| `exercises` | group member | group member | creator (own exercise) |
| `exercise_submissions` | creator + submitter | assignee only | submitter (before grading) |
| `peer_reviews` | creator + submitter | creator only | creator (own review) |
| `srs_progress` | own records only | self | self |
| `notifications` | own records only | server (service_role) | self (mark read) |
| `leaderboard` | group member | server only | server only |

Sensitive admin operations (bulk delete, tombstoning, leaderboard recalc) use `service_role` key exclusively from Route Handlers or Edge Functions — never exposed to client.

### 3.4 Realtime Subscriptions

| Channel | Table | Event | FE Action |
|---------|-------|-------|-----------|
| `leaderboard:group:{id}` | `leaderboard` | UPDATE | `queryClient.invalidateQueries(['leaderboard', groupId])` |
| `notifications:user:{id}` | `notifications` | INSERT | Increment badge count; `setQueryData` |
| `reviews:group:{id}` | `peer_review_comments` | INSERT | Invalidate debate thread query |

---

## 4. FE ↔ BE Connection Patterns

### 4.1 Structured Data (Supabase)

- **Browser (client components):** `createBrowserClient` with `anon` key. RLS enforces all access control.
- **Server (RSC, Route Handlers):** `createServerClient` with session cookie. For admin operations: `service_role` key, server-only, never in client bundle.
- **Pattern:** All React Query `queryFn`/`mutationFn` call Supabase client directly. No custom REST API layer needed for CRUD.

### 4.2 File Storage (Cloudflare R2)

Two upload strategies:

1. **Proxied Upload** (sensitive files): `POST /api/files/upload` → Next.js Route Handler → R2 SDK. File URL stored in Postgres.
2. **Signed URL** (large files, audio recordings): `GET /api/files/signed-url?key=...` → Route Handler generates pre-signed R2 URL → client uploads directly to R2. Avoids Vercel serverless memory limits.

```
Browser ──POST multipart──► /api/files/upload (Route Handler)
                                    │
                                    └──► R2 SDK ──► Cloudflare R2
                                    └──► Supabase: store URL in DB
```

### 4.3 Offline-First Pattern (Flashcards)

```
First Open:
  Browser ──► /api/decks/{id} ──► Supabase ──► cards[]
           ──► Dexie.js: store deck + cards in IndexedDB

Subsequent Opens (same deck):
  Browser ──► Dexie.js: serve from IndexedDB (no network)
           ──► Practice offline

Grade Submission:
  If online:   ──► Supabase: POST srs_progress update immediately
  If offline:  ──► Dexie gradeQueue: push {card_id, grade, timestamp}
               ──► On reconnect: sync.ts flushes queue to Supabase
```

### 4.4 Real-Time Strategy (SSE vs WebSocket)

Per PRD NFR3: **SSE (Server-Sent Events) preferred over WebSocket** to minimize infrastructure cost.

- Supabase Realtime uses WebSocket internally but is managed infrastructure (counts toward free tier, not self-hosted WSS).
- Custom real-time needs (if any) use SSE via Next.js Route Handler `ReadableStream` response.
- **No self-hosted WebSocket server** — aligns with zero-OPEX.

---

## 5. Server-Side Logic

### 5.1 Weekly Exercise Lifecycle (Cron)

Managed by Vercel Cron (`vercel.json` schedule) calling Route Handlers:

```
Monday 00:00 (start of week):
  GET /api/cron/weekly-start
  → Create new week_cycle entry
  → Send email: "Create your exercise by {deadline}!"

Saturday 23:59 (deadline):
  GET /api/cron/weekly-shuffle
  → Collect all submitted group_challenge exercises for week_cycle
  → Run derangement shuffle (lib/shuffle/derangement.ts)
  → INSERT exercise_assignments (each member ← one peer exercise)
  → Send email: "Your assigned exercise from {creator} is ready!"
  → INSERT notifications (type: 'exercise_assigned')

Sunday (grading reminder):
  GET /api/cron/reminders
  → Find pending peer_reviews older than 24h
  → Send reminder email to reviewers
  → INSERT notifications (type: 'grading_reminder')

Sunday 23:59 (end of week):
  GET /api/cron/weekly-close
  → UPDATE exercises SET is_public = true WHERE week_cycle = current (FR40e)
  → Recalculate leaderboard scores
  → Award streak badges
```

### 5.2 Derangement Shuffle Algorithm

Located in `lib/shuffle/derangement.ts`. Implements a **Fisher-Yates derangement** (no element maps to its original position):

```typescript
// Guaranteed: assignments[i] !== i (no self-assignment)
function derangement(n: number): number[]

// Usage in /api/cron/weekly-shuffle:
// 1. Get member list [A, B, C, D, E]
// 2. Get their submitted exercise IDs
// 3. Apply derangement: member[i] receives exercise[derangement[i]]
// Edge case: n=1 → no shuffle possible; skip assignment (solo mode)
// Edge case: n=2 → A gets B's, B gets A's (only valid derangement)
```

### 5.3 SRS Scheduling (SM-2)

Located in `lib/srs/sm2.ts`. Client-side computation, server stores results:

```typescript
// Input: current ease_factor, interval, repetitions, grade (0-5)
// Output: new ease_factor, interval (days), next_review_at
function sm2(card: SRSCard, grade: number): SRSUpdate

// Grades: 0=Again (reset), 1=Hard, 2=Good, 3=Easy
// SM-2 formula: new_interval = interval * ease_factor
// Ease factor adjusted: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
// Minimum EF: 1.3
```

### 5.4 Email Notifications

Rate limiting to stay within free-tier quotas:

```
Email triggers:
  - exercise_assigned: immediate (after shuffle)
  - editor_review_request: immediate (lesson submitted)
  - lesson_approved/rejected: immediate
  - exercise_reminder: 1 day before deadline (cron)
  - grading_reminder: 1 day before grading deadline (cron)

Rate limits:
  - Max 1 reminder email per user per 24h
  - Large groups (>20 members): batch digest instead of individual
  - Fallback: if email quota exceeded → INSERT notification only (in-app)
```

Sent via Resend/Brevo API from Next.js Route Handler or Supabase Edge Function.

### 5.5 Leaderboard Score Calculation

```sql
-- Score components (example weights):
-- Exercise submission: +10 pts
-- Peer review completed: +15 pts
-- Lesson approved: +25 pts
-- Streak day: +5 pts
-- Error incurred (dispute lost): -5 pts

-- Recalculated via cron at end of week
-- Realtime: incremental UPDATE on each action (for live feel)
```

---

## 6. Novel UX Features — Architecture Notes

### 6.1 Alive Text

Tiptap custom extension (`AlivTextExtension`). Stores hidden content as a node attribute:

```typescript
// In Tiptap JSON (lesson content):
{ type: 'alive_text', attrs: { hidden: true }, content: [...] }

// Rendering (React component):
// hidden=true → render as <AnimatedDots> (Framer Motion, purple pulsing)
// onClick → animate dots dissolve → reveal original text
// Track: alive_text_interactions in Supabase for "deep reading" metric
```

### 6.2 Social Hotspots

Paragraph-level reactions and comment anchors in lesson view:

```typescript
// Each paragraph renders with:
// - hover → show margin reaction buttons (❤️ 🤔 💡)
// - reaction stored in lesson_reactions table
// - comment thread expanded inline below paragraph
// - comment count badge shown on margin

// Mobile: tap paragraph → bottom sheet with reactions + thread
// Desktop: floating margin alongside paragraph
```

### 6.3 Focus Mode (Anti-Cheat)

Activated during timed `group_challenge` exercises (FR24):

```typescript
// On exercise start:
// - Enter fullscreen API (if available)
// - Add 'beforeunload' event listener
// - Add 'visibilitychange' listener → log tab-switch events

// Tab-switch events stored in exercise_submissions.answers JSONB:
{ ..., focus_events: [{ type: 'blur', timestamp: '...' }, ...] }

// Logged for editor/admin review — no automatic penalty in MVP
```

### 6.4 Flashcard Keyboard Controller (Desktop)

Framer Motion + keyboard event binding:

```typescript
// Space → flip card (rotateY 180deg, spring physics)
// Arrow Left (after flip) → grade: Again (swipe left animation)
// Arrow Right (after flip) → grade: Good (swipe right animation)
// Arrow Left/Right disabled until card is flipped (anti-mistouch)

// Mobile: tap center → flip; swipe left/right → grade
// Visual: Keyboard Hints shown faded below card on desktop
```

---

## 7. GDPR / PDPA Compliance Architecture

### 7.1 PII Separation

The `profiles` table is the only table containing PII (`full_name`, `school`, `location`, `age`, `email` via `auth.users`). All other tables reference `user_id` (UUID). This isolation enables clean tombstoning.

### 7.2 Account Deletion Flow (NFR6, NFR7)

```
User requests deletion:
  1. GDPR request logged with 24h SLA
  2. Supabase Auth: delete auth.users record (cascades session)
  3. profiles: DELETE row (destroys all PII)
  4. All content references updated:
     - lessons.author_id → NULL (or system "Anonymous" UUID)
     - peer_review_comments.author_id → "Anonymous" UUID
     - exercise_submissions.submitter_id → "Anonymous" UUID
     (Tombstoning: content preserved, identity severed — NFR7)
  5. flashcard_decks, exercises by user: soft-delete (is_deleted=true)
  6. srs_progress: DELETE (personal data, no archival value)
  7. Confirmation email sent within 24h
```

### 7.3 Data Export (FR3, GDPR Article 20)

`GET /api/export/user-data` (authenticated):
- Returns ZIP: `profile.json`, `flashcard_decks.json`, `srs_progress.json`, `submissions.json`
- Generated server-side via Route Handler, streamed as download

### 7.4 Cookie Consent

- Consent banner on first visit (pre-auth)
- Stored in `localStorage` + `profiles.gdpr_consent_at`
- Required fields disclosed: session cookies (Supabase Auth), analytics (post-MVP)

---

## 8. Performance & NFR Decisions

### 8.1 Core Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| FCP | < 1.5s | Next.js SSR/RSC for initial HTML; Cloudflare CDN for static |
| LCP | < 2.5s | Hero content server-rendered; image optimization (next/image) |
| TTI (flashcard ready) | < 3.5s on 4G | Deck pre-cached in Dexie; React Query prefetch on route hover |
| Core interaction feedback | < 200ms | Optimistic UI updates in React Query mutations |
| Realtime leaderboard update | < 2s | Supabase Realtime (postgres_changes) |
| Client-side PDF export | < 3s | html2canvas + jsPDF (NFR4) |
| Context switch between zones | < 1s | Client-side navigation (no full page reload) |

### 8.2 Concurrent Users (NFR9, NFR10)

Target: **1,000 CCU** within free-tier constraints:

- **Supabase Free:** 500 concurrent DB connections (PgBouncer pooler active). Sufficient for 1k CCU with typical EdTech read-heavy workloads.
- **Vercel Free:** 100 serverless invocations/day limit on some plans → most reads bypass Vercel (direct Supabase client from browser). API routes only for file upload, cron, auth callback.
- **Cloudflare R2 + CDN:** Static assets served from edge. >80% cache hit ratio target (NFR11).
- **Realtime connections:** Supabase Realtime supports hundreds of concurrent WS connections on free tier. Users only subscribe to their group channels — natural partitioning.

### 8.3 Cache Strategy

```
Static assets (JS, CSS, images): Cloudflare CDN — cache forever (content hash URL)
Lesson HTML: RSC + Next.js cache (revalidate on lesson publish event)
Flashcard decks: Dexie.js (IndexedDB) — offline-first, invalidate on deck update
Leaderboard: React Query staleTime=30s; Realtime invalidation on change
User profile: React Query staleTime=5min
```

### 8.4 Bundle Optimization

- **shadcn/ui:** Only import used components (a la carte).
- **Framer Motion:** Tree-shake unused exports; use `LazyMotion` with `domAnimation` feature bundle.
- **Tiptap:** Only load editor extensions needed per route (lesson creator ≠ read view).
- **Dexie.js:** Loaded only on flashcard practice routes.
- **Code splitting:** Dynamic imports for Editor, PDF export, Anki parser (heavy, not on initial load).

### 8.5 Testing Strategy

- **Framework:** Jest (`next/jest`) with `jest-environment-jsdom` for UI/component tests.
- **Libraries:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- **Test locations:**
  - Colocated tests in `src/**` using `*.test.ts` / `*.test.tsx`.
  - Cross-cutting smoke/integration tests in root `tests/` (not `scripts/`).
- **Execution commands:**
  - `npm test` for standard unit test run
  - `npm run test:watch` for local TDD flow
  - `npm run test:coverage` for coverage report

---

## 9. Deployment & Environments

### 9.1 Infrastructure

| Service | Provider | Plan | Purpose |
|---------|---------|------|---------|
| Frontend + API Routes + Cron | Vercel | Free | Next.js hosting, serverless Route Handlers |
| Database + Auth + Realtime | Supabase | Free | Postgres, Auth, Realtime, Edge Functions |
| File Storage | Cloudflare R2 | Free (10GB/mo) | Audio, images, exports, avatars |
| CDN | Cloudflare | Free | Static asset caching, edge delivery |
| Email | Resend or Brevo | Free (100/day or 300/day) | Transactional email |

### 9.2 Environment Variables

```bash
# Public (safe for client bundle)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only (never in client bundle)
SUPABASE_SERVICE_ROLE_KEY=      # Admin operations, cron jobs
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
RESEND_API_KEY=                 # or BREVO_API_KEY=
CRON_SECRET=                    # Vercel Cron authorization token
```

### 9.3 Cron Schedule (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/weekly-start",   "schedule": "0 0 * * 1" },
    { "path": "/api/cron/weekly-shuffle", "schedule": "59 23 * * 6" },
    { "path": "/api/cron/reminders",      "schedule": "0 9 * * *" },
    { "path": "/api/cron/weekly-close",   "schedule": "59 23 * * 0" }
  ]
}
```

All cron routes verify `Authorization: Bearer {CRON_SECRET}` header.

### 9.4 Database Migrations

```bash
# Supabase CLI workflow
supabase migration new <migration_name>
supabase db push           # apply to remote
supabase gen types typescript --project-id ... > src/types/database.ts
```

---

## 10. Admin Dashboard

Platform admin (founder/developer) interface at `/admin`:

| Section | Data Source | Key Metrics |
|---------|------------|-------------|
| **System Health** | Supabase Dashboard API + Edge Function | CCU estimate, DB connections, storage usage % |
| **User Management** | `profiles` + `auth.users` | Total users, new signups, warning/ban |
| **Group Management** | `groups` + `group_members` | Active groups, member counts, flagged content |
| **Content Moderation** | `lessons` + `exercises` | Flagged content queue, soft-delete actions |
| **Email Quotas** | Resend/Brevo API | Emails sent today, quota remaining |
| **Growth Analytics** | Aggregate queries | MoM retention, streak velocity, contributor ratio |

Admin access: `group_members` role is NOT used. Separate `admins` table or `profiles.is_admin boolean` checked in proxy logic. All admin routes protected by `proxy.ts` role guard.

---

## 11. Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│  Client (Browser / Mobile Chrome)                                  │
│  Next.js App Router • Tailwind • shadcn • Framer Motion            │
│  Zustand • React Query • Tiptap • Dexie.js (IndexedDB)             │
│                                                                    │
│  Supabase client (anon key):                                       │
│    → Auth, DB queries, Realtime subscriptions                      │
│  File upload: → /api/files/upload  or  R2 signed URL              │
└─────────────────┬──────────────────────┬───────────────────────────┘
                  │                      │
     HTTPS (Supabase WS/REST)            │ HTTPS (Vercel API Routes)
                  │                      │
                  ▼                      ▼
┌─────────────────────────┐   ┌─────────────────────────────────────┐
│  Supabase               │   │  Next.js Server (Vercel)             │
│  • Postgres + RLS       │   │  • /api/auth/callback                │
│  • Auth (JWT/cookie)    │   │  • /api/files/upload (→ R2)          │
│  • Realtime             │   │  • /api/files/signed-url             │
│    (leaderboard,        │   │  • /api/cron/weekly-shuffle          │
│     notifications)      │   │  • /api/cron/reminders               │
│  • Edge Functions       │   │  • /api/export/user-data             │
│    (optional email)     │   │  • /admin/** (protected routes)      │
└─────────────────────────┘   └─────────────┬───────────────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                    ┌──────────────┐  ┌──────────┐  ┌────────────┐
                    │ Cloudflare   │  │  Resend  │  │ Cloudflare │
                    │ R2           │  │ /Brevo   │  │    CDN     │
                    │ (audio,      │  │ (email)  │  │ (static    │
                    │  images,     │  │          │  │  assets)   │
                    │  exports)    │  │          │  │            │
                    └──────────────┘  └──────────┘  └────────────┘
```

---

## 12. Stack Summary

| Layer | Technology |
|-------|-----------|
| **FE Framework** | Next.js (latest, App Router) + TypeScript |
| **Internationalization** | next-intl (request config + `NextIntlClientProvider` + `messages/*.json`) |
| **Styling** | Tailwind CSS v4 + shadcn/ui (copy-to-repo) |
| **Forms** | React Hook Form + Zod |
| **State** | Zustand (client) + TanStack Query (server) |
| **Editor** | Tiptap Community (Confluence-style, Alive Text extension) |
| **Gestures** | Framer Motion (flashcard flip/swipe, micro-interactions) |
| **Offline** | Dexie.js (IndexedDB, offline-first flashcard cache + grade queue) |
| **SRS** | SM-2 algorithm (client-side calc, server stores results) |
| **BE (structured)** | Supabase (Postgres + Auth + Realtime + RLS) |
| **BE (unstructured)** | Cloudflare R2 (audio, images, exports, avatars) |
| **Email** | Resend or Brevo (free tier, cron-triggered reminders) |
| **Cron** | Vercel Cron (weekly shuffle, reminders, leaderboard recalc) |
| **CDN** | Cloudflare Free CDN (static assets, >80% cache hit target) |
| **Hosting** | Vercel Free (Next.js + API Routes + Cron) |
| **Icons** | Lucide React |
| **Anki Import** | Custom .apkg parser (client-side SQLite zip) |
| **PDF Export** | html2canvas + jsPDF (client-side, < 3s — NFR4) |
