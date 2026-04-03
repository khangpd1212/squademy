import { screen } from "@testing-library/react";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { LessonEditorView } from "./lesson-editor-view";

const updateLessonMock = { mutate: jest.fn(), isPending: false };

jest.mock("@/hooks/api/use-lesson-queries", () => ({
  useLesson: jest.fn(),
  useUpdateLesson: jest.fn(() => updateLessonMock),
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
  status: "draft",
  groupId: "group-1",
  authorId: "user-1",
  updatedAt: new Date().toISOString(),
};

describe("LessonEditorView", () => {
  it("renders loading skeleton while fetching", () => {
    useLesson.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    renderWithQueryClient(<LessonEditorView lessonId="lesson-1" />);

    // Skeleton divs with animate-pulse
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
      data: { ...mockLesson, status: "review" },
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
      data: { ...mockLesson, status: "published" },
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
});
