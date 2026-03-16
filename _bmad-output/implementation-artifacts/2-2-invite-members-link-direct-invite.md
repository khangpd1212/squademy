# Story 2.2: Invite Members — Link & Direct Invite

Status: done

## Story

As a Group Admin,
I want to invite new members via a shareable link or by searching their username,
so that I can grow my group with the people I want to study with.

## Acceptance Criteria

1. **Given** I am a Group Admin and open the Members page for my group,
   **When** I click "Copy Invite Link",
   **Then** a URL containing the group's `invite_code` is copied to my clipboard (e.g. `/join/[invite_code]`),
   **And** a success indicator appears: "Link copied!"

2. **Given** I am a Group Admin and click "Revoke Invite Link",
   **When** I confirm the action in a dialog,
   **Then** the group's `invite_code` is regenerated to a new unique slug,
   **And** the old invite link no longer works — navigating to it shows "This invite link is invalid or has expired."

3. **Given** I am a Group Admin and type a username in the "Invite by username" field,
   **When** I select a user from the suggestions and click "Send Invite",
   **Then** a `group_invitations` row is created with `status = 'pending'`,
   **And** the invited user sees the invitation in their invitations list.

4. **Given** I receive a direct group invitation,
   **When** I navigate to my invitations and click "Accept",
   **Then** a `group_members` row is created with `role = 'member'`,
   **And** the `group_invitations` status is updated to `'accepted'`,
   **And** I am redirected to the group's home page.

5. **Given** I receive a direct group invitation,
   **When** I click "Decline",
   **Then** the `group_invitations` status is updated to `'declined'`,
   **And** the invitation disappears from my list.

6. **Given** an unauthenticated user navigates to `/join/[invite_code]`,
   **When** the invite code is valid,
   **Then** they are redirected to `/register?redirect=/join/[invite_code]` to register first,
   **And** after registration/login they are automatically joined to the group.

7. **Given** an authenticated user navigates to `/join/[invite_code]`,
   **When** the invite code is valid and the user is not already a member,
   **Then** a `group_members` row is created with `role = 'member'`,
   **And** the user is redirected to the group home page.

8. **Given** a user navigates to `/join/[invite_code]`,
   **When** the invite code does not exist or has been revoked (new code issued),
   **Then** a "This invite link is invalid or has expired." error page is shown.

## Tasks / Subtasks

- [x] **Task 1: Database — add `group_invitations` table, RLS policies, update TypeScript types** (AC: 3, 4, 5, 6, 7)
  - [x] Create migration: `supabase/migrations/20260315_add_group_invitations.sql`
    - `CREATE TABLE group_invitations (id uuid PK, group_id uuid FK groups, invited_by uuid FK profiles, invitee_id uuid FK profiles, status text CHECK IN ('pending','accepted','declined'), created_at timestamptz)`
    - Enable RLS on `group_invitations`
    - Policy `group_invitations_select`: `auth.uid() = invitee_id OR auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = group_invitations.group_id AND role = 'admin')`
    - No INSERT/UPDATE/DELETE RLS needed — all mutations go through API routes using admin client (service_role)
  - [x] Update `src/types/database.ts` — add `group_invitations` table with `Row`, `Insert`, `Update` types

- [x] **Task 2: Supabase Admin Client** (AC: 4, 5, 7)
  - [x] Create `src/lib/supabase/admin.ts` with `createAdminClient()` using `SUPABASE_SERVICE_ROLE_KEY`
  - [x] This client bypasses RLS — use only in server-side Route Handlers for: group_members insert (join/accept), group_invitations mutations (create/accept/decline)
  - [x] Never expose service_role key to client bundle — only import from server-side files

- [x] **Task 3: Update middleware to allow unauthenticated access to `/join/*`** (AC: 6)
  - [x] Update `src/lib/supabase/middleware.ts` — add `/join` to the unauthenticated allowlist
  - [x] When unauthenticated user hits a non-auth, non-api, non-join route → redirect to `/login` (existing behavior)
  - [x] The `/join/[inviteCode]` page itself handles the `/register` redirect (not middleware)

