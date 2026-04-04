import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { LessonListItem } from "./lesson-list-item";
import type { MyLessonItem } from "@/hooks/api/use-lesson-queries";
import { LESSON_STATUS } from "@squademy/shared";

const mockLessonBase: MyLessonItem = {
  id: "lesson-1",
  title: "My Test Lesson",
  status: LESSON_STATUS.DRAFT,
  groupId: "group-1",
  updatedAt: "2026-04-01T00:00:00.000Z",
  group: { name: "IELTS Warriors" },
};

describe("LessonListItem", () => {
  it("shows delete button for draft lessons on hover", () => {
    const { container } = renderWithQueryClient(
      <LessonListItem lesson={mockLessonBase} onDelete={jest.fn()} />,
    );

    const link = container.querySelector("a");
    if (link) {
      userEvent.hover(link);
    }

    const deleteButton = screen.queryByRole("button");
    expect(deleteButton).toBeInTheDocument();
  });

  it("shows delete button for rejected lessons", () => {
    const { container } = renderWithQueryClient(
      <LessonListItem
        lesson={{ ...mockLessonBase, status: LESSON_STATUS.REJECTED }}
        onDelete={jest.fn()}
      />,
    );

    const link = container.querySelector("a");
    if (link) {
      userEvent.hover(link);
    }

    const deleteButton = screen.queryByRole("button");
    expect(deleteButton).toBeInTheDocument();
  });

  it("hides delete button for in_review lessons", () => {
    const { container } = renderWithQueryClient(
      <LessonListItem
        lesson={{ ...mockLessonBase, status: LESSON_STATUS.REVIEW }}
        onDelete={jest.fn()}
      />,
    );

    const link = container.querySelector("a");
    if (link) {
      userEvent.hover(link);
    }

    const deleteButton = screen.queryByRole("button");
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("hides delete button for published lessons", () => {
    const { container } = renderWithQueryClient(
      <LessonListItem
        lesson={{ ...mockLessonBase, status: LESSON_STATUS.PUBLISHED }}
        onDelete={jest.fn()}
      />,
    );

    const link = container.querySelector("a");
    if (link) {
      userEvent.hover(link);
    }

    const deleteButton = screen.queryByRole("button");
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = jest.fn();
    const { container } = renderWithQueryClient(
      <LessonListItem lesson={mockLessonBase} onDelete={onDelete} />,
    );

    const link = container.querySelector("a");
    if (link) {
      userEvent.hover(link);
    }

    const deleteButton = screen.getByRole("button");
    await userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith("lesson-1");
  });
});
