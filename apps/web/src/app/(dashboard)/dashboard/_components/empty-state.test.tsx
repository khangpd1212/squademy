import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/hooks/api/use-group-queries", () => ({
  useJoinGroup: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));

describe("EmptyState", () => {
  it("renders empty state message", () => {
    render(<EmptyState />);

    expect(
      screen.getByText(/not part of any group yet/i),
    ).toBeInTheDocument();
  });

  it("has a Create a Group button linking to /groups/create", () => {
    render(<EmptyState />);

    const btn = screen.getByRole("button", { name: /create a group/i });
    expect(btn).toHaveAttribute("href", "/groups/create");
  });

  it("has an invite code input field", () => {
    render(<EmptyState />);

    expect(
      screen.getByLabelText(/join with invite link/i),
    ).toBeInTheDocument();
  });

  it("has a Join button", () => {
    render(<EmptyState />);

    expect(
      screen.getByRole("button", { name: /join/i }),
    ).toBeInTheDocument();
  });
});
