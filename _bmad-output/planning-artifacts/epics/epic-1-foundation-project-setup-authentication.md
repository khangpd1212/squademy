# Epic 1: Foundation — Project Setup & Authentication

Users can register, log in, manage their profile, export personal data, request account deletion, and navigate the platform. Establishes the technical foundation (Next.js + NestJS + Prisma + shadcn/ui monorepo + design system) and GDPR-compliant JWT auth system that all other epics depend on.

### Story 1.1: Monorepo & Project Foundation Setup

As a developer,
I want the monorepo scaffolded with Next.js App Router, NestJS API, Prisma schema, Tailwind CSS v4, shadcn/ui, and the full design system configured,
So that all subsequent stories have a consistent, working foundation to build upon.

**Acceptance Criteria:**

**Given** a new empty repository
**When** the project setup story is complete
**Then** a Yarn Workspaces + Turborepo monorepo is initialized with four packages:
  - `apps/web` (@squademy/web) — Next.js frontend
  - `apps/api` (@squademy/api) — NestJS backend
  - `packages/database` (@squademy/database) — Prisma schema, client, generated types
  - `packages/shared` (@squademy/shared) — Zod schemas, shared types, constants

**And** `apps/web`: Next.js with TypeScript and App Router is initialized
**And** Tailwind CSS v4 is configured with `@theme` design tokens: brand colors (`--brand-purple: #7C3AED`, `--brand-teal: #0D9488`, `--brand-pink: #EC4899`), semantic colors (emerald success, amber streak, red error), light/dark mode via class strategy (`@custom-variant dark`)
**And** Google Fonts are loaded: `Nunito` (headers/UI), `Inter` (body/reading), `Fira Code` (code/IPA)
**And** shadcn/ui is initialized (copy-to-repo pattern); base components `Button`, `Input`, `Card`, `Dialog`, `Badge`, `Dropdown` are added
**And** `globals.css` defines the `sq-card`, `sq-btn`, `sq-input` base component classes with 14px border-radius and unified shadow rhythm
**And** root layout (`app/layout.tsx`) loads fonts, applies `ThemeProvider` (light/dark), and sets `<html lang="en">`

**And** `apps/api`: NestJS 11 is initialized with `AppModule`, `PrismaModule` (global), `AuthModule`
**And** Passport.js JWT strategy is configured with access token (15min) + refresh token (7d)
**And** `JwtAuthGuard` is created as the default protected route guard
**And** `HttpExceptionFilter` is set up for consistent error responses

**And** `packages/database`: Prisma 6 schema is created with `users` and `profiles` tables as defined in the Architecture
**And** `prisma generate` produces TypeScript types consumed by both `apps/web` and `apps/api` via workspace protocol (`"@squademy/database": "workspace:*"`)

**And** `packages/shared`: Zod validation schemas for auth (login, register) are created and shared between FE and BE

**And** `apps/web` has `proxy.ts` configured for JWT verification via `jose` library and request forwarding to NestJS API
**And** Next.js API routes (`/api/auth/*`) proxy to NestJS `/auth/*` endpoints

**And** environment variables are documented in `.env.example`:
  - `apps/web`: `NEXT_PUBLIC_APP_URL`, `NESTJS_API_URL`, `JWT_SECRET`, `CLOUDFLARE_R2_*`, `CRON_SECRET`
  - `apps/api`: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `CLOUDFLARE_R2_*`

**And** `app/page.tsx` redirects authenticated users to `/dashboard` and unauthenticated users to `/login`
**And** `turbo.json` pipeline is configured for `build`, `dev`, `lint`, and `test` tasks with dependency-aware caching
**And** the monorepo builds without errors (`turbo build` passes)

---

### Story 1.2: User Registration

As a new user,
I want to register an account with my email and password and accept the privacy policy,
So that I can access the Squademy platform.

**Acceptance Criteria:**

**Given** I navigate to `/register`
**When** I submit a valid email, password (min 8 chars), and display name
**Then** the form calls `POST /api/auth/register` which proxies to NestJS `POST /auth/register`
**And** NestJS AuthService hashes the password with bcrypt and creates a `users` row and a linked `profiles` row via Prisma
**And** JWT access token (15min) and refresh token (7d) are generated and returned as httpOnly cookies by the Next.js API route
**And** I am redirected to `/dashboard`

**Given** the registration form is rendered
**When** I view the form
**Then** a privacy policy acceptance checkbox is present and required before submission
**And** `profiles.gdpr_consent_at` is set to the current timestamp upon successful registration

**Given** I submit the registration form with an email already in use
**When** NestJS returns a 409 Conflict error
**Then** an inline error message is displayed below the email field: "An account with this email already exists."
**And** the form does not redirect or clear other fields

