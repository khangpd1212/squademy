# Product Requirements Document - Squademy

**Author:** Mestor
**Date:** 2026-03-07T18:50:37+07:00

## Executive Summary

Squademy is a web-based, all-in-one English learning platform that replaces the fragmented ecosystem of Anki, Notion, Google Sheets, and ad-hoc social media groups with a unified, community-driven experience. It targets self-studying English groups—students (15–24) and young professionals (25–35)—who need structured learning paths, frictionless content creation tools, and built-in accountability mechanisms to maintain long-term study discipline.

The platform operates on a dual-role model: every member is both a learner and a potential content contributor. Members study through editor-curated learning paths, practice via interactive exercises (flashcards, quizzes, dictation, cloze tests), and can contribute their own lessons back to the group. An editor reviews and approves all contributed content, ensuring curriculum quality through a GitHub-style editorial workflow (Draft → Review → Publish).

Squademy is asynchronous by design. It provides no built-in video or voice meeting functionality; users who wish to meet live use third-party platforms. Connection and accountability are achieved through structured workflows: exercise completion tracking, peer-review swapping, leaderboards, streaks, and reputation systems. Groups are formed by manual invitation, not algorithmic matching.

### What Makes This Special

Squademy's core insight is that the best way to learn is not just consuming curated content—it is creating it and reviewing others' work. The platform operationalizes this through two distinct accountability loops:

1. **Content Loop:** Any member contributes a lesson → The group editor reviews and approves → Approved content becomes available to the squad. This creates a sense of ownership and true community curation.
2. **Practice Loop:** Every group member creates an exercise before the weekly deadline → The system performs a round-robin shuffle (derangement: nobody receives their own) so each member is assigned exactly one exercise created by another member → Each member completes and submits the assigned exercise → The completed submission returns to its original creator for grading with line-level feedback → Both parties learn. This mandatory reciprocal mechanism ensures every member is both an exercise creator and an exercise taker each week.

These loops, combined with gamification components (streaks, leaderboards, contributor badges), create a self-reinforcing engagement cycle that no combination of standalone tools can replicate.

## Project Classification

- **Project Type:** Web Application / User-Generated Content (UGC) Platform
- **Domain:** EdTech / Social Learning (English Language Learning)
- **Complexity:** Medium — structured learning paths, peer-review swapping, dual user roles (learner/contributor), editorial gatekeeping; no real-time A/V communication
- **Project Context:** Greenfield — new product built from scratch
- **Architecture Constraint:** Zero-OPEX (free-tier infrastructure, edge computing, voluntary donations only)

## Success Criteria

### User Success

**Learner Success:**
- A user maintains a 7-day study streak, indicating successful onboarding and habit formation.
- A user consistently engages with exercises and reviews throughout a full month.
- After 3–6 months of continuous usage, the user demonstrates measurable proficiency improvement (e.g., higher quiz accuracy, passing a level-up test).

**Contributor Success:**
- A member's first contributed lesson is approved by the editor — the "my work matters" moment.
- Contribution count is tracked and visible; active contributors earn contributor badges.
- A healthy ratio of contributors to passive learners develops organically within groups.

**Peer Review Success:**
- Assigned exercises are completed by peers within a reasonable timeframe.
- The system sends email reminders for pending exercises and pending grading (OpenReview-style nudging).
- Both exercise creator (grader) and exercise taker experience the exercise as a learning moment, not a chore.

### Business Success

- **Months 1–6:** User acquisition and retention within a zero-OPEX environment. No paid infrastructure.
- **Post-1,000 active users:** Initiate premium account monetization (Phase 2).
- **KPIs:**
  - 70% month-over-month retention rate
  - Reach 1,000 active users before Phase 2
  - Track streak engagement velocity (7-day and 30-day streaks)
  - Monitor contributor-to-learner ratio per group

### Technical Success

- Platform operates reliably at zero ongoing operational cost (free tiers + edge computing).
- Supports 1,000 concurrent users (CCU) on the chosen infrastructure.
- Core features function end-to-end without reliance on disparate external tools.

### Measurable Outcomes

| Metric | Target | Timeframe |
|---|---|---|
| 7-day streak retention | ≥60% of new users | Month 1 |
| MoM retention | ≥70% | Ongoing |
| Active users | 1,000 | Before Phase 2 |
| Peer review completion | ≥80% reviewed within 48h | Ongoing |
| Contributor ratio | ≥10% of group members contributing | Month 3+ |
| CCU capacity | 1,000 | Launch |

