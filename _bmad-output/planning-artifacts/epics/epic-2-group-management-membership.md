# Epic 2: Group Management & Membership

Group Admins can create groups, manage membership, assign roles, and control access via invitation links. Users can view and navigate to all groups they belong to from the dashboard. Establishes the group container that all content and activity lives within.

> **API Convention:** All client API calls use `browser-client.ts` calling NestJS directly
> via `NEXT_PUBLIC_API_URL`. Paths below are NestJS endpoints (e.g. `POST /groups` means
> `${NEXT_PUBLIC_API_URL}/groups`). Cron routes (`/api/cron/`*) are Vercel cron handlers
> on Next.js.

### Story 2.1: Create & Configure a Group

As a logged-in user,
I want to create a new learning group with a name and description,
So that I can invite my classmates and organize our study activities in one place.

**Acceptance Criteria:**

**Given** I am logged in and navigate to the "Create Group" screen
**When** I submit a valid group name (required) and optional description
**Then** `POST /groups` (JwtAuthGuard)
**And** NestJS GroupsService creates a new `groups` row via Prisma with a unique `invite_code` slug auto-generated
**And** a `group_members` row is created with my `user_id` and `role = 'admin'`
**And** I am redirected to the new group's home page at `/group/[groupId]`

**Given** I submit the Create Group form with an empty group name
**When** Zod validation runs (shared schema from `@squademy/shared`)
**Then** an inline error appears: "Group name is required." and the form is not submitted

**Given** I am on the group home page after creation
**When** the page loads
**Then** an empty state is shown: "Your group is ready! Invite members to get started."
**And** a prominent "Invite Members" CTA button is visible

---

### Story 2.2: Invite Members — Link & Direct Invite

As a Group Admin,
I want to invite new members via a shareable link or by searching their username,
So that I can grow my group with the people I want to study with.

**Acceptance Criteria:**

**Given** I am a Group Admin and open the Members page for my group
**When** I click "Copy Invite Link"
**Then** a URL containing the group's `invite_code` is copied to my clipboard (e.g. `/join/[invite_code]`)
**And** a success indicator appears: "Link copied!"

**Given** I am a Group Admin and click "Revoke Invite Link"
**When** I confirm the action
**Then** `PATCH /groups/:groupId/invite-code` (GroupAdminGuard) regenerates a new unique slug
**And** the old invite link no longer works — navigating to it shows "This invite link is invalid or has expired."

**Given** I am a Group Admin and type a username in the "Invite by username" field
**When** I select a user from the suggestions and click Send Invite
**Then** `POST /groups/:groupId/invitations` (GroupAdminGuard) creates a `group_invitations` row with `status = 'pending'`
**And** the invited user sees the invitation in their notifications/invitations list

**Given** I receive a direct group invitation
**When** I navigate to my invitations and click "Accept"
**Then** `PATCH /invitations/:id/respond` creates a `group_members` row with `role = 'member'`
**And** the `group_invitations` status is updated to `'accepted'`
**And** I am redirected to the group's home page

**Given** I receive a direct group invitation
**When** I click "Decline"
**Then** the `group_invitations` status is updated to `'declined'` via NestJS API
**And** the invitation disappears from my list

**Given** an unauthenticated user navigates to `/join/[invite_code]`
**When** the invite code is valid
**Then** they are redirected to `/register?redirect=/join/[invite_code]` to register first
**And** after registration/login they are automatically joined to the group

**Given** an authenticated user navigates to `/join/[invite_code]`
**When** the invite code is valid and the user is not already a member
**Then** `POST /groups/join` validates the invite code and creates a `group_members` row with `role = 'member'` via Prisma
**And** the user is redirected to the group home page

**Given** a user navigates to `/join/[invite_code]`
**When** the invite code does not exist or has been revoked
**Then** a "This invite link is invalid or has expired." error page is shown

---

### Story 2.3: Member & Role Management

As a Group Admin,
I want to view all group members, remove inactive members, and assign or change their roles,
So that I can maintain a healthy group with the right people in the right roles.

**Acceptance Criteria:**

**Given** I am a Group Admin and navigate to the Members page
**When** the page loads
**Then** `GET /groups/:groupId/members` (GroupMemberGuard) returns all members with display name, avatar, role badge, and join date

**Given** I click the role dropdown next to a member and select "Editor"
**When** I confirm the change
**Then** `PATCH /groups/:groupId/members/:userId` (GroupAdminGuard) updates `group_members.role` to `'editor'` via Prisma
**And** the role badge updates immediately via React Query optimistic update

