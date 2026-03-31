---
project_name: 'squademy'
user_name: 'USER'
date: '2026-03-26'
sections_completed: ['technology_stack', 'language_specific_rules', 'framework_specific_rules', 'testing_rules', 'code_quality_style', 'development_workflow']
existing_patterns_found: 30
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Monorepo Structure

| Workspace | Package | Purpose |
|-----------|---------|---------|
| `apps/web` | `@squademy/web` | Next.js 16 frontend (Vercel) |
| `apps/api` | `@squademy/api` | NestJS 11 backend (Oracle VM) |
| `packages/database` | `@squademy/database` | Prisma 6 schema + generated client |
| `packages/shared` | `@squademy/shared` | Zod schemas, constants, shared types |

- **Build system**: Turborepo (`turbo.json`) + Yarn Workspaces 4 (`packageManager: "yarn@4.13.0"`)
- **Node linker**: `node-modules` (`.yarnrc.yml`)
- **Scripts**: `yarn dev` / `yarn build` / `yarn test` / `yarn lint` (all via Turborepo)

---

## Technology Stack & Versions

### Frontend (`apps/web`) — Production

| Technology | Package | Version |
|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict mode) | ^5 |
| Runtime | React + React DOM | 19.2.3 |
| Styling | Tailwind CSS v4 (CSS-first, NO tailwind.config.js) | ^4 |
| UI Components | shadcn/ui (base-nova, @base-ui/react primitives) | ^4.0.5 |
| Forms | React Hook Form + @hookform/resolvers | ^7.71.2 / ^5.2.2 |
| Validation | Zod v4 (NOT v3 — different API) | ^4.3.6 |
| Client State | Zustand | ^5.0.11 |
| Server State | TanStack React Query | ^5.90.21 |
| i18n | next-intl | ^4.8.3 |
| Theming | next-themes (class strategy) | ^0.4.6 |
| Icons | Lucide React | ^0.577.0 |
| Notifications | sonner | ^2.0.7 |
| ID Generation | nanoid | ^5.1.6 |
| Testing | Jest + jest-environment-jsdom | ^30.3.0 |
| Testing Utils | @testing-library/react, jest-dom, user-event | ^16.3.2 / ^6.9.1 / ^14.6.1 |

### Backend (`apps/api`) — Production

| Technology | Package | Version |
|-----------|---------|---------|
| Framework | NestJS | ^11 |
| Language | TypeScript | ^5 |
| ORM | Prisma (via `@squademy/database`) | 6 |
| Auth | Passport + passport-jwt + @nestjs/jwt | ^0.7 / ^4 / ^11 |
| Validation | class-validator + class-transformer | ^0.14 / ^0.5 |
| Rate Limiting | @nestjs/throttler | ^6 |
| Password Hashing | bcrypt | ^6 |
| ID Generation | nanoid v3 (CJS compatible) | ^3 |
| Testing | Jest + ts-jest | ^30 / ^29 |

### Database (`packages/database`)

| Technology | Details |
|-----------|---------|
| Database | PostgreSQL (self-hosted on Oracle VM) |
| ORM | Prisma 6 |
| Schema | `packages/database/prisma/schema.prisma` |
| Generate | `yarn db:generate` |
| Migrate | `yarn db:migrate` |

### Planned (NOT yet installed — do NOT import)

- **Tiptap Community** — Rich text editor (WYSIWYG)
- **Framer Motion** — Animations, gestures, flashcard flip
- **Dexie.js** — IndexedDB offline cache for flashcards
- **Cloudflare R2 SDK** — File storage (audio, images)
- **html2canvas + jsPDF** — Client-side PDF export
- **Resend/Brevo** — Transactional email

### Critical Version Notes

- **Next.js 16** uses `src/proxy.ts` as request interception entrypoint — do NOT create `middleware.ts`
- **Tailwind CSS v4** config lives entirely in `globals.css` via `@theme inline` — do NOT create `tailwind.config.js`
- **shadcn/ui base-nova** uses `@base-ui/react` primitives (NOT Radix UI) — check imports when adding new components
- **Zod v4** has different API from v3 (e.g., type inference) — use v4 docs
- **React 19** — Server Components are default; mark `"use client"` for client interactivity; `ref` is a prop (no `forwardRef`)
- **jest.config.cjs** (web) — must be CommonJS format (required by `next/jest`)
- **NestJS** uses `import cookieParser from "cookie-parser"` (default import, not namespace)
- **nanoid v3** in API (CJS compatible), v5 in web (ESM)

