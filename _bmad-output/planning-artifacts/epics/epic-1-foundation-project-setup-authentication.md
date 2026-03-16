# Epic 1: Foundation — Project Setup & Authentication

Users can register, log in, manage their profile, export personal data, request account deletion, and navigate the platform. Establishes the technical foundation (Next.js + Supabase + shadcn/ui + design system) and GDPR-compliant auth system that all other epics depend on.

### Story 1.1: Project Foundation & Design System Setup

As a developer,
I want the project scaffolded with Next.js App Router, Tailwind CSS v4, shadcn/ui, Supabase connection, and the full design system configured,
So that all subsequent stories have a consistent, working foundation to build upon.

**Acceptance Criteria:**

**Given** a new empty repository
**When** the project setup story is complete
**Then** `create-next-app` with TypeScript and App Router is initialized
**And** Tailwind CSS v4 is configured with `@theme` design tokens: brand colors (`--brand-purple: #7C3AED`, `--brand-teal: #0D9488`, `--brand-pink: #EC4899`), semantic colors (emerald success, amber streak, red error), light/dark mode via class strategy (`@custom-variant dark`)
**And** Google Fonts are loaded: `Nunito` (headers/UI), `Inter` (body/reading), `Fira Code` (code/IPA)
**And** shadcn/ui is initialized (copy-to-repo pattern); base components `Button`, `Input`, `Card`, `Dialog`, `Badge`, `Dropdown` are added
**And** Supabase client is configured: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (RSC/Route Handlers), `lib/supabase/middleware.ts` (session refresh)
**And** `middleware.ts` is set up at root to refresh Supabase session on every request
**And** environment variables are documented in `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_R2_*`, `RESEND_API_KEY`, `CRON_SECRET`
**And** root layout (`app/layout.tsx`) loads fonts, applies `ThemeProvider` (light/dark), and sets `<html lang="en">`
**And** `app/page.tsx` redirects authenticated users to `/dashboard` and unauthenticated users to `/login`
**And** `globals.css` defines the `sq-card`, `sq-btn`, `sq-input` base component classes with 14px border-radius and unified shadow rhythm
**And** the app builds without errors (`next build` passes)

---

### Story 1.2: User Registration

As a new user,
I want to register an account with my email and password and accept the privacy policy,
So that I can access the Squademy platform.

**Acceptance Criteria:**

**Given** I navigate to `/register`
**When** I submit a valid email, password (min 8 chars), and display name
**Then** Supabase Auth creates my account and sends a confirmation email
**And** a `profiles` row is created with my `display_name` and `id` linked to `auth.users`
**And** I am redirected to a "Check your email" confirmation page

**Given** the registration form is rendered
**When** I view the form
**Then** a privacy policy acceptance checkbox is present and required before submission
**And** `profiles.gdpr_consent_at` is set to the current timestamp upon successful registration

**Given** I submit the registration form with an email already in use
**When** Supabase returns an auth error
**Then** an inline error message is displayed below the email field: "An account with this email already exists."
**And** the form does not redirect or clear other fields

**Given** I submit the registration form with a password under 8 characters
**When** client-side Zod validation runs
**Then** an inline error appears below the password field before the form is submitted

**Given** I am already logged in
**When** I navigate to `/register`
**Then** I am redirected to `/dashboard`

---

### Story 1.3: User Login & Session Management

As a registered user,
I want to log in with my email and password and have my session maintained across page reloads,
So that I can access my groups and learning content without logging in repeatedly.

**Acceptance Criteria:**

**Given** I navigate to `/login`
**When** I submit a valid email and password
**Then** Supabase Auth authenticates me and sets a session cookie
**And** `middleware.ts` refreshes the session token on every subsequent request
**And** I am redirected to `/dashboard`

**Given** I navigate to `/login`
**When** I submit an incorrect email or password
**Then** an inline error message is displayed: "Invalid email or password."
**And** the password field is cleared but the email field retains its value

**Given** I am unauthenticated and navigate to any `(dashboard)` route
**When** `middleware.ts` finds no valid session
**Then** I am redirected to `/login` with a `?redirect=` query param preserving my original destination

**Given** I am authenticated and navigate back to my original destination after login
**When** the `?redirect=` param is present
**Then** I am sent to that original URL instead of the default `/dashboard`

**Given** I am logged in and click "Log out"
**When** the logout action executes
**Then** my Supabase session is destroyed, the cookie is cleared, and I am redirected to `/login`

**Given** I am already logged in
**When** I navigate to `/login`
**Then** I am redirected to `/dashboard`

---

### Story 1.4: User Profile Management

As a logged-in user,
I want to view and update my profile information,
So that my group members can identify me and my profile reflects my current details.

**Acceptance Criteria:**

**Given** I navigate to `/settings`
**When** the page loads
**Then** my current profile data is pre-populated: display name, avatar, full name, school, location, age

**Given** I update my display name and click Save
**When** the mutation runs
**Then** `profiles.display_name` is updated in Supabase
**And** a success indicator appears inline (green checkmark near the Save button — no toast in MVP)
**And** the updated display name is reflected immediately via optimistic update

**Given** I upload a new avatar image (JPG/PNG, max 2MB)
**When** the upload completes
**Then** the image is uploaded to Cloudflare R2 via `/api/files/upload`
**And** `profiles.avatar_url` is updated with the new R2 URL
**And** the new avatar is displayed immediately in the profile form and top navigation

**Given** I upload an avatar file larger than 2MB
**When** client-side validation runs
**Then** an inline error appears: "Image must be under 2MB." and the upload is not submitted

**Given** I submit the profile form with an empty display name
**When** Zod validation runs
**Then** an inline error appears: "Display name is required." and the form is not submitted

---

### Story 1.5: Personal Data Export Request

As a logged-in user,
I want to request and download a complete export of my personal learning data,
So that I can exercise my GDPR data portability rights (FR3).

**Acceptance Criteria:**

**Given** I am authenticated and navigate to `/settings/privacy`
**When** I click "Export My Data"
**Then** the platform creates an export package for my account
**And** the package includes my profile and learning records (`profile`, `flashcard_decks`, `srs_progress`, `submissions`) in machine-readable files

**Given** the export is ready
**When** I click "Download Export"
**Then** I receive a downloadable `.zip` file generated from `/api/export/user-data`
**And** the file is linked to my authenticated account only

**Given** I am unauthenticated
**When** I attempt to call `/api/export/user-data`
**Then** the request is rejected with unauthorized response

---

### Story 1.6: Account Deletion & Tombstoning

As a logged-in user,
I want to request account deletion with clear confirmation,
So that my PII is removed while educational contributions are anonymized for compliance (FR4, NFR6, NFR7).

**Acceptance Criteria:**

**Given** I am authenticated and navigate to `/settings/privacy`
**When** I choose "Delete My Account"
**Then** a destructive confirmation flow is shown with explicit warning about irreversible action

**Given** I confirm deletion through the required confirmation step
**When** the deletion request is submitted
**Then** my account enters a GDPR deletion workflow with 24-hour SLA for PII destruction
**And** PII fields in `profiles` are permanently removed
**And** my authored educational content is tombstoned to "Anonymous Learner" rather than hard-deleted

**Given** deletion processing is complete
**When** I try to sign in again with the deleted account
**Then** authentication fails and no active session is available

---

