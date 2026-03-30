import { render, screen } from "@testing-library/react";
import { DashboardView } from "./dashboard-view";

jest.mock("@/hooks/api/use-group-queries", () => ({
  useMyGroups: jest.fn(),
}));

jest.mock("@/hooks/api/use-invitation-queries", () => ({
  useInvitations: jest.fn(),
}));

jest.mock("./pending-invitations", () => ({
  PendingInvitations: () => <div>Pending Invitations Section</div>,
}));

jest.mock("./empty-state", () => ({
  EmptyState: () => <div>Empty State</div>,
}));

jest.mock("./group-card", () => ({
  GroupCard: ({ group }: { group: { name: string } }) => <div>{group.name}</div>,
}));

const { useMyGroups } = jest.requireMock("@/hooks/api/use-group-queries") as {
  useMyGroups: jest.Mock;
};

const { useInvitations } = jest.requireMock("@/hooks/api/use-invitation-queries") as {
  useInvitations: jest.Mock;
};

describe("DashboardView", () => {
  beforeEach(() => {
    useMyGroups.mockReset();
    useInvitations.mockReset();
  });

  it("renders loading skeleton while fetching", () => {
    useMyGroups.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    useInvitations.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { container } = render(<DashboardView />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders group cards when groups are loaded", () => {
    useMyGroups.mockReturnValue({
      data: [
        {
          id: "group-1",
          name: "IELTS Warriors",
          description: null,
          role: "member",
          memberCount: 3,
          createdAt: "2026-03-30T00:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    useInvitations.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<DashboardView />);

    expect(screen.getByText("IELTS Warriors")).toBeInTheDocument();
  });

  it("renders empty state when no groups and no invitations", () => {
    useMyGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    useInvitations.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<DashboardView />);

    expect(screen.getByText("Empty State")).toBeInTheDocument();
  });

  it("renders invitations error message when invitations query fails", () => {
    useMyGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    useInvitations.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Network error"),
    });

    render(<DashboardView />);

    expect(screen.getByText("Could not load invitations.")).toBeInTheDocument();
  });

  it("renders pending invitations section when invitations exist", () => {
    useMyGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    useInvitations.mockReturnValue({
      data: [
        {
          id: "inv-1",
          groupId: "group-1",
          groupName: "IELTS Warriors",
          invitedByName: "Admin",
          createdAt: "2026-03-30T00:00:00.000Z",
        },
      ],
      isLoading: false,
    });

    render(<DashboardView />);

    expect(screen.getByText("Pending Invitations Section")).toBeInTheDocument();
  });
});
