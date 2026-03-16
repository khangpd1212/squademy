# Epic 9: Admin Dashboard & Platform Operations

Platform admins can monitor system health, manage users, moderate content flagged by Editors, and review platform growth analytics.

### Story 9.1: Admin Dashboard — System Health & User Management

As a Platform Admin,
I want to monitor system health metrics and manage user accounts,
So that I can ensure the platform operates reliably within free-tier constraints.

**Acceptance Criteria:**

**Given** I navigate to `/admin`
**When** the page loads (protected by `middleware.ts` checking `profiles.is_admin = true`)
**Then** the system health dashboard is shown with: estimated CCU, active group count, storage usage %, email quota remaining today

**Given** I navigate to `/admin/users`
**When** the page loads
**Then** all user profiles are listed with display name, email, join date, group count, and active status
**And** a search input allows filtering by display name or email

**Given** I find a user and click "Warn"
**When** I enter a warning reason and confirm
**Then** the warning is logged and the user receives an in-app notification with the warning text

**Given** I find a user and click "Ban"
**When** I confirm the action
**Then** the user's Supabase Auth account is disabled via `service_role` key
**And** the user is immediately signed out and cannot log back in

**Given** I am a regular user (not admin)
**When** I navigate to any `/admin/*` route
**Then** `middleware.ts` redirects me to `/dashboard` — admin routes are inaccessible

---

### Story 9.2: Content Moderation & Growth Analytics

As a Platform Admin,
I want to review flagged content and track platform growth metrics,
So that I can make data-driven decisions about when to introduce Phase 2 features.

**Acceptance Criteria:**

**Given** I navigate to `/admin/content`
**When** the page loads
**Then** all soft-deleted lessons (`is_deleted = true`) and any editor-flagged content are listed
**And** I can permanently delete or restore any soft-deleted content

**Given** I navigate to `/admin/groups`
**When** the page loads
**Then** all groups are listed with name, member count, lesson count, and last activity date
**And** I can view a group's details or remove a group from the platform

**Given** I view the growth analytics section of the admin dashboard
**When** the page loads
**Then** key KPIs are displayed: total active users, MoM retention rate, 7-day streak retention %, average contributor-to-learner ratio per group, peer review completion rate
**And** data is sourced from aggregate Supabase queries run server-side (RSC)

**Given** the email quota usage is shown in the dashboard
**When** I view today's email stats
**Then** emails sent today and remaining quota are displayed
**And** if quota is above 80% used, an amber warning indicator is shown
