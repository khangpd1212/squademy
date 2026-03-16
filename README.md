# Squademy

Squademy is a Next.js 16 + TypeScript project using App Router, Tailwind CSS v4, Supabase SSR, and Jest for unit testing.

## Development

Start the local dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Testing (Jest)

Jest is the default unit test framework for this repository from now on.

- Config: `jest.config.cjs` (based on `next/jest`)
- Setup: `jest.setup.ts`
- Alias support: `@/*` -> `src/*`
- Environment: `jsdom` (suitable for React component/unit tests)
- Recommended test locations:
  - Co-located: `src/**/*.test.ts(x)`
  - Cross-cutting/integration: `tests/**/*.test.ts(x)`

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run coverage:

```bash
npm run test:coverage
```

## Notes

- Existing warnings in unrelated legacy files may still appear in lint output.
- Unit tests should be added alongside features moving forward (prefer `*.test.ts` / `*.test.tsx` colocated with source files).
