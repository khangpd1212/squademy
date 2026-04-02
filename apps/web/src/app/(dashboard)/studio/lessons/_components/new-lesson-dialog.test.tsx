import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { NewLessonDialog } from "./new-lesson-dialog";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/api/use-group-queries", () => ({
  useMyGroups: jest.fn(),
}));

jest.mock("@/hooks/api/use-lesson-queries", () => ({
  useCreateLesson: jest.fn(),
}));

const { useMyGroups } = jest.requireMock("@/hooks/api/use-group-queries") as {
  useMyGroups: jest.Mock;
};
const { useCreateLesson } = jest.requireMock("@/hooks/api/use-lesson-queries") as {
  useCreateLesson: jest.Mock;
};

const mockGroup1 = { id: "group-1", name: "IELTS Warriors", role: "member", memberCount: 3, createdAt: "" };
const mockGroup2 = { id: "group-2", name: "TOEFL Squad", role: "member", memberCount: 2, createdAt: "" };

function renderDialog(open = true) {
  const onOpenChange = jest.fn();
  renderWithQueryClient(<NewLessonDialog open={open} onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

describe("NewLessonDialog", () => {
  beforeEach(() => {
    mockPush.mockReset();
    useCreateLesson.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });
  });

  it("shows no-groups message when user has no groups", () => {
    useMyGroups.mockReturnValue({ data: [], isLoading: false });

    renderDialog();

    expect(
      screen.getByText(/You need to join a group/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create/i })).not.toBeInTheDocument();
  });

  it("auto-selects and shows confirmation for single-group user", () => {
    useMyGroups.mockReturnValue({ data: [mockGroup1], isLoading: false });

    renderDialog();

    expect(
      screen.getByText(/Create lesson in "IELTS Warriors"/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create/i })).toBeInTheDocument();
  });

  it("shows group selector for multi-group user", () => {
    useMyGroups.mockReturnValue({ data: [mockGroup1, mockGroup2], isLoading: false });

    renderDialog();

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("creates lesson and redirects on success (single group)", async () => {
    useMyGroups.mockReturnValue({ data: [mockGroup1], isLoading: false });

    const mutateAsync = jest.fn().mockResolvedValue({
      id: "lesson-new",
      title: "Untitled Lesson",
      status: "draft",
      groupId: "group-1",
    });
    useCreateLesson.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      reset: jest.fn(),
    });

    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith("group-1");
      expect(mockPush).toHaveBeenCalledWith("/studio/lessons/lesson-new");
    });
  });

  it("disables Create button while pending", () => {
    useMyGroups.mockReturnValue({ data: [mockGroup1], isLoading: false });
    useCreateLesson.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      isError: false,
      reset: jest.fn(),
    });

    renderDialog();

    expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
  });

  it("shows error message on create failure", () => {
    useMyGroups.mockReturnValue({ data: [mockGroup1], isLoading: false });
    useCreateLesson.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      isError: true,
      error: new Error("Failed to create lesson"),
      reset: jest.fn(),
    });

    renderDialog();

    expect(screen.getByText("Failed to create lesson")).toBeInTheDocument();
  });
});
