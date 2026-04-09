import { render, screen } from "@testing-library/react";
import { LearningPathCard } from "./learning-path-card";
import type { LearningPathItem } from "@/hooks/api/use-group-learning-path";

describe("LearningPathCard", () => {
  const mockLessonItem: LearningPathItem = {
    id: "lp-1",
    sortOrder: 1,
    lesson: {
      id: "lesson-1",
      title: "Introduction to IELTS",
      author: { displayName: "John Doe" },
    },
    deck: null,
  };

  const mockDeckItem: LearningPathItem = {
    id: "lp-2",
    sortOrder: 2,
    lesson: null,
    deck: {
      id: "deck-1",
      title: "IELTS Vocabulary",
    },
  };

  it("renders lesson with title and contributor", () => {
    render(<LearningPathCard item={mockLessonItem} groupId="group-1" />);

    expect(screen.getByText("Introduction to IELTS")).toBeInTheDocument();
    expect(screen.getByText("by John Doe")).toBeInTheDocument();
  });

  it("renders Read button with correct link", () => {
    render(<LearningPathCard item={mockLessonItem} groupId="group-1" />);

    const button = screen.getByRole("link", { name: /read/i });
    expect(button).toHaveAttribute("href", "/group/group-1/lessons/lesson-1");
  });

  it("renders deck card with title and label", () => {
    render(<LearningPathCard item={mockDeckItem} groupId="group-1" />);

    expect(screen.getByText("IELTS Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Flashcard deck")).toBeInTheDocument();
  });
});