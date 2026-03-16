/** @jest-environment node */

import { PATCH } from "./route";

const getUserMock = jest.fn();
const updateMock = jest.fn();
const eqMock = jest.fn();
const selectMock = jest.fn();
const singleMock = jest.fn();
const fromMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  })),
}));

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    selectMock.mockReset();
    singleMock.mockReset();
    fromMock.mockReset();

    fromMock.mockReturnValue({ update: updateMock });
    updateMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ single: singleMock });
    singleMock.mockResolvedValue({ data: null, error: null });
  });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Tina" }),
      })
    );

    expect(response.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns 400 when displayName is empty", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "   " }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.field).toBe("displayName");
    expect(fromMock).not.toHaveBeenCalled();
  });
});
