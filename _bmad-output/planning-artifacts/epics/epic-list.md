# Epic List

### Epic 1: Foundation — Project Setup & Authentication
Users can register, log in, manage their profile, export their data, and request account deletion. Establishes the technical foundation (Next.js + Supabase + shadcn/ui) and GDPR-compliant auth system that all other epics depend on.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 2: Group Management & Membership
Group Admins can create groups, generate invitation links, invite users directly, manage member access, assign roles, schedule exercises, and delete groups. Establishes the group container that all content and activity lives within.
**FRs covered:** FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12

### Epic 3: Content Studio — Lesson & Flashcard Creation
Contributors can create lessons with a WYSIWYG Markdown editor, import Markdown files, export lessons to Markdown/DOCX/PDF, submit drafts to the editorial queue, and track submission status.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18

### Epic 4: Editorial Review & Learning Path
Editors can view the lesson submission queue, approve or reject with line-level feedback, and soft-delete published content. Learners can view published lessons in the group learning path.
**FRs covered:** FR25, FR26, FR27, FR28, FR28a, FR29

### Epic 5: Practice Engine — Flashcard SRS & Quizzes
Learners can study flashcards with a mobile-optimized swipe interface, offline-first caching via Dexie.js, SM-2 spaced repetition scheduling, study-ahead capability, quiz completion, and inline card editing.
**FRs covered:** FR30, FR30a, FR31, FR31a, FR32, FR33

### Epic 6: Exercise Studio & Peer-Review Loop
Contributors can create exercises with templates and macros. The system performs weekly derangement shuffle. Members complete assigned exercises, creators grade with line-level feedback, debates occur in threads, disputes escalate to Editors for binding decisions, and weekly exercises become public archive after the week ends.
**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR24, FR35, FR36, FR37, FR38, FR39, FR40a, FR40b, FR40c, FR40d, FR40e, FR41

### Epic 7: Notifications System
The platform sends email and in-app notifications for all trigger events: exercise assignment, creation deadline reminders, grading reminders, lesson approval/rejection, dispute opened/resolved, and streak milestones. Includes rate limiting, free-tier quota management, and in-app fallback.
**FRs covered:** FR34, FR40

### Epic 8: Gamification & Engagement Engine
The system tracks daily learning streaks, calculates and displays a live leaderboard updated in real-time via Supabase Realtime, and awards contributor badges based on approved submissions.
**FRs covered:** FR42, FR43, FR44, FR45

### Epic 9: Admin Dashboard & Platform Operations
Platform admins can monitor system health (CCU, DB connections, storage), manage users (warnings, bans), moderate content, track email quotas, and review growth analytics (MoM retention, streak velocity, contributor ratio).
**FRs covered:** Platform admin journey (Journey 5 from PRD)

---

