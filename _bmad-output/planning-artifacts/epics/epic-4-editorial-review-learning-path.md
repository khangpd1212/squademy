# Epic 4: Editorial Review & Learning Path

Editors can view the lesson submission queue, approve or reject with line-level feedback, and soft-delete published content. Learners can view and interact with published lessons in the group learning path.

### Story 4.1: Editor Review Queue & Lesson Approval/Rejection

As an Editor,
I want to see a queue of lessons pending review and approve or reject them with feedback,
So that I can maintain the quality of our group's curriculum efficiently.

**Acceptance Criteria:**

**Given** I am an Editor and navigate to `/review/lesson`
**When** the page loads
**Then** all `lessons` with `status = 'review'` for my groups are listed with contributor name, lesson title, and submission date
**And** lessons are sorted oldest-first (review queue order)

**Given** I click on a pending lesson to review it
**When** the review page opens at `/review/lesson/[reviewId]`
**Then** the lesson content is rendered in a distraction-free read-only layout (no navigation sidebar, full-width content)
**And** an "Approve & Publish" (primary green) button and a "Request Changes" (destructive red) button are shown at the top

**Given** I click "Approve & Publish"
**When** the action executes
**Then** `lessons.status` is updated to `'published'`
**And** the lesson appears in the group's learning path
**And** I am returned to the review queue
**And** the lesson count in the queue decreases by one

**Given** I click "Request Changes" and submit feedback text
**When** the action executes
**Then** `lessons.status` is updated to `'rejected'`
**And** `lessons.editor_feedback` is saved with my feedback text
**And** I am returned to the review queue

**Given** I have no pending lessons in my queue
**When** the review queue page loads
**Then** an empty state is shown: "All caught up! ✅ No lessons pending review."

---

### Story 4.2: Line-Level Comments on Lessons

As an Editor or group member,
I want to attach comments to specific paragraphs in a lesson,
So that I can give precise, contextual feedback or discuss specific points with my peers.

**Acceptance Criteria:**

**Given** I am viewing a lesson (published or in review)
**When** I hover over a paragraph on desktop
**Then** a comment icon (💬) appears in the left margin next to the paragraph

**Given** I click the comment icon on a paragraph
**When** the comment panel opens
**Then** an inline comment thread expands below the paragraph (Threads-style)
**And** a text input is shown for me to type my comment

**Given** I submit a comment on a paragraph
**When** the action executes
**Then** a `review_comments` row is created with `lesson_id`, `user_id`, `line_ref` (paragraph identifier), and `body`
**And** my comment appears immediately in the thread via optimistic update
**And** a comment count badge appears on the paragraph margin

**Given** another member has already commented on a paragraph
**When** I open the lesson
**Then** paragraphs with comments show a comment count badge in the margin
**And** clicking the badge expands the existing thread

**Given** I am replying to an existing comment
**When** I click "Reply" on a comment and submit
**Then** a `review_comments` row is created with `parent_id` set to the comment I replied to
**And** the reply is nested below the parent comment in the thread

**Given** I am on mobile and tap a paragraph
**When** the tap event fires
**Then** a bottom sheet slides up with the reaction buttons and comment thread for that paragraph

---

### Story 4.3: Published Lesson View & Learning Path

As a Learner,
I want to read published lessons in my group's learning path and interact with Alive Text and Social Hotspots,
So that reading lessons feels engaging and community-driven rather than passive.

**Acceptance Criteria:**

**Given** I navigate to my group's home page at `/group/[groupId]`
**When** the page loads
**Then** all `lessons` with `status = 'published'` for this group are listed in `sort_order` sequence as the Learning Path
**And** each lesson shows title, contributor name, and a "Read" button

**Given** I click a lesson to read it
**When** the lesson page opens
**Then** the lesson content renders with `Inter` font for body text and `Nunito` for headings
**And** the layout is a centered single-column (600–700px wide) with margin space on both sides for Social Hotspots
**And** Alive Text blocks render as animated purple pulsing dots (Framer Motion)

**Given** I encounter an Alive Text block
**When** I click or tap on the animated dots
**Then** the dots dissolve (Framer Motion animation) and the hidden text is revealed
**And** an `alive_text_interactions` event is recorded in Supabase for engagement tracking

**Given** paragraphs have reactions from other members
**When** I view the lesson
**Then** reaction counts (❤️ 🤔 💡) are visible in the left margin next to each paragraph

**Given** I click a reaction button on a paragraph
**When** the action executes
**Then** a `lesson_reactions` row is created (or deleted if I already reacted with the same type — toggle behavior)
**And** the reaction count updates immediately via optimistic update

**Given** I finish reading the lesson
**When** I reach the bottom
**Then** the lesson is marked as read in my progress and a "Next Lesson" suggestion appears

---

### Story 4.4: Content Moderation — Soft Delete

As an Editor,
I want to soft-delete published content that violates guidelines,
So that I can maintain a safe and high-quality learning environment.

**Acceptance Criteria:**

**Given** I am an Editor and viewing a published lesson
**When** I click "Remove Content" (visible only to Editors)
**Then** a confirmation dialog appears: "Remove this lesson from the group? It will no longer be visible to members."

**Given** I confirm the removal
**When** the action executes
**Then** `lessons.is_deleted` is set to `true`
**And** the lesson disappears from the group's learning path immediately
**And** the lesson remains in the database (soft-delete — not destroyed)

**Given** I am a regular Member (not Editor)
**When** I view any published lesson
**Then** the "Remove Content" button is not visible

---

