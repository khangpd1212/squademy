# Epic 8: Gamification & Engagement Engine

The system tracks daily learning streaks, calculates and displays a live leaderboard updated via React Query polling (refetchInterval: 30s), awards contributor badges for milestone achievements, and renders a GitHub-style Activity Heatmap on user profiles to visualize learning consistency.

### Story 8.1: Daily Learning Streaks

As a Learner,
I want the system to track my daily study activity and display my current streak,
So that I am motivated to study every day and build a consistent habit.

**Acceptance Criteria:**

**Given** I complete at least one flashcard session or exercise submission in a day
**When** NestJS records the activity via Prisma
**Then** `streaks.last_activity_at` is updated and `streaks.current_streak` is incremented by 1 if the previous activity was yesterday
**And** if the previous activity was today already, the streak count is not incremented again (idempotent)

**Given** I miss a day (no activity recorded)
**When** the next activity is recorded by NestJS
**Then** `streaks.current_streak` resets to 1
**And** `streaks.longest_streak` is preserved if the reset streak was less than the longest

**Given** I navigate to my profile or the group leaderboard
**When** the page loads
**Then** my current streak is displayed as a flame icon with the streak count in amber/orange color
**And** if my current streak equals my longest streak, a subtle "Personal best!" indicator is shown

**Given** I earn a 7-day streak
**When** NestJS StreaksService detects the milestone
**Then** a `badges` row is created via Prisma with `badge_type = 'streak_7'`
**And** a notification is created via NestJS NotificationsService: "You've earned the 7-Day Streak badge!"

**Given** I earn a 30-day streak
**When** the milestone is reached
**Then** a `badges` row is created via Prisma with `badge_type = 'streak_30'`

---

### Story 8.2: Live Leaderboard

As a group member,
I want to see a live leaderboard showing how I rank against my peers in the group,
So that friendly competition motivates me to stay engaged.

**Acceptance Criteria:**

**Given** I navigate to `/group/[groupId]/leaderboard`
**When** the page loads
**Then** `GET /api/groups/:groupId/leaderboard` (proxied to NestJS, protected by GroupMemberGuard) returns all group members ranked by `leaderboard.total_score` descending
**And** each row shows: rank position, avatar, display name, total score, weekly score, and streak badge

**Given** a group member completes an activity that earns points (exercise submission, peer review, lesson approved, streak day)
**When** NestJS LeaderboardService updates the `leaderboard` table via Prisma
**Then** on the next React Query polling cycle (refetchInterval: 30s), `GET /api/groups/:groupId/leaderboard` returns updated scores
**And** the leaderboard re-renders with the new scores (NFR3: within 30s polling interval)

**Given** the end-of-week cron runs (`/api/cron/weekly-close`)
**When** the cron handler calls NestJS LeaderboardService to recalculate scores
**Then** score components are applied via Prisma: exercise submission +10pts, peer review completed +15pts, lesson approved +25pts, streak day +5pts, dispute error incurred -5pts
**And** `leaderboard.week_score` resets to 0 for the new week
**And** `leaderboard.total_score` is updated cumulatively

**Given** I am ranked #1 on the leaderboard
**When** the page renders
**Then** my row is highlighted with a distinct gold/amber styling to celebrate the top position

---

### Story 8.3: Contributor Badges

As a Contributor,
I want to earn badges when I reach contribution milestones,
So that my efforts are recognized and visible to my group.

**Acceptance Criteria:**

**Given** my first lesson submission is approved by an Editor
**When** NestJS LessonsService processes the approval
**Then** NestJS BadgesService creates a `badges` row via Prisma with `badge_type = 'first_contribution'`
**And** a notification is created: "You've earned the First Contribution badge!"

**Given** an Editor approves any of my lesson submissions
**When** the approval action executes in NestJS
**Then** a `badges` row is created via Prisma with `badge_type = 'editor_approved'` for this specific lesson approval

**Given** I navigate to my profile or the leaderboard
**When** the page loads
**Then** all my earned badges are displayed as pill badges with icons next to my name

**Given** I have earned the same badge type multiple times (e.g. `editor_approved` for multiple lessons)
**When** my profile displays badges
**Then** the badge is shown once with a count indicator (e.g. "Editor Approved x3") rather than duplicated

---

### Story 8.4: Activity Heatmap (FR46)

As a Learner,
I want to see a GitHub-style Activity Heatmap on my profile page showing my daily learning activity over the past 12 months,
So that I can visualize my consistency and stay motivated to fill in gaps.

**Acceptance Criteria:**

**Given** I navigate to my profile or settings page
**When** the page loads
**Then** `GET /api/users/activity-heatmap` (proxied to NestJS, protected by JwtAuthGuard) returns my daily activity data for the past 52 weeks
**And** a heatmap grid showing the past 52 weeks (12 months) is displayed
**And** each cell represents one day and is colored by activity intensity:
  - 0 actions: `zinc-200` (light) / `zinc-800` (dark)
  - 1-2 actions: `emerald-200` / `emerald-900`
  - 3-5 actions: `emerald-400` / `emerald-700`
  - 6+ actions: `emerald-600` / `emerald-500`

**Given** I hover over a specific day cell on desktop
**When** the tooltip appears
**Then** it shows: date, flashcards reviewed, exercises completed, reviews submitted, lessons read (e.g., "Mar 15: 4 flashcards, 1 exercise, 1 review")

**Given** I complete a tracked action (flashcard grade, exercise submit, review submit, lesson read)
**When** the action is recorded by NestJS
**Then** NestJS ActivityService increments the corresponding counter in `daily_activity` via Prisma UPSERT on `(user_id, group_id, activity_date)`
**And** the heatmap reflects the updated count on next page load or via React Query invalidation

**Given** I am on a mobile device (< 768px)
**When** the profile page loads
**Then** the heatmap is collapsed to show the most recent 3 months
**And** a "Show full year" button expands to the full 52-week view

**Given** I view my heatmap
**When** it renders
**Then** below the grid, my "Current streak: X days" and "Longest streak: Y days" are displayed in amber/orange styling

---
