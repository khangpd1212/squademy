/** @jest-environment node */

const getUserMock = jest.fn();
let membersCallCount = 0;

// First call: admin check (select role, eq group, eq user, maybeSingle)
// Second call: existing members (select user_id, eq group_id)
const adminCheckMaybeSingleMock = jest.fn();
const existingMembersResultMock = jest.fn();
const profilesNotMock = jest.fn();
const profilesLimitMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "group_members") {
        membersCallCount += 1;
        if (membersCallCount % 2 === 1) {
          // Admin check
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: adminCheckMaybeSingleMock,
                }),
              }),
            }),
          };
        }
        // Existing members
        return {
          select: () => ({
            eq: existingMembersResultMock,
          }),
        };
      }
      // profiles
      return {
        select: () => ({
          ilike: () => ({
            not: profilesNotMock,
          }),
        }),
      };
    },
  })),
}));

import { GET } from "./route";

describe("GET /api/profiles/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    membersCallCount = 0;

    adminCheckMaybeSingleMock.mockResolvedValue({ data: { role: "admin" } });
    existingMembersResultMock.mockResolvedValue({ data: [] });
    profilesNotMock.mockReturnValue({ limit: profilesLimitMock });
    profilesLimitMock.mockResolvedValue({
      data: [{ id: "u2", display_name: "Alice", avatar_url: null }],
      error: null,
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await GET(
      new Request("http://localhost/api/profiles/search?q=al&groupId=g1")
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when query is too short", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await GET(
      new Request("http://localhost/api/profiles/search?q=a&groupId=g1")
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 for non-admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    adminCheckMaybeSingleMock.mockResolvedValue({ data: { role: "member" } });
    const res = await GET(
      new Request("http://localhost/api/profiles/search?q=al&groupId=g1")
    );
    expect(res.status).toBe(403);
  });

  it("returns 200 with matching profiles for admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await GET(
      new Request("http://localhost/api/profiles/search?q=al&groupId=g1")
    );
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.profiles).toHaveLength(1);
    expect(payload.profiles[0].display_name).toBe("Alice");
  });
});
