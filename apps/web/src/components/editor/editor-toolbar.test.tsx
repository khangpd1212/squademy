import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { type Editor } from "@tiptap/react";
import { EditorToolbar } from "./editor-toolbar";

jest.mock("@/lib/export/markdown-export", () => ({
  downloadMarkdown: jest.fn(),
}));

jest.mock("@/lib/export/docx-export", () => ({
  downloadDocx: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/export/pdf-export", () => ({
  downloadPdf: jest.fn().mockResolvedValue(undefined),
}));

// Test mock for Tiptap Editor - only implements the methods used in tests
const fakeEditor = {
  chain: () => ({
    focus: () => ({
      toggleBold: () => ({ run: () => {} }),
      toggleItalic: () => ({ run: () => {} }),
      toggleUnderline: () => ({ run: () => {} }),
      toggleStrike: () => ({ run: () => {} }),
      toggleHeading: () => ({ run: () => {} }),
      toggleBulletList: () => ({ run: () => {} }),
      toggleOrderedList: () => ({ run: () => {} }),
      toggleBlockquote: () => ({ run: () => {} }),
    }),
  }),
  isActive: () => false,
  getJSON: () => ({ type: "doc", content: [] }),
  getHTML: () => "<p></p>",
} as unknown as Editor; // Type assertion for test mock - satisfies the Editor interface for testing purposes

describe("EditorToolbar file import", () => {
  it("shows extension validation error for non-md files", async () => {
    const onMarkdownSelected = jest.fn();

    render(<EditorToolbar editor={fakeEditor} onMarkdownSelected={onMarkdownSelected} />);

    const input = screen.getByTestId("md-file-input") as HTMLInputElement;
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByTestId("import-error")).toHaveTextContent("Only .md files are supported for import.");
    expect(onMarkdownSelected).not.toHaveBeenCalled();
  });

  it("shows size validation error for too-large files", async () => {
    const onMarkdownSelected = jest.fn();

    render(<EditorToolbar editor={fakeEditor} onMarkdownSelected={onMarkdownSelected} />);

    const input = screen.getByTestId("md-file-input") as HTMLInputElement;
    const file = new File(["a".repeat(250 * 1024 + 1)], "test.md", { type: "text/markdown" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByTestId("import-error")).toHaveTextContent("File too large. Maximum size is 250KB.");
    expect(onMarkdownSelected).not.toHaveBeenCalled();
  });

  it("accepts uppercase .MD extension", async () => {
    const onMarkdownSelected = jest.fn();

    render(<EditorToolbar editor={fakeEditor} onMarkdownSelected={onMarkdownSelected} />);

    const input = screen.getByTestId("md-file-input") as HTMLInputElement;
    const file = new File(["# Hello"], "README.MD", { type: "text/markdown" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onMarkdownSelected).toHaveBeenCalledWith("# Hello");
    });
    expect(screen.queryByTestId("import-error")).not.toBeInTheDocument();
  });

  it("shows error when FileReader fails", async () => {
    const onMarkdownSelected = jest.fn();

    render(<EditorToolbar editor={fakeEditor} onMarkdownSelected={onMarkdownSelected} />);

    const input = screen.getByTestId("md-file-input") as HTMLInputElement;
    const file = new File(["content"], "test.md", { type: "text/markdown" });

    const originalFileReader = window.FileReader;
    const mockFileReader = {
      readAsText: jest.fn(function(this: { onload: (() => void) | null; onerror: (() => void) | null }) {
        setTimeout(() => this.onerror?.(), 0);
      }),
      result: null as string | null,
      onload: null as ((() => void) | null),
      onerror: null as ((() => void) | null),
    } as unknown as typeof FileReader & { prototype: InstanceType<typeof FileReader> };
    window.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-error")).toHaveTextContent("Failed to read markdown file.");
    });
    expect(onMarkdownSelected).not.toHaveBeenCalled();

    window.FileReader = originalFileReader;
  });
});

describe("EditorToolbar export", () => {
  it("shows export button", () => {
    render(
      <EditorToolbar
        editor={fakeEditor}
        contentMarkdown="# Test Content"
        lessonTitle="Test Lesson"
      />
    );

    const exportButton = screen.getByTitle("Export");
    expect(exportButton).toBeInTheDocument();
  });

  it("export button is always enabled (individual menu items handle disabled state)", () => {
    render(<EditorToolbar editor={fakeEditor} />);

    const exportButton = screen.getByTitle("Export");
    expect(exportButton).not.toBeDisabled();
  });
});