- [x] **Task 4: Join via invite link — page + API route** (AC: 6, 7, 8)
  - [x] Create `src/app/join/[inviteCode]/page.tsx` (server component)
    - If user NOT authenticated: `redirect('/register?redirect=/join/${inviteCode}')`
    - If user IS authenticated: call `POST /api/groups/join` with `{ inviteCode }`
    - On success: `redirect('/group/${groupId}')`
    - On invalid code (404): render error UI with message "This invite link is invalid or has expired." and a "Back to home" link
    - On already-member (409): `redirect('/group/${groupId}')` silently
  - [x] Create `src/app/api/groups/join/route.ts` with `POST` handler
    - Auth check → 401 if not authenticated
    - Parse `{ inviteCode }` from body
    - Query `groups` table: `SELECT id FROM groups WHERE invite_code = :inviteCode LIMIT 1`
    - If not found → return `{ message: "This invite link is invalid or has expired." }` with status 404
    - Check if already member: `SELECT 1 FROM group_members WHERE group_id = :groupId AND user_id = :userId`
    - If already member → return `{ ok: true, group: { id } }` with status 200 (idempotent)
    - Use `createAdminClient()` to `INSERT INTO group_members (group_id, user_id, role) VALUES (:groupId, :userId, 'member')`
    - Return `{ ok: true, group: { id } }` with status 201

- [x] **Task 5: Members page — invite link section (Copy + Revoke)** (AC: 1, 2)
  - [x] Update `src/app/(dashboard)/group/[groupId]/members/page.tsx` (server component)
    - Auth check: `createClient → getUser → redirect('/login') if no user`
    - Verify user is a member of this group (RLS will handle access, but check role for admin-only sections)
    - Fetch: `SELECT role FROM group_members WHERE group_id = :groupId AND user_id = :userId`
    - Fetch: `SELECT id, name, invite_code FROM groups WHERE id = :groupId`
    - Fetch members list: `SELECT gm.user_id, gm.role, gm.joined_at, p.display_name, p.avatar_url FROM group_members gm JOIN profiles p ON p.id = gm.user_id WHERE gm.group_id = :groupId ORDER BY gm.joined_at ASC`
    - Render `<InviteLinkSection>` (client, only if `isAdmin`) and `<InviteByUsername>` (client, only if `isAdmin`)
    - Render members list with display name, avatar, role badge, join date
  - [x] Create `src/app/(dashboard)/group/[groupId]/members/_components/invite-link-section.tsx` (client component)
    - Props: `{ inviteCode: string, groupId: string }`
    - Display: full invite URL = `${window.location.origin}/join/${inviteCode}`
    - "Copy Invite Link" button: uses `navigator.clipboard.writeText(url)`, then shows inline success "Link copied!" for 2s
    - "Revoke Invite Link" button: opens shadcn `Dialog` for confirmation
    - On confirm revoke: calls `DELETE /api/groups/${groupId}/invite-link`, shows success and updates displayed URL with new code
    - Loading state on revoke; error handling with `submitError` state
  - [x] Create `src/app/api/groups/[groupId]/invite-link/route.ts` with `DELETE` handler
    - Auth check → 401
    - Verify caller is admin: `SELECT role FROM group_members WHERE group_id = :groupId AND user_id = :userId`
    - If not admin → 403 `{ message: "Only group admins can revoke the invite link." }`
    - Generate new `invite_code` using same nanoid pattern as Story 2.1: `customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)`
    - Handle uniqueness conflict (retry max 3 times, same pattern as `/api/groups/route.ts`)
    - `UPDATE groups SET invite_code = :newCode WHERE id = :groupId`
    - Return `{ ok: true, inviteCode: newCode }` with status 200

- [x] **Task 6: Members page — invite by username + create invitation** (AC: 3)
  - [x] Create `src/app/api/profiles/search/route.ts` with `GET` handler
    - Auth check → 401
    - Query params: `q` (search term, required, min 2 chars), `groupId` (required)
    - Validate: if `q.length < 2` → return 400
    - Query: `SELECT id, display_name, avatar_url FROM profiles WHERE display_name ILIKE '%${q}%' AND id != :userId AND id NOT IN (SELECT user_id FROM group_members WHERE group_id = :groupId) LIMIT 10`
    - Return `{ profiles: [...] }` — only display_name and avatar_url (no PII)
  - [x] Create `src/app/(dashboard)/group/[groupId]/members/_components/invite-by-username.tsx` (client component)
    - Props: `{ groupId: string }`
    - Controlled input; debounce search by 300ms (use `setTimeout` + cleanup, no extra library)
    - Call `GET /api/profiles/search?q=${query}&groupId=${groupId}` when query length ≥ 2
    - Show dropdown/list of matching users with display name
    - "Send Invite" button next to each result
    - On click: call `POST /api/invitations`, show inline success "Invite sent!" or error
    - Disable button after successful invite (prevent duplicate)
  - [x] Create `src/app/api/invitations/route.ts` with `POST` handler
    - Auth check → 401
    - Parse `{ groupId, inviteeId }` from body
    - Verify caller is admin of this group → 403 if not
    - Check invitee is not already a member → 409 if already member
    - Check no existing pending invitation exists → 409 if duplicate pending
    - Use `createAdminClient()` to INSERT into `group_invitations (group_id, invited_by, invitee_id, status='pending')`
    - Return `{ ok: true, invitation: { id } }` with status 201