## Product Scope

### MVP — Minimum Viable Product

Core features essential for proving the concept:

- **Flashcard Engine:** SRS functionality, Anki `.apkg` import, Tinder-swipe mobile-friendly interface (powered by **Framer Motion** for gestures and **Dexie.js** for offline-first caching).
- **Smart WYSIWYG Editor:** Powered by **Tiptap** (Free/Community edition); Markdown + MathJax support, auto-format pasted content, GitHub-style collaboration flow (Draft → Editor Review → Publish).
- **Interactive Quiz Creator:** Generate group challenges from existing flashcards (Multiple Choice, Word-Definition, Cloze, Dictation, **IPA -> Word**, **Word -> Sentence**).
- **Peer-Review Swapping:** Random assignment of created exercises to peers for completion; creator grades submitted answers with accept/reject + comments; email reminders for pending exercises and grading.
- **Progress Tracking & Gamification:** Streaks, leaderboards, error-target tracking, contributor badges, reputation system.
- **Group Management:** Manual invitation-based groups, editor role for content gatekeeping.
- **Focus Mode / Anti-Cheat:** Integrated anti-cheat mechanisms for quizzes during timed assessments.

### Growth Features (Phase 2)

- **Forum / Q&A:** Stack Overflow-style forum for questions and discussions within groups.
- **Premium Accounts:** Subscription tiers, payment gateway, premium-only features (post 1,000 users).
- **Mock Test / Exam Simulation:** Timed mock tests simulating standardized exams (IELTS, TOEIC, etc.) with structured sections, configurable time limits, and post-test analytics.

### Vision (Phase 3+)

- **Subject-Agnostic Platform:** Expand beyond English to medical, programming, and other terminology-heavy learning.
- **AI Integrations:** Auto-generate quizzes from editor content, AI-assisted dictation grading.
- **Advanced Analytics:** Per-user learning path recommendations, group health dashboards.

## User Journeys

### Journey 1: Linh — The Eager Learner (Primary User, Happy Path)

**Who:** Linh, 22, university student in Ho Chi Minh City. She passed IELTS 5.5 but needs 6.5 for her scholarship application. She studies with a group of 5 classmates but they keep losing momentum because organizing study sessions is exhausting.

**Opening Scene:** Linh receives a Squademy invite link from her classmate Minh (the group admin). She signs up, joins "IELTS Warriors," and sees a structured learning path with flashcard decks and exercises already set up by the group's editor.

**Rising Action:** Linh starts her first flashcard session—swiping through vocabulary cards feels intuitive and fast. It’s exercise week: all 5 members of IELTS Warriors must create and submit an exercise before the deadline. Linh creates a dictation exercise, and Hà creates a cloze test on collocations. The system shuffles all 5 exercises so nobody gets their own. Linh receives Hà’s cloze test and completes it. Phúc receives Linh’s dictation exercise, transcribes the audio, and submits. Linh then grades Phúc’s submission — she marks two errors and adds a comment: "Watch out for ‘affect’ vs ‘effect’!"

**Climax:** Day 7 — Linh earns her first streak badge. She checks the leaderboard and sees she's #2 in the group. She also gets a notification: "Hà graded your cloze test submission — 92% correct! 🎉" The feedback is specific and helpful. She realizes she's learning faster *because* she's both creating exercises for others and completing exercises made by her peers.

**Resolution:** After one month, Linh has maintained her streak, contributed two lesson drafts (one approved by the editor), and her quiz accuracy has risen from 68% to 84%. She tells her roommate about Squademy.

**Capabilities revealed:** Invitation-based onboarding, flashcard SRS, exercise creation and completion, peer-assignment swapping, creator-grading with comments, email notifications, streak tracking, leaderboard, contributor workflow.

---

### Journey 2: Linh — The Frustrated Learner (Primary User, Edge Case)

**Who:** Same Linh, but things go wrong.

**Opening Scene:** Linh created a dictation exercise, but the peer assigned to complete it hasn't submitted answers for 3 days. She also submits a lesson on "Business Email Writing," but the editor rejects it with feedback: "Too similar to existing lesson. Try covering formal complaint letters instead."

**Rising Action:** Linh receives an email reminder: "You have 2 exercises to complete!" She realizes she also forgot to complete Phúc's assigned exercise. She opens it, completes it, and submits her answers. Meanwhile, the system has sent a reminder to the peer assigned to Linh's dictation exercise.

