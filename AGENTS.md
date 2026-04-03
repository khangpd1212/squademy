# AGENTS.md

This file provides instructions for AI coding agents operating in the Squademy monorepo.

---

## Project Structure

| Workspace | Package | Purpose |
|-----------|---------|---------|
| `apps/web` | `@squademy/web` | Next.js 16 frontend (port 4000) |
| `apps/api` | `@squademy/api` | NestJS 11 backend (port 4001) |
| `packages/database` | `@squademy/database` | Prisma 6 schema + generated client |
| `packages/shared` | `@squademy/shared` | Zod v4 schemas, constants, shared types |

**Monorepo:** Yarn 4 + Turborepo

---

## Build/Lint/Test Commands

### Root Commands (via Turborepo)
```bash
yarn dev           # Start web + api in parallel
yarn build          # Production build all packages
yarn lint           # ESLint across all packages
yarn test           # Jest across all packages
yarn db:generate    # Regenerate Prisma client + types
yarn db:migrate     # Apply pending Prisma migrations
```

### Single Test Commands

**Frontend (apps/web):**
```bash
# All web tests
yarn workspace @squademy/web test

# Single test file (exact path)
yarn workspace @squademy/web test -- src/app/login/page.test.tsx

# Single test with pattern match
yarn workspace @squademy/web test -- --testPathPattern="login-form"

# Watch mode for specific file
yarn workspace @squademy/web test:watch -- src/app/login/page.test.tsx

# With coverage
yarn workspace @squademy/web test:coverage
```

**Backend (apps/api):**
```bash
# All api tests
yarn workspace @squademy/api test

# Single test file
yarn workspace @squademy/api test -- src/groups/groups.controller.spec.ts

# Watch mode
yarn workspace @squademy/api test:watch
```

### Individual Package Commands
```bash
yarn workspace @squademy/web build
yarn workspace @squademy/api build
yarn workspace @squademy/api lint
yarn workspace @squademy/database db:studio
```

---

## Code Style Guidelines

### TypeScript Conventions

- **Strict mode ON** — avoid `any`, use explicit types
- **Zod v4 API** (NOT v3):
  - `z.email()` NOT `z.string().email()`
  - `z.infer<typeof schema>` for type inference
  - `safeParse()` NOT `parse()` in shared validation
- **Export both schema AND inferred type:**
  ```typescript
  export const fooSchema = z.object({ ... });
  export type FooInput = z.infer<typeof fooSchema>;
  ```

### Import Conventions

- **Frontend:** Use `@/*` path alias (maps to `./src/*`) — never `../../` relative paths
- **Exception:** Same-directory imports use `./`
- **Update barrel exports** in `src/hooks/index.ts` and `src/stores/index.ts` when adding modules
- **Heavy modules (nanoid):** Dynamic import `await import("nanoid")`

### File Naming

| Type | File Name | Export Name |
|------|-----------|-------------|
| Component | `login-form.tsx` (kebab) | `LoginForm` (Pascal) |
| Hook | `use-auth-queries.ts` | `useLogin` (camel) |
| Store | `ui-store.ts` | `useUiStore` |
| Schema | `login-schema.ts` | `loginSchema` + `LoginInput` |
| DTO (backend) | `register.dto.ts` | `RegisterDto` |
| NestJS module | `auth/` (kebab folder) | `AuthModule` |

### ESLint

- **Flat config** (`eslint.config.mjs`, ESLint 9+)
- **Frontend:** Extends `next/core-web-vitals` + `next/typescript`
- **Backend:** Extends `@eslint/js` + `typescript-eslint`
- **Unused vars:** Warn with ignore pattern `^_` for intentionally unused params

### React 19 Conventions

- **Server Components are DEFAULT** — no `"use client"` unless using hooks, events, or browser APIs
- `"use client"` goes on the FIRST line of the file
- **React Compiler enabled** — do NOT use `useMemo`, `useCallback`, or `React.memo`
- **ref is a prop** — no `forwardRef` needed

