# Story 1.1: Project Foundation & Design System Setup

Status: done

## Story

As a developer,  
I want the project scaffolded with Next.js App Router, Tailwind CSS v4, shadcn/ui, Supabase connection, and the full design system configured,  
so that all subsequent stories have a consistent, working foundation to build upon.

## Acceptance Criteria

1. Given a new empty repository, when the project setup story is complete, then `create-next-app` with TypeScript and App Router is initialized.
2. Tailwind CSS v4 is configured with `@theme` design tokens: brand colors (`--brand-purple: #7C3AED`, `--brand-teal: #0D9488`, `--brand-pink: #EC4899`), semantic colors (emerald success, amber streak, red error), and class-based dark mode (`@custom-variant dark`).
3. Google Fonts are loaded: `Nunito` (headers/UI), `Inter` (body/reading), `Fira Code` (code/IPA).
4. shadcn/ui is initialized with copy-to-repo pattern, and base components `Button`, `Input`, `Card`, `Dialog`, `Badge`, `Dropdown` are available.
5. Supabase client setup exists at `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (RSC/Route Handlers), `src/lib/supabase/middleware.ts` (session refresh helper).
6. Root auth guard is configured to refresh Supabase session on every request (root `middleware.ts` and matcher for private routes).
7. `.env.example` documents required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_R2_*`, `RESEND_API_KEY`, `CRON_SECRET`.
8. Root layout (`src/app/layout.tsx`) loads fonts, applies theme provider, and sets `<html lang="en">`.
9. `src/app/page.tsx` redirects authenticated users to `/dashboard` and unauthenticated users to `/login`.
10. `src/app/globals.css` defines `sq-card`, `sq-btn`, `sq-input` base classes with 14px border radius and unified shadow rhythm.
11. App builds successfully with `npm run build`.

## Tasks / Subtasks

- [x] Align foundation dependencies and conventions (AC: 1, 4, 11)
  - [x] Verify Next.js + React + TypeScript + Tailwind v4 baseline remains valid and compiles.
  - [x] Ensure shadcn/ui base components exist and follow copy-to-repo usage (`src/components/ui`).
  - [x] Keep imports and aliases aligned with current `@/*` convention in project files.

- [x] Finalize design token system in `src/app/globals.css` (AC: 2, 10)
  - [x] Add/confirm brand tokens: `--brand-purple`, `--brand-teal`, `--brand-pink`.
  - [x] Add/confirm semantic tokens for success, warning/streak, error states.
  - [x] Ensure dark mode variant uses the class strategy required by architecture/UX.
  - [x] Introduce reusable utility/component classes: `sq-card`, `sq-btn`, `sq-input` with 14px radius and consistent shadow rhythm.

- [x] Configure typography and app shell (AC: 3, 8)
  - [x] Replace current font setup with `Nunito`, `Inter`, and `Fira Code` in `src/app/layout.tsx`.
  - [x] Keep `<html lang="en">` and hydration-safe theme handling.
  - [x] Ensure body classes map to design tokens and remain compatible with existing components.

- [x] Standardize Supabase bootstrap and auth guard (AC: 5, 6, 7, 9)
  - [x] Keep split clients in `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`.
  - [x] Normalize public key env naming across code and `.env.example` (current mismatch risk between `NEXT_PUBLIC_SUPABASE_ANON_KEY` and publishable key naming).
  - [x] Add root `middleware.ts` to call Supabase `updateSession()` and protect private routes.
  - [x] Update `src/app/page.tsx` to route users by auth state (`/dashboard` vs `/login`) using server-safe pattern.

- [x] Expand environment contract (AC: 7)
  - [x] Extend `.env.example` with placeholders for `CLOUDFLARE_R2_*`, `RESEND_API_KEY`, `CRON_SECRET`.
  - [x] Keep comments concise so future stories can copy values correctly.