- [x] **Task 7: Invitations inbox — list + accept/decline** (AC: 4, 5)
  - [x] Create `src/app/(dashboard)/invitations/page.tsx` (server component)
    - Auth check: `createClient → getUser → redirect('/login') if no user`
    - Fetch pending invitations: `SELECT gi.id, gi.group_id, gi.created_at, g.name as group_name, p.display_name as invited_by_name FROM group_invitations gi JOIN groups g ON g.id = gi.group_id JOIN profiles p ON p.id = gi.invited_by WHERE gi.invitee_id = :userId AND gi.status = 'pending' ORDER BY gi.created_at DESC`
    - If no invitations: show empty state "No pending invitations."
    - Render `<InvitationList>` client component with invitations data
  - [x] Create `src/app/(dashboard)/invitations/_components/invitation-list.tsx` (client component)
    - Props: `{ invitations: InvitationType[] }`
    - Show each invitation: group name, invited by, date, "Accept" + "Decline" buttons
    - On Accept: call `PATCH /api/invitations/${id}` with `{ action: 'accept' }`, on success `router.push('/group/${groupId}')`
    - On Decline: call `PATCH /api/invitations/${id}` with `{ action: 'decline' }`, on success remove from list (optimistic UI)
    - Loading state per invitation (disable buttons while pending)
    - Error state: inline error per invitation
  - [x] Create `src/app/api/invitations/[id]/route.ts` with `PATCH` handler
    - Auth check → 401
    - Parse `{ action }` from body — must be `'accept'` or `'decline'`
    - Load invitation: `SELECT * FROM group_invitations WHERE id = :id`
    - If not found → 404
    - Verify `invitee_id = auth.uid()` → 403 if not the invitee
    - Verify `status = 'pending'` → 409 if already processed
    - Use `createAdminClient()` for all mutations:
      - For `'accept'`:
        - Check not already member (idempotency): `SELECT 1 FROM group_members WHERE group_id AND user_id`
        - If not member: `INSERT INTO group_members (group_id, user_id, role='member')`
        - `UPDATE group_invitations SET status='accepted' WHERE id = :id`
        - Return `{ ok: true, groupId }` with status 200
      - For `'decline'`:
        - `UPDATE group_invitations SET status='declined' WHERE id = :id`
        - Return `{ ok: true }` with status 200
  - [x] Add "Invitations" link to `src/components/layout/sidebar.tsx` with `Mail` icon from lucide-react (href: `/invitations`)
  - [x] Add "Invites" link to `src/components/layout/mobile-nav.tsx` if space permits, or document as future enhancement

- [x] **Task 8: Tests** (AC: 1–8)
  - [x] `src/app/api/groups/join/route.test.ts`:
    - Unauthenticated → 401
    - Valid invite_code, not a member → 201, group_members insert called
    - Valid invite_code, already a member → 200 (idempotent)
    - Invalid invite_code → 404
  - [x] `src/app/api/groups/[groupId]/invite-link/route.test.ts`:
    - Unauthenticated → 401
    - Non-admin → 403
    - Admin: generates new invite_code, updates group → 200 with new code
  - [x] `src/app/api/profiles/search/route.test.ts`:
    - Unauthenticated → 401
    - Query too short (< 2 chars) → 400
    - Valid query → 200 with filtered profiles
  - [x] `src/app/api/invitations/route.test.ts`:
    - Unauthenticated → 401
    - Non-admin → 403
    - Already a member → 409
    - Duplicate pending invitation → 409
    - Valid → 201
  - [x] `src/app/api/invitations/[id]/route.test.ts`:
    - Unauthenticated → 401
    - Not invitee → 403
    - Not found → 404
    - Already accepted/declined → 409
    - Accept: inserts group_members, updates invitation → 200
    - Decline: updates invitation status → 200
  - [x] `src/app/(dashboard)/group/[groupId]/members/_components/invite-link-section.test.tsx`:
    - Renders invite URL
    - Copy button writes to clipboard and shows "Link copied!" success
    - Revoke opens dialog; confirm calls API and updates displayed code
  - [x] Run `npm test`, `npm run lint`, `npm run build` to verify all pass

