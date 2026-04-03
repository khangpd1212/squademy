import { render, screen } from "@testing-library/react";
import { MarkdownImportDialog } from "./markdown-import-dialog";
import type { TiptapDoc } from "./markdown-import";

const sampleDoc: TiptapDoc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Hello" }] },
    { type: "paragraph", content: [{ type: "text", text: "Paragraph content" }] },
  ],
};

describe("MarkdownImportDialog", () => {
  it("renders parsed nodes safely and without dangerouslySetInnerHTML", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <MarkdownImportDialog
        parsedDoc={sampleDoc}
        parseError={null}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Paragraph content")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-confirm")).toBeEnabled();
  });

  it("renders parse error and disables confirm button", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <MarkdownImportDialog
        parsedDoc={sampleDoc}
        parseError="Parse failed"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByTestId("dialog-parse-error")).toHaveTextContent("Parse failed");
    expect(screen.getByTestId("dialog-confirm")).toBeDisabled();
  });

  it("shows empty state for empty file", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const emptyDoc: TiptapDoc = {
      type: "doc",
      content: [{ type: "paragraph" }],
    };

    render(
      <MarkdownImportDialog
        parsedDoc={emptyDoc}
        parseError={null}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByTestId("dialog-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-confirm")).toBeDisabled();
  });
});