---

## Critical Implementation Rules

### Authentication Architecture

**Pattern: Pure Bearer Token + Cookie Marker**

Auth tokens are stored in **localStorage** (client-side). A non-httpOnly `logged_in=true` cookie marker is used for Next.js proxy redirect checks.

**Flow:**
1. Login/Register API returns `{ accessToken, refreshToken }` in response body
2. `browser-client.ts` stores both tokens in localStorage via `setAuthTokens()`
3. `browser-client.ts` sets `logged_in=true` cookie marker via `setLoginMarkerCookie()`
4. All API requests include `Authorization: Bearer <accessToken>` header
5. When accessToken expires, `browser-client.ts` auto-refreshes via `/auth/refresh`
6. `proxy.ts` checks `logged_in` cookie to redirect unauthenticated users

**Token Lifetimes:**
- Access token: 15 minutes
- Refresh token: 7 days
- Both rotated on refresh

**Backend JWT Strategy:**
- `JwtStrategy` extracts token from `Authorization: Bearer` header only
- `JwtRefreshStrategy` also extracts from Bearer header only
- NO cookie-based token extraction on backend

**Known Deviation:** Architecture spec recommends httpOnly cookies. Current implementation uses localStorage due to cross-origin constraints (Vercel frontend + Oracle VM backend = different domains). Will migrate to httpOnly cookies when custom domain enables same-origin setup.

### API Client Pattern (Frontend)

**Two clients, different contexts:**

| Client | File | Context | Usage |
|--------|------|---------|-------|
| Server-side | `src/lib/api/client.ts` | SSR / Server Components | Checks `logged_in` cookie marker; returns placeholder user for layout |
| Client-side | `src/lib/api/browser-client.ts` | Browser / Client Components | Full auth with auto-refresh; stores tokens in localStorage |

**`browser-client.ts` key functions:**
- `apiRequest<T>(path, init)` — typed fetch with auto Bearer header
- `apiFetchRaw(path, init)` — raw fetch for FormData uploads
- `setAuthTokens(access, refresh)` — saves to localStorage + sets cookie marker
- `clearAuthTokens()` — removes from localStorage + clears cookie marker
- `getAccessToken()` / `getRefreshToken()` — read from localStorage

**API base URL:** `NEXT_PUBLIC_API_URL` env var (e.g., `http://localhost:4001/api`)

### NestJS Backend Rules

**Module Structure:**
- `AuthModule` — register, login, logout, refresh, me
- `UsersModule` — profile CRUD, search
- `GroupsModule` — group CRUD, invite management
- `MembersModule` — membership management
- `InvitationsModule` — invitation accept/reject

**Controller Response Format:**
```
Success: { ok: true, data: { ... } }
Error:   { ok: false, message: "...", error: "..." }
```

**DTO Validation:**
- Use `class-validator` decorators on DTOs
- `ValidationPipe` enabled globally (transform: true, whitelist: true)
- Always include `@MaxLength()` on all string fields
- Password: `@MinLength(6) @MaxLength(128)`
- Display name: `@MinLength(1) @MaxLength(50)`

**Global Guards & Filters:**
- `ThrottlerGuard` bound globally via `APP_GUARD`
- `HttpExceptionFilter` formats all errors as `{ ok: false, message, error }`
- `JwtAuthGuard` applied per-route via `@UseGuards(JwtAuthGuard)`

**Duplicate Email:** Returns `409 Conflict` (not 400)

### Language-Specific Rules (TypeScript)

**Strict Mode & Typing:**
- TypeScript strict mode is ON — avoid `any`
- Zod schemas must export both schema AND inferred type: `export const fooSchema = z.object(...)` + `export type FooInput = z.infer<typeof fooSchema>`

**Zod v4 API (NOT v3):**
- Use `z.email()` instead of `z.string().email()`
- Use `z.infer<typeof schema>` for type inference
- Validation: always use `safeParse()`, never `parse()` in shared validation