- [x] Validate build and quality gates (AC: 11)
  - [x] Run `npm run build`.
  - [x] Run `npm run lint` to catch regressions in changed files.
  - [x] Fix any compile/lint issue introduced by foundation edits.

## Dev Notes

### Existing Codebase Intelligence

- The project is already bootstrapped and partially aligned to this story, so implementation should be a **normalization pass**, not a greenfield re-init.
- Current gaps to close:
  - Font stack is `Geist`/`Geist_Mono`, not the required `Nunito`/`Inter`/`Fira Code`.
  - Root `middleware.ts` is missing, while `src/lib/supabase/middleware.ts` already exists.
  - `.env.example` is incomplete for R2/email/cron keys.
  - Home page currently renders login/register CTAs instead of auth-based redirect logic.
  - Supabase env var naming is inconsistent in code (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) vs env file (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Technical Requirements

- Use Next.js App Router structure in `src/app`.
- Keep Tailwind CSS v4 CSS-first setup and tokenized theme model.
- Keep shadcn a-la-carte component usage (no full UI library import).
- Keep Supabase SSR split (browser/server/middleware helper) and cookie-based session refresh.
- Do not introduce paid/incompatible infra dependencies.

### Architecture Compliance Guardrails

- Respect zero-OPEX stack constraints and existing ADR choices.
- Maintain mobile-first, accessible UI primitives from day one:
  - 44x44 minimum touch targets for interactive controls.
  - Visible focus ring semantics consistent with purple brand guidance.
- Preserve unified component DNA (`sq-card`, `sq-btn`, `sq-input`) for future stories.
- Keep auth/session handling server-safe; do not rely on client-only auth checks for route protection.

### Library and Framework Notes (Latest Verification)

- Next.js 16 is current stable; middleware/proxy guidance changed in docs, but this story should preserve the repo convention and AC expectation: root auth boundary file with matcher-based protection.
- Tailwind CSS v4 supports `@theme` token definition and class-based dark-mode custom variant patterns.
- shadcn/ui current install flow remains `init` + a-la-carte `add <component>`, matching copy-to-repo expectation.
- Supabase SSR docs continue to recommend `createBrowserClient`, `createServerClient`, and request-time session refresh helper in middleware boundary.

### File Structure Requirements

- `src/app/layout.tsx`: font loading + providers + global shell.
- `src/app/page.tsx`: auth-aware redirect entrypoint.
- `src/app/globals.css`: token and base class definitions.
- `src/lib/supabase/client.ts`: browser Supabase client.
- `src/lib/supabase/server.ts`: server Supabase client for RSC/route handlers.
- `src/lib/supabase/middleware.ts`: `updateSession()` helper.
- `middleware.ts` (repo root): invoke `updateSession()` and define matcher.
- `.env.example`: full variable contract for stories in epics 1/3/6/7.

### Testing Requirements

- Build validation: `npm run build` must pass.
- Static checks: `npm run lint` must pass for changed files.
- Manual smoke checks:
  - Visiting `/` as unauthenticated user lands on `/login`.
  - Visiting `/` as authenticated user lands on `/dashboard`.
  - Theme toggling path does not break hydration.
  - Supabase clients compile without env key type/runtime errors.

### Suggested Implementation Order

1. Normalize env var names and Supabase client references.
2. Add root `middleware.ts` and matcher.
3. Update `src/app/page.tsx` redirect logic.
4. Replace fonts in `src/app/layout.tsx`.
5. Complete `src/app/globals.css` design tokens and `sq-*` classes.
6. Extend `.env.example`.
7. Run lint/build and fix any fallout.

### Risks / Pitfalls to Avoid

- Do not create duplicate Supabase client helpers in new locations.
- Do not hardcode secrets or fallback credentials.
- Do not break existing alias imports (`@/...`) while moving files.
- Do not add toast-based UX feedback patterns for this story's UI primitives (MVP guideline is inline/contextual feedback).
- Do not implement client-side only redirects for protected routes; keep middleware/session refresh path authoritative.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-1-foundation-project-setup-authentication.md`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#2.1 Full Stack Table`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#2.2 Directory Structure (Next.js App Router)`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#2.4 Theming — Light / Dark Mode`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#9.2 Environment Variables`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Unified Design DNA`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Step 12: UX Consistency Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Step 13: Responsive Design & Accessibility`]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md#Additional Requirements`]
- [Source: [Next.js 16 announcement](https://nextjs.org/blog/next-16)]
- [Source: [Tailwind CSS theme docs](https://tailwindcss.com/docs/theme)]
- [Source: [Supabase Next.js server-side auth docs](https://supabase.com/docs/guides/auth/server-side/nextjs?router=pages)]
- [Source: [shadcn/ui Next.js install docs](https://ui.shadcn.com/docs/cli)]

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

- `npm run lint`
- `npm run build`
- `npx -y react-doctor@latest . --verbose --diff`
- `npm test`

### Completion Notes List

- Implemented root auth middleware boundary in `middleware.ts` using `updateSession()` and matcher exclusions for static assets.
- Updated home entry route to server-side auth redirect (`/dashboard` if authenticated, `/login` otherwise).
- Standardized Supabase public key usage to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in browser/server clients.
- Added app-wide `ThemeProvider` and switched typography stack to `Nunito`, `Inter`, and `Fira Code`.
- Extended global design tokens with brand/semantic colors and introduced `sq-card`, `sq-btn`, `sq-input` utility classes (14px radius + unified shadow rhythm).
- Expanded `.env.example` with Cloudflare R2, Resend, and cron secret placeholders.
- Validation completed: `npm run lint`, `npm run build`, and React Doctor (100/100).
- Code review follow-up fixes applied: added concrete `/dashboard` route, hardened middleware matcher for metadata/static paths, explicitly mapped heading typography to `Nunito`, and added an automated smoke test script for Story 1.1 critical flow checks.
- Re-validated after fixes: `npm run test:story-1-1`, `npm run lint`, `npm run build` all passed (lint warnings are unrelated pre-existing warnings).
- Introduced project-wide Jest baseline (`next/jest` + Testing Library) so subsequent stories can use `npm test` as the standard unit test command.

### File List

- `_bmad-output/implementation-artifacts/1-1-project-foundation-design-system-setup.md`
- `middleware.ts`
- `package.json`
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/providers.tsx`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `.env.example`
- `jest.config.cjs`
- `jest.setup.ts`
- `README.md`
- `src/app/dashboard/page.test.ts`
- `src/lib/supabase/client.test.ts`
- `tests/story-1-1-smoke-check.test.ts`

## Change Log

- 2026-03-12: Implemented Story 1.1 foundation normalization (auth middleware, root redirects, design tokens, typography, provider setup, env contract) and validated with lint/build/react-doctor.
- 2026-03-12: Addressed code review findings (missing `/dashboard` route, middleware matcher scope, explicit typography mapping, missing automated flow checks) and re-validated with smoke test + lint + build.
- 2026-03-12: Added Jest as default unit test framework for the repository (next/jest config, setup file, unit test examples, and README testing documentation).
- 2026-03-12: Standardized test folder layout by moving Story 1.1 smoke test from `scripts/` to root `tests/` and updating docs/config references.

## Senior Developer Review (AI)

### Reviewer

GPT-5.3 Codex

### Date

2026-03-12

### Outcome

Approve

### Findings Summary

- High issues resolved:
  - Added concrete `/dashboard` route to eliminate authenticated redirect-to-404 risk.
  - Narrowed middleware matcher to avoid intercepting metadata and common static asset routes.
- Medium issues resolved:
  - Explicitly applied `Nunito` to heading elements while keeping `Inter` as default body font.
  - Added automated Story 1.1 smoke checks and execution evidence.

### Residual Notes

- Repository still contains unrelated pre-existing changes outside this story scope (e.g., `.gitignore`, moved/deleted planning docs).
- Lint warnings remain in unrelated files not touched by this story implementation.
