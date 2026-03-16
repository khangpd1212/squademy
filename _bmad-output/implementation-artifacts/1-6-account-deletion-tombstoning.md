# Story 1.6: Account Deletion & Tombstoning

Status: backlog

## Story

As a logged-in user,  
I want to request account deletion with clear confirmation,  
so that my PII is removed while educational contributions are anonymized for compliance (FR4, NFR6, NFR7).

## Acceptance Criteria

1. Given authenticated user opens `/settings/privacy`, choosing "Delete My Account" shows destructive, explicit irreversible warning flow.
2. Given user confirms required deletion step, account enters GDPR deletion workflow with 24-hour SLA for PII destruction.
3. Given deletion processing completes, PII in `profiles` is removed and authored content is tombstoned as "Anonymous Learner".
4. Given deleted account attempts login again, authentication fails and no active session is available.

## Tasks / Subtasks

- [ ] Build deletion UX in privacy settings (AC: 1, 2)
  - [ ] Add two-step confirmation control (typed confirmation or explicit checkbox + final confirm).
  - [ ] Show irreversible consequences clearly before final action.

- [ ] Implement deletion request endpoint/workflow (AC: 2, 3)
  - [ ] Add secure API route for deletion request submission.
  - [ ] Persist workflow record/state with timestamp and SLA marker.
  - [ ] Trigger deletion processor path (immediate or queued job, depending on infra constraints).

- [ ] Implement tombstoning/data deletion logic (AC: 3, 4)
  - [ ] Remove PII from profile/auth context according to GDPR requirement.
  - [ ] Re-assign authored content references to tombstone identity (`Anonymous Learner`) where required.
  - [ ] Invalidate sessions/tokens so account cannot authenticate post-deletion.

- [ ] Ensure operational safety
  - [ ] Use service-role/server-only operations for destructive changes.
  - [ ] Make workflow idempotent to avoid repeated destructive operations.

- [ ] Test and validate (AC: 1-4)
  - [ ] Tests for confirmation flow and API authorization.
  - [ ] Tests for deletion workflow side effects (PII removal + auth invalidation path).
  - [ ] Run `npm test`, `npm run lint`, `npm run build`.

## Dev Notes

### Existing Codebase Intelligence

- No deletion workflow endpoint exists yet.
- Privacy page has just been introduced and can host deletion action alongside export controls.
- Architecture explicitly expects tombstoning rather than hard-delete for educational contributions.

### Technical Requirements

- Keep all destructive operations server-only with strict auth checks.
- Ensure data retention/deletion behavior aligns with GDPR notes in architecture.
- Prefer workflow-based deletion execution with clear auditability over ad-hoc multi-table deletes in client-triggered flow.

### File Structure Requirements

- `src/app/(dashboard)/settings/privacy/page.tsx` (extend with deletion controls)
- `src/app/api/privacy/delete-account/route.ts`
- Optional workflow helpers:
  - `src/lib/privacy/delete-account.ts`
  - `src/lib/privacy/tombstone.ts`
- Tests:
  - `src/app/api/privacy/delete-account/route.test.ts`
  - `src/app/(dashboard)/settings/privacy/delete-account.test.tsx` (optional)

### Previous Story Intelligence

- Continue sanitized API error responses and fail-fast prerequisite checks.
- Keep auth/session invalidation behavior consistent with login/logout implementation.
- Avoid cross-story scope creep: implement only required GDPR deletion workflow path for this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-foundation-project-setup-authentication.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `_bmad-output/planning-artifacts/prd.md`]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

### Completion Notes List

- Story context generated in batch mode for Epic 1 implementation wave.
- 2026-03-15: Deferred by user; implementation intentionally not started.

### File List

- `_bmad-output/implementation-artifacts/1-6-account-deletion-tombstoning.md`
