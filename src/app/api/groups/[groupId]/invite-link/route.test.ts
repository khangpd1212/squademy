/** @jest-environment node */

jest.mock("nanoid", () => ({
  customAlphabet: () => () => "newcode12345a",
}));

const getUserMock = jest.fn();
const membersSelectMock = jest.fn();
const membersEqGroupMock = jest.fn();
const membersEqUserMock = jest.fn();
const membersMaybeSingleMock = jest.fn();
const groupsUpdateMock = jest.fn();
const groupsUpdateEqMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "group_members") {
        return { select: membersSelectMock };
      }
      return { update: groupsUpdateMock };
    },
  })),
}));

import { DELETE } from "./route";

describe("DELETE /api/groups/[groupId]/invite-link", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    membersSelectMock.mockReturnValue({ eq: membersEqGroupMock });
    membersEqGroupMock.mockReturnValue({ eq: membersEqUserMock });
    membersEqUserMock.mockReturnValue({ maybeSingle: membersMaybeSingleMock });
    membersMaybeSingleMock.mockResolvedValue({ data: { role: "admin" } });

    groupsUpdateMock.mockReturnValue({ eq: groupsUpdateEqMock });
    groupsUpdateEqMock.mockResolvedValue({ error: null });
  });

  const makeRequest = () =>
    DELETE(new Request("http://localhost/api/groups/g1/invite-link", { method: "DELETE" }), {
      params: Promise.resolve({ groupId: "g1" }),
    });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await makeRequest();
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    membersMaybeSingleMock.mockResolvedValue({ data: { role: "member" } });
    const res = await makeRequest();
    expect(res.status).toBe(403);
  });

  it("returns 200 with new invite code for admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const res = await makeRequest();
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.inviteCode).toBe("newcode12345a");
  });
});