## Dev Notes

### Critical Gaps — Must Address Before Implementation

**1. `group_invitations` table missing from `src/types/database.ts`**
The `group_invitations` table is defined in the architecture (`architecture.md` Section 3.2) but is NOT in the current TypeScript types. Task 1 creates both the migration AND the types. The schema:
```typescript
group_invitations: {
  Row: {
    id: string;
    group_id: string;
    invited_by: string;
    invitee_id: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
  };
  Insert: {
    group_id: string;
    invited_by: string;
    invitee_id: string;
    status?: 'pending' | 'accepted' | 'declined';
  };
  Update: {
    status?: 'pending' | 'accepted' | 'declined';
  };
}
```

**2. Supabase Admin Client required — `SUPABASE_SERVICE_ROLE_KEY` env var**
Task 2 creates `src/lib/supabase/admin.ts`. This is needed because `group_members` INSERT RLS was intentionally tightened in Story 2.1 review (only group creators can insert as admin). All join/accept operations must bypass RLS using service_role. The client:
```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```
**NEVER** import `createAdminClient` in client components — server-only.

**3. `middleware.ts` at project root (`middleware.ts`) calls `updateSession` from `src/lib/supabase/middleware.ts`**
The actual middleware logic is in `src/lib/supabase/middleware.ts`. To add `/join` to the allowlist, update the `if (!user && ...)` condition in `src/lib/supabase/middleware.ts` to add:
```typescript
!request.nextUrl.pathname.startsWith("/join")
```
The `/join/[inviteCode]` page itself handles the `/register` redirect for unauthenticated users.

### Codebase Patterns (MUST Follow)

**API Route patterns** (from `src/app/api/groups/route.ts`):
- Auth: `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();`
- Validation: Zod `schema.safeParse(body)`, return first issue with `field` + `message`
- Errors: `NextResponse.json({ message, field? }, { status })`
- Success 201 for creates, 200 for updates
- Use `createClient` from `@/lib/supabase/server` for auth + regular queries
- Use `createAdminClient` from `@/lib/supabase/admin` ONLY for mutations that need to bypass RLS

**Form patterns** (from `src/app/(dashboard)/groups/create/_components/create-group-form.tsx`):
- `"use client"` directive
- `useForm({ resolver: zodResolver(schema), mode: "onSubmit" })`
- `isSaving` state for button disabled
- `submitError` state for general errors
- `form.setError(field, { type: "server", message })` for field-level API errors
- Success redirect: `router.push('/...')`

**Server Component patterns** (from `src/app/(dashboard)/settings/page.tsx`):
```typescript
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // fetch data...
  return <ClientComponent data={...} />;
}
```

**Invite code generation** (same pattern as `src/app/api/groups/route.ts`):
- `nanoid` v5.1.6 already installed
- `customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)` — 12 char URL-safe
- Handle uniqueness conflict: retry max 3 times, check `error.code === "23505" && /invite_code/i.test(error.message)`

**Clipboard API** (no extra library):
```typescript
await navigator.clipboard.writeText(url);
```
May fail in non-HTTPS or old browsers. Wrap in try/catch; show error "Could not copy link. Please copy manually: {url}" if it throws.

**Dialog for confirmation** (shadcn Dialog already available):
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
```

### Supabase Query Patterns

**Profiles join for members list** — profiles table has `display_name` and `avatar_url`. Join via `user_id`:
```typescript
const { data } = await supabase
  .from('group_members')
  .select('user_id, role, joined_at, profiles(display_name, avatar_url)')
  .eq('group_id', groupId)
  .order('joined_at', { ascending: true });
```

**Profile search** — ilike for case-insensitive search:
```typescript
const { data } = await supabase
  .from('profiles')
  .select('id, display_name, avatar_url')
  .ilike('display_name', `%${query}%`)
  .neq('id', userId)
  .not('id', 'in', `(${existingMemberIds.join(',')})`)
  .limit(10);