**Climax:** Linh revises her lesson based on the editor's feedback and resubmits. This time it gets approved. She sees her contribution count go from 0 to 1, and earns her first Contributor badge.

**Resolution:** Linh learns that rejection isn't failure — it's part of the editorial quality loop. The reminder system prevented her review from being forgotten.

**Capabilities revealed:** Email reminders for pending exercises and grading, lesson rejection with feedback, lesson resubmission, contributor badge system, notification for exercise and grading deadlines.

---

### Journey 3: Minh — The Group Admin

**Who:** Minh, 24, the unofficial study group leader. He created the IELTS Warriors group because he's the most organized person in the friend circle.

**Opening Scene:** Minh creates a new group on Squademy called "IELTS Warriors." He generates an invite link and sends it to his 5 classmates via their group chat.

**Rising Action:** As members join, Minh sees the member list grow. He designates Trang (who has the highest English level) as an Editor. Later, he also promotes Hà to Editor because the group is growing and Trang can't review everything alone. Minh himself focuses on studying, not editing.

**Climax:** The group reaches 12 members through word of mouth. Minh removes an inactive member who hasn't engaged in 3 weeks. He checks group-level stats: 8 of 12 members maintained their weekly streak, and 3 lessons were approved this month.

**Resolution:** Minh's group runs itself — editors maintain quality, the peer swap keeps everyone accountable, and Minh only needs to manage membership and editor assignments.

**Capabilities revealed:** Group creation, invite link generation, member management (add/remove), editor role assignment, group-level analytics dashboard, multi-editor support.

---

### Journey 4: Trang — The Editor

**Who:** Trang, 26, IELTS 7.5 holder and Minh's friend. She takes the editor role seriously because she cares about content quality.

**Opening Scene:** Trang receives a notification: "Linh submitted a new lesson: Business Email Writing." She opens the review interface, reads through the lesson content in the editor.

**Rising Action:** Trang reviews the lesson structure, checks grammar, and verifies accuracy. She finds the lesson overlaps heavily with an existing one. She rejects the submission with detailed feedback: "Great effort! But we already cover formal email openings. Could you pivot to formal complaint letters? That's a gap in our curriculum." She also approves a vocabulary lesson from Phúc that perfectly fills a gap in the learning path.

**Climax:** Trang curates the learning path by reordering approved lessons for logical progression. She sees the group's curriculum growing organically from member contributions — exactly as intended.

**Resolution:** Trang spends about 20 minutes per week on editorial duties. The quality bar she maintains means every lesson in the group's path is vetted and valuable.

**Capabilities revealed:** Lesson review interface (approve/reject with comments), curriculum organization (ordering lessons in learning path), editorial notifications, content quality gatekeeping.

---

### Journey 5: Platform Admin — System Operations

**Who:** The Squademy ops team (initially just the founder/developer).

**Opening Scene:** The platform admin logs into the admin dashboard and checks system health: 850 CCU, 120 active groups, storage usage at 40% of free-tier limit.

**Rising Action:** A user reports inappropriate content in a lesson. The admin reviews the flagged content, removes it, and sends a warning to the author. They also notice one group has grown to 50 members, which is straining the free-tier email quota for review reminders.

**Climax:** The admin adjusts the email reminder frequency for large groups and monitors the impact. They also review the monthly growth metrics: new sign-ups, group creation rate, and retention trends.

**Resolution:** The platform runs smoothly within zero-OPEX constraints. The admin makes data-driven decisions about when to introduce Phase 2 premium features.

**Capabilities revealed:** Admin dashboard (CCU, storage, email quotas), content moderation/flagging system, user management (warnings, bans), system health monitoring, growth analytics.

---

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
| --- | --- |
| Learner (Happy) | Onboarding, flashcards, exercises, peer-review swap, streaks, leaderboard |
| Learner (Edge) | Email reminders, lesson rejection/resubmission, contributor badges |
| Group Admin | Group CRUD, invite links, member management, editor role assignment, group analytics |
| Editor | Lesson review (approve/reject + comments), learning path curation, editorial notifications |
| Platform Admin | Admin dashboard, content moderation, system monitoring, growth analytics |

## Domain-Specific Requirements

### Privacy & Data Protection

