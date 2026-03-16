# Epic 8: Gamification & Engagement Engine

The system tracks daily learning streaks, calculates and displays a live leaderboard updated in real-time, and awards contributor badges for milestone achievements.

### Story 8.1: Daily Learning Streaks

As a Learner,
I want the system to track my daily study activity and display my current streak,
So that I am motivated to study every day and build a consistent habit.

**Acceptance Criteria:**

**Given** I complete at least one flashcard session or exercise submission in a day
**When** the activity is recorded
**Then** `streaks.last_activity_at` is updated and `streaks.current_streak` is incremented by 1 if the previous activity was yesterday
**And** if the previous activity was today already, the streak count is not incremented again (idempotent)

**Given** I miss a day (no activity recorded)
**When** the next activity is recorded
**Then** `streaks.current_streak` resets to 1
**And** `streaks.longest_streak` is preserved if the reset streak was less than the longest

**Given** I navigate to my profile or the group leaderboard
**When** the page loads
**Then** my current streak is displayed as a 🔥 flame icon with the streak count in amber/orange color
**And** if my current streak equals my longest streak, a subtle "Personal best!" indicator is shown

**Given** I earn a 7-day streak
**When** the streak milestone is reached
**Then** a `badges` row is created with `badge_type = 'streak_7'`
**And** a notification is created: "🎉 You've earned the 7-Day Streak badge!"

**Given** I earn a 30-day streak
**When** the milestone is reached
**Then** a `badges` row is created with `badge_type = 'streak_30'`

---

### Story 8.2: Live Leaderboard

As a group member,
I want to see a live leaderboard showing how I rank against my peers in the group,
So that friendly competition motivates me to stay engaged.

**Acceptance Criteria:**

**Given** I navigate to `/group/[groupId]/leaderboard`
**When** the page loads
**Then** all group members are listed ranked by `leaderboard.total_score` descending
**And** each row shows: rank position, avatar, display name, total score, weekly score, and streak badge

**Given** a group member completes an activity that earns points (exercise submission, peer review, lesson approved, streak day)
**When** the `leaderboard` table is updated on the server
**Then** Supabase Realtime fires a `postgres_changes UPDATE` event on the `leaderboard:group:[id]` channel
**And** React Query invalidates the leaderboard query
**And** the leaderboard re-renders with the new scores within 2 seconds (NFR3)

**Given** the end-of-week cron runs (`/api/cron/weekly-close`)
**When** leaderboard scores are recalculated
**Then** score components are applied: exercise submission +10pts, peer review completed +15pts, lesson approved +25pts, streak day +5pts, dispute error incurred -5pts
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
**When** `lessons.status` changes to `'published'` for my first ever lesson
**Then** a `badges` row is created with `badge_type = 'first_contribution'`
**And** a notification is created: "🏆 You've earned the First Contribution badge!"

**Given** an Editor approves any of my lesson submissions
**When** the approval action executes
**Then** a `badges` row is created with `badge_type = 'editor_approved'` for this specific lesson approval

**Given** I navigate to my profile or the leaderboard
**When** the page loads
**Then** all my earned badges are displayed as pill badges with icons next to my name

**Given** I have earned the same badge type multiple times (e.g. `editor_approved` for multiple lessons)
**When** my profile displays badges
**Then** the badge is shown once with a count indicator (e.g. "Editor Approved ×3") rather than duplicated

---
