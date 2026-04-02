import { render, screen } from "@testing-library/react";
import { LessonEditor } from "./lesson-editor";

const mockEditor = {
  isActive: jest.fn(() => false),
  chain: jest.fn(() => ({
    focus: jest.fn(() => ({
      toggleBold: jest.fn(() => ({ run: jest.fn() })),
    })),
  })),
  getJSON: jest.fn(() => ({ type: "doc", content: [] })),
  getText: jest.fn(() => ""),
  state: { doc: { descendants: jest.fn() } },
  view: { nodeDOM: jest.fn() },
  commands: { setTextSelection: jest.fn() },
  on: jest.fn(),
  off: jest.fn(),
  getAttributes: jest.fn(() => ({})),
};

jest.mock("@tiptap/react", () => ({
  useEditor: jest.fn(() => mockEditor),
  EditorContent: ({ editor }: { editor: unknown }) =>
    editor ? <div data-testid="editor-content" /> : null,
}));

jest.mock("@tiptap/starter-kit", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => ({})),
  },
}));

jest.mock("@tiptap/extension-underline", () => ({ __esModule: true, default: {} }));
jest.mock("@tiptap/extension-link", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));
jest.mock("@tiptap/extension-image", () => ({ __esModule: true, default: {} }));
jest.mock("@tiptap/extension-table", () => ({
  __esModule: true,
  Table: { configure: jest.fn(() => ({})) },
}));
jest.mock("@tiptap/extension-table-row", () => ({ __esModule: true, default: {} }));
jest.mock("@tiptap/extension-table-cell", () => ({ __esModule: true, default: {} }));
jest.mock("@tiptap/extension-table-header", () => ({ __esModule: true, default: {} }));
jest.mock("@tiptap/extension-placeholder", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));
jest.mock("./extensions/alive-text", () => ({ AliveText: {} }));

jest.mock("./editor-toolbar", () => ({
  EditorToolbar: () => <div data-testid="editor-toolbar" />,
}));

describe("LessonEditor", () => {
  it("renders editor content area", () => {
    render(<LessonEditor content={null} />);
    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
  });

  it("renders toolbar when editable is true", () => {
    render(<LessonEditor content={null} editable={true} />);
    expect(screen.getByTestId("editor-toolbar")).toBeInTheDocument();
  });

  it("does not render toolbar when editable is false", () => {
    render(<LessonEditor content={null} editable={false} />);
    expect(screen.queryByTestId("editor-toolbar")).not.toBeInTheDocument();
  });

  it("exposes editor instance via ref when editor is ready", () => {
    const ref = { current: null as import("@tiptap/react").Editor | null };
    render(<LessonEditor content={null} ref={(e) => { ref.current = e; }} />);
    expect(ref.current).toBe(mockEditor);
  });
});
  