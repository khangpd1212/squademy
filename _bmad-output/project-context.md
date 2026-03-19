---
project_name: 'squademy'
user_name: 'USER'
date: '2026-03-17'
sections_completed: ['technology_stack', 'language_specific_rules', 'framework_specific_rules', 'testing_rules', 'code_quality_style', 'development_workflow']
existing_patterns_found: 30
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Installed (production)

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
| Auth/DB (SSR) | @supabase/ssr | ^0.9.0 |
| Auth/DB (Client) | @supabase/supabase-js | ^2.99.1 |
| i18n | next-intl | ^4.8.3 |
| Theming | next-themes (class strategy) | ^0.4.6 |
| Icons | Lucide React | ^0.577.0 |
| Notifications | sonner | ^2.0.7 |
| ID Generation | nanoid | ^5.1.6 |
| Testing | Jest + jest-environment-jsdom | ^29.7.0 / ^30.3.0 |
| Testing Utils | @testing-library/react, jest-dom, user-event | ^16.3.2 / ^6.9.1 / ^14.6.1 |

### Planned (in architecture, NOT yet installed — do NOT import)

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
- **jest.config.cjs** — must be CommonJS format (required by `next/jest`)

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

**Strict Mode & Typing:**
- TypeScript strict mode is ON — avoid `any`; use `as unknown as X` only for Supabase client type gaps
- `src/types/database.ts` is generated — run `supabase gen types typescript` after schema changes
- Zod schemas must export both schema AND inferred type: `export const fooSchema = z.object(...)` + `export type FooInput = z.infer<typeof fooSchema>`

**Zod v4 API (NOT v3):**
- Use `z.email()` instead of `z.string().email()`
- Use `z.infer<typeof schema>` for type inference
- Validation: always use `safeParse()`, never `parse()` in API routes

**Import/Export Conventions:**
- Always use `@/*` path alias (maps to `./src/*`) — never relative `../../` paths
- Exception: same-directory imports use `./` (e.g., `./use-supabase` in hooks)
- Barrel exports in `src/hooks/index.ts` and `src/stores/index.ts` — update when adding new modules
- Heavy modules use dynamic import: `await import("nanoid")` pattern

**API Route Pattern (strict order):**
1. Authenticate: `const { data: { user } } = await supabase.auth.getUser()`
2. Guard: `if (!user)` → return 401
3. Parse body: `request.json().catch(() => null) as FooInput | null`
4. Validate: `schema.safeParse(body)` → on failure return `{ message, field }` with 400
5. Business logic → return `{ ok: true, ...data }` on success

**Supabase Client Usage:**
- Browser components: `createBrowserClient` from `@/lib/supabase/client`
- Server (RSC, Route Handlers): `await createClient()` from `@/lib/supabase/server` (async — Next.js 16)
- Admin operations: `createAdminClient` from `@/lib/supabase/admin` (service_role, server-only)
- NEVER use server client in client components or vice versa

**Environment Variables:**
- `NEXT_PUBLIC_*` prefix = safe for client bundle
- No prefix = server-only (never exposed to client)
- API routes: explicit null check for env vars; proxy/middleware: `!` non-null assertion OK

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
- `src/proxy.ts` handles session refresh and auth redirects (Next.js 16 pattern)
- Matcher excludes: static assets, images, favicon, robots, sitemap, common file types
- Unauthenticated users redirected to `/login?redirect={original_path}`
- Public routes (no auth required): `/`, `/login`, `/register`, `/join/*`, `/api/*`

**Layouts:**
- Root layout (`src/app/layout.tsx`): fonts (Nunito, Inter, Fira Code), NextIntlClientProvider, Providers (theme + query client), TooltipProvider, Toaster
- Auth layout: centered, `max-w-md`, minimal
- Dashboard layout: sidebar + header, responsive (`md:` breakpoint for sidebar visibility)

**React Hook Form + Zod Pattern:**
1. Define schema in colocated `*-schema.ts` file
2. Component: `useForm<FooInput>({ resolver: zodResolver(fooSchema) })`
3. Submit: `fetch("/api/...", { method: "POST", body: JSON.stringify(data) })`
4. Handle API errors: set field-level errors via `form.setError()` or general `submitError` state
5. Display: inline error messages below each field

**State Management Split:**
- **Zustand** for client-only UI state (sidebar, theme, future: flashcard session, quiz state)
  - Pattern: `interface XState {}` → `export const useXStore = create<XState>((set) => ({...}))`
  - Store files in `src/stores/`, kebab-case names, barrel export via `index.ts`
- **TanStack Query** for server state (DB reads/writes)
  - `staleTime: 60_000` (60s) configured in `src/lib/query-client.ts`
  - `queryFn` calls Supabase client directly — no custom REST wrapper
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
- Jest with `next/jest` plugin, `jest-environment-jsdom`, config in `jest.config.cjs` (CommonJS)
- Setup file: `jest.setup.ts` imports `@testing-library/jest-dom`
- Test roots: `<rootDir>/src` (colocated) + `<rootDir>/tests` (integration/smoke)

**Test File Conventions:**
- Colocate tests with source: `login-form.test.tsx` next to `login-form.tsx`
- Schema tests: `login-schema.test.ts` next to `login-schema.ts`
- API route tests: `route.test.ts` next to `route.ts`
- Pattern: `**/?(*.)+(spec|test).ts?(x)`

**Testing Patterns:**
- Component tests: `@testing-library/react` with `render()`, `screen`, `userEvent`
- API route tests: direct function import, mock Supabase client
- Schema tests: test valid/invalid inputs against Zod schemas
- Use `@testing-library/user-event` (NOT `fireEvent`) for user interactions

**Coverage:**
- Collected from `src/**/*.{ts,tsx}` excluding `.d.ts` files
- Run: `npm test` (standard), `npm run test:watch` (TDD), `npm run test:coverage`

**Module Mocking:**
- Module alias `@/*` → `<rootDir>/src/$1` configured in jest
- Mock Supabase clients in tests — never hit real DB in unit tests

### Code Quality & Style Rules

**ESLint Configuration:**
- `eslint.config.mjs` with flat config format (ESLint 9+)
- Extends: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Ignored paths: `_bmad/`, `_bmad-output/`, `docs/`, `.next/`, `out/`, `build/`
- Run: `npm run lint`

**File Naming Conventions:**
- Components: kebab-case files (`login-form.tsx`, `invite-link-section.tsx`)
- Component exports: PascalCase (`LoginForm`, `InviteLinkSection`)
- Hooks: kebab-case files prefixed with `use-` (`use-auth.ts`) → camelCase export (`useAuth`)
- Stores: kebab-case with `-store` suffix (`ui-store.ts`) → `useXStore` export
- Schemas: kebab-case with `-schema` suffix (`login-schema.ts`)
- API routes: always `route.ts` in descriptive directory
- Types: kebab-case (`database.ts`, `index.ts`)

**Directory Organization:**
- `src/app/` — Pages and API routes (App Router)
- `src/components/ui/` — shadcn/ui primitives (auto-generated, editable)
- `src/components/layout/` — Header, Sidebar, MobileNav
- `src/components/{feature}/` — Feature-specific shared components
- `src/app/**/_components/` — Page-local private components
- `src/hooks/` — Custom React hooks with barrel export
- `src/stores/` — Zustand stores with barrel export
- `src/lib/` — Utilities, Supabase clients, auth helpers
- `src/types/` — TypeScript type definitions
- `src/i18n/` — Internationalization config

**Styling Rules:**
- Tailwind CSS utility classes only — no custom CSS files (except `globals.css` for theme tokens)
- Dark mode: use `dark:` variant — theme managed via `next-themes` class strategy
- Use `cn()` for conditional classes — import from `@/lib/utils`
- Mobile-first: base styles for mobile, `md:` for tablet/desktop breakpoints
- Fonts: Nunito (headers/UI), Inter (body/reading), Fira Code (code/IPA)

### Development Workflow Rules

**Database Migrations:**
- Use Supabase MCP tools for migration operations (apply_migration, list_migrations, execute_sql, etc.)
- After schema changes: regenerate types via `mcp__supabase__generate_typescript_types` → update `src/types/database.ts`
- Migration naming: descriptive with date prefix (e.g., `20260315_add_groups_description_and_rls_policies`)
- All tables MUST have RLS enabled — no exceptions

**Supabase RLS (Row Level Security):**
- Every new table requires RLS policies before use
- Access controlled by `auth.uid()` + `group_members` role
- Admin operations use `service_role` key — server-only, never client
- Test RLS policies after creation — verify both allowed and denied access paths

**Zero-OPEX Constraint:**
- All infrastructure must operate within free tiers (Vercel, Supabase, Cloudflare R2)
- No paid services — every technology choice must be validated against free tier limits
- Supabase free: 500 concurrent DB connections, limited Realtime connections
- Vercel free: limited serverless invocations — most reads should bypass Vercel (direct Supabase from browser)

**Deployment:**
- Hosted on Vercel (auto-deploy from main branch)
- Environment variables set in Vercel dashboard — never commit `.env` files
- `.env.local` for local development (gitignored)
- Cron jobs configured in `vercel.json` with `CRON_SECRET` authorization
