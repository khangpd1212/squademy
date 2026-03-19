/** @jest-environment node */

const getUserMock = jest.fn();
const serverFromMock = jest.fn();
const membershipSelectMock = jest.fn();
const membershipEqGroupMock = jest.fn();
const membershipEqUserMock = jest.fn();
const membershipMaybeSingleMock = jest.fn();

const adminFromMock = jest.fn();
const targetSelectMock = jest.fn();
const targetEqGroupMock = jest.fn();
const targetEqUserMock = jest.fn();
const targetMaybeSingleMock = jest.fn();
const countSelectMock = jest.fn();
const countEqGroupMock = jest.fn();
const countEqRoleMock = jest.fn();
const deleteMock = jest.fn();
const deleteEqGroupMock = jest.fn();
const deleteEqUserMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: getUserMock },
    from: serverFromMock,
  })),
}));

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: adminFromMock,
  }),
}));

import { DELETE } from "./route";

describe("DELETE /api/groups/[groupId]/members/[memberId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    serverFromMock.mockReturnValue({
      select: membershipSelectMock,
    });
    membershipSelectMock.mockReturnValue({ eq: membershipEqGroupMock });
    membershipEqGroupMock.mockReturnValue({ eq: membershipEqUserMock });
    membershipEqUserMock.mockReturnValue({ maybeSingle: membershipMaybeSingleMock });
    membershipMaybeSingleMock.mockResolvedValue({ data: { role: "admin" } });

    adminFromMock.mockImplementation((table: string) => {
      if (table === "group_members") {
        return {
          select: (columns: string, options?: { count?: "exact"; head?: boolean }) => {
            if (options?.head) {
              return countSelectMock(columns, options);
            }
            return targetSelectMock(columns);
          },
          delete: deleteMock,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    targetSelectMock.mockReturnValue({ eq: targetEqGroupMock });
    targetEqGroupMock.mockReturnValue({ eq: targetEqUserMock });
    targetEqUserMock.mockReturnValue({ maybeSingle: targetMaybeSingleMock });
    targetMaybeSingleMock.mockResolvedValue({ data: { user_id: "member-2", role: "member" } });

    countSelectMock.mockReturnValue({ eq: countEqGroupMock });
    countEqGroupMock.mockReturnValue({ eq: countEqRoleMock });
    countEqRoleMock.mockResolvedValue({ count: 1, error: null });

    deleteMock.mockReturnValue({ eq: deleteEqGroupMock });
    deleteEqGroupMock.mockReturnValue({ eq: deleteEqUserMock });
    deleteEqUserMock.mockResolvedValue({ error: null });
  });

  const makeRequest = () =>
    DELETE(new Request("http://localhost/api/groups/group-1/members/member-2", { method: "DELETE" }), {
      params: Promise.resolve({ groupId: "group-1", memberId: "member-2" }),
    });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await makeRequest();
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin caller", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "member-1" } } });
    membershipMaybeSingleMock.mockResolvedValue({ data: { role: "member" } });
    const res = await makeRequest();
    expect(res.status).toBe(403);
  });

  it("returns 404 if target member does not exist", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "member-1" } } });
    targetMaybeSingleMock.mockResolvedValue({ data: null });
    const res = await makeRequest();
    expect(res.status).toBe(404);
  });

  it("returns 409 for sole-admin self removal", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "member-1" } } });
    targetMaybeSingleMock.mockResolvedValue({ data: { user_id: "member-1", role: "admin" } });
    const res = await DELETE(
      new Request("http://localhost/api/groups/group-1/members/member-1", { method: "DELETE" }),
      { params: Promise.resolve({ groupId: "group-1", memberId: "member-1" }) }
    );
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload.message).toBe(
      "You cannot remove yourself while you are the only admin. Transfer admin role first."
    );
  });

  it("returns 200 for valid member removal", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "member-1" } } });
    const res = await makeRequest();
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
  });
});