- **Data Collection:** Platform collects full user profile data including name, email, age, school/workplace, and location.
- **Data Retention:** All user data and content is retained indefinitely. Deleted group content is soft-deleted (removed from frontend, retained in backend for future AI exploration).
- **International Compliance (GDPR):** Platform targets international reach from MVP. Must implement:
  - Cookie consent and privacy policy acceptance at registration
  - User data export capability (GDPR Article 20 — data portability)
  - Account deletion request flow (GDPR Article 17 — right to erasure, noting backend retention policy must be disclosed)
- **Vietnam PDPA:** Comply with Vietnam's Personal Data Protection Decree (Decree 13/2023) for local user data handling.

### Content Moderation

- **Editorial Gatekeeping as Primary Moderation:** The editor review process serves as the primary content moderation layer. All contributed lessons must pass editor approval before publication.
- **No Explicit Prohibited Content Policy (MVP):** No additional content restrictions beyond editor judgment. No automated content filtering at launch.
- **No Copyright Enforcement (MVP):** No built-in copyright checking for imported Anki decks or pasted content. Users accept responsibility via Terms of Service.
- **Future Consideration:** Content reporting/flagging by members may be added Post-MVP as the platform scales beyond trusted friend groups.

### Notification & Email Constraints

- **Email Strategy:** Use free-tier email service (e.g., Resend, Brevo) or self-hosted system email within zero-OPEX constraint.
- **Notification Triggers:**
  - **Immediate:** Email sent to peer reviewer upon exercise swap assignment.
  - **Reminder:** Email sent 1 day before review deadline if not yet completed.
  - **Editorial:** Email sent to editors when new lesson submission arrives.
- **Fallback:** In-app notification as fallback when email quotas are exceeded.
- **Rate Limiting:** Email frequency caps for large groups to stay within free-tier quotas.

### Data Portability & Ownership

- **User Export:** Users can export their flashcard decks and learning progress data.
- **Soft Delete Policy:** When a group admin deletes a group, all lessons and content are removed from the frontend UI but retained in the backend database for potential future AI training/exploration.
- **Contributor Ownership:** Contributors retain awareness that their content may persist in backend systems post-deletion (disclosed in Terms of Service).

### Risk Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Email quota exhaustion** | Peer reviews stall, engagement drops | In-app notification fallback, rate limiting for large groups. |
| **GDPR deletion request vs. soft-delete policy** | Legal non-compliance | Transparent privacy policy, full deletion of PII while tombstoning content. |
| **Editor bottleneck** | Content backlog, contributor frustration | Multi-editor support, editorial dashboard with queue visibility. |
| **Inappropriate peer review comments** | Toxic interactions | Editor oversight, future implement comment flagging system. |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Dual Accountability Loop Architecture** — Most EdTech platforms create dependency on an authority figure (teacher, AI, pre-built course). Squademy creates a self-sustaining ecosystem where users ARE the value engine through two interlocking loops (Content Loop + Practice Loop). This generates network effects — rare in EdTech — where each additional member increases platform value.

2. **GitHub-for-Education Content Model** — Democratizing content creation within trusted groups using an open-source contribution model (Draft → Editor Review → Publish). Unlike top-down platforms (Khan Academy, Coursera), Squademy's editorial gatekeeping combines quality control with community ownership.

3. **Peer-Review-as-Pedagogy** — The exercise creation-and-grading mechanism operationalizes the "protégé effect" (learning by teaching) as a core platform mechanic. Creating exercises and grading peers' submissions reinforces the creator's own knowledge, turning both exercise design and assessment into bidirectional learning moments.

4. **Asynchronous-First Group Learning** — A contrarian design choice that deliberately excludes real-time features. This reduces infrastructure complexity (no WebSocket/STUN/TURN servers), directly enabling the zero-OPEX constraint while creating connection through structured asynchronous workflows.

5. **Alive Text (Novel Social Reading)** — Content in lessons that remains hidden (rendered as animated dots) until interacted with, encouraging active reading and focus.

6. **Social Hotspots** — Contextual reaction and comment anchors aligned with specific paragraphs or sections of lessons, creating a sense of "co-presence" in a purely asynchronous environment.

### Key Product Principles

- **Graceful Degradation to Solo Mode:** The platform functions at every group size — from 1 (solo self-study) to many. Solo users can create and take their own quizzes; the swap mechanism activates only when peers exist, eliminating the cold start problem.
- **Mandatory Round-Robin Shuffle (MVP):** Every group member must create one exercise per weekly cycle. The system performs a derangement shuffle — a random permutation where no member receives their own exercise. Each member creates exactly one, solves exactly one, and grades exactly one. Weighting logic based on proficiency is deferred to Growth phases.

