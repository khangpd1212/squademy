import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    global.fetch = jest.fn();
  });

  it("shows inline validation when password is too short", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Display name"), "Tina");
    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "1234567");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Password must be at least 8 characters.")
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

    render(<RegisterForm />);

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

  it("redirects to check-email page on success", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        redirectTo: "/register/check-email?email=tina%40example.com",
      }),
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Display name"), "Tina");
    await user.type(screen.getByLabelText("Email"), "tina@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        "/register/check-email?email=tina%40example.com"
      )
    );
  });
});
