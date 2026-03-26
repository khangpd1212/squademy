# Epic 7: Notifications System

The platform sends email and in-app notifications for all trigger events across the application. In-app notifications use React Query polling (refetchInterval: 60s) — no WebSocket or Realtime dependency. Includes rate limiting, free-tier quota management, and in-app fallback when email quotas are exceeded.

### Story 7.1: In-App Notification Infrastructure

As a user,
I want to see near-real-time in-app notifications for events relevant to me,
So that I stay informed about my learning activities without relying solely on email.

**Acceptance Criteria:**

**Given** I am logged in and a notification-triggering event occurs (exercise assigned, lesson approved, dispute opened, etc.)
**When** the NestJS NotificationsService inserts a row into the `notifications` table via Prisma for my `recipient_id`
**Then** on my next React Query polling cycle (refetchInterval: 60s), `GET /api/notifications/unread-count` (proxied to NestJS, protected by JwtAuthGuard) returns the updated count
**And** the notification bell badge count in my top navigation updates

**Given** I click the notification bell
**When** the notifications panel opens
**Then** `GET /api/notifications` (proxied to NestJS, protected by JwtAuthGuard) returns all my unread notifications with type icon, body text, and relative timestamp ("2 minutes ago")
**And** notifications are sorted newest-first

**Given** I click a notification
**When** `PATCH /api/notifications/:id/read` (proxied to NestJS) executes
**Then** `notifications.is_read` is set to `true` via Prisma
**And** I am navigated to the relevant context (e.g. clicking "exercise assigned" goes to the exercise)

**Given** I have no unread notifications
**When** the notification panel opens
**Then** the badge is hidden and the panel shows: "You're all caught up!"

---

### Story 7.2: Email Notification Service & Triggers

As a user,
I want to receive email notifications for important events even when I'm not actively using the app,
So that I never miss a deadline or important update from my group.

**Acceptance Criteria:**

**Given** a derangement shuffle assigns me an exercise
**When** the `/api/cron/weekly-shuffle` cron handler calls NestJS to insert `exercise_assignments` rows
**Then** NestJS NotificationsService sends an email immediately via Resend/Brevo to the assignee: "Your exercise from [creator] is ready!"
**And** `notifications.email_sent` is set to `true` for this notification

**Given** a lesson I submitted is approved by an Editor
**When** `lessons.status` changes to `'published'` via NestJS LessonsService
**Then** NestJS NotificationsService sends an email immediately to me: "Your lesson '[title]' has been published!"

**Given** a lesson I submitted is rejected by an Editor
**When** `lessons.status` changes to `'rejected'` via NestJS LessonsService
**Then** NestJS NotificationsService sends an email immediately to me with the editor's feedback summary

**Given** a peer submits answers to my exercise
**When** NestJS creates an `exercise_submissions` row via Prisma
**Then** NestJS NotificationsService sends an email immediately to me (the creator): "Your exercise has been submitted by [name]. Time to grade!"

**Given** the daily reminder cron runs (`/api/cron/reminders` at 09:00)
**When** the cron handler calls NestJS to check for pending actions
**Then** NestJS queries via Prisma for members with pending exercise assignments or pending peer reviews not yet graded
**And** a reminder email is sent: "Reminder: You have [N] pending action(s) due [deadline]."
**And** the reminder respects rate limiting: max 1 reminder email per user per 24 hours

**Given** a group has more than 20 members
**When** a batch notification event fires (e.g. weekly shuffle)
**Then** instead of individual emails, NestJS NotificationsService sends a digest email to each member with all their pending actions
**And** this batch behavior reduces per-event email volume for large groups

**Given** the email quota for the day has been exceeded (Resend/Brevo free tier limit)
**When** an email would normally be sent
**Then** the email is skipped and `notifications.email_sent` remains `false`
**And** the in-app notification is still created via Prisma and visible to the user (fallback — FR domain requirement)

---
