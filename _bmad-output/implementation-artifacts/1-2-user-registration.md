# Story 1.2: User Registration

Status: done

## Story

As a new user,  
I want to register an account with my email and password and accept the privacy policy,  
so that I can access the Squademy platform.

## Acceptance Criteria

1. Given I navigate to `/register`, when I submit a valid email, password (min 8 chars), and display name, then Supabase Auth creates my account and sends a confirmation email, a `profiles` row is created linked to `auth.users`, and I am redirected to a "Check your email" confirmation page.
2. Given the registration form is rendered, when I view the form, then a privacy policy acceptance checkbox is present and required before submission, and `profiles.gdpr_consent_at` is set to current timestamp on successful registration.
3. Given I submit the registration form with an email already in use, when Supabase returns an auth error, then inline error appears below email field: "An account with this email already exists." and the form does not redirect or clear other fields.
4. Given I submit with password under 8 characters, when client-side Zod validation runs, then inline error appears below password field before submit.
5. Given I am already logged in, when I navigate to `/register`, then I am redirected to `/dashboard`.

## Tasks / Subtasks

- [x] Build registration form UI and schema validation (AC: 2, 4)
  - [x] Create `RegisterForm` client component for email, password, display name, privacy consent checkbox.
  - [x] Add Zod schema with min-length password validation and required consent validation.
  - [x] Render inline field errors (no toast) consistent with UX guideline.
  - [x] Keep existing register page card wrapper and plug in `RegisterForm`.

- [x] Implement Supabase signup flow (AC: 1, 3)
  - [x] Call `supabase.auth.signUp()` with email/password and metadata needed for profile initialization.
  - [x] Map duplicate-email/auth conflicts to inline email error message exact copy from AC.
  - [x] Keep entered values on auth error; do not clear unrelated fields.

- [x] Persist profile and consent metadata (AC: 1, 2)
  - [x] Ensure `profiles` row is inserted/available with `id` and `display_name` at registration completion.
  - [x] Ensure GDPR consent timestamp (`gdpr_consent_at`) is written when registration succeeds.
  - [x] Use server-safe path for profile persistence (route handler or secure server action) if client direct insert violates current RLS/auth timing.

- [x] Add post-submit confirmation page/route (AC: 1)
  - [x] Add lightweight "Check your email" confirmation page and redirect successful registration there.
  - [x] Keep CTA to `/login` on confirmation screen.

- [x] Guard `/register` for authenticated users (AC: 5)
  - [x] In register page (server component), check existing session and redirect authenticated users to `/dashboard`.
  - [x] Ensure no flicker from client-only redirect.

- [x] Test and validate registration flow (AC: 1-5)
  - [x] Add unit tests for validation schema and core submission behavior.
  - [x] Add component test for inline error rendering and consent-required behavior.
  - [x] Run `npm test`, `npm run lint`, and `npm run build`.

## Dev Notes

### Existing Codebase Intelligence

