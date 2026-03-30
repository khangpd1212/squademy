# Requirements Inventory

### Functional Requirements

FR1: Users can register and log in to the platform.
FR2: Users can manage their profile information (name, email, age, school, location).
FR3: Users can request a complete export of their personal data.
FR4: Users can request account deletion (which anonymizes but retains their contributed content).
FR5: Group Admins can create and configure new learning groups.
FR5a: Users can view a dashboard listing all groups they belong to — displaying group name, their role, member count, and last activity — and navigate into any group.
FR6: Group Admins can generate and revoke private invitation links.
FR7: Group Admins can invite users directly by typing their username.
FR8: Users can view, accept, or decline direct group invitations.
FR9: Group Admins can manage member access (remove members).
FR10: Group Admins can assign user roles (Member, Contributor, Editor) within their group.
FR11: Group Admins can schedule recurring or specific dates for group exercises/challenges.
FR12: Group Admins can delete a group (triggering soft-delete of group content).
FR13: Contributors can access a dedicated Content Studio optimized for document formatting (headings, fonts, tables, colors).
FR14: Contributors can create new lessons using a WYSIWYG Markdown editor.
FR15: Contributors can import lessons via Markdown files and render a preview within 1 second.
FR16: Users can export lessons for offline use in Markdown, DOCX, or PDF formats.
FR17: Contributors can submit drafts to the editorial queue for review.
FR18: Contributors can view the status of their submitted lesson drafts.
FR19: Contributors can access a dedicated Exercise Studio optimized for rapid quiz creation using templates and macros.
FR20: Contributors can automatically format pasted quiz content (from GPT or other websites) to match the platform theme.
FR21: Contributors can use a "Flashcard Macro" to select specific flashcards, filter by unit, and generate specific question types (word-definition, sound-word, IPA->Word, Word->Free-text Sentence).
FR22: Contributors can use 1-click standard templates for quiz types (Multiple Choice, Fill in the Blank, Cloze Test, Matching, True/False/Not Given, Paragraph Writing, Alive Text Block).
FR23: Every group member must create and submit an exercise before the weekly exercise deadline. The system performs a derangement shuffle assigning each member exactly one exercise created by another member. Members can also create Personal Practice Test exercises for self-assessment (not shuffled).
FR24: The platform shall enforce "Focus Mode" during timed group challenges, activating anti-cheat mechanisms (logging tab-switches or window-blur events).
FR25: Editors can view a queue of pending lesson submissions (exercises do NOT go through editorial review).
FR26: Editors can review, approve, or reject lesson submissions.
FR27: Editors can provide feedback comments at the specific line-level of the submitted lesson content.
FR28: Editors can soft-delete published content that violates guidelines.
FR28a: Editors can arbitrate exercise disputes escalated by assignees.
FR28b: Editors can access a dedicated Learning Path (Roadmap) editor screen to drag-and-drop reorder published lessons and flashcard decks into a sequential curriculum.
FR29: Learners can view published lessons within their group.
FR30: Learners can study flashcards using a mobile-optimized swipe interface or alternative accessible interactable buttons.
FR30a: Flashcard decks are stored offline-first on the client. New decks are loaded from the server only when the learner opens a deck for the first time.
FR30b: The flashcard practice session provides audio micro-feedback (flip, ding, tuk sounds) and haptic feedback on supported mobile devices to reinforce the tactile, game-like experience.
FR31: The system can surface flashcards based on Spaced Repetition logic (SM-2 algorithm).
FR31a: Learners can study ahead — completing extra cards beyond the daily SRS schedule or loading additional decks beyond the weekly plan.
FR32: Learners can complete Quizzes attached to lessons or personal practice tests.
FR33: Users have the option to edit flashcards directly during study or review sessions to correct errors or add personal context.
FR34: The system can send email reminders to members before the weekly exercise creation deadline.
FR35: Once all members have submitted exercises (or the deadline passes), the system performs a derangement shuffle assigning each member exactly one exercise from another member.
FR36: Learners can complete and submit their assigned Group Challenge exercises.
FR37: Exercise creators can grade submitted peer answers and provide feedback/approval at the specific line-level.
FR38: Creators (graders) and exercise takers can engage in threaded debates on specific line-level comments.
FR39: Creators can modify their final score/decision for an exercise after engaging in a comment debate.
FR40: The system can send email notifications for new exercise assignments, submitted answers pending grading, and impending deadlines.
FR40a: Exercise takers can report specific questions they believe are incorrect by flagging them with a reason, escalating to the Editor.
FR40b: Upon escalation, the Editor reviews the debate thread and makes a binding decision on whether the exercise creator or the exercise taker is correct.
FR40c: If the Editor rules the creator's question was incorrect, the system adds errors to the creator's weekly error count.
FR40d: If the Editor rules the taker's answer was incorrect, the system adds errors to the taker's weekly error count.
FR40e: After the weekly exercise period ends, all Group Challenge exercises become publicly available within the group for additional practice (unscored).
FR41: Editors can monitor peer-review interactions for inappropriate comments.
FR42: The system can track and display daily learning streaks.
FR43: The system can calculate and update a live Leaderboard based on learning and review activity.
FR44: Users can view the live Leaderboard within their group.
FR45: The system can award badges to Contributors based on approved submissions.
FR46: Users can view an Activity Heatmap (GitHub-style contribution calendar) on their personal profile screen, displaying daily learning activity over the past 12 months.

