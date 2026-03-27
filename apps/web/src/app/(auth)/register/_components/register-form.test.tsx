import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
      AUTH_EMAIL_CONFLICT: "An account with this email already exists.",
      fallback: "Something went wrong. Please try again.",
      network: "Network error. Please try again.",
    };
    return messages[key] ?? key;
  },
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    global.fetch = jest.fn();
  });

  it("shows inline validation when password is too short", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<RegisterForm />);

    await user.type(screen.getByLabelText("Display name"), "Tina");
    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps duplicate email response to inline email error without clearing fields", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        field: "email",
        message: "An account with this email already exists.",
      }),
    });

    renderWithQueryClient(<RegisterForm />);

    await user.type(screen.getByLabelText("Display name"), "Tina");
    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("An account with this email already exists.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Tina");
    expect(screen.getByLabelText("Email")).toHaveValue("tina@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("12345678");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects to dashboard on success", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          accessToken: "token-a",
          refreshToken: "token-r",
        },
      }),
    });

    renderWithQueryClient(<RegisterForm />);

    await user.type(screen.getByLabelText("Display name"), "Tina");
    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/dashboard")
    );
  });
});
