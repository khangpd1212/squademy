/** @jest-environment node */

import { POST } from "./route";

const getUserMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

describe("POST /api/files/upload", () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it("returns 401 when the requester is unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const formData = new FormData();
    formData.set("file", new File(["content"], "avatar.png", { type: "image/png" }));
    const request = new Request("http://localhost/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.message).toBe("Unauthorized.");
  });

  it("returns 400 when avatar is larger than 2MB", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const oversized = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "avatar.png", {
      type: "image/png",
    });
    const formData = new FormData();
    formData.set("file", oversized);
    const request = new Request("http://localhost/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toBe("Avatar must be 2MB or smaller.");
  });

  it("returns data URL when avatar is valid", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("file", avatar);
    const request = new Request("http://localhost/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.url).toMatch(/^data:image\/png;base64,/);
  });
});
