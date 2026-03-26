import {
  apiRequest,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "./browser-client";

const originalFetch = global.fetch;

describe("browser-client auth flow", () => {
  beforeEach(() => {
    clearAuthTokens();
    localStorage.clear();
    global.fetch = jest.fn();
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4001/api";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("stores and reads auth tokens", () => {
    setAuthTokens("access-1", "refresh-1");

    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBe("refresh-1");
    expect(localStorage.getItem("squademy.auth.tokens")).toBeTruthy();
  });

  it("retries once after 401 by refreshing token", async () => {
    const fetchMock = global.fetch as jest.Mock;
    setAuthTokens("expired-access", "refresh-token");

    fetchMock
      .mockResolvedValueOnce(
        {
          status: 401,
          ok: false,
          json: async () => ({ ok: false, error: "Unauthorized" }),
        } as Response,
      )
      .mockResolvedValueOnce(
        {
          status: 200,
          ok: true,
          json: async () => ({
            ok: true,
            data: { accessToken: "new-access", refreshToken: "new-refresh" },
          }),
        } as Response,
      )
      .mockResolvedValueOnce(
        {
          status: 200,
          ok: true,
          json: async () => ({ ok: true, data: { id: "g-1" } }),
        } as Response,
      );

    const result = await apiRequest<{ id: string }>("/groups/g-1");

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("g-1");
    expect(getAccessToken()).toBe("new-access");
    expect(getRefreshToken()).toBe("new-refresh");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
