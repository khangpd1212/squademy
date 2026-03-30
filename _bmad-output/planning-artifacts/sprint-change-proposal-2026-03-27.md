# Sprint Change Proposal — API Pattern Documentation Alignment

**Date:** 2026-03-27  
**Type:** Course correction (documentation only)  
**Classification:** Minor — no code changes, no scope/timeline impact  

---

## Summary

Planning artifacts (Architecture document, Epics 1–9, `requirements-inventory.md`, `project-context.md`) described a **Next.js `/api/*` → NestJS proxy** pattern. The implemented stack uses **direct browser calls to NestJS** via `apps/web/src/lib/api/browser-client.ts` and `NEXT_PUBLIC_API_URL` (intentional deviation for cross-origin hosting: Vercel + Oracle VM).

This proposal records alignment of documentation with that implementation pattern.

---

## Problem

- **Mismatch:** Stories and architecture sections referenced `POST /api/groups` “proxied to NestJS `POST /groups`,” `useApi.ts`, `lib/api/client.ts` as a Next proxy client, and deployment diagrams showing all API traffic through Vercel `/api/*`.
- **Actual:** React Query `queryFn` / `mutationFn` use `browser-client.ts` against the Nest host; `proxy.ts` is request interception for SSR redirects (`logged_in` cookie), not an HTTP proxy to Nest.

---

## Change Description

| Area | Action |
|------|--------|
| `architecture.md` | §2.2 tree: remove auth proxy routes; keep `app/api/` for cron, planned files, export, webhooks; note direct Nest for CRUD. §2.3 + §4.1 + deployment diagrams: direct Nest via `browser-client.ts`. Hooks/lib: `hooks/api/use-*-queries.ts`, `browser-client.ts`. |
| Epics 1–9 | Add **API Convention** blockquote at top; rewrite acceptance criteria to Nest paths (e.g. `POST /groups (JwtAuthGuard)`); remove “proxies to NestJS” wording. **Exception:** `/api/cron/*` and planned `POST /api/files/upload` remain Next.js Route Handlers. |
| `requirements-inventory.md` | Clarify Route Handlers = cron/webhooks/planned upload, not CRUD BFF; file upload line marked planned. |
| `project-context.md` | Add **Architecture Deviations** table row for direct Nest vs Next proxy. |

---

## Out of Scope

- **PRD** — no proxy wording; unchanged.
- **`_bmad-output/implementation-artifacts/`** — already aligned with code where updated.
- **Application source code** — no changes in this CC.

---

## Risk & Testing

- **Risk:** None (markdown-only).
- **Verification:** Grep epics for `proxied to NestJS` / `proxies to`; spot-check `architecture.md` §2.2–2.3 and diagram §11.

---

## Approval / Record

- **Recommended action:** Merge documentation updates; communicate to team that epic paths denote Nest routes relative to `NEXT_PUBLIC_API_URL` (includes Nest global prefix `/api` on the API host, e.g. `https://api.example.com/api/...`).

---

## References

- `apps/web/src/lib/api/browser-client.ts`
- `apps/api/src/main.ts` — `setGlobalPrefix('api')`
- Epic planning files under `_bmad-output/planning-artifacts/epics/`
