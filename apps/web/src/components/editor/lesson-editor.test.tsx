import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonEditor } from "./lesson-editor";
import { type TiptapDoc } from "./markdown-import";

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
  commands: {
    setTextSelection: jest.fn(),
    setContent: jest.fn(),
  },
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
  EditorToolbar: ({ onMarkdownSelected }: { onMarkdownSelected?: (text: string) => void }) => (
    <div data-testid="editor-toolbar">
      <button data-testid="mock-import-btn" onClick={() => onMarkdownSelected?.("## Imported Content")}>
        Import
      </button>
    </div>
  ),
}));

jest.mock("./markdown-import-dialog", () => ({
  MarkdownImportDialog: ({ onConfirm, onCancel, parsedDoc }: { onConfirm: (doc: TiptapDoc) => void; onCancel: () => void; parsedDoc: TiptapDoc | null }) => (
    <div data-testid="import-dialog">
      <div data-testid="preview-content">{JSON.stringify(parsedDoc)}</div>
      <button data-testid="confirm-btn" onClick={() => onConfirm(parsedDoc!)}>Confirm</button>
      <button data-testid="cancel-btn" onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("./markdown-import", () => ({
  parseMarkdownToTiptap: jest.fn((text) => ({ type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: text.replace("## ", "") }] }] })),
}));

describe("LessonEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders editor content area", () => {
    render(<LessonEditor content={null} />);
    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
  });

  it("renders toolbar when editor is ready", () => {
    render(<LessonEditor content={null} editable={true} />);
    expect(screen.getByTestId("editor-toolbar")).toBeInTheDocument();
  });

  it("renders toolbar for read-only mode with export functionality", () => {
    render(<LessonEditor content={null} editable={false} />);
    expect(screen.getByTestId("editor-toolbar")).toBeInTheDocument();
  });

  it("exposes editor instance via ref when editor is ready", () => {
    const ref = { current: null as import("@tiptap/react").Editor | null };
    render(<LessonEditor content={null} ref={(e) => { ref.current = e; }} />);
    expect(ref.current).toBe(mockEditor);
  });

  it("opens import dialog when markdown is selected from toolbar", async () => {
    render(<LessonEditor content={null} />);

    const importBtn = screen.getByTestId("mock-import-btn");
    await userEvent.click(importBtn);

    expect(screen.getByTestId("import-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("preview-content")).toHaveTextContent("Imported Content");
  });

  it("updates editor content and closes dialog on confirm", async () => {
    render(<LessonEditor content={null} />);

    await userEvent.click(screen.getByTestId("mock-import-btn"));
    await userEvent.click(screen.getByTestId("confirm-btn"));

    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(expect.objectContaining({
      type: "doc",
      content: expect.arrayContaining([
        expect.objectContaining({ type: "heading" })
      ])
    }));
    expect(screen.queryByTestId("import-dialog")).not.toBeInTheDocument();
  });

  it("closes dialog on cancel without updating editor", async () => {
    render(<LessonEditor content={null} />);

    await userEvent.click(screen.getByTestId("mock-import-btn"));
    await userEvent.click(screen.getByTestId("cancel-btn"));

    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    expect(screen.queryByTestId("import-dialog")).not.toBeInTheDocument();
  });
});
  