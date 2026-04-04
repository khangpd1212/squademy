import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { DeleteLessonDialog } from "./delete-lesson-dialog";

const mockOnOpenChange = jest.fn();

jest.mock("@/hooks/api/use-lesson-queries", () => ({
  useDeleteLesson: jest.fn(),
}));

const { useDeleteLesson } = jest.requireMock("@/hooks/api/use-lesson-queries") as {
  useDeleteLesson: jest.Mock;
};

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("DeleteLessonDialog", () => {
  beforeEach(() => {
    mockOnOpenChange.mockClear();
    useDeleteLesson.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    });
  });

  it("renders dialog with lesson title", () => {
    renderWithQueryClient(
      <DeleteLessonDialog
        lessonId="lesson-1"
        lessonTitle="My Test Lesson"
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    expect(screen.getByText("Delete this lesson?")).toBeInTheDocument();
    expect(screen.getByText(/My Test Lesson/)).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("calls delete API on confirm", async () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    useDeleteLesson.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    renderWithQueryClient(
      <DeleteLessonDialog
        lessonId="lesson-1"
        lessonTitle="My Test Lesson"
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith("lesson-1");
    });
  });

  it("shows success toast after deletion", async () => {
    const { toast } = await import("sonner");
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    useDeleteLesson.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    renderWithQueryClient(
      <DeleteLessonDialog
        lessonId="lesson-1"
        lessonTitle="My Test Lesson"
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Lesson deleted.");
    });
  });

  it("shows error message when delete fails", async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error("Delete failed"));
    useDeleteLesson.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    renderWithQueryClient(
      <DeleteLessonDialog
        lessonId="lesson-1"
        lessonTitle="My Test Lesson"
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });

    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  it("closes on cancel", async () => {
    renderWithQueryClient(
      <DeleteLessonDialog
        lessonId="lesson-1"
        lessonTitle="My Test Lesson"
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows loading state during deletion", () => {
    useDeleteLesson.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    renderWithQueryClient(
      <DeleteLessonDialog
        lessonId="lesson-1"
        lessonTitle="My Test Lesson"
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    expect(screen.getByRole("button", { name: /Deleting/i })).toBeDisabled();
  });
});
