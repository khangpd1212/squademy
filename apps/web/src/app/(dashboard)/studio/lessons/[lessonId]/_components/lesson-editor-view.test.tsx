import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { LessonEditorView } from "./lesson-editor-view";
import { LESSON_STATUS } from "@squademy/shared";

const updateLessonMock = { mutate: jest.fn(), isPending: false };
const submitLessonMock = { mutate: jest.fn(), isPending: false };

jest.mock("@/hooks/api/use-lesson-queries", () => ({
  useLesson: jest.fn(),
  useUpdateLesson: jest.fn(() => updateLessonMock),
  useSubmitLesson: jest.fn(() => submitLessonMock),
}));

let capturedOnImportAction: ((content: Record<string, unknown>) => void) | undefined;

jest.mock("@/components/editor/lesson-editor", () => ({
  LessonEditor: ({ editable, onImportAction }: { editable: boolean; onImportAction?: (content: Record<string, unknown>) => void }) => {
    capturedOnImportAction = onImportAction;
    return (
      <div data-testid="lesson-editor" data-editable={String(editable)} />
    );
  },
}));

jest.mock("@/components/editor/outline-panel", () => ({
  OutlinePanel: () => <div data-testid="outline-panel" />,
}));

const { useLesson } = jest.requireMock("@/hooks/api/use-lesson-queries") as {
  useLesson: jest.Mock;
};

const mockLesson = {
  id: "lesson-1",
  title: "My Lesson Title",
  content: { type: "doc", content: [] },
  contentMarkdown: "some text",
  status: LESSON_STATUS.DRAFT,
  groupId: "group-1",
  authorId: "user-1",
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  updateLessonMock.mutate = jest.fn();
  submitLessonMock.mutate = jest.fn();
  submitLessonMock.isPending = false;
});

describe("LessonEditorView", () => {
  it("renders loading skeleton while fetching", () => {
    useLesson.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders editor with lesson data after fetch", async () => {
    useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

    const titleInput = await screen.findByDisplayValue("My Lesson Title");
    expect(titleInput).toBeInTheDocument();
    expect(screen.getByTestId("lesson-editor")).toBeInTheDocument();
  });

  it("title input is editable for draft lessons", async () => {
    useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

    const titleInput = await screen.findByDisplayValue("My Lesson Title");
    expect(titleInput).not.toHaveAttribute("readonly");
  });

  it("editor is read-only when lesson status is review", async () => {
    useLesson.mockReturnValue({
      data: { ...mockLesson, status: LESSON_STATUS.REVIEW },
      isLoading: false,
      isError: false,
    });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

    const editor = screen.getByTestId("lesson-editor");
    expect(editor).toHaveAttribute("data-editable", "false");

    const titleInput = await screen.findByDisplayValue("My Lesson Title");
    expect(titleInput).toHaveAttribute("readonly");
  });

  it("editor is read-only when lesson status is published", () => {
    useLesson.mockReturnValue({
      data: { ...mockLesson, status: LESSON_STATUS.PUBLISHED },
      isLoading: false,
      isError: false,
    });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

    const editor = screen.getByTestId("lesson-editor");
    expect(editor).toHaveAttribute("data-editable", "false");
  });

  it("shows error state when lesson fetch fails", () => {
    useLesson.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-x" />);

    expect(screen.getByText("Lesson not found")).toBeInTheDocument();
  });

  it("passes imported content through onImportAction callback", () => {
    useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

    const importedContent = { type: "doc", content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Imported" }] }] };

    expect(capturedOnImportAction).toBeDefined();
    capturedOnImportAction!(importedContent);
  });

  describe("submit for review", () => {
    it("shows Submit for Review button for draft lessons", async () => {
      useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText("Submit for Review")).toBeInTheDocument();
    });

    it("does not show Submit for Review button when status is review", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.REVIEW },
        isLoading: false,
        isError: false,
      });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(screen.queryByText("Submit for Review")).not.toBeInTheDocument();
    });

    it("does not show Submit for Review button when status is published", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.PUBLISHED },
        isLoading: false,
        isError: false,
      });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(screen.queryByText("Submit for Review")).not.toBeInTheDocument();
    });

    it("calls submit mutation when Submit for Review is clicked", async () => {
      useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });
      const user = userEvent.setup();

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      const submitButton = await screen.findByText("Submit for Review");
      await user.click(submitButton);

      expect(submitLessonMock.mutate).toHaveBeenCalledWith("lesson-1");
    });

    it("shows submitting state when submit is pending", async () => {
      useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });
      submitLessonMock.isPending = true;

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText("Submitting...")).toBeInTheDocument();
      expect(screen.queryByText("Submit for Review")).not.toBeInTheDocument();
    });
  });

  describe("resubmit for review", () => {
    it("shows Resubmit for Review button for rejected lessons", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.REJECTED },
        isLoading: false,
        isError: false,
      });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText("Resubmit for Review")).toBeInTheDocument();
    });

    it("does not show Resubmit for Review button when status is draft", async () => {
      useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(screen.queryByText("Resubmit for Review")).not.toBeInTheDocument();
    });

    it("calls submit mutation when Resubmit for Review is clicked", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.REJECTED },
        isLoading: false,
        isError: false,
      });
      const user = userEvent.setup();

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      const resubmitButton = await screen.findByText("Resubmit for Review");
      await user.click(resubmitButton);

      expect(submitLessonMock.mutate).toHaveBeenCalledWith("lesson-1");
    });

    it("shows submitting state when submit is pending for rejected lesson", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.REJECTED },
        isLoading: false,
        isError: false,
      });
      submitLessonMock.isPending = true;

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText("Submitting...")).toBeInTheDocument();
      expect(screen.queryByText("Resubmit for Review")).not.toBeInTheDocument();
    });
  });

  describe("status badge", () => {
    it("shows styled In Review badge when status is review", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.REVIEW },
        isLoading: false,
        isError: false,
      });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText("In Review")).toBeInTheDocument();
    });

    it("shows styled Draft badge when status is draft", async () => {
      useLesson.mockReturnValue({ data: mockLesson, isLoading: false, isError: false });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText("Draft")).toBeInTheDocument();
    });

    it("shows styled Published badge when status is published", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.PUBLISHED },
        isLoading: false,
        isError: false,
      });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText(LESSON_STATUS.PUBLISHED)).toBeInTheDocument();
    });

    it("shows styled Rejected badge when status is rejected", async () => {
      useLesson.mockReturnValue({
        data: { ...mockLesson, status: LESSON_STATUS.REJECTED },
        isLoading: false,
        isError: false,
      });

      renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

      expect(await screen.findByText(LESSON_STATUS.REJECTED)).toBeInTheDocument();
    });
  });
});
