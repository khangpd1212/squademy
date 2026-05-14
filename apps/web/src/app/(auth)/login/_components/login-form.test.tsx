import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";

const pushMock = jest.fn();
const searchParamsMock = new URLSearchParams();
const setAuthTokensMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => searchParamsMock,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
      fallback: "Something went wrong. Please try again.",
      network: "Network error. Please try again.",
    };
    return messages[key] ?? key;
  },
}));

jest.mock("@/lib/api/browser-client", () => ({
  apiRequest: jest.fn(),
  setAuthTokens: (...args: unknown[]) => setAuthTokensMock(...args),
  clearAuthTokens: jest.fn(),
}));

const { apiRequest: apiRequestMock } = jest.requireMock("@/lib/api/browser-client") as {
  apiRequest: jest.Mock;
};

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    setAuthTokensMock.mockReset();
    apiRequestMock.mockReset();
    searchParamsMock.delete("redirect");
  });

  it("shows inline auth error and clears password but keeps email", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({
      data: null,
      message: "Invalid email or password.",
      code: "AUTH_INVALID_CREDENTIALS",
      status: 401,
    });

    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Invalid email or password.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("tina@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("preserves redirect query when login succeeds", async () => {
    const user = userEvent.setup();
    searchParamsMock.set("redirect", "/groups/abc/exercises");
    apiRequestMock.mockResolvedValue({
      data: {
        accessToken: "token-a",
        refreshToken: "token-r",
      },
      message: null,
      status: 200,
    });

    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/auth/login",
        expect.objectContaining({ method: "POST" })
      );
      expect(setAuthTokensMock).toHaveBeenCalledWith("token-a", "token-r");
      expect(pushMock).toHaveBeenCalledWith("/groups/abc/exercises");
    });
  });

  it("blocks open redirect and falls back to /dashboard", async () => {
    const user = userEvent.setup();
    searchParamsMock.set("redirect", "//evil.com");
    apiRequestMock.mockResolvedValue({
      data: {
        accessToken: "token-a",
        refreshToken: "token-r",
      },
      message: null,
      status: 200,
    });

    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });
});
