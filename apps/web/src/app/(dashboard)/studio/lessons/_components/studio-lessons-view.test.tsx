import { screen } from "@testing-library/react";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { StudioLessonsView } from "./studio-lessons-view";
import { LESSON_STATUS } from "@squademy/shared";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/api/use-lesson-queries", () => ({
  useMyLessons: jest.fn(),
  useCreateLesson: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    reset: jest.fn(),
  })),
  useDeleteLesson: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
}));

jest.mock("@/hooks/api/use-group-queries", () => ({
  useMyGroups: jest.fn(() => ({ data: [], isLoading: false })),
}));

const { useMyLessons } = jest.requireMock("@/hooks/api/use-lesson-queries") as {
  useMyLessons: jest.Mock;
};

const mockLesson = {
  id: "lesson-1",
  title: "Introduction to IELTS",
  status: LESSON_STATUS.DRAFT,
  groupId: "group-1",
  updatedAt: new Date(Date.now() - 3600_000).toISOString(),
  group: { name: "IELTS Warriors" },
};

describe("StudioLessonsView", () => {
  it("shows skeleton loading state while fetching", () => {
    useMyLessons.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    renderWithQueryClient(<StudioLessonsView />);

    expect(screen.getByLabelText("Loading lessons")).toBeInTheDocument();
  });

  it("renders lesson list with correct status badge", () => {
    useMyLessons.mockReturnValue({
      data: [mockLesson],
      isLoading: false,
      isError: false,
    });

    renderWithQueryClient(<StudioLessonsView />);

    expect(screen.getByText("Introduction to IELTS")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("IELTS Warriors")).toBeInTheDocument();
  });

  it("renders all 5 status badges correctly", () => {
    const statuses = [
      { status: LESSON_STATUS.DRAFT, label: "Draft" },
      { status: LESSON_STATUS.REVIEW, label: "In Review" },
      { status: LESSON_STATUS.PUBLISHED, label: "Published" },
      { status: LESSON_STATUS.REJECTED, label: "Rejected" },
      { status: LESSON_STATUS.DELETED, label: "Deleted" },
    ];

    useMyLessons.mockReturnValue({
      data: statuses.map((s, i) => ({
        ...mockLesson,
        id: `lesson-${i}`,
        title: `Lesson ${s.status}`,
        status: s.status,
      })),
      isLoading: false,
      isError: false,
    });

    renderWithQueryClient(<StudioLessonsView />);

    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("In Review")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Deleted")).toBeInTheDocument();
  });

  it("shows empty state when no lessons", () => {
    useMyLessons.mockReturnValue({ data: [], isLoading: false, isError: false });

    renderWithQueryClient(<StudioLessonsView />);

    expect(
      screen.getByText(/You haven't created any lessons yet/),
    ).toBeInTheDocument();
  });

  it("shows My Lessons heading and New Lesson button", () => {
    useMyLessons.mockReturnValue({ data: [], isLoading: false, isError: false });

    renderWithQueryClient(<StudioLessonsView />);

    expect(screen.getByText("My Lessons")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "New Lesson" }).length).toBeGreaterThanOrEqual(1);
  });

  it("shows error message on fetch failure", () => {
    useMyLessons.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderWithQueryClient(<StudioLessonsView />);

    expect(screen.getByText(/Failed to load lessons/)).toBeInTheDocument();
  });
});
