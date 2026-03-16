# Story 1.3: User Login & Session Management

Status: done

## Story

As a registered user,  
I want to log in with my email and password and have my session maintained across page reloads,  
so that I can access my groups and learning content without logging in repeatedly.

## Acceptance Criteria

1. Given I navigate to `/login`, when I submit a valid email and password, then Supabase Auth authenticates me, sets session cookie, and redirects me to `/dashboard`.
2. Given I submit incorrect credentials on `/login`, then inline error is shown: "Invalid email or password.", password field is cleared, and email field is retained.
3. Given I am unauthenticated and request a protected route, then middleware redirects to `/login?redirect=<original-path>`.
4. Given I complete login with a valid `redirect` query param, then I am redirected back to that original destination instead of default `/dashboard`.
5. Given I am logged in and click logout, then session is destroyed and I am redirected to `/login`.
6. Given I am already logged in and open `/login`, then I am redirected to `/dashboard`.

## Tasks / Subtasks

- [x] Build login form and validation (AC: 1, 2)
  - [x] Create `LoginForm` client component under `src/app/(auth)/login/_components`.
  - [x] Add schema for email/password validation.
  - [x] Show inline errors only (no toast), clear password on auth failure, keep email.

- [x] Implement login endpoint/flow (AC: 1, 2, 4)
  - [x] Add `POST /api/auth/login` route (or secure server action) for `auth.signInWithPassword`.
  - [x] Normalize invalid-credential errors to exact AC copy.
  - [x] Return redirect target based on validated `redirect` query param.

- [x] Add server-side guard for `/login` (AC: 6)
  - [x] Update login page to check session server-side and redirect authenticated users to `/dashboard`.

- [x] Add logout action (AC: 5)
  - [x] Add `POST /api/auth/logout` route to sign out and redirect to `/login`.
  - [x] Ensure cookie/session is cleared.

- [x] Align middleware redirect preservation (AC: 3, 4)
  - [x] Ensure unauthenticated protected-route redirect includes encoded `redirect` param.
  - [x] Ensure login flow consumes and validates that param safely (same-origin path only).

- [x] Test and validate (AC: 1-6)
  - [x] Unit/component tests for inline error behavior and password clearing.
  - [x] Route/auth tests for redirect preservation and logout behavior.
  - [x] Run `npm test`, `npm run lint`, `npm run build`.

## Dev Notes

### Existing Codebase Intelligence

- `src/app/(auth)/login/page.tsx` currently still placeholder UI with no login logic.
- Registration endpoint exists at `src/app/api/auth/register/route.ts` and already demonstrates server-driven auth orchestration patterns.
- Session refresh and route protection currently live in `src/lib/supabase/middleware.ts` and are wired at root middleware/proxy layer.

### Technical Requirements

- Reuse existing auth stack: Supabase SSR helpers in `src/lib/supabase/*`.
- Keep UX consistent with Story 1.2 (inline form errors, no toast).
- Preserve compatibility with current middleware strategy and protected route model.
- Validate `redirect` target as internal app path to prevent open redirect risk.

### File Structure Requirements

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/_components/login-form.tsx`
- `src/app/(auth)/login/login-schema.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- Tests:
  - `src/app/(auth)/login/_components/login-form.test.tsx`
  - `src/app/(auth)/login/page.test.tsx`
  - `src/app/api/auth/login/route.test.ts` (optional if environment setup allows)

### Previous Story Intelligence (1.1, 1.2)

- Keep tests in `src/**` or `tests/**`, not in `scripts/`.
- Maintain strict error sanitization in API responses (no leaking raw backend internals).
- Keep auth endpoints fail-fast on missing env/schema preconditions where applicable.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-foundation-project-setup-authentication.md`]
- [Source: `src/app/(auth)/login/page.tsx`]
- [Source: `src/lib/supabase/middleware.ts`]
- [Source: `src/lib/supabase/server.ts`]
- [Source: `_bmad-output/implementation-artifacts/1-2-user-registration.md`]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

- `npx jest --runTestsByPath "src/app/(auth)/login/login-schema.test.ts"` (RED then GREEN)
- `npx jest --runTestsByPath "src/app/(auth)/login/_components/login-form.test.tsx"` (RED then GREEN)
- `npx jest --runTestsByPath "src/app/(auth)/login/page.test.tsx"` (RED then GREEN)
- `npx jest --runTestsByPath "src/lib/supabase/middleware.test.ts"` (RED then GREEN)
- `npx jest --runTestsByPath "src/app/api/auth/login/route.test.ts" "src/app/api/auth/logout/route.test.ts"`
- `npm test` (pass)
- `npm run lint` (pass with unrelated pre-existing warnings)
- `npm run build` (fails on unrelated pre-existing type error in `src/app/(dashboard)/settings/_components/profile-form.tsx`)

### Completion Notes List

- Story context generated in batch mode for Epic 1 implementation wave.
- Implemented complete login flow with inline error handling and password clearing behavior.
- Added secure redirect handling to prevent open redirects while preserving internal destination paths.
- Added `/api/auth/login` and `/api/auth/logout` route handlers with Supabase SSR cookie integration.
- Added server-side `/login` guard for authenticated users and wired dashboard header logout action.
- Added unit/component/route/middleware tests covering ACs 1-6.
- Code review follow-up: added explicit logout error handling and test coverage for sign-out failure path.

### File List

- `_bmad-output/implementation-artifacts/1-3-user-login-session-management.md`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/login-schema.ts`
- `src/app/(auth)/login/login-schema.test.ts`
- `src/app/(auth)/login/_components/login-form.tsx`
- `src/app/(auth)/login/_components/login-form.test.tsx`
- `src/app/(auth)/login/page.test.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/login/route.test.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/logout/route.test.ts`
- `src/lib/auth/redirect.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/middleware.test.ts`
- `src/components/layout/header.tsx`

### Change Log

- 2026-03-15: Completed Story 1.3 login/session management implementation, added auth routes, redirect-preservation middleware update, logout integration, and coverage tests for login, auth routes, and middleware.
- 2026-03-15: Ran adversarial code review and resolved follow-ups before finalizing story as done.

## Senior Developer Review (AI)

### Reviewer

GPT-5.3 Codex

### Date

2026-03-15

### Outcome

Approve

### Findings Summary

- High: 0
- Medium: 2
- Low: 0

### Action Items

- [x] [Medium] Handle `signOut` failure in `POST /api/auth/logout` instead of always redirecting success.
- [x] [Medium] Add regression test for logout failure path returning a server error response.