### Styling

- **Tailwind utility classes only** — no custom CSS (except `globals.css` for theme tokens)
- Use `cn()` from `@/lib/utils` for conditional classes — never string concatenation
- **Dark mode:** `dark:` variant via `next-themes` class strategy
- **Mobile-first:** base = mobile, `md:` = tablet/desktop
- **Tailwind CSS v4:** Config lives in `globals.css` via `@theme inline` — do NOT create `tailwind.config.js`

### Error Handling

- **Backend services:** Throw only `{ code: ErrorCode.X }` — NO hardcoded messages
- `HttpExceptionFilter` auto-resolves message via `getErrorMessage(code)` from shared
- `ErrorCode` and `ErrorMessage` live in `@squademy/shared` (single source of truth)

---

## Testing Conventions

### Framework & Config

| App | Runner | Environment | Config |
|-----|--------|-------------|--------|
| `apps/web` | Jest + `next/jest` | `jest-environment-jsdom` | `jest.config.cjs` |
| `apps/api` | Jest + `ts-jest` | Node | `jest.config.cjs` |

### Test File Conventions

- **Colocate tests:** `*.test.ts(x)` next to source files
- **Schema tests:** `*-schema.test.ts` next to schema files
- **Pattern:** `**/?(*.)+(spec|test).ts?(x)` for web, `*.spec.ts` for api

### Frontend Testing Patterns

- Use `@testing-library/react` with `render()`, `screen`, `userEvent`
- Use `renderWithQueryClient()` for TanStack Query components
- Use `@testing-library/user-event` (NOT `fireEvent`) for user interactions
- Mock `global.fetch` for API calls — never hit real API
- Mock `next/navigation` for router tests

---

## Shared Package Guidelines (`@squademy/shared`)

- **Validation constraints, constants, Zod schemas, error codes, and types** used by BOTH backend and frontend live in `packages/shared`
- Backend DTOs import `VALIDATION` constants for min/max values — do NOT hardcode magic numbers
- Domain constants (`GROUP_ROLES`, `INVITATION_STATUS`, `LESSON_STATUS`, `ErrorCode`) must be imported from `@squademy/shared`
- When adding a new feature: if a constant, type, or constraint is needed by both FE and BE, add it to `packages/shared` first

---

## Critical Version Constraints

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16 | Uses `src/proxy.ts` for request interception — NOT `middleware.ts` |
| Tailwind CSS | v4 | Config in `globals.css` via `@theme inline` |
| shadcn/ui | base-nova | Uses `@base-ui/react` primitives (NOT Radix UI) |
| Zod | v4 | Different API from v3 — see Zod v4 API above |
| React | 19 | Server Components default; React Compiler enabled |
| nanoid | v3 (API), v5 (web) | CJS vs ESM difference |

---

## Auth Architecture

Tokens stored in **localStorage** (client-side). Non-httpOnly `logged_in=true` cookie marker enables proxy redirect checks.

- Access token: 15 minutes
- Refresh token: 7 days
- Both rotated on refresh
- Backend validates `Authorization: Bearer <accessToken>` header ONLY

---

## Data Contract Boundary

- **API + DB:** Use `null` for optional fields (not `""`)
- **UI forms:** Use `string` values only. Normalize `null -> ""` when hydrating form state
- **PATCH behavior:** Omitted field = no change, `null` = clear value, `""` = clear value

---

## Cursor Rules Reference

Detailed architecture rules available in `.cursor/rules/`:
- `squademy-project.mdc` — Project overview and critical constraints
- `typescript-conventions.mdc` — TypeScript, Zod, imports, naming
- `testing-rules.mdc` — Testing patterns and conventions
- `frontend-nextjs.mdc` — Next.js, React, state management, shadcn
- `backend-nestjs.mdc` — NestJS modules, DTOs, error handling
- `auth-architecture.mdc` — Auth flow, token lifecycle, proxy rules
