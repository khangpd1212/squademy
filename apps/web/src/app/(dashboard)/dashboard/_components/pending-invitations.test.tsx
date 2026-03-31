import { render, screen } from "@testing-library/react";
import { PendingInvitations } from "./pending-invitations";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/hooks/api/use-invitation-queries", () => ({
  useInvitations: jest.fn(),
  useRespondInvitation: jest.fn(),
}));

const { useInvitations, useRespondInvitation } = jest.requireMock(
  "@/hooks/api/use-invitation-queries",
) as { useInvitations: jest.Mock; useRespondInvitation: jest.Mock };

describe("PendingInvitations", () => {
  beforeEach(() => {
    useInvitations.mockReset();
    useRespondInvitation.mockReset();
    useRespondInvitation.mockReturnValue({ mutateAsync: jest.fn() });
  });

  it("returns null when there are no invitations", () => {
    useInvitations.mockReturnValue({ data: [] });

    const { container } = render(<PendingInvitations />);

    expect(container.innerHTML).toBe("");
  });

  it("renders invitation details with Accept and Decline buttons", () => {
    useInvitations.mockReturnValue({
      data: [
        {
          id: "inv-1",
          groupId: "g-1",
          groupName: "Study Group",
          invitedByName: "Alice",
          createdAt: "2026-03-30T00:00:00.000Z",
        },
      ],
    });

    render(<PendingInvitations />);

    expect(screen.getByText("Study Group")).toBeInTheDocument();
    expect(screen.getByText("Invited by Alice")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("renders multiple invitations", () => {
    useInvitations.mockReturnValue({
      data: [
        {
          id: "inv-1",
          groupId: "g-1",
          groupName: "Group A",
          invitedByName: "Alice",
          createdAt: "2026-03-30T00:00:00.000Z",
        },
        {
          id: "inv-2",
          groupId: "g-2",
          groupName: "Group B",
          invitedByName: "Bob",
          createdAt: "2026-03-29T00:00:00.000Z",
        },
      ],
    });

    render(<PendingInvitations />);

    expect(screen.getByText("Group A")).toBeInTheDocument();
    expect(screen.getByText("Group B")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /accept/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /decline/i })).toHaveLength(2);
  });
});
