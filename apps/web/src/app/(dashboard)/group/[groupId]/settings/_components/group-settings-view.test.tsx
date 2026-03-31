import { render, screen } from "@testing-library/react";
import { GroupSettingsView } from "./group-settings-view";

jest.mock("@/hooks/api/use-group-queries", () => ({
  useGroup: jest.fn(),
}));

jest.mock("@/hooks/api/use-auth-queries", () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock("./group-settings-form", () => ({
  GroupSettingsForm: ({ isAdmin }: { isAdmin: boolean }) => (
    <div>Group Settings Form ({isAdmin ? "admin" : "member"})</div>
  ),
}));

jest.mock("./delete-group-section", () => ({
  DeleteGroupSection: ({ groupName }: { groupName: string }) => (
    <div>Delete Group Section for {groupName}</div>
  ),
}));

const { useGroup } = jest.requireMock("@/hooks/api/use-group-queries") as {
  useGroup: jest.Mock;
};

const { useCurrentUser } = jest.requireMock("@/hooks/api/use-auth-queries") as {
  useCurrentUser: jest.Mock;
};

const baseGroup = {
  id: "group-1",
  name: "IELTS Warriors",
  description: "Practice together",
  exerciseDeadlineDay: null,
  exerciseDeadlineTime: null,
  members: [
    {
      userId: "user-1",
      role: "admin",
      joinedAt: "2026-03-30T00:00:00.000Z",
      user: {
        displayName: "Admin",
        avatarUrl: null,
      },
    },
  ],
};

describe("GroupSettingsView", () => {
  beforeEach(() => {
    useGroup.mockReset();
    useCurrentUser.mockReset();
  });

  it("renders delete section for admins", () => {
    useGroup.mockReturnValue({
      data: baseGroup,
      isLoading: false,
    });
    useCurrentUser.mockReturnValue({
      data: { userId: "user-1", email: "admin@example.com" },
      isLoading: false,
    });

    render(<GroupSettingsView groupId="group-1" />);

    expect(screen.getByText("Group Settings Form (admin)")).toBeInTheDocument();
    expect(
      screen.getByText("Delete Group Section for IELTS Warriors"),
    ).toBeInTheDocument();
  });

  it("does not render delete section for non-admin members", () => {
    useGroup.mockReturnValue({
      data: {
        ...baseGroup,
        members: [
          {
            ...baseGroup.members[0],
            role: "member",
          },
        ],
      },
      isLoading: false,
    });
    useCurrentUser.mockReturnValue({
      data: { userId: "user-1", email: "member@example.com" },
      isLoading: false,
    });

    render(<GroupSettingsView groupId="group-1" />);

    expect(screen.getByText("Group Settings Form (member)")).toBeInTheDocument();
    expect(
      screen.queryByText("Delete Group Section for IELTS Warriors"),
    ).not.toBeInTheDocument();
  });
});