```

**Admin client usage** (Task 2 pattern):
```typescript
import { createAdminClient } from "@/lib/supabase/admin";

// In route handler only:
const admin = createAdminClient();
const { error } = await admin.from('group_members').insert({ group_id, user_id, role: 'member' });
```

### URL Construction for Invite Link

On client side (browser), use `window.location.origin`:
```typescript
const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
```
Do NOT hardcode a base URL. `window.location.origin` is available in client components and returns the correct origin (http://localhost:3000 in dev, https://your-domain.com in prod).

### Database Schema Relationships

```
groups (id, name, invite_code, created_by, ...)
  ↑ FK
group_members (group_id, user_id, role, joined_at) ← PK(group_id, user_id)
  ↑ FK
group_invitations (id, group_id, invited_by, invitee_id, status, created_at)
  ↑ FK (group_id → groups, invited_by → profiles, invitee_id → profiles)

profiles (id, display_name, avatar_url, ...)
```

### RLS Reference

After Story 2.1 review, current `group_members` INSERT policy:
- Only group creator can insert themselves as admin (bootstrap)
- All other inserts → use admin client (service_role, bypasses RLS)

`group_invitations` new RLS (Task 1):
- SELECT: invitee OR group admin
- INSERT/UPDATE/DELETE: admin client only (no RLS policies needed for these operations)

### Join Flow Sequence

```
Unauthenticated user visits /join/abc123:
  page.tsx server component:
    → supabase.auth.getUser() → null
    → redirect('/register?redirect=/join/abc123')

After registration/login, middleware redirects to /join/abc123:
  page.tsx server component:
    → supabase.auth.getUser() → user
    → POST /api/groups/join { inviteCode: 'abc123' }
    → API validates invite_code, inserts member, returns groupId
    → redirect('/group/${groupId}')
```

The `/register` page already stores the `redirect` param and redirects after auth (check `src/app/(auth)/register/` for the existing pattern). If not, verify this before implementation.

### File Structure Requirements

```
src/
├── app/
│   ├── join/
│   │   └── [inviteCode]/
│   │       └── page.tsx                          # NEW: join via invite link
│   ├── (dashboard)/
│   │   ├── invitations/
│   │   │   ├── page.tsx                          # NEW: invitations inbox
│   │   │   └── _components/
│   │   │       └── invitation-list.tsx           # NEW: accept/decline UI
│   │   └── group/
│   │       └── [groupId]/
│   │           └── members/
│   │               ├── page.tsx                  # UPDATE: add invite sections + members list
│   │               └── _components/
│   │                   ├── invite-link-section.tsx   # NEW: copy + revoke
│   │                   └── invite-by-username.tsx    # NEW: search + send invite
│   └── api/
│       ├── groups/
│       │   ├── join/
│       │   │   ├── route.ts                      # NEW: POST join via invite code
│       │   │   └── route.test.ts                 # NEW
│       │   └── [groupId]/
│       │       └── invite-link/
│       │           ├── route.ts                  # NEW: DELETE revoke invite
│       │           └── route.test.ts             # NEW
│       ├── profiles/
│       │   └── search/
│       │       ├── route.ts                      # NEW: GET search profiles
│       │       └── route.test.ts                 # NEW
│       └── invitations/
│           ├── route.ts                          # NEW: POST create invitation
│           ├── route.test.ts                     # NEW
│           └── [id]/
│               ├── route.ts                      # NEW: PATCH accept/decline
│               └── route.test.ts                 # NEW
├── lib/
│   └── supabase/
│       ├── admin.ts                              # NEW: service_role client
│       └── middleware.ts                         # UPDATE: add /join to allowlist
├── components/
│   └── layout/
│       └── sidebar.tsx                           # UPDATE: add Invitations link
└── types/
    └── database.ts                               # UPDATE: add group_invitations
supabase/
└── migrations/
    └── 20260315_add_group_invitations.sql        # NEW