### Competitive Landscape

| Capability | Squademy | Anki | Duolingo | StudyBlue |
| --- | --- | --- | --- | --- |
| Peer content creation | ✅ Editorial gate | ❌ | ❌ | Partial (no gate) |
| Peer exercise review | ✅ Swap mechanism | ❌ | ❌ | ❌ |
| Async group learning | ✅ Core design | ❌ Solo only | ❌ Solo only | Partial |
| Network effects | ✅ Both loops | ❌ | ❌ | Weak |
| Solo-to-group scaling | ✅ Graceful | N/A (solo) | N/A (solo) | Partial |

### Validation Approach

- Validate dual-loop engagement with a pilot group of 5–10 users over 30 days.
- Measure: Does peer review completion rate stay above 80%? Do contributors increase over time?
- Monitor swap quality: Are "lazy reviews" (no comments, instant approval) a problem?

### Innovation Risk Mitigation

| Risk | Mitigation |
| --- | --- |
| **Lazy peer reviews** ("looks good 👍") | Track review depth (comment length, time spent); incentivize quality via reputation. |
| **Solo mode users never forming groups** | Onboarding prompts to invite friends; prominently showcase group benefits. |
| **Editor burnout in large groups** | Multi-editor support (already designed); priority editorial queue dashboard. |

## Web Application Specific Requirements

### Project-Type Overview

Squademy is a hybrid SPA/MPA web application — server-rendered pages for static/marketing content with SPA-like interactivity for core features (flashcard swiping, quiz taking, editor interface, leaderboard). Chrome is the primary supported browser for MVP.

### Browser Support

| Browser | MVP Support | Post-MVP |
| --- | --- | --- |
| Chrome (latest 2 versions) | ✅ Primary | ✅ |
| Firefox | ❌ | ✅ |
| Safari | ❌ | ✅ |
| Edge | ❌ | ✅ |

### Responsive Design

- **Mobile-first approach:** Interface designed for mobile screens first, then scaled up for tablet and desktop.
- **Flashcard UI:** Tinder-style swipe gestures optimized for touch devices (Framer Motion).
- **Breakpoints:** Mobile (< 768px), Tablet (768–1024px), Desktop (> 1024px).
- **All core features must be fully functional on mobile Chrome.**
- **Theming & Branding:**
  - Primary Colors: Electric Purple (`#7C3AED`), Teal (`#0D9488`), Pink (`#EC4899`).
  - Success Indicator: Green (`#34d399` / Emerald-400).
  - Adaptive UI: Light Mode (Zinc-50/White) and Dark Mode (Zinc-950/Zinc-900).
- **Typography:**
  - `Nunito` for playful display and general headers.
  - `Inter` for standard reading and body text.
  - `Fira Code` (Monospace) for specialized technical or IPA notation.

### Performance Targets

| Metric | Target | Context |
| --- | --- | --- |
| First Contentful Paint (FCP) | < 1.5s | Chrome on 4G connection |
| Largest Contentful Paint (LCP) | < 2.5s | Core Web Vitals threshold |
| Time to Interactive (TTI) | < 3.5s | Flashcard deck ready to swipe |
| Concurrent Users (CCU) | 1,000 | Zero-OPEX infrastructure |

### Real-Time Features

Despite the asynchronous-first design, select features require real-time updates:

- **Leaderboard:** Live score updates when group members complete exercises or earn streaks.
- **Notification badges:** In-app notification count updates without page refresh.
- **Implementation approach:** Server-Sent Events (SSE) or lightweight polling preferred over full WebSocket to minimize infrastructure cost within zero-OPEX constraint.

### SEO Strategy

- **MVP:** No SEO optimization needed. All content is behind authentication.
- **Post-MVP:** Public landing page and marketing pages may require basic SEO (meta tags, structured data).

### Accessibility

- **Target:** WCAG 2.1 Level AA compliance.
- **Key considerations:**
  - Keyboard navigation for all interactive elements (flashcard review, quiz answering, editor).
  - Screen reader support for exercise content and peer review feedback.
  - Sufficient color contrast ratios (4.5:1 minimum for text).
  - Focus indicators for interactive elements.

### Implementation Considerations