### NonFunctional Requirements

NFR1 (Response Time): Core interactive actions (swiping flashcards, submitting a quiz answer) must complete and provide visual feedback within 200 milliseconds via optimistic UI updates.
NFR2 (Page Load): The initial application load (Time to Interactive) must complete within 3.5 seconds on a standard 4G mobile connection.
NFR3 (Real-Time Latency): Live leaderboard updates and peer-review threaded comments must reflect changes to all connected group members within 2 seconds of submission via Server-Sent Events (SSE) or lightweight polling.
NFR4 (Client-Side Processing): Computationally heavy exports (e.g., PDF generation) must be performed client-side and completed within 3 seconds for standard export sizes.
NFR5 (Data Encryption): All user profile data and generated content must be encrypted in transit (TLS 1.2+) and at rest.
NFR6 (Data Minimization & Deletion): The database schema must separate PII from content. An account deletion request must permanently destroy PII within 24 hours.
NFR7 (Tombstoning): Upon account deletion, the user's educational contributions must be anonymized to "Anonymous Learner" to preserve threaded debate integrity (GDPR/PDPA compliance).
NFR8 (Access Control): Private group content and exercises must strictly reject access attempts from non-members or unauthenticated users (API-level verification on every request).
NFR9 (Concurrency): The system architecture must gracefully handle 1,000 Concurrent Users (CCU) without dropping requests or exceeding the 2-second response time threshold.
NFR10 (Scalability Constraint): The platform must support 1,000 CCU within free-tier infrastructure (Oracle VM Always Free for NestJS API + PostgreSQL, Cloudflare R2, Vercel + Cloudflare CDN).
NFR11 (Edge Caching): The platform must achieve a >80% cache hit ratio for static assets and public lessons via an edge CDN layer.
NFR12 (Uptime): Core practice and review loops must maintain 99.9% uptime.
NFR13 (Standards): The platform must comply with WCAG 2.1 Level AA standards.
NFR14 (Input Agnosticism): All critical flows (including the Tinder-style flashcard swipe) must be fully operable via keyboard shortcuts and standard accessible button clicks.

### Additional Requirements

**From Architecture:**