```

### Testing Standards

- Framework: Jest + Testing Library (already configured in project)
- API route tests: `/** @jest-environment node */` header, mock `@/lib/supabase/server` AND `@/lib/supabase/admin`
- Component tests: mock `next/navigation` (`useRouter`, `usePathname`), mock `fetch`
- Mock `navigator.clipboard` in invite-link-section test: `Object.assign(navigator, { clipboard: { writeText: jest.fn() } })`
- Debounce in invite-by-username: use `jest.useFakeTimers()` + `jest.advanceTimersByTime(300)` to test search trigger

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-2-group-management-membership.md` — Story 2.2 ACs]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Section 3.2 group_invitations schema, Section 3.3 RLS Summary]
- [Source: `_bmad-output/implementation-artifacts/2-1-create-configure-a-group.md` — Form patterns, API patterns, nanoid usage, RLS review findings]
- [Source: `src/app/api/groups/route.ts` — invite_code generation pattern, conflict retry logic]
- [Source: `src/app/(dashboard)/groups/create/_components/create-group-form.tsx` — Client form pattern]
- [Source: `src/app/(dashboard)/settings/page.tsx` — Server component + auth guard pattern]
- [Source: `src/lib/supabase/middleware.ts` — Middleware auth logic to update]
- [Source: `middleware.ts` — Root Next.js middleware, calls updateSession]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npm test -- --no-coverage` — 75/75 tests pass (post-review)
- `npm run lint` — 0 errors, 0 warnings
- `npm run build` — successful production build

### Completion Notes List

- Created `group_invitations` table migration with RLS SELECT policy (invitee or group admin)
- Created Supabase admin client (`src/lib/supabase/admin.ts`) for service_role operations that bypass RLS
- Updated middleware to allow unauthenticated access to `/join/*` routes
- Implemented `/join/[inviteCode]` page: unauthenticated → redirect to register, authenticated → join group or show error
- Implemented `POST /api/groups/join` API: validates invite code, checks membership, inserts via admin client
- Implemented `DELETE /api/groups/[groupId]/invite-link` API: admin-only invite code regeneration with nanoid conflict retry
- Implemented members page with invite link section (copy/revoke), invite by username search, and members list
- Implemented profile search API (`GET /api/profiles/search`) with ilike search excluding existing members
- Implemented invitations API (`POST /api/invitations`) for admin-only direct invites with duplicate prevention
- Implemented invitation accept/decline API (`PATCH /api/invitations/[id]`) with group_members insert on accept
- Implemented invitations inbox page with accept/decline UI and optimistic decline removal
- Added "Invitations" link to sidebar (Mail icon) and mobile nav ("Invites")
- Added TypeScript types for `group_invitations` table in `database.ts`
- All Supabase partial select results use explicit type casts (placeholder types don't generate partial select types)
- 26 tests across 6 test files covering all API routes and invite link component
- [Review Fix] Join page now delegates to POST /api/groups/join instead of direct DB mutation — no side effects in GET render
- [Review Fix] Profile search API now verifies requester is admin of the specified group
- [Review Fix] Invitation accept/decline checks UPDATE errors and returns 500 on failure
- [Review Fix] Clipboard timer uses ref cleanup to prevent memory leak
- [Review Fix] Profile search uses single `.not('id', 'in', ...)` instead of loop of `.neq()` calls

### File List

- `supabase/migrations/20260315_add_group_invitations.sql`
- `src/types/database.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/middleware.ts`
- `src/app/join/[inviteCode]/page.tsx`
- `src/app/api/groups/join/route.ts`
- `src/app/api/groups/join/route.test.ts`
- `src/app/api/groups/[groupId]/invite-link/route.ts`
- `src/app/api/groups/[groupId]/invite-link/route.test.ts`
- `src/app/(dashboard)/group/[groupId]/members/page.tsx`
- `src/app/(dashboard)/group/[groupId]/members/_components/invite-link-section.tsx`
- `src/app/(dashboard)/group/[groupId]/members/_components/invite-link-section.test.tsx`
- `src/app/(dashboard)/group/[groupId]/members/_components/invite-by-username.tsx`
- `src/app/api/profiles/search/route.ts`
- `src/app/api/profiles/search/route.test.ts`
- `src/app/api/invitations/route.ts`
- `src/app/api/invitations/route.test.ts`
- `src/app/api/invitations/[id]/route.ts`
- `src/app/api/invitations/[id]/route.test.ts`
- `src/app/(dashboard)/invitations/page.tsx`
- `src/app/(dashboard)/invitations/_components/invitation-list.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/mobile-nav.tsx`

## Change Log

- 2026-03-15: Implemented Story 2.2 end-to-end — invite link copy/revoke, join via invite code, username search + direct invite, invitations inbox with accept/decline, middleware update, admin client, migration, and full test coverage.