**Import/Export Conventions:**
- Always use `@/*` path alias (maps to `./src/*`) — never relative `../../` paths
- Exception: same-directory imports use `./`
- Barrel exports in `src/hooks/index.ts` and `src/stores/index.ts` — update when adding new modules
- Heavy modules use dynamic import: `await import("nanoid")` pattern

**Component Directives:**
- Server Components are DEFAULT — do NOT add `"use client"` unless component uses hooks, event handlers, or browser APIs
- `"use client"` goes on the first line of the file

### Framework-Specific Rules (Next.js 16 + React 19)

**App Router Structure:**
- Route groups: `(auth)` for login/register, `(dashboard)` for authenticated pages
- Page-local components in `_components/` folders (private to that route segment)
- Shared components in `src/components/` organized by domain: `ui/`, `layout/`, `flashcard/`, `editor/`, `quiz/`, `peer-review/`
- Dynamic routes: `[groupId]`, `[inviteCode]`, `[lessonId]` etc.

**Proxy (NOT Middleware):**
- `src/proxy.ts` handles auth redirects (Next.js 16 pattern)
- Checks `logged_in` cookie marker (not JWT verification)
- Unauthenticated users redirected to `/login?redirect={original_path}`
- Public routes (no auth required): `/`, `/login`, `/register`, `/register/check-email`, `/join/*`, `/privacy`

**Layouts:**
- Root layout (`src/app/layout.tsx`): fonts (Nunito, Inter, Fira Code), NextIntlClientProvider, Providers (theme + query client), TooltipProvider, Toaster
- Auth layout: centered, `max-w-md`, minimal
- Dashboard layout: sidebar + header, responsive (`md:` breakpoint for sidebar visibility)

**React Hook Form + Zod Pattern:**
1. Define schema in colocated `*-schema.ts` file
2. Component: `useForm<FooInput>({ resolver: zodResolver(fooSchema) })`
3. Submit: call mutation hook (e.g., `useLogin`, `useRegister`)
4. Handle API errors: set field-level errors via `form.setError()` or general `submitError` state
5. Display: inline error messages below each field

**State Management Split:**
- **Zustand** for client-only UI state (sidebar, theme, future: flashcard session, quiz state)
  - Pattern: `interface XState {}` -> `export const useXStore = create<XState>((set) => ({...}))`
  - Store files in `src/stores/`, kebab-case names, barrel export via `index.ts`
- **TanStack Query** for server state (API reads/writes)
  - `staleTime: 60_000` (60s) configured in `src/lib/query-client.ts`
  - Query keys centralized in `src/lib/api/query-keys.ts`
  - Hooks in `src/hooks/api/use-auth-queries.ts` and `use-user-queries.ts`
- **React Hook Form** for form state only — do not mix with Zustand

**shadcn/ui Components:**
- Located in `src/components/ui/` — copy-to-repo model (full ownership)
- Use `cn()` from `@/lib/utils` for conditional class merging — never string concatenation
- When adding new shadcn components: `npx shadcn add <component>` — respects `components.json` config
- Primitives come from `@base-ui/react` (NOT Radix) — verify imports match

**i18n (next-intl):**
- Config in `src/i18n/request.ts`, currently hardcoded locale "en"
- Messages in `messages/en.json`
- `NextIntlClientProvider` wraps app in root layout
- Use `useTranslations()` hook in client components, `getTranslations()` in server components

### Testing Rules

**Framework & Config:**
- Frontend: Jest with `next/jest` plugin, `jest-environment-jsdom`, config in `jest.config.cjs` (CommonJS)
- Backend: Jest with `ts-jest`, config in `jest.config.ts`
- Setup file (web): `jest.setup.ts` imports `@testing-library/jest-dom`

**Test File Conventions:**
- Colocate tests with source: `login-form.test.tsx` next to `login-form.tsx`
- Schema tests: `login-schema.test.ts` next to `login-schema.ts`
- Pattern: `**/?(*.)+(spec|test).ts?(x)`

**Testing Patterns:**
- Component tests: `@testing-library/react` with `render()`, `screen`, `userEvent`
- Use `renderWithQueryClient()` from `@/test-utils/render-with-query-client` for components using TanStack Query
- Schema tests: test valid/invalid inputs against Zod schemas
- Use `@testing-library/user-event` (NOT `fireEvent`) for user interactions
- Mock `global.fetch` for API call tests
- Mock `next/navigation` for router tests

