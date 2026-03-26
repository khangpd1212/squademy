# Squademy — Architecture Decision Record

**Version:** 3.0
**Date:** 2026-03-26
**Based on:** PRD v1.0 + UX Design Specification v1.0
**Constraint:** Zero-OPEX (free-tier infrastructure only — Vercel Free + Oracle VM Always Free)

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
| Server State | **TanStack Query** | Data fetching, caching, mutations; `queryFn` calls Next.js API routes (proxy to NestJS) |
| Rich Text | **Tiptap (Community)** | WYSIWYG for Lesson Creator + Exercise Creator (Confluence-style toolbar) |
| Gestures / Animation | **Framer Motion** | Flashcard 3D flip, swipe gestures, Alive Text dissolve, page transitions, micro-interactions |
| Offline Cache | **Dexie.js** | IndexedDB wrapper: cache flashcard decks offline, queue grade results when offline |
| API Client | **fetch (native)** | HTTP client calling NestJS REST API via Next.js API route proxy |
| Anki Import | **Custom Parser** | Parse `.apkg` (SQLite zip) client-side; extract cards → insert via NestJS API |
| PDF/DOCX Export | **Client-side** | `html2canvas` + `jsPDF` for PDF; `docx` library for DOCX (NFR4: client-side, < 3s) |
| SRS Algorithm | **SM-2 variant** | Client-side scheduling; next review interval computed from grade history stored in Dexie + synced to NestJS API |
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
│   │   │       ├── roadmap/page.tsx     # Editor-only: drag-drop lesson/deck ordering
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
│   │   ├── auth/
│   │   │   ├── login/route.ts          # Proxy → NestJS /auth/login
│   │   │   ├── register/route.ts       # Proxy → NestJS /auth/register
│   │   │   └── refresh/route.ts        # Proxy → NestJS /auth/refresh
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
│   ├── gamification/                   # StreakBadge, LeaderboardRow, ContributorBadge, ActivityHeatmap
│   ├── roadmap/                        # RoadmapEditor, DraggableLessonCard, LearningPathView
│   └── notifications/                  # InAppNotification, NotificationBell
├── hooks/
│   ├── useAuth.ts                      # JWT auth state, login/logout helpers
│   ├── useApi.ts                       # Fetch wrapper for Next.js API routes
│   ├── useOfflineSync.ts               # Dexie.js sync logic
│   ├── useSRS.ts                       # SM-2 next interval calculation
│   └── useSound.ts                     # Audio micro-feedback (flip, ding, tuk) + haptic (Vibration API)
├── lib/
│   ├── api/
│   │   ├── client.ts                   # Fetch wrapper for API calls to Next.js routes
│   │   └── proxy.ts                    # JWT verification + proxy helpers (imported by proxy.ts)
│   ├── dexie/
│   │   ├── db.ts                       # Dexie schema (decks, cards, gradeQueue)
│   │   └── sync.ts                     # Sync queue → NestJS API when online
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
│   ├── audio/
│   │   ├── sounds.ts                   # Preloaded AudioBuffer pool (flip, ding, tuk, streak)
│   │   └── haptic.ts                   # Vibration API wrapper (light tap, decisive buzz)
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
│   ├── database.ts                     # Re-exported Prisma generated types (from @squademy/database)
│   └── app.ts                          # App-level types (roles, SRS grades, etc.)
├── styles/
│   └── globals.css                     # Tailwind @theme, design tokens
└── proxy.ts                            # JWT verification, token refresh, admin route guard, NestJS proxy (Next.js 16 proxy entrypoint)
```

Additional root-level i18n files:

messages/
└── en.json                             # Default translation messages


tests/                                  # Integration/smoke-style repository tests
jest.config.cjs                         # next/jest-based config with @/* alias
jest.setup.ts                           # @testing-library/jest-dom setup


### 2.3 Data Flow

- **Server state (NestJS API):** React Query (`useQuery` / `useMutation`). All DB reads/writes go through `queryFn`/`mutationFn` calling Next.js API routes, which proxy to NestJS. Cache invalidation via polling (`refetchInterval`) or manual invalidation on mutations.
- **Auth:** JWT-based (Passport.js on NestJS). Access token (15min) + refresh token (7d) stored in localStorage via `browser-client.ts`. A non-httpOnly `logged_in=true` cookie marker is set so `proxy.ts` can detect auth state during SSR. `proxy.ts` (Next.js 16) checks the cookie marker and redirects unauthenticated users to `/login?redirect={path}`. Real JWT verification happens on the NestJS API via `Authorization: Bearer` header. Token refresh is handled transparently by `browser-client.ts` when a 401 is received.
- **Polling (Realtime replacement):** Leaderboard and notification badge updates use React Query `refetchInterval` (30s / 60s). No WebSocket dependency.
- **Offline-first (Flashcards):** Decks downloaded once → stored in Dexie (IndexedDB). Practice runs fully offline. Grade results queued in Dexie `gradeQueue`. On reconnect, `sync.ts` flushes queue to NestJS API and updates SRS intervals.
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

## 2.6 Monorepo Architecture

**Tooling:** Yarn Workspaces + Turborepo

| Package | Name | Purpose |
|---------|------|---------|
| `apps/web` | @squademy/web | Next.js frontend |
| `apps/api` | @squademy/api | NestJS backend |
| `packages/database` | @squademy/database | Prisma schema, client, generated types |
| `packages/shared` | @squademy/shared | Zod schemas, shared types, constants |

Shared packages are consumed by both apps via workspace protocol (`"@squademy/database": "workspace:*"`). Turborepo orchestrates build/test/lint tasks with dependency-aware caching.

```
squademy/                        # Monorepo root
├── apps/
│   ├── web/                     # Next.js frontend (deployed to Vercel)
│   │   ├── src/                 # Directory structure per Section 2.2
│   │   ├── next.config.ts
│   │   └── package.json
│   └── api/                     # NestJS backend (deployed to Oracle VM)
│       ├── src/
│       │   ├── auth/            # AuthModule (login, register, refresh, guards)
│       │   ├── users/           # UsersModule (profile CRUD, search)
│       │   ├── groups/          # GroupsModule (CRUD, invite code join)
│       │   ├── members/         # MembersModule (role management)
│       │   ├── invitations/     # InvitationsModule (direct invitations)
│       │   ├── prisma/          # PrismaModule (global DB access)
│       │   ├── common/          # Guards, decorators, filters, interceptors
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       └── package.json
├── packages/
│   ├── database/                # @squademy/database
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Single source of truth for DB schema
│   │   │   └── migrations/
│   │   └── package.json
│   └── shared/                  # @squademy/shared
│       ├── src/
│       │   ├── schemas/         # Zod validation schemas (shared FE + BE)
│       │   ├── types/           # Shared TypeScript types
│       │   └── constants/       # Role enums, status enums, etc.
│       └── package.json
├── turbo.json                   # Turborepo pipeline config
├── package.json                 # Root workspace config
└── yarn.lock
```

---

## 3. Backend — NestJS on Oracle VM

### 3.1 Backend Stack

| Component | Technology | Role |
|-----------|-----------|------|
| Runtime | **Node.js 20 LTS** | Server runtime on Oracle VM |
| Framework | **NestJS 11** | REST API, Guards, Modules, DI |
| ORM | **Prisma 6** | Type-safe queries, migrations, schema |
| Auth | **Passport.js + JWT** | Access/refresh token auth (email/password) |
| Validation | **class-validator + class-transformer** | DTO validation |
| Config | **@nestjs/config** | Environment management |
| Rate Limiting | **@nestjs/throttler** | API rate limiting |
| Process Manager | **PM2 / Docker** | Production process management |

### 3.1.1 NestJS Modules

- **PrismaModule** (global, shared DB access)
- **AuthModule** (JWT auth, register, login, refresh)
- **UsersModule** (profile CRUD, search)
- **GroupsModule** (CRUD, join via invite code)
- **MembersModule** (role management, removal)
- **InvitationsModule** (direct invitations)

### 3.1.2 Authorization (NestJS Guards)

All authorization is enforced at the API layer via NestJS Guards:

| Guard | Purpose |
|-------|---------|
| **JwtAuthGuard** | Validates access token on every protected route |
| **GroupMemberGuard** | Checks user is a member of the target group |
| **GroupAdminGuard** | Checks user has `admin` role in the group |
| **GroupEditorGuard** | Checks user has `editor` or `admin` role |
| **ResourceOwnerGuard** | Checks user owns the resource (e.g., own submission) |

Guards are applied via decorators: `@UseGuards(JwtAuthGuard, GroupMemberGuard)` on controllers.

### 3.2 Database — Self-hosted PostgreSQL 16 on Oracle VM

Database is managed by **Prisma 6** ORM. Schema lives in `packages/database/prisma/schema.prisma`. Migrations are applied via `prisma migrate deploy` in production and `prisma migrate dev` locally.

#### Users

```sql
-- Single User table (managed by Prisma)
-- PII fields (full_name, school, location, age) are tombstoned on deletion
users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,              -- bcrypt hashed (nullable for future OAuth)
  display_name text NOT NULL,
  avatar_url text,                 -- R2 URL
  full_name text,                  -- PII: tombstoned on deletion
  school text,                     -- PII: tombstoned on deletion
  location text,                   -- PII: tombstoned on deletion
  age int,                         -- PII: tombstoned on deletion
  accept_privacy_at timestamptz,   -- GDPR consent timestamp
  refresh_token text,              -- hashed refresh token
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

