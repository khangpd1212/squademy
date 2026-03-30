import { render, screen } from "@testing-library/react";
import { GroupCard } from "./group-card";

describe("GroupCard", () => {
  it("renders group information and links to group page", () => {
    render(
      <GroupCard
        group={{
          id: "group-1",
          name: "IELTS Warriors",
          description: "Practice speaking every day.",
          role: "admin",
          memberCount: 5,
          createdAt: "2026-03-29T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("IELTS Warriors")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("5 members")).toBeInTheDocument();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/group/group-1");
  });
});