- **Framework:** Hybrid SPA/MPA suggests a framework like Next.js (SSR + client-side interactivity) or similar.
- **Infrastructure:** **Structured data** (users, groups, lessons, exercises, reviews, etc.) are stored in **Supabase** (PostgreSQL, Auth, Realtime). **Unstructured data** (audio recordings, images, exported files, and other binary assets) are stored in **Cloudflare R2**. Static assets and edge caching use **Cloudflare Free CDN**; frontend hosting on **Vercel**.
- **State Management:** Client-side state for interactive features (flashcard progress, quiz state); server state for data persistence.
- **Long-Form Lesson Optimization:** Grammar lessons stored as Tiptap ProseMirror JSON (`content jsonb`) may grow very large. The architecture must support lazy-loading content blocks (progressive rendering of lesson sections) and consider JSONB compression or chunked storage for lessons exceeding a configurable threshold (e.g., 500KB) to balance database performance with rich content needs.
- **Offline Capability:** Not required for MVP (zero-OPEX constraint limits service worker complexity).
- **PWA:** Consider Progressive Web App shell for mobile-first experience (Post-MVP).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** "Platform MVP" — A full ecosystem launch. The core value of Squademy relies on the interaction between multiple systems (content creation, peer review, gamification, and asynchronous group dynamics). A stripped-down version would not adequately test the dual accountability loops. Therefore, all foundational mechanics must be present from Day 1 to validate the core hypothesis.

**Resource Requirements:** Zero-OPEX constraint necessitates careful architectural choices (e.g., serverless, managed free-tier services) to support a comprehensive feature set without initial funding.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Learner (Happy Path & Edge Case: Peer Review)
- Contributor (Lesson Creation & Submission)
- Editor (Review & Approval)
- Group Admin (Provisioning & Management)
- Platform Admin (Oversight)

**Must-Have Capabilities (Day 1):**
- **Content Engine:** WYSIWYG Markdown editor for lessons, Quizzes, Anki deck import/parsing.
- **Practice Engine:** Flashcard UI with Tinder-style swiping, Spaced Repetition logic.
- **Accountability Engine:** Peer-review exercise swap mechanism with comment capabilities.
- **Gamification Engine:** Streaks, live leaderboards, contributor badges.
- **Group Mechanics:** Invitation-only group creation and user roles (Admin, Editor, Member, Contributor).
- **Focus Mode / Anti-Cheat:** Integrated anti-cheat and focus mechanics (e.g., Pomodoro timer, tab-switch warnings) for timed assessments.

### Post-MVP Features

**Phase 2 (Growth):**
- In-depth Analytics Dashboard for Learners and Editors.
- Enhanced notifications (push notifications).
- Multi-editor queue management improvements.
- **Mock Test / Exam Simulation:** Organize timed mock tests that simulate standardized exams (e.g., IELTS, TOEIC). Includes structured sections (Listening, Reading, Writing), configurable time limits per section, auto-scoring where possible, and post-test analytics comparing performance to target scores.

**Phase 3 (Expansion):**
- Real-time Forum / Q&A spaces.
- AI Integrations (Auto-grading assistance for Editors, content generation suggestions).
- Monetization infrastructure (subscription tiers post-1,000 users).

### Risk Mitigation Strategy

**Technical Risks (Concurrency, Privacy, Safety):**
- *Concurrency (1k CCU):* Rely on **Supabase** for structured data (PostgreSQL database, authentication, realtime) and **Cloudflare R2** for unstructured assets (audio recordings, images, file uploads). Frontend is hosted on Vercel; static assets and edge caching use **Cloudflare Free CDN**. The system targets 1,000 CCU within free-tier constraints.
- *Privacy (GDPR/PDPA):* Architect database to separate PII from content for easy anonymization (tombstoning) upon deletion.
- *Safety (Content Moderation):* Empower Editors as the primary content gatekeepers, supported by peer-review reporting mechanisms.

**Market Risks:**
- *Cold Start:* Emphasize solo-mode utility during initial onboarding so users gain standalone value before inviting peers.

**Resource Risks:**
- *Developer Burnout:* As a solo developer building a Platform MVP, prioritize established libraries (existing Markdown parsers, robust Spaced Repetition algorithms) over custom implementations.

## Functional Requirements

### User Anatomy & Authentication

- **FR1:** Users can register and log in to the platform.
- **FR2:** Users can manage their profile information (name, email, age, school, location).
- **FR3:** Users can request a complete export of their personal data.
- **FR4:** Users can request account deletion (which anonymizes but retains their contributed content).