- **Framework:** Next.js (App Router) with TypeScript — all routing, SSR/RSC, Server Components; **Route Handlers** (`app/api/*`) reserved for Vercel cron, webhooks, and planned uploads — not a BFF proxy for Nest CRUD
- **Starter Template:** Greenfield project — no starter template specified; initialize with `create-next-app` + TypeScript + Tailwind CSS v4 + shadcn/ui setup (Epic 1, Story 1)
- **Monorepo:** Yarn Workspaces + Turborepo — `apps/web` (Next.js), `apps/api` (NestJS), `packages/database` (Prisma), `packages/shared` (Zod + types)
- **Database Migrations:** Prisma workflow (`prisma migrate dev`, `prisma migrate deploy`, `prisma generate`) from `packages/database`
- **Environment Variables:** Two sets — `apps/web` (`NEXT_PUBLIC_APP_URL`, `NESTJS_API_URL`, `JWT_SECRET`, `CLOUDFLARE_R2_*`, `CRON_SECRET`) and `apps/api` (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `CLOUDFLARE_R2_*`)
- **Cron Setup (Vercel):** 4 scheduled jobs in `vercel.json` — weekly-start (Mon 00:00), weekly-shuffle (Sat 23:59), reminders (daily 09:00), weekly-close (Sun 23:59)
- **Authorization (NestJS Guards):** All API routes protected by Guards (`JwtAuthGuard`, `GroupMemberGuard`, `GroupAdminGuard`, `GroupEditorGuard`, `ResourceOwnerGuard`); no RLS — authorization enforced at API layer
- **Derangement Shuffle Algorithm:** `lib/shuffle/derangement.ts` — Fisher-Yates derangement; edge cases for n=1 (skip) and n=2 (swap)
- **SM-2 SRS Algorithm:** `lib/srs/sm2.ts` — client-side scheduling; stores results via NestJS API → Prisma → `srs_progress` table
- **File Upload:** Two strategies — planned Next.js Route Handler `POST /api/files/upload` (R2) for sensitive files; signed URL for large files (audio) — **planned** (not yet implemented in `apps/web`)
- **Offline-first Flashcard Pattern:** Dexie.js IndexedDB — first open downloads and caches; subsequent opens serve locally; grade queue synced to NestJS API on reconnect
- **GDPR Deletion Flow:** Tombstoning process via NestJS AuthService (24h SLA) — deletes users + profiles, tombstones content references, clears personal data
- **Email Rate Limiting:** Max 1 reminder/user/24h; large groups (>20) get batch digest; fallback to in-app notification if quota exceeded
- **Leaderboard Score Weights:** Exercise submission +10pts, peer review +15pts, lesson approved +25pts, streak day +5pts, dispute error -5pts
- **Admin Dashboard:** Separate `/admin` route group with `proxy.ts` role guard + NestJS `AdminGuard`; `users.is_admin` boolean checked at both proxy and API level

**From UX Design Specification:**

- **Mobile-First Breakpoints:** Mobile (<768px), Tablet (768–1024px), Desktop (>1024px) with Tailwind standard classes
- **Responsive Layouts:** 3-column desktop (Sidebar | Main | Stats), 2-column tablet (collapsible tray), single-column mobile (Bottom Tab Bar)
- **Flashcard Anti-mistouch:** Grade arrow keys disabled until card is flipped; mobile tap=flip, swipe=grade; desktop Space=flip, ←/→=grade
- **Focus Mode (Review):** Hide all navigation bars in review/grading screens; distraction-free layout (ChatGPT-inspired)
- **Alive Text Pattern:** Tiptap custom extension — hidden content renders as animated purple pulsing dots (Framer Motion); click/tap to dissolve and reveal
- **Social Hotspots Pattern:** Paragraph-level margin reactions (❤️ 🤔 💡) and inline comment threads; mobile uses bottom sheet overlay
- **Sound Design (FR30b):** Flip sound, "Ding" for Good, "Tuk" for Again, streak chime, combo-break glass — preloaded via Web Audio API from `/public/sounds/`; user-toggleable in Settings
- **Haptic Feedback (FR30b, Mobile):** Light vibration `navigator.vibrate([10])` on flip, decisive buzz `navigator.vibrate([30])` on grade swipe; no-op on unsupported devices; toggleable in Settings
- **Keyboard Controller (Desktop):** Space=flip, ←/→=grade; keyboard hints displayed faded below card
- **Zone Accent Colors:** Practice=Purple, Grammar Blog/Lesson=Teal, Studio/Review=Neutral/Dark
- **Component System:** `sq-card`, `sq-btn`, `sq-input`, `pill` — unified border-radius 14px, shadow, spacing rhythm
- **Button Hierarchy:** Only 1 Primary (sq-btn-green) per screen; Destructive (sq-btn-red) always left of Primary
- **Feedback States:** Inline/contextual only — no toast notifications in MVP
- **Empty States:** Illustrations with CTAs (not blank screens)
- **No full modals in MVP:** Everything inline or slide panel; destructive confirm is inline row
- **Deep Reading Tracking:** Track alive_text_interactions per user per lesson for engagement analytics
- **WCAG AA Compliance:** Focus ring purple #7C3AED 2px on all interactive elements; touch targets min 44×44px; semantic HTML5; screen reader aria-labels on all icons
- **Lighthouse Accessibility Score:** Target >90

### FR Coverage Map