**Given** I try to change my own role as the sole Admin
**When** I attempt to demote myself
**Then** NestJS returns a 400 error and an inline error appears: "Cannot demote the sole admin. Promote another admin first."
**And** the change is not saved

**Given** I click "Remove" next to a member and confirm the dialog
**When** `DELETE /groups/:groupId/members/:userId` (GroupAdminGuard) executes
**Then** the `group_members` row is deleted via Prisma
**And** the member disappears from the members list immediately
**And** the removed member loses access to all group content (enforced by NestJS GroupMemberGuard on all group endpoints)

**Given** I try to remove myself as the sole Admin
**When** I attempt the action
**Then** NestJS returns a 400 error and an inline error appears: "Cannot remove the sole admin. Transfer admin role first."

---

### Story 2.4: Group Settings & Exercise Scheduling

As a Group Admin,
I want to configure my group's name, description, and weekly exercise schedule,
So that members know what the group is about and when exercises are due.

**Acceptance Criteria:**

**Given** I navigate to the Group Settings page (`/group/[groupId]/settings`)
**When** the page loads
**Then** `GET /groups/:groupId` (GroupAdminGuard) returns the current group name, description, and exercise schedule settings pre-populated

**Given** I update the group name or description and click Save
**When** `PATCH /groups/:groupId` (GroupAdminGuard) executes
**Then** the `groups` table is updated via Prisma
**And** a success indicator appears inline
**And** the updated name is reflected immediately in the group layout header via React Query cache invalidation

**Given** I configure the weekly exercise schedule (deadline day and time)
**When** I save the settings
**Then** the schedule configuration is stored in the `groups` table via NestJS API
**And** the schedule is displayed in the group home page for all members to see

**Given** I submit the settings form with an empty group name
**When** Zod validation runs (shared schema from `@squademy/shared`)
**Then** an inline error appears: "Group name is required." and the form is not submitted

---

### Story 2.5: Dashboard — My Groups List

As a logged-in user,
I want to see a list of all groups I belong to on the dashboard,
So that I can quickly navigate to any group and understand my role and activity at a glance.

**Acceptance Criteria:**

**Given** I am authenticated and navigate to `/dashboard`
**When** the page loads
**Then** `GET /groups/me` (JwtAuthGuard) queries all `group_members` rows for my `user_id` via Prisma, joining `groups` table
**And** the dashboard displays a card grid of my groups, each showing: group name, my role badge (Admin/Editor/Contributor/Member), member count, and last activity date
**And** groups are sorted by last activity (most recent first)

**Given** I click on a group card
**When** the navigation fires
**Then** I am navigated to the group home page at `/group/[groupId]`

**Given** I am authenticated and have no group memberships
**When** the dashboard loads
**Then** an empty state illustration is shown with the message: "You're not part of any group yet."
**And** two CTAs are visible: "Create a Group" (primary) linking to the Create Group screen, and "Join with Invite Link" (secondary) with a text input field to paste an invite link

**Given** I am authenticated and navigate to `/dashboard`
**When** I have pending group invitations
**Then** a "Pending Invitations" section appears above the group list showing each invitation with group name, inviter name, and "Accept" / "Decline" buttons (delegates to Story 2.2 invitation acceptance flow)

**Given** I am on the dashboard and a group's name or my role changes
**When** another tab or session triggers the mutation
**Then** the group card reflects the updated data on the next React Query refetch (staleTime-based)

---

### Story 2.6: Delete Group

As a Group Admin,
I want to delete a group I no longer need,
So that inactive groups do not clutter the platform.

**Acceptance Criteria:**

**Given** I am a Group Admin and navigate to Group Settings
**When** I click "Delete Group"
**Then** a confirmation dialog appears: "Are you sure? All group content will be removed for members. This cannot be undone."
**And** the dialog requires me to type the group name to confirm

**Given** I confirm the deletion by typing the group name correctly
**When** `DELETE /groups/:groupId` (GroupAdminGuard) executes
**Then** NestJS GroupsService executes the deletion within a Prisma transaction:
**And** all `lessons`, `exercises`, `flashcard_decks` with `group_id` matching this group have `is_deleted` set to `true` (soft-delete)
**And** all `group_members` rows for this group are deleted
**And** the `groups` row is deleted
**And** I am redirected to `/dashboard` with an inline confirmation: "Group deleted."

**Given** I am a non-Admin member
**When** I view Group Settings
**Then** the "Delete Group" section is not visible

---
