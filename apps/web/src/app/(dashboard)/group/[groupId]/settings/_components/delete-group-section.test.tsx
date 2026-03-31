import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteGroupSection } from "./delete-group-section";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => pushMock(...args),
    refresh: jest.fn(),
  }),
}));

describe("DeleteGroupSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders danger zone section with delete button", () => {
    renderWithQueryClient(
      <DeleteGroupSection groupId="group-1" groupName="IELTS Warriors" />,
    );

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Group" }),
    ).toBeInTheDocument();
  });

  it("opens confirmation dialog on button click", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <DeleteGroupSection groupId="group-1" groupName="IELTS Warriors" />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Group" }));

    expect(
      await screen.findByText("Delete IELTS Warriors?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure? All group content will be removed for members. This cannot be undone.",
      ),
    ).toBeInTheDocument();
  });

  it("disables delete button until group name typed correctly", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <DeleteGroupSection groupId="group-1" groupName="IELTS Warriors" />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Group" }));
    await screen.findByText("Delete IELTS Warriors?");

    const deleteBtn = screen.getByRole("button", { name: "Delete" });
    expect(deleteBtn).toBeDisabled();

    await user.type(
      screen.getByLabelText("Type the group name to confirm"),
      "wrong name",
    );
    expect(deleteBtn).toBeDisabled();
  });

  it("enables delete button when name matches", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <DeleteGroupSection groupId="group-1" groupName="IELTS Warriors" />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Group" }));
    await screen.findByText("Delete IELTS Warriors?");

    await user.type(
      screen.getByLabelText("Type the group name to confirm"),
      "IELTS Warriors",
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("calls delete API and redirects on success", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderWithQueryClient(
      <DeleteGroupSection groupId="group-1" groupName="IELTS Warriors" />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Group" }));
    await screen.findByText("Delete IELTS Warriors?");

    await user.type(
      screen.getByLabelText("Type the group name to confirm"),
      "IELTS Warriors",
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard?groupDeleted=1");
    });
  });

  it("shows error on delete failure", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Server error" }),
    });

    renderWithQueryClient(
      <DeleteGroupSection groupId="group-1" groupName="IELTS Warriors" />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Group" }));
    await screen.findByText("Delete IELTS Warriors?");

    await user.type(
      screen.getByLabelText("Type the group name to confirm"),
      "IELTS Warriors",
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Server error")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("resets dialog state when closed", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <DeleteGroupSection groupId="group-1" groupName="IELTS Warriors" />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Group" }));
    await screen.findByText("Delete IELTS Warriors?");

    await user.type(
      screen.getByLabelText("Type the group name to confirm"),
      "some text",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Delete IELTS Warriors?"),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete Group" }));
    await screen.findByText("Delete IELTS Warriors?");

    const input = screen.getByLabelText("Type the group name to confirm");
    expect(input).toHaveValue("");
  });
});