#### Groups & Membership

```sql
groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code text UNIQUE,   -- generated slug for invite link
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
)

group_members (
  group_id uuid REFERENCES groups(id),
  user_id uuid REFERENCES users(id),
  role text CHECK (role IN ('admin', 'editor', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
)

-- Direct invitations by username
group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  invited_by uuid REFERENCES users(id),
  invitee_id uuid REFERENCES users(id),
  status text CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now()
)
```

#### Content — Lessons

```sql
lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  author_id uuid REFERENCES users(id),
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
  user_id uuid REFERENCES users(id),
  line_ref text,           -- e.g., "paragraph-3" or character offset
  body text NOT NULL,
  parent_id uuid REFERENCES review_comments(id),  -- threaded
  created_at timestamptz DEFAULT now()
)

-- Social reactions on lesson paragraphs
lesson_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id),
  user_id uuid REFERENCES users(id),
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
  author_id uuid REFERENCES users(id),
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
  user_id uuid REFERENCES users(id),
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
  creator_id uuid REFERENCES users(id),
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
  assignee_id uuid REFERENCES users(id),
  week_cycle text,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (exercise_id, assignee_id)
)

exercise_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid REFERENCES exercises(id),
  submitter_id uuid REFERENCES users(id),
  answers jsonb,           -- array of {question_id, answer, auto_grade_result}
  submitted_at timestamptz DEFAULT now()
)

peer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES exercise_submissions(id),
  reviewer_id uuid REFERENCES users(id),  -- exercise creator
  status text CHECK (status IN ('pending', 'graded', 'disputed', 'arbitrated')),
  overall_score numeric(5,2),
  reviewed_at timestamptz
)

-- Line-level grading comments + debate threads
peer_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_review_id uuid REFERENCES peer_reviews(id),
  question_ref text,       -- which question this comment refers to
  author_id uuid REFERENCES users(id),
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
  reporter_id uuid REFERENCES users(id),
  reason text NOT NULL,
  status text CHECK (status IN ('open', 'resolved')),
  arbiter_id uuid REFERENCES users(id) NULL,   -- editor who arbitrates
  arbitration_decision text CHECK (arbitration_decision IN ('creator_wrong', 'taker_wrong', NULL)),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
)
```