**Given** I submit the registration form with a password under 8 characters
**When** client-side Zod validation runs (shared schema from `@squademy/shared`)
**Then** an inline error appears below the password field before the form is submitted

**Given** I am already logged in (valid JWT in cookies)
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
**Then** the form calls `POST /api/auth/login` which proxies to NestJS `POST /auth/login`
**And** NestJS validates credentials via bcrypt and returns JWT access token (15min) + refresh token (7d)
**And** Next.js API route sets both tokens as httpOnly cookies
**And** I am redirected to `/dashboard`

**Given** I navigate to `/login`
**When** I submit an incorrect email or password
**Then** an inline error message is displayed: "Invalid email or password."
**And** the password field is cleared but the email field retains its value

**Given** I am unauthenticated and navigate to any `(dashboard)` route
**When** `proxy.ts` finds no valid JWT in cookies
**Then** I am redirected to `/login` with a `?redirect=` query param preserving my original destination

**Given** I am authenticated and navigate back to my original destination after login
**When** the `?redirect=` param is present
**Then** I am sent to that original URL instead of the default `/dashboard`

**Given** my access token has expired but my refresh token is still valid
**When** `proxy.ts` detects the expired access token
**Then** it automatically calls NestJS `POST /auth/refresh` to rotate both tokens
**And** the new tokens are set as httpOnly cookies transparently
**And** my original request is forwarded to NestJS with the new access token

**Given** I am logged in and click "Log out"
**When** the logout action executes
**Then** `POST /api/auth/logout` proxies to NestJS which invalidates the refresh token hash
**And** httpOnly cookies are cleared
**And** I am redirected to `/login`

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
**Then** my current profile data is fetched via `GET /api/users/profile` (proxied to NestJS, protected by JwtAuthGuard) and pre-populated: display name, avatar, full name, school, location, age

**Given** I update my display name and click Save
**When** the mutation calls `PATCH /api/users/profile` (proxied to NestJS `PATCH /users/profile`)
**Then** `profiles.display_name` is updated via Prisma
**And** a success indicator appears inline (green checkmark near the Save button — no toast in MVP)
**And** the updated display name is reflected immediately via React Query optimistic update

**Given** I upload a new avatar image (JPG/PNG, max 2MB)
**When** the upload completes
**Then** the image is uploaded to Cloudflare R2 via `/api/files/upload`
**And** `profiles.avatar_url` is updated via NestJS API with the new R2 URL
**And** the new avatar is displayed immediately in the profile form and top navigation

**Given** I upload an avatar file larger than 2MB
**When** client-side validation runs
**Then** an inline error appears: "Image must be under 2MB." and the upload is not submitted

**Given** I submit the profile form with an empty display name
**When** Zod validation runs (shared schema from `@squademy/shared`)
**Then** an inline error appears: "Display name is required." and the form is not submitted

---

### Story 1.5: Personal Data Export Request

As a logged-in user,
I want to request and download a complete export of my personal learning data,
So that I can exercise my GDPR data portability rights (FR3).

**Acceptance Criteria:**

**Given** I am authenticated and navigate to `/settings/privacy`
**When** I click "Export My Data"
**Then** `GET /api/export/user-data` proxies to NestJS which aggregates my data via Prisma queries (protected by JwtAuthGuard)
**And** the package includes my profile and learning records (`profile`, `flashcard_decks`, `srs_progress`, `submissions`) in machine-readable JSON files

**Given** the export is ready
**When** I click "Download Export"
**Then** I receive a downloadable `.zip` file streamed from the NestJS API
**And** the file is linked to my authenticated account only (verified by JwtAuthGuard)

**Given** I am unauthenticated
**When** I attempt to call `/api/export/user-data`
**Then** the request is rejected with 401 Unauthorized (`proxy.ts` blocks unauthenticated requests)

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
**When** the deletion request calls `DELETE /api/users/account` (proxied to NestJS, protected by JwtAuthGuard)
**Then** NestJS AuthService executes the GDPR deletion workflow within a Prisma transaction:
**And** `users` row is deleted (invalidates all JWTs)
**And** `profiles` row is deleted (destroys all PII)
**And** authored content references are tombstoned: `lessons.author_id`, `peer_review_comments.author_id`, `exercise_submissions.submitter_id` → set to system "Anonymous" UUID
**And** personal data is deleted: `srs_progress` rows removed, flashcard decks and exercises by user soft-deleted (`is_deleted = true`)
**And** httpOnly cookies are cleared and user is redirected to `/login`

**Given** deletion processing is complete
**When** I try to sign in again with the deleted account
**Then** authentication fails and no active session is available

---