### Group Administration & Access

- **FR5:** Group Admins can create and configure new learning groups.
- **FR6:** Group Admins can generate and revoke private invitation links.
- **FR7:** Group Admins can invite users directly by typing their username.
- **FR8:** Users can view, accept, or decline direct group invitations.
- **FR9:** Group Admins can manage member access (remove members).
- **FR10:** Group Admins can assign user roles (Member, Contributor, Editor) within their group.
- **FR11:** Group Admins can schedule recurring or specific dates for group exercises/challenges.
- **FR12:** Group Admins can delete a group (triggering soft-delete of group content).

### Content Studio (Lessons)

- **FR13:** Contributors can access a dedicated Content Studio optimized for document formatting (headings, fonts, tables, colors).
- **FR14:** Contributors can create new lessons using a WYSIWYG Markdown editor.
- **FR15:** Contributors can import lessons via Markdown files and render a preview within 1 second.
- **FR16:** Users can export lessons for offline use in Markdown, DOCX, or PDF formats.
- **FR17:** Contributors can submit drafts to the editorial queue for review.
- **FR18:** Contributors can view the status of their submitted lesson drafts.

### Exercise Studio (Quizzes & Challenges)

- **FR19:** Contributors can access a dedicated Exercise Studio optimized for rapid quiz creation using templates and macros.
- **FR20:** Contributors can automatically format pasted quiz content (from GPT or other websites) to match the platform theme.
- **FR21:** Contributors can use a "Flashcard Macro" to select specific flashcards, filter by unit, and generate specific question types (e.g., word-definition, sound-word, **IPA -> Word**, **Word -> Free-text Sentence**).
- **FR22:** Contributors can use 1-click standard templates for quiz types (Multiple Choice, Fill in the Blank, Cloze Test, Matching, True/False/Not Given, Paragraph Writing, **Alive Text Block**).
- **FR23:** Every group member must create and submit an exercise before the weekly exercise deadline. The system then performs a round-robin shuffle (derangement) assigning each member exactly one exercise created by another member. Exercises do NOT require Editor approval before assignment — creators are solely responsible for exercise quality. Members can also create "Personal Practice Test" exercises for self-assessment (not shuffled).
- **FR24:** The platform shall enforce "Focus Mode" during timed group challenges, activating anti-cheat mechanisms (e.g., logging tab-switches or window-blur events).

### Editorial Moderation (Editor Journey)

- **FR25:** Editors can view a queue of pending **lesson** submissions (exercises do NOT go through editorial review).
- **FR26:** Editors can review, approve, or reject **lesson** submissions.
- **FR27:** Editors can provide feedback comments at the specific line-level of the submitted lesson content.
- **FR28:** Editors can soft-delete published content that violates guidelines.
- **FR28a:** Editors can arbitrate exercise disputes escalated by assignees (see FR40a–FR40d).
- **FR28b:** Editors can access a dedicated Learning Path (Roadmap) editor screen where they can drag-and-drop to reorder published lessons and flashcard decks into a sequential curriculum for group members.

### Practice Engine (Learner Journey)

- **FR29:** Learners can view published lessons within their group.
- **FR30:** Learners can study flashcards using a mobile-optimized swipe interface or alternative accessible interactable buttons.
- **FR30a:** Flashcard decks are stored offline-first on the client. New decks are loaded from the server only when the learner opens a deck for the first time.
- **FR30b:** The flashcard practice session provides audio micro-feedback (e.g., soft flip sound, "ding" on Good, "tuk" on Again) and haptic feedback on supported mobile devices (light vibration on flip, decisive vibration on swipe) to reinforce the tactile, game-like experience.
- **FR31:** The system can surface flashcards based on Spaced Repetition logic.
- **FR31a:** Learners can study ahead — completing extra cards beyond the daily SRS schedule or loading additional decks beyond the weekly plan.
- **FR32:** Learners can complete Quizzes attached to lessons or personal practice tests.
- **FR33:** Users have the option to edit flashcards directly during study or review sessions to correct errors or add personal context, mirroring the edit functionality supported by Anki.

### Peer-Review & Accountability (The Challenge Loop)