#### Gamification

```sql
streaks (
  user_id uuid REFERENCES users(id),
  group_id uuid REFERENCES groups(id),
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_activity_at timestamptz,
  PRIMARY KEY (user_id, group_id)
)

-- Weekly error tracking (for dispute scoring)
weekly_errors (
  user_id uuid REFERENCES users(id),
  group_id uuid REFERENCES groups(id),
  week_cycle text,
  error_count int DEFAULT 0,
  PRIMARY KEY (user_id, group_id, week_cycle)
)

badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  group_id uuid REFERENCES groups(id),
  badge_type text CHECK (badge_type IN ('first_contribution', 'streak_7', 'streak_30', 'top_contributor', 'editor_approved')),
  awarded_at timestamptz DEFAULT now()
)

-- Daily activity log for heatmap visualization (FR46)
daily_activity (
  user_id uuid REFERENCES users(id),
  group_id uuid REFERENCES groups(id),
  activity_date date NOT NULL,
  flashcards_reviewed int DEFAULT 0,
  exercises_completed int DEFAULT 0,
  reviews_submitted int DEFAULT 0,
  lessons_read int DEFAULT 0,
  total_actions int GENERATED ALWAYS AS (
    flashcards_reviewed + exercises_completed + reviews_submitted + lessons_read
  ) STORED,
  PRIMARY KEY (user_id, group_id, activity_date)
)

-- Learning Path ordering for Editor roadmap editor (FR28b)
learning_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  item_type text CHECK (item_type IN ('lesson', 'flashcard_deck')),
  item_id uuid NOT NULL,           -- lessons.id or flashcard_decks.id
  sort_order int NOT NULL,
  added_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, item_type, item_id)
)

-- Leaderboard: materialized view or function-based
-- Computed from: submissions + peer_reviews + streaks + badges
-- Updated via Realtime trigger or periodic recalc
leaderboard (
  group_id uuid REFERENCES groups(id),
  user_id uuid REFERENCES users(id),
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
  recipient_id uuid REFERENCES users(id),
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

### 3.3 Authorization Matrix (NestJS Guards)

All endpoints are protected by NestJS Guards. Authorization is enforced at the controller/route level:

| Resource | READ | CREATE | UPDATE/DELETE |
|----------|------|--------|---------------|
| `lessons` | GroupMemberGuard | GroupMemberGuard | ResourceOwnerGuard (own draft); GroupEditorGuard (status update) |
| `exercises` | GroupMemberGuard | GroupMemberGuard | ResourceOwnerGuard (own exercise) |
| `exercise_submissions` | ResourceOwnerGuard (creator + submitter) | JwtAuthGuard (assignee check in service) | ResourceOwnerGuard (before grading) |
| `peer_reviews` | ResourceOwnerGuard (creator + submitter) | ResourceOwnerGuard (creator only) | ResourceOwnerGuard (own review) |
| `srs_progress` | JwtAuthGuard (own records) | JwtAuthGuard | JwtAuthGuard |
| `notifications` | JwtAuthGuard (own records) | Internal service only | JwtAuthGuard (mark read) |
| `leaderboard` | GroupMemberGuard | Internal service only | Internal service only |
| `daily_activity` | JwtAuthGuard (own records) | JwtAuthGuard | JwtAuthGuard |
| `learning_path_items` | GroupMemberGuard | GroupEditorGuard | GroupEditorGuard |

Sensitive admin operations (bulk delete, tombstoning, leaderboard recalc) are restricted to admin-only endpoints protected by a dedicated `AdminGuard`.

### 3.4 Database Migrations (Prisma)

```bash
# Prisma workflow
cd packages/database
npx prisma migrate dev --name <migration_name>   # local development
npx prisma migrate deploy                         # production (Oracle VM)
npx prisma generate                                # regenerate Prisma Client + types
```

Schema file: `packages/database/prisma/schema.prisma`
Generated types consumed by both `apps/web` and `apps/api` via workspace protocol.

---

## 4. FE ↔ BE Connection Patterns

### 4.1 Structured Data (NestJS API via Proxy)

- **Browser (client components):** React Query `queryFn`/`mutationFn` call Next.js API routes (`/api/*`). No direct DB access from the browser.
- **Next.js `proxy.ts`:** Checks the `logged_in` cookie marker to redirect unauthenticated users during SSR. Does NOT verify JWTs or proxy API calls.
- **Client-side `browser-client.ts`:** Attaches `Authorization: Bearer <accessToken>` from localStorage on every API request directly to the NestJS backend (`NEXT_PUBLIC_API_URL`).
- **NestJS (Oracle VM):** Validates JWT, applies Guards for authorization, executes Prisma queries against PostgreSQL.
- **Pattern:** `Browser (browser-client.ts) → NestJS REST API (Bearer token) → Prisma → PostgreSQL`. `proxy.ts` handles SSR auth redirects only.

### 4.2 File Storage (Cloudflare R2)

Two upload strategies:

1. **Proxied Upload** (sensitive files): `POST /api/files/upload` → Next.js Route Handler → R2 SDK. File URL stored in Postgres.
2. **Signed URL** (large files, audio recordings): `GET /api/files/signed-url?key=...` → Route Handler generates pre-signed R2 URL → client uploads directly to R2. Avoids Vercel serverless memory limits.

```
Browser ──POST multipart──► /api/files/upload (Next.js Route Handler)
                                    │
                                    └──► R2 SDK ──► Cloudflare R2
                                    └──► NestJS API: store URL in PostgreSQL via Prisma
```

### 4.3 Offline-First Pattern (Flashcards)

```
First Open:
  Browser ──► /api/decks/{id} ──► NestJS API ──► Prisma ──► PostgreSQL ──► cards[]
           ──► Dexie.js: store deck + cards in IndexedDB

Subsequent Opens (same deck):
  Browser ──► Dexie.js: serve from IndexedDB (no network)
           ──► Practice offline

Grade Submission:
  If online:   ──► NestJS API: POST /srs-progress update immediately
  If offline:  ──► Dexie gradeQueue: push {card_id, grade, timestamp}
               ──► On reconnect: sync.ts flushes queue to NestJS API
```

### 4.4 Real-Time Strategy (Polling + SSE)

Per PRD NFR3: **SSE (Server-Sent Events) preferred over WebSocket** to minimize infrastructure cost.

- **Polling (MVP):** Leaderboard and notification badge updates use React Query with `refetchInterval` (30s for leaderboard, 60s for notifications). Simple, zero infrastructure overhead.
- **SSE (Post-MVP):** If real-time feel is insufficient, NestJS can serve SSE endpoints via `@Sse()` decorator, consumed by Next.js API route proxy or `EventSource` on the client.
- **No WebSocket server** — aligns with zero-OPEX.

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

Sent via Resend/Brevo API from NestJS service or Next.js Route Handler (cron-triggered).

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
// Track: alive_text_interactions via NestJS API for "deep reading" metric
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

### 6.5 Audio Micro-Feedback & Haptic (FR30b)

Sound and haptic feedback for the flashcard practice session:

```typescript
// lib/audio/sounds.ts
// Preload short audio clips as AudioBuffer via Web Audio API
// Sounds: flip (soft paper rustle), ding (correct/good), tuk (again), 
//         streak (celebratory chime), combo_break (glass shatter)
// Files stored as static assets in /public/sounds/ (~10-50KB each)
// Loaded on first practice session entry, cached in memory

// lib/audio/haptic.ts
// Wrapper around navigator.vibrate() for supported devices
// Patterns: lightTap([10]) for flip, decisiveBuzz([30]) for swipe grade
// No-op on unsupported devices (desktop browsers)

// hooks/useSound.ts
// Combines audio + haptic into a single hook for practice components
// Respects user preference: stored in Zustand uiStore.soundEnabled
// Usage: const { playFlip, playGood, playAgain } = useSound()
```

### 6.6 Learning Path Roadmap Editor (FR28b)

Editor-only drag-and-drop interface for curriculum ordering:

```typescript
// Route: /group/[groupId]/roadmap
// Access: editor or admin role only (checked via group_members.role)

// Components: components/roadmap/
// - RoadmapEditor: main container with DnD context
// - DraggableLessonCard: draggable item (lesson or deck, status pill)
// - LearningPathView: read-only sequential view for members

// Data: learning_path_items table
// - Editors drag published lessons and flashcard decks into ordered list
// - sort_order updated on drop via optimistic mutation
// - Members see the ordered path on group home page

// DnD implementation: HTML5 Drag and Drop API (no extra library)
// or @dnd-kit if complexity warrants — evaluate at implementation time
```

### 6.7 Activity Heatmap (FR46)

GitHub-style contribution calendar on user profile:

```typescript
// Component: components/gamification/ActivityHeatmap
// Data source: daily_activity table (aggregated per user per day)

// Display: 52-week grid (12 months), color intensity based on total_actions
// Color scale: 0 actions = zinc-200/zinc-800, 1-2 = emerald-200, 
//              3-5 = emerald-400, 6+ = emerald-600
// Hover tooltip: "Mar 15: 4 flashcards, 1 exercise, 1 review"

// Activity recording: incremented via NestJS API (Prisma upsert)
// on each tracked action (flashcard grade, exercise submit, review submit, lesson read)
// Uses UPSERT on (user_id, group_id, activity_date) to increment counters
```

### 6.8 Long-Form Lesson Content Strategy

Optimization for grammar lessons that may grow very large:

```typescript
// Problem: Tiptap ProseMirror JSON stored as JSONB can exceed 500KB+
// for comprehensive grammar lessons with examples, tables, images.

// Strategy 1: Progressive Rendering (MVP)
// - Lesson content loaded in full but rendered progressively
// - Tiptap read-only view uses IntersectionObserver to render
//   visible sections only, lazy-loading deep content blocks

// Strategy 2: Chunked Storage (Post-MVP if needed)
// - Split lesson content into section-level chunks
// - Each chunk stored as separate row in lesson_sections table
// - Table of Contents built from chunk headers
// - Load chunks on scroll (infinite scroll per section)

// Database optimization:
// - JSONB content NOT indexed (no GIN index on lesson content)
// - content_markdown TEXT column for full-text search (GIN tsvector index)
// - Lesson list queries NEVER select content column (use explicit column list)
// - Single lesson fetch: SELECT id, title, content WHERE id = $1
```

---

## 7. GDPR / PDPA Compliance Architecture

### 7.1 PII Separation

PII fields (`full_name`, `school`, `location`, `age`, `email`) reside in the `users` table alongside non-PII fields. On account deletion, PII fields are NULLed (tombstoned) and `display_name` is set to "Anonymous Learner", while the UUID row is preserved so foreign key references in content tables remain valid.

### 7.2 Account Deletion Flow (NFR6, NFR7)

```
User requests deletion:
  1. GDPR request logged with 24h SLA
  2. NestJS AuthService: NULL PII fields on users row (full_name, school, location, age, email, avatar_url), set display_name to "Anonymous Learner", clear password_hash and refresh_token (invalidates all JWTs)
  3. All content references updated:
     - lessons.author_id → NULL (or system "Anonymous" UUID)
     - peer_review_comments.author_id → "Anonymous" UUID
     - exercise_submissions.submitter_id → "Anonymous" UUID
     (Tombstoning: content preserved, identity severed — NFR7)
  4. flashcard_decks, exercises by user: soft-delete (is_deleted=true)
  5. srs_progress: DELETE (personal data, no archival value)
  6. Confirmation email sent within 24h
```

### 7.3 Data Export (FR3, GDPR Article 20)

`GET /api/export/user-data` (authenticated):
- Returns ZIP: `profile.json`, `flashcard_decks.json`, `srs_progress.json`, `submissions.json`
- Generated server-side via Route Handler, streamed as download

### 7.4 Cookie Consent

- Consent banner on first visit (pre-auth)
- Stored in `localStorage` + `profiles.gdpr_consent_at`
- Required fields disclosed: `logged_in` marker cookie (auth state detection), localStorage (JWT tokens), analytics (post-MVP)

---

## 8. Performance & NFR Decisions

### 8.1 Core Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| FCP | < 1.5s | Next.js SSR/RSC for initial HTML; Cloudflare CDN for static |
| LCP | < 2.5s | Hero content server-rendered; image optimization (next/image) |
| TTI (flashcard ready) | < 3.5s on 4G | Deck pre-cached in Dexie; React Query prefetch on route hover |
| Core interaction feedback | < 200ms | Optimistic UI updates in React Query mutations |
| Leaderboard update | < 30s | React Query polling (`refetchInterval: 30000`) |
| Client-side PDF export | < 3s | html2canvas + jsPDF (NFR4) |
| Context switch between zones | < 1s | Client-side navigation (no full page reload) |

### 8.2 Concurrent Users (NFR9, NFR10)

Target: **1,000 CCU** within free-tier constraints:

- **Oracle VM (Always Free):** 4 ARM cores, 24GB RAM — ample for NestJS + PostgreSQL. Prisma connection pooling (pool_size=20) handles concurrent queries efficiently.
- **Vercel Free:** Serverless functions handle API proxy routes. Static assets and SSR pages served from Vercel CDN edge.
- **Cloudflare R2 + CDN:** Static assets served from edge. >80% cache hit ratio target (NFR11).
- **Polling vs WebSocket:** Polling-based updates (React Query `refetchInterval`) are less real-time but require zero persistent connections. Sufficient for EdTech workloads where leaderboard/notification latency of 30-60s is acceptable.

### 8.3 Cache Strategy

```
Static assets (JS, CSS, images): Cloudflare CDN — cache forever (content hash URL)
Lesson HTML: RSC + Next.js cache (revalidate on lesson publish mutation)
Flashcard decks: Dexie.js (IndexedDB) — offline-first, invalidate on deck update
Leaderboard: React Query staleTime=30s; refetchInterval=30s polling
Notifications: React Query refetchInterval=60s polling
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
| Frontend + API Proxy + Cron | Vercel | Free | Next.js hosting, API route proxy to NestJS |
| Backend API | Oracle Cloud VM | Always Free (ARM, 4 cores, 24GB RAM) | NestJS API (Docker container) |
| Database | Oracle Cloud VM | Always Free (same VM) | PostgreSQL 16 (Docker container) |
| Reverse Proxy + SSL | Oracle Cloud VM | Always Free (same VM) | Nginx + Let's Encrypt |
| File Storage | Cloudflare R2 | Free (10GB/mo) | Audio, images, exports, avatars |
| CDN | Cloudflare | Free | Static asset caching, edge delivery |
| Email | Resend or Brevo | Free (100/day or 300/day) | Transactional email |

### 9.2 Environment Variables

**Frontend (apps/web — Vercel):**
```bash
# Public (safe for client bundle)
NEXT_PUBLIC_APP_URL=             # e.g., https://squademy.app

# Server-only (never in client bundle)
NESTJS_API_URL=                  # e.g., https://api.squademy.app (Oracle VM)
JWT_SECRET=                      # Shared with NestJS for JWT verification in proxy.ts
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CRON_SECRET=                     # Vercel Cron authorization token
```

**Backend (apps/api — Oracle VM):**
```bash
DATABASE_URL=                    # PostgreSQL connection string (Prisma)
JWT_SECRET=                      # Shared with Next.js proxy for JWT verification
JWT_REFRESH_SECRET=              # Separate secret for refresh tokens
RESEND_API_KEY=                  # or BREVO_API_KEY=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
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
# Prisma workflow (from packages/database)
npx prisma migrate dev --name <migration_name>   # Create + apply migration locally
npx prisma migrate deploy                         # Apply pending migrations in production
npx prisma generate                                # Regenerate Prisma Client + TypeScript types
npx prisma db seed                                 # Seed development data
```

---

## 10. Admin Dashboard

Platform admin (founder/developer) interface at `/admin`:

| Section | Data Source | Key Metrics |
|---------|------------|-------------|
| **System Health** | NestJS health endpoint + PM2/Docker stats | CCU estimate, DB connections, storage usage % |
| **User Management** | `profiles` + `users` (via NestJS admin endpoints) | Total users, new signups, warning/ban |
| **Group Management** | `groups` + `group_members` | Active groups, member counts, flagged content |
| **Content Moderation** | `lessons` + `exercises` | Flagged content queue, soft-delete actions |
| **Email Quotas** | Resend/Brevo API | Emails sent today, quota remaining |
| **Growth Analytics** | Aggregate queries (Prisma) | MoM retention, streak velocity, contributor ratio |

Admin access: `group_members` role is NOT used. Separate `admins` table or `users.is_admin boolean` checked in proxy.ts and NestJS `AdminGuard`. All admin routes protected at both proxy and API level.

---

## 11. Architecture Diagram

### 11.1 Deployment Topology

```
Browser
  ├─ Static assets → Vercel CDN
  ├─ SSR + API proxy → Vercel (Next.js)
  │     └─ /api/* routes → Oracle VM (NestJS API, port 3001)
  ├─ File uploads → Cloudflare R2
  └─ (No direct DB access from browser)

Oracle VM (Always Free Tier)
  ├─ NestJS API (Docker container)
  │     ├─ REST endpoints
  │     ├─ JWT auth + Guards
  │     └─ Prisma ORM → PostgreSQL
  ├─ PostgreSQL 16 (Docker container)
  └─ Nginx (reverse proxy + SSL via Let's Encrypt)

External
  ├─ Cloudflare R2 (audio, images, exports)
  ├─ Cloudflare CDN (static assets)
  └─ Resend/Brevo (transactional email)
```

### 11.2 Detailed Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│  Client (Browser / Mobile Chrome)                                  │
│  Next.js App Router • Tailwind • shadcn • Framer Motion            │
│  Zustand • React Query • Tiptap • Dexie.js (IndexedDB)             │
│                                                                    │
│  All API calls via fetch → /api/* (Next.js proxy)                  │
│  Auth: localStorage JWT tokens + `logged_in` cookie marker         │
│  File upload: → /api/files/upload  or  R2 signed URL              │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
                   HTTPS (Vercel API Routes)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js Server (Vercel)                                            │
│  • proxy.ts: JWT verification, token refresh, NestJS proxy          │
│  • /api/auth/* → proxy to NestJS /auth/*                            │
│  • /api/groups/* → proxy to NestJS /groups/*                        │
│  • /api/files/upload → Cloudflare R2                                │
│  • /api/files/signed-url → R2 pre-signed URL                       │
│  • /api/cron/* → Vercel Cron jobs                                   │
│  • /api/export/user-data → NestJS                                   │
│  • /admin/** (protected SSR routes)                                 │
└──────────────────┬──────────────────┬──────────────────────────────┘
                   │                  │
        HTTPS (NestJS API)            │ Direct (R2 SDK)
                   │                  │
                   ▼                  ▼
┌──────────────────────────┐   ┌──────────────┐
│  Oracle VM               │   │ Cloudflare   │
│  ┌────────────────────┐  │   │ R2           │
│  │ Nginx (SSL)        │  │   │ (audio,      │
│  │  └─► NestJS:3001   │  │   │  images,     │
│  │      ├─ REST API   │  │   │  exports)    │
│  │      ├─ Guards     │  │   └──────────────┘
│  │      ├─ Passport   │  │
│  │      └─ Prisma ORM │  │   ┌──────────┐  ┌────────────┐
│  ├────────────────────┤  │   │  Resend  │  │ Cloudflare │
│  │ PostgreSQL 16      │  │   │ /Brevo   │  │    CDN     │
│  │ (Docker)           │  │   │ (email)  │  │ (static    │
│  └────────────────────┘  │   │          │  │  assets)   │
└──────────────────────────┘   └──────────┘  └────────────┘
```

### 11.3 Auth Flow (JWT-based)

```
Auth Flow:
  1. Client calls NestJS /auth/login directly via browser-client.ts
  2. NestJS validates credentials via bcrypt → returns access token (15min) + refresh token (7d) in response body
  3. browser-client.ts stores tokens in localStorage + sets `logged_in=true` cookie marker

Session Management:
  1. proxy.ts (Next.js 16) checks `logged_in` cookie marker (no JWT verification)
  2. If marker absent → redirects to /login?redirect={original_path}
  3. browser-client.ts auto-refreshes via NestJS /auth/refresh when 401 received
  4. On logout → clearAuthTokens() removes localStorage tokens + clears cookie marker
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
| **BE Framework** | NestJS 11 (REST API, Guards, Modules, DI) |
| **ORM** | Prisma 6 (type-safe queries, migrations, schema) |
| **Database** | Self-hosted PostgreSQL 16 on Oracle VM (Docker) |
| **Auth** | Passport.js + JWT (access/refresh tokens, localStorage + cookie marker) |
| **File Storage** | Cloudflare R2 (audio, images, exports, avatars) |
| **Email** | Resend or Brevo (free tier, cron-triggered reminders) |
| **Cron** | Vercel Cron (weekly shuffle, reminders, leaderboard recalc) |
| **CDN** | Cloudflare Free CDN (static assets, >80% cache hit target) |
| **FE Hosting** | Vercel Free (Next.js + API proxy + Cron) |
| **BE Hosting** | Oracle Cloud VM Always Free (NestJS + PostgreSQL + Nginx) |
| **Monorepo** | Yarn Workspaces + Turborepo |
| **Icons** | Lucide React |
| **Anki Import** | Custom .apkg parser (client-side SQLite zip) |
| **PDF Export** | html2canvas + jsPDF (client-side, < 3s — NFR4) |
