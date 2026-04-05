import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberManagementList } from "./member-management-list";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { GROUP_ROLES } from "@squademy/shared";

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const members = [
  {
    user_id: "user-1",
    role: GROUP_ROLES.ADMIN,
    joined_at: "2026-03-10T00:00:00.000Z",
    profiles: { display_name: "Admin User", avatar_url: null },
  },
  {
    user_id: "user-2",
    role: GROUP_ROLES.MEMBER,
    joined_at: "2026-03-11T00:00:00.000Z",
    profiles: { display_name: "Member User", avatar_url: null },
  },
];

describe("MemberManagementList", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("renders members with role badge and joined date", () => {
    renderWithQueryClient(
      <MemberManagementList
        members={members}
        currentUserId="user-1"
        isAdmin
        groupId="group-1"
      />,
    );

    expect(screen.getByText("Admin User (You)")).toBeInTheDocument();
    expect(screen.getByText("Member User")).toBeInTheDocument();
    expect(screen.getAllByText(/Joined/)).toHaveLength(2);
    expect(screen.getAllByText(GROUP_ROLES.ADMIN).length).toBeGreaterThan(0);
    expect(screen.getAllByText(GROUP_ROLES.EDITOR).length).toBeGreaterThan(0);
  });

  it("shows role and remove controls for admin", () => {
    renderWithQueryClient(
      <MemberManagementList
        members={members}
        currentUserId="user-1"
        isAdmin
        groupId="group-1"
      />,
    );

    expect(screen.getByLabelText("Role for Member User")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Member User" }),
    ).toBeInTheDocument();
  });

  it("hides management controls for non-admin", () => {
    renderWithQueryClient(
      <MemberManagementList
        members={members}
        currentUserId="user-2"
        isAdmin={false}
        groupId="group-1"
      />,
    );

    expect(
      screen.queryByLabelText("Role for Member User"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Member User" }),
    ).not.toBeInTheDocument();
  });

  it("optimistically updates role on success", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderWithQueryClient(
      <MemberManagementList
        members={members}
        currentUserId="user-1"
        isAdmin
        groupId="group-1"
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Role for Member User"),
      GROUP_ROLES.EDITOR,
    );
    await user.click(screen.getByRole("button", { name: "Confirm change" }));

    expect(screen.getByLabelText("Role for Member User")).toHaveValue(GROUP_ROLES.EDITOR);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it("optimistically removes member on success", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderWithQueryClient(
      <MemberManagementList
        members={members}
        currentUserId="user-1"
        isAdmin
        groupId="group-1"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Remove Member User" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm Remove" }));

    await waitFor(() =>
      expect(screen.queryByText("Member User")).not.toBeInTheDocument(),
    );
  });

  it("rolls back optimistic updates and shows API error", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Cannot demote the sole admin. Promote another admin first.",
      }),
    });

    renderWithQueryClient(
      <MemberManagementList
        members={members}
        currentUserId="user-1"
        isAdmin
        groupId="group-1"
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Role for Admin User"),
      GROUP_ROLES.EDITOR,
    );
    await user.click(screen.getByRole("button", { name: "Confirm change" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Cannot demote the sole admin. Promote another admin first.",
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Role for Admin User")).toHaveValue(GROUP_ROLES.ADMIN);
  });

  it("shows error and rolls back when sole-admin self-removal fails", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Cannot remove the sole admin. Transfer admin role first.",
      }),
    });

    renderWithQueryClient(
      <MemberManagementList
        members={members}
        currentUserId="user-1"
        isAdmin
        groupId="group-1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove Admin User" }));
    await user.click(screen.getByRole("button", { name: "Confirm Remove" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Cannot remove the sole admin. Transfer admin role first.",
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Admin User (You)")).toBeInTheDocument();
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });
});
