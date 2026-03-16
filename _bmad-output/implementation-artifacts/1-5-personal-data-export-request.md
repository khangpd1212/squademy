# Story 1.5: Personal Data Export Request

Status: backlog

## Story

As a logged-in user,  
I want to request and download a complete export of my personal learning data,  
so that I can exercise my GDPR data portability rights (FR3).

## Acceptance Criteria

1. Given I am authenticated on `/settings/privacy`, clicking "Export My Data" creates an export package for my account.
2. Given export is ready, clicking "Download Export" returns a `.zip` generated from `/api/export/user-data` with scoped user data files.
3. Given I am unauthenticated and call `/api/export/user-data`, request is rejected as unauthorized.

## Tasks / Subtasks

- [ ] Add privacy settings UI entry point (AC: 1, 2)
  - [ ] Add `/settings/privacy` page in dashboard area.
  - [ ] Add explicit "Export My Data" trigger and download action UI.

- [ ] Implement export API route (AC: 1, 2, 3)
  - [ ] Create `GET /api/export/user-data` route requiring authenticated session.
  - [ ] Query only current user's data from required tables.
  - [ ] Build ZIP payload with machine-readable files (JSON) and proper headers.

- [ ] Enforce authorization and data scoping (AC: 2, 3)
  - [ ] Reject unauthenticated requests with 401.
  - [ ] Ensure no cross-user data is included.

- [ ] Add operational safeguards
  - [ ] Handle large payload gracefully (streaming or bounded response strategy).
  - [ ] Return clear error for missing required data sources without exposing internals.

- [ ] Test and validate (AC: 1-3)
  - [ ] API tests for authenticated and unauthenticated scenarios.
  - [ ] UI interaction test for export trigger behavior.
  - [ ] Run `npm test`, `npm run lint`, `npm run build`.

## Dev Notes

### Existing Codebase Intelligence

- `/api/export/user-data` does not exist yet.
- `/settings` exists in placeholder state and can be extended with privacy section.
- Current DB type file is placeholder-like; export fields should be validated against actual Supabase schema before final implementation.

### Technical Requirements

- Route must use server-side Supabase client bound to current session.
- Keep export payload strictly per authenticated user.
- Prefer streaming ZIP if payload size grows; MVP can start with in-memory zip if bounded.

### File Structure Requirements

- `src/app/(dashboard)/settings/privacy/page.tsx`
- `src/app/api/export/user-data/route.ts`
- Optional helpers:
  - `src/lib/export/user-data.ts`
- Tests:
  - `src/app/api/export/user-data/route.test.ts`
  - `src/app/(dashboard)/settings/privacy/page.test.tsx` (optional)

### Previous Story Intelligence

- Keep response messages sanitized and deterministic.
- Follow auth route patterns already used in registration/login flows.
- Maintain inline-first UX tone when showing export state on privacy settings page.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-foundation-project-setup-authentication.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `src/app/(dashboard)/settings/page.tsx`]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

### Completion Notes List

- Story context generated in batch mode for Epic 1 implementation wave.
- 2026-03-15: Deferred by user; implementation intentionally not started.

### File List

- `_bmad-output/implementation-artifacts/1-5-personal-data-export-request.md`
