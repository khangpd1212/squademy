import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateGroupForm } from "./create-group-form";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("CreateGroupForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    global.fetch = jest.fn();
  });

  it("shows inline validation when group name is empty", async () => {
    const user = userEvent.setup();
    render(<CreateGroupForm />);

    await user.click(screen.getByRole("button", { name: "Create Group" }));

    expect(await screen.findByText("Group name is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls API and redirects on success", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        group: { id: "group-1", name: "IELTS Warriors", inviteCode: "abc123def456" },
      }),
    });

    render(<CreateGroupForm />);

    await user.type(screen.getByLabelText("Group name"), "IELTS Warriors");
    await user.type(
      screen.getByLabelText("Description (optional)"),
      "Prepare together for IELTS."
    );
    await user.click(screen.getByRole("button", { name: "Create Group" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/group/group-1"));
  });
});
