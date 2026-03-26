import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";

const pushMock = jest.fn();
const searchParamsMock = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => searchParamsMock,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    searchParamsMock.delete("redirect");
    global.fetch = jest.fn();
  });

  it("shows inline auth error and clears password but keeps email", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Invalid email or password.",
      }),
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
    searchParamsMock.set("redirect", "/group/abc/exercises");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          accessToken: "token-a",
          refreshToken: "token-r",
        },
      }),
    });

    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4001/api/auth/login",
        expect.objectContaining({ credentials: "include", method: "POST" })
      );
      expect(pushMock).toHaveBeenCalledWith("/group/abc/exercises");
    });
  });

  it("blocks open redirect and falls back to /dashboard", async () => {
    const user = userEvent.setup();
    searchParamsMock.set("redirect", "//evil.com");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          accessToken: "token-a",
          refreshToken: "token-r",
        },
      }),
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
