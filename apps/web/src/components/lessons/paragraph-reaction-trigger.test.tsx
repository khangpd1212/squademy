import { render } from "@testing-library/react";
import { ParagraphReactionTrigger } from "./paragraph-reaction-trigger";
import type { LessonReaction } from "@/hooks/api/use-lesson-queries";
import type { ReactionType } from "@squademy/shared";

describe("ParagraphReactionTrigger", () => {
  const mockReactions: LessonReaction[] = [
    { lineRef: "p1", type: "thumbs_up" as ReactionType, count: 2, userReacted: false },
    { lineRef: "p1", type: "heart" as ReactionType, count: 1, userReacted: true },
  ];

  const mockToggle = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing when reactions exist", () => {
    const { container } = render(
      <ParagraphReactionTrigger
        lineRef="p1"
        lessonId="lesson-1"
        reactions={mockReactions}
        toggleReaction={mockToggle}
        isToggling={false}
      />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with isToggling prop without crashing", () => {
    const { container } = render(
      <ParagraphReactionTrigger
        lineRef="p1"
        lessonId="lesson-1"
        reactions={[]}
        toggleReaction={mockToggle}
        isToggling={true}
      />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with empty reactions without crashing", () => {
    const { container } = render(
      <ParagraphReactionTrigger
        lineRef="p1"
        lessonId="lesson-1"
        reactions={[]}
        toggleReaction={mockToggle}
        isToggling={false}
      />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});