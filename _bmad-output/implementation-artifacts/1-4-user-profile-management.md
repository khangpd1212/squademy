# Story 1.4: User Profile Management

Status: done

## Story

As a logged-in user,  
I want to view and update my profile information,  
so that my group members can identify me and my profile reflects my current details.

## Acceptance Criteria

1. Given I navigate to `/settings`, profile fields are pre-populated (display name, avatar, full name, school, location, age).
2. Given I update display name and save, `profiles.display_name` is updated, inline success indicator appears, and UI reflects optimistic update.
3. Given I upload avatar JPG/PNG <= 2MB, file is uploaded via `/api/files/upload`, `profiles.avatar_url` is updated, and UI updates immediately.
4. Given avatar > 2MB, inline validation error appears and upload is blocked.
5. Given empty display name, inline validation error appears and save is blocked.

## Tasks / Subtasks

- [x] Build settings profile form UI (AC: 1, 2, 5)
  - [x] Replace placeholder `src/app/(dashboard)/settings/page.tsx` with profile settings UI.
  - [x] Add schema validation for required/optional fields and age constraints.
  - [x] Add inline success state near save action (no toast in MVP).

- [x] Implement profile read/write (AC: 1, 2)
  - [x] Add profile query by authenticated user id.
  - [x] Add mutation for profile update with optimistic UI handling.
  - [x] Ensure updates respect RLS and authenticated ownership.

- [x] Implement avatar upload pipeline (AC: 3, 4)
  - [x] Add client-side file validation (type + <= 2MB).
  - [x] Implement `/api/files/upload` route handler contract for avatar upload.
  - [x] Persist returned URL to `profiles.avatar_url`.

- [x] Keep auth safety boundaries (AC: 1-5)
  - [x] Ensure unauthenticated users cannot access profile update endpoints.
  - [x] Ensure all writes are scoped to current user.

- [x] Test and validate (AC: 1-5)
  - [x] Component tests for validation and inline states.
  - [x] API tests for profile mutation and upload validation where practical.
  - [x] Run `npm test`, `npm run lint`, `npm run build`.

## Dev Notes

### Existing Codebase Intelligence

- `src/app/(dashboard)/settings/page.tsx` currently placeholder only.
- `profiles` type currently includes `id`, `display_name`, `avatar_url`, `gdpr_consent_at` in `src/types/database.ts`, but AC also references full_name/school/location/age that may require schema/type extension.
- File upload API path `/api/files/upload` is planned in architecture but not implemented yet.

### Technical Requirements

- Continue inline feedback strategy from previous stories (no toast).
- If DB schema lacks required profile columns, add migrations first and regenerate local DB types.
- Keep upload validation mirrored on both client and server for safety.

### File Structure Requirements

- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/_components/profile-form.tsx`
- `src/app/(dashboard)/settings/profile-schema.ts`
- `src/app/api/files/upload/route.ts`
- Optional helpers:
  - `src/lib/r2/client.ts` (if upload integration is introduced now)
- Tests:
  - `src/app/(dashboard)/settings/_components/profile-form.test.tsx`
  - `src/app/api/files/upload/route.test.ts` (optional)

### Previous Story Intelligence (1.1, 1.2, 1.3)

- Do not broaden middleware matcher scope while adding new endpoints.
- Keep API error responses sanitized and deterministic.
- Preserve consistency of auth and server route patterns introduced in registration/login stories.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-foundation-project-setup-authentication.md`]
- [Source: `src/app/(dashboard)/settings/page.tsx`]
- [Source: `src/types/database.ts`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

- 2026-03-15: Implemented profile settings UI + API routes (`/api/profile`, `/api/files/upload`), added schema, migration, and Jest coverage.
- 2026-03-15: Verified with `npm test`, `npm run lint`, and `npm run build` (lint has pre-existing warnings in unrelated files).

### Completion Notes List

- Replaced placeholder `/settings` page with a profile card + editable form and pre-populated server data.
- Added optimistic display-name update behavior and inline save success state (no toast).
- Added authenticated `PATCH /api/profile` endpoint with input validation, ownership scoping, and upsert fallback.
- Added authenticated `POST /api/files/upload` endpoint with server-side avatar validation (type/size) and deterministic response contract.
- Added client-side avatar validation and immediate avatar preview/update flow tied to profile persistence.
- Added/updated tests for profile form behavior and profile/upload API validation paths.
- Added profile schema/type extensions and DB migration for `full_name`, `school`, `location`, `age`.
- Ran full verification gates: tests passing, lint passing (warnings only), production build passing.

### File List

- `_bmad-output/implementation-artifacts/1-4-user-profile-management.md`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/profile-schema.ts`
- `src/app/(dashboard)/settings/_components/profile-form.tsx`
- `src/app/(dashboard)/settings/_components/profile-form.test.tsx`
- `src/app/api/profile/route.ts`
- `src/app/api/profile/route.test.ts`
- `src/app/api/files/upload/route.ts`
- `src/app/api/files/upload/route.test.ts`
- `src/types/database.ts`
- `supabase/migrations/20260315_add_profiles_extended_fields.sql`

## Change Log

- 2026-03-15: Implemented Story 1.4 profile management end-to-end (UI, API, validation, tests, migration).
- 2026-03-15: Code-review pass completed with fixes applied for profile-row upsert fallback, avatar URL safety guard, and empty-file upload validation.

## Senior Developer Review (AI)

### Outcome

Approve

### Findings and Resolution

- [x] [MEDIUM] `PATCH /api/profile` previously failed when a profile row was missing. Updated to upsert and then re-select by user id.
- [x] [MEDIUM] `PATCH /api/profile` accepted arbitrary avatar URL strings. Added URL safety guard (`data:image/`, `https://`, `http://`).
- [x] [LOW] `POST /api/files/upload` did not reject zero-byte files. Added explicit empty-file validation.