**Module Mocking:**
- Module alias `@/*` -> `<rootDir>/src/$1` configured in jest
- Mock API responses via `global.fetch` — never hit real API in unit tests

### Code Quality & Style Rules

**ESLint Configuration:**
- `eslint.config.mjs` with flat config format (ESLint 9+)
- Extends: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Ignored paths: `_bmad/`, `_bmad-output/`, `docs/`, `.next/`, `out/`, `build/`
- Run: `yarn lint`

**File Naming Conventions:**
- Components: kebab-case files (`login-form.tsx`, `invite-link-section.tsx`)
- Component exports: PascalCase (`LoginForm`, `InviteLinkSection`)
- Hooks: kebab-case files prefixed with `use-` (`use-auth-queries.ts`) -> camelCase export (`useLogin`)
- Stores: kebab-case with `-store` suffix (`ui-store.ts`) -> `useXStore` export
- Schemas: kebab-case with `-schema` suffix (`login-schema.ts`)
- DTOs (backend): kebab-case with `.dto.ts` suffix (`register.dto.ts`)
- NestJS modules: kebab-case folders (`auth/`, `users/`, `groups/`)

**Directory Organization:**

Frontend (`apps/web/src/`):
- `app/` — Pages (App Router)
- `components/ui/` — shadcn/ui primitives
- `components/layout/` — Header, Sidebar, MobileNav
- `components/{feature}/` — Feature-specific shared components
- `app/**/_components/` — Page-local private components
- `hooks/` — Custom React hooks with barrel export
- `hooks/api/` — TanStack Query hooks (API data fetching)
- `stores/` — Zustand stores with barrel export
- `lib/api/` — API clients (browser-client.ts, client.ts, query-keys.ts)
- `lib/` — Utilities
- `i18n/` — Internationalization config

Backend (`apps/api/src/`):
- `auth/` — AuthModule (controller, service, DTOs, strategies, guards)
- `users/` — UsersModule (controller, service, DTOs)
- `groups/` — GroupsModule
- `members/` — MembersModule
- `invitations/` — InvitationsModule
- `common/` — Shared filters, guards, decorators

**Styling Rules:**
- Tailwind CSS utility classes only — no custom CSS files (except `globals.css` for theme tokens)
- Dark mode: use `dark:` variant — theme managed via `next-themes` class strategy
- Use `cn()` for conditional classes — import from `@/lib/utils`
- Mobile-first: base styles for mobile, `md:` for tablet/desktop breakpoints
- Fonts: Nunito (headers/UI), Inter (body/reading), Fira Code (code/IPA)

### Development Workflow Rules

**Database Migrations:**
- Prisma schema in `packages/database/prisma/schema.prisma`
- Generate client: `yarn db:generate` (runs `prisma generate`)
- Apply migrations: `yarn db:migrate` (runs `prisma migrate dev`)
- All model names use PascalCase, all `@@map()` use snake_case table names
- All field `@map()` use snake_case column names

**Environment Variables:**
- Frontend: `NEXT_PUBLIC_*` prefix = safe for client bundle; no prefix = server-only
- Backend: all env vars are server-only (loaded via `@nestjs/config` ConfigModule)
- Key env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`
- `.env.local` for local development (gitignored)

**Deployment:**
- Frontend: Vercel (auto-deploy from main branch)
- Backend: Oracle VM (Docker Compose + Nginx + SSL)
- Database: PostgreSQL on Oracle VM

### Architecture Deviations

| Spec Says | Current Implementation | Reason |
|-----------|----------------------|--------|
| httpOnly cookies for JWT | localStorage + cookie marker | Cross-origin (Vercel + Oracle VM = different domains) |
| Shared Zod schemas for backend validation | class-validator DTOs on backend | NestJS convention; Zod schemas used on frontend only |
| Separate users + profiles tables | Single `User` model with all fields | Simplified for MVP; can split later if needed |
| Password min 8 chars | Password min 6 chars | User decision for better UX during early testing |
| Epic/architecture: Next.js `/api/*` proxies CRUD to NestJS | Browser calls Nest directly via `browser-client.ts` + `NEXT_PUBLIC_API_URL` | Cross-origin (Vercel + Oracle VM); epics reference Nest paths only (e.g. `POST /groups`) — no Next proxy layer for domain REST |