| FR | Epic | Mô tả ngắn |
|---|---|---|
| FR1 | Epic 1 | User registration & login |
| FR2 | Epic 1 | Profile management |
| FR3 | Epic 1 | Personal data export (GDPR Art. 20) |
| FR4 | Epic 1 | Account deletion / tombstoning (GDPR Art. 17) |
| FR5 | Epic 2 | Group creation & configuration |
| FR5a | Epic 2 | Dashboard: view & navigate to joined groups |
| FR6 | Epic 2 | Invite link generation & revocation |
| FR7 | Epic 2 | Direct invite by username |
| FR8 | Epic 2 | Accept / decline group invitations |
| FR9 | Epic 2 | Remove members |
| FR10 | Epic 2 | Assign roles (Member, Contributor, Editor) |
| FR11 | Epic 2 | Schedule group exercises |
| FR12 | Epic 2 | Delete group (soft-delete content) |
| FR13 | Epic 3 | Content Studio access |
| FR14 | Epic 3 | WYSIWYG Markdown lesson editor (Tiptap) |
| FR15 | Epic 3 | Markdown file import with preview |
| FR16 | Epic 3 | Export lesson (Markdown, DOCX, PDF) |
| FR17 | Epic 3 | Submit draft to editorial queue |
| FR18 | Epic 3 | View draft submission status |
| FR25 | Epic 4 | Editor view lesson submission queue |
| FR26 | Epic 4 | Approve or reject lesson submissions |
| FR27 | Epic 4 | Line-level feedback comments on lessons |
| FR28 | Epic 4 | Soft-delete published content |
| FR28a | Epic 4 | Editorial arbitration authority (execution path implemented in Epic 6 dispute lifecycle) |
| FR28b | Epic 4 | Learning Path Roadmap Editor — drag-and-drop curriculum ordering |
| FR29 | Epic 4 | Learners view published lessons |
| FR30 | Epic 5 | Flashcard swipe UI (mobile-optimized) |
| FR30a | Epic 5 | Offline-first flashcard caching (Dexie.js) |
| FR30b | Epic 5 | Audio micro-feedback & haptic for flashcard practice |
| FR31 | Epic 5 | SRS scheduling (SM-2 algorithm) |
| FR31a | Epic 5 | Study-ahead beyond daily SRS schedule |
| FR32 | Epic 5 | Complete quizzes / personal practice tests |
| FR33 | Epic 5 | Edit flashcards during study sessions |
| FR19 | Epic 6 | Exercise Studio access |
| FR20 | Epic 6 | Auto-format pasted quiz content |
| FR21 | Epic 6 | Flashcard Macro exercise generator |
| FR22 | Epic 6 | 1-click quiz type templates |
| FR23 | Epic 6 | Mandatory weekly exercise creation + derangement shuffle |
| FR24 | Epic 6 | Focus Mode / anti-cheat during group challenges |
| FR35 | Epic 6 | System derangement shuffle assignment |
| FR36 | Epic 6 | Complete and submit assigned group challenge exercise |
| FR37 | Epic 6 | Creator grades peer answers (line-level) |
| FR38 | Epic 6 | Threaded debate on line-level comments |
| FR39 | Epic 6 | Creator modifies score after debate |
| FR40a | Epic 6 | Exercise taker flags incorrect question (dispute) |
| FR40b | Epic 6 | Editor arbitrates dispute binding decision |
| FR40c | Epic 6 | Error count added to creator if question wrong |
| FR40d | Epic 6 | Error count added to taker if answer wrong |
| FR40e | Epic 6 | Weekly exercises become public archive after week ends |
| FR41 | Epic 6 | Editor monitors peer-review for inappropriate comments |
| FR34 | Epic 7 | Email reminder before weekly exercise creation deadline |
| FR40 | Epic 7 | Email notifications (assignment, grading, deadlines) |
| FR42 | Epic 8 | Daily learning streak tracking & display |
| FR43 | Epic 8 | Live leaderboard calculation & updates |
| FR44 | Epic 8 | View group leaderboard |
| FR45 | Epic 8 | Contributor badge awards |
| FR46 | Epic 8 | Activity Heatmap (GitHub-style contribution calendar) |

### Traceability Notes (Correct Course 2026-03-12)

- FR3 implementation path restored in `epic-1` via Story 1.5 (personal data export).
- FR4 implementation path restored in `epic-1` via Story 1.6 (account deletion and tombstoning).
- Epic 4 Story 4.4 is moderation-only to maintain epic independence.
- FR40b/FR40c/FR40d execution is centralized in `epic-6` via Story 6.7 (editor arbitration decision and error settlement).