- **FR34:** The system can send email reminders to members before the weekly exercise creation deadline indicating they must create and submit their exercise.
- **FR35:** Once all members have submitted exercises (or the deadline passes), the system performs a derangement shuffle: each member is assigned exactly one exercise created by another member (no member receives their own).
- **FR36:** Learners can complete and submit their assigned Group Challenge exercises created by other members.
- **FR37:** Exercise creators can grade submitted peer answers and provide feedback/approval at the specific line-level.
- **FR38:** Creators (graders) and exercise takers can engage in threaded debates on specific line-level comments (similar to Wattpad/GitHub).
- **FR39:** Creators can modify their final score/decision for an exercise after engaging in a comment debate.
- **FR40:** The system can send email notifications for new exercise assignments, submitted answers pending grading, and impending deadlines.
- **FR40a:** Exercise takers can report specific questions they believe are incorrect by flagging them with a reason, escalating the dispute to the Editor.
- **FR40b:** Upon escalation, the Editor reviews the debate thread and makes a binding decision on whether the exercise creator or the exercise taker is correct.
- **FR40c:** If the Editor rules the creator's question was incorrect, the system adds errors to the creator's weekly error count for each incorrectly authored question.
- **FR40d:** If the Editor rules the taker's answer was incorrect, the system adds errors to the taker's weekly error count as normal.
- **FR40e:** After the weekly exercise period ends, all Group Challenge exercises created during that week become publicly available within the group for additional practice (unscored).
- **FR41:** Editors can monitor peer-review interactions for inappropriate comments.

### Gamification & Engagement
- **FR42:** The system can track and display daily learning streaks.
- **FR43:** The system can calculate and update a live Leaderboard based on learning and review activity.
- **FR44:** Users can view the live Leaderboard within their group.
- **FR45:** The system can award badges to Contributors based on approved submissions.
- **FR46:** Users can view an Activity Heatmap (GitHub-style contribution calendar) on their personal profile screen, displaying a visual grid of daily learning activity (flashcard sessions, exercises completed, reviews submitted) over the past 12 months to encourage consistency and habit formation.

## Non-Functional Requirements

### Performance
- **NFR1 (Response Time):** Core interactive actions (swiping flashcards, submitting a quiz answer) must complete and provide visual feedback within 200 milliseconds via optimistic UI updates.
- **NFR2 (Page Load):** The initial application load (Time to Interactive) must complete within 3.5 seconds on a standard 4G mobile connection.
- **NFR3 (Real-Time Latency):** Live leaderboard updates and peer-review threaded comments must reflect changes to all connected group members within 2 seconds of submission via Server-Sent Events (SSE) or lightweight polling.
- **NFR4 (Client-Side Processing):** To preserve server resources, computationally heavy exports (e.g., PDF generation) must be performed client-side and completed within 3 seconds for standard export sizes.

### Security & Privacy
- **NFR5 (Data Encryption):** All user profile data and generated content must be encrypted in transit (TLS 1.2+) and at rest.
- **NFR6 (Data Minimization & Deletion):** The database schema must separate PII (Personally Identifiable Information) from content. An account deletion request must permanently destroy PII within 24 hours.
- **NFR7 (Tombstoning):** Upon account deletion, the user's educational contributions (exercises, reviews, comments) must be "tombstoned" (anonymized to "Anonymous Learner") to preserve the integrity of threaded debates and group learning value (Compliance: GDPR/PDPA).
- **NFR8 (Access Control):** Private group content and exercises must strictly reject access attempts from non-members or unauthenticated users (API-level verification on every request).

### Scalability, Reliability & Architecture
- **NFR9 (Concurrency):** The system architecture (database connections, API backend) must gracefully handle 1,000 Concurrent Users (CCU) without dropping requests or exceeding the 2-second response time threshold.
- **NFR10 (Scalability Constraint):** The platform must support 1,000 CCU within free-tier infrastructure (Supabase for structured data, Cloudflare R2 for file storage, Vercel + Cloudflare CDN for delivery) without degrading the 2-second response time threshold.
- **NFR11 (Edge Caching):** The platform must achieve a >80% cache hit ratio for static assets and public lessons via an edge CDN layer to shift traffic away from the origin server.
- **NFR12 (Uptime):** Core practice and review loops must maintain 99.9% uptime. The content creation studio can tolerate scheduled maintenance windows.

### Accessibility Standards

- **NFR13 (Standards):** The platform must comply with WCAG 2.1 Level AA standards.
- **NFR14 (Input Agnosticism):** All critical flows (including the Tinder-style flashcard swipe) must be fully operable via keyboard shortcuts and standard accessible button clicks.