- `src/app/(auth)/register/page.tsx` exists but currently only renders static card shell and placeholder comment for form.
- `src/app/(auth)/login/page.tsx` similarly placeholder; registration story should not implement full login logic.
- Supabase helpers already exist and were standardized in Story 1.1:
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/middleware.ts`
- Middleware already allows public auth routes (`/login`, `/register`) and protects private routes.

### Technical Requirements

- Use current stack already installed in repo: React Hook Form + Zod + Supabase SSR client helpers.
- Keep inline validation and error feedback patterns; no toast-based UX for MVP.
- Preserve app routing conventions and alias imports (`@/*`).
- Do not introduce new auth library abstractions; reuse existing `src/lib/supabase/*`.
- Use explicit confirmation redirect target as `/register/check-email` after successful sign-up.
- Ensure sign-up uses Next.js-compatible confirmation redirect (`emailRedirectTo`) so auth confirmation flow returns to the app correctly.

### Architecture Compliance Guardrails

- Auth/session checks that affect route entry should run server-side where possible.
- Avoid duplicating Supabase helper creation logic in feature files.
- Respect privacy/compliance requirement: consent capture is mandatory in registration success flow.
- Keep implementation compatible with Next.js App Router and current middleware strategy.
- Avoid assuming DB/type parity for GDPR fields; update DB schema/types first if `profiles.gdpr_consent_at` is not yet available.

### File Structure Requirements

- `src/app/(auth)/register/page.tsx` (server page entry + auth redirect guard)
- `src/app/(auth)/register/_components/register-form.tsx` (client form component)
- `src/app/(auth)/register/check-email/page.tsx` (confirmation page)
- Optional if needed for secure persistence:
  - `src/app/api/auth/register/route.ts` (server-side profile/consent orchestration)
- Schema/types alignment if missing in current project state:
  - Supabase migration for `profiles.gdpr_consent_at`
  - Regenerated `src/types/database.ts` after schema update
- Tests:
  - `src/app/(auth)/register/_components/register-form.test.tsx`
  - `src/app/(auth)/register/register-schema.test.ts`

### Project Structure Notes

- Keep auth UI pages under `src/app/(auth)/...` and route-specific components colocated in `_components`.
- Reuse existing global UI primitives in `src/components/ui/*` (`Card`, `Input`, `Button`) instead of creating parallel auth-only primitives.
- Keep cross-feature smoke/integration tests in root `tests/` and colocated unit/component tests under `src/`.
- Maintain existing Supabase helper boundaries:
  - browser: `src/lib/supabase/client.ts`
  - server/RSC: `src/lib/supabase/server.ts`
  - middleware/session refresh: `src/lib/supabase/middleware.ts`

### Previous Story Intelligence (Story 1.1)

- Story 1.1 established Jest as the default test framework (`next/jest` + Testing Library). Use `npm test` as baseline verification command.
- Test layout was standardized away from `scripts/`; do not add new tests under `scripts/`.
- Middleware matcher was intentionally narrowed to avoid static/metadata interception; do not broaden matcher scope while implementing registration.
- Typography/theme/provider foundations are already stable; registration work should stay within auth feature scope and avoid unrelated design-system refactors.

### Testing Requirements

- Validate form schema behavior (password length, required consent, required fields).
- Validate duplicate-email message mapping and inline error rendering behavior.
- Validate authenticated-user redirect for `/register`.
- Validate successful registration redirects to `/register/check-email`.
- Validate consent timestamp persistence path (API/server action or direct insert) with failure handling when schema field is absent/misconfigured.
- Run standard quality gates:
  - `npm test`
  - `npm run lint`
  - `npm run build`

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-foundation-project-setup-authentication.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]
- [Source: `_bmad-output/planning-artifacts/prd.md`]
- [Source: `src/app/(auth)/register/page.tsx`]
- [Source: `src/lib/supabase/client.ts`]
- [Source: `src/lib/supabase/server.ts`]
- [Source: `src/lib/supabase/middleware.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

- `npm test`
- `npm run lint`
- `npm run build`
- `npx -y react-doctor@latest . --verbose --diff`

### Completion Notes List

- Implemented full registration UX in `RegisterForm` with RHF + Zod validation, inline field errors, privacy-consent requirement, and duplicate-email mapping.
- Added server-side registration endpoint `POST /api/auth/register` to orchestrate Supabase sign-up and profile upsert with GDPR consent timestamp.
- Added authenticated redirect guard in `src/app/(auth)/register/page.tsx` so logged-in users are redirected to `/dashboard`.
- Added `/register/check-email` confirmation route and client redirect after successful registration.
- Added schema, component, and page tests for Story 1.2 registration behavior.
- Added migration scaffold for `profiles.gdpr_consent_at` and aligned local TS DB type with the new field.
- Validation completed: `npm test`, `npm run lint`, `npm run build`, and React Doctor (100/100).
- Applied code-review autofixes: fail-fast env/schema preflight before sign-up, best-effort auth rollback on profile sync failure, sanitized API error messaging, and added live `/privacy` page for registration consent link.

### File List

- `_bmad-output/implementation-artifacts/1-2-user-registration.md`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/register/check-email/page.tsx`
- `src/app/(auth)/register/register-schema.ts`
- `src/app/(auth)/register/register-schema.test.ts`
- `src/app/(auth)/register/page.test.tsx`
- `src/app/(auth)/register/_components/register-form.tsx`
- `src/app/(auth)/register/_components/register-form.test.tsx`
- `src/app/api/auth/register/route.ts`
- `src/types/database.ts`
- `supabase/migrations/20260312_add_profiles_gdpr_consent_at.sql`

## Senior Developer Review (AI)

### Reviewer

GPT-5.3 Codex

### Date

2026-03-12

### Outcome

Approve

### Findings Summary

- High issues resolved:
  - Added fail-fast prereq checks (service role + schema compatibility) before creating auth users.
  - Added best-effort rollback (`auth.admin.deleteUser`) when profile sync fails to reduce partial-success inconsistency risk.
- Medium issues resolved:
  - Added `/privacy` route so registration privacy link is no longer dead.
  - Removed raw backend profile error leakage from API responses.
