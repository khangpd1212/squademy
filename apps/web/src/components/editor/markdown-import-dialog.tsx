import { type TiptapDoc, type TiptapNode, type TiptapTextNode } from "./markdown-import";

type MarkdownImportDialogProps = {
  parsedDoc: TiptapDoc | null;
  parseError: string | null;
  onConfirm: (doc: TiptapDoc) => void;
  onCancel: () => void;
};

function renderInline(nodes: TiptapTextNode[]): React.ReactNode {
  return nodes.map((n, index) => {
    let inlineNode: React.ReactNode = n.text;

    if (n.marks) {
      for (const mark of n.marks) {
        if (mark.type === "bold") inlineNode = <strong key={`bold-${index}`}>{inlineNode}</strong>;
        else if (mark.type === "italic") inlineNode = <em key={`italic-${index}`}>{inlineNode}</em>;
        else if (mark.type === "link" && mark.attrs?.href) {
          const href = String(mark.attrs.href).trim();
          if (href.startsWith("javascript:")) break;
          inlineNode = (
            <a key={`link-${index}`} href={href} target="_blank" rel="noreferrer noopener">
              {inlineNode}
            </a>
          );
        }
      }
    }

    return <span key={`text-${index}`}>{inlineNode}</span>;
  });
}

function renderNode(node: TiptapNode, key: number): React.ReactNode {
  switch (node.type) {
    case "heading":
      return (
        <h3 key={`heading-${key}`} className="preview-heading">
          {renderInline(node.content ?? [])}
        </h3>
      );
    case "paragraph":
      return (
        <p key={`paragraph-${key}`}>
          {renderInline(node.content ?? [])}
        </p>
      );
    case "blockquote":
      return (
        <blockquote key={`blockquote-${key}`}>
          {node.content?.map((child, idx) => (
            <div key={`blockquote-child-${idx}`}>{renderNode(child, idx)}</div>
          ))}
        </blockquote>
      );
    case "bulletList":
      return (
        <ul key={`bullet-${key}`}>
          {node.content?.map((li, idx) => (
            <li key={`bullet-item-${idx}`}>
              {li.type === "listItem" ? li.content?.map((c, j) => renderNode(c, j)) : null}
            </li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={`ordered-${key}`} start={node.attrs.start}>
          {node.content?.map((li, idx) => (
            <li key={`ordered-item-${idx}`}>
              {li.type === "listItem" ? li.content?.map((c, j) => renderNode(c, j)) : null}
            </li>
          ))}
        </ol>
      );
    case "listItem":
      return <li key={`listitem-${key}`}>{node.content?.map((c, idx) => renderNode(c, idx))}</li>;
    default:
      return null;
  }
}

function renderPreview(doc: TiptapDoc): React.ReactNode {
  return <>{doc.content.map((n, i) => renderNode(n, i))}</>;
}

// ---------------------------------------------------------------------------
// Dialog component
// ---------------------------------------------------------------------------

export function MarkdownImportDialog({
  parsedDoc,
  parseError,
  onConfirm,
  onCancel,
}: MarkdownImportDialogProps) {
  const hasContent = parsedDoc !== null && parsedDoc.content.length > 0;

  const previewContent = parsedDoc && hasContent ? renderPreview(parsedDoc) : null;

  const isEmpty =
    parsedDoc !== null &&
    parsedDoc.content.length === 1 &&
    parsedDoc.content[0].type === "paragraph" &&
    !("content" in parsedDoc.content[0] && (parsedDoc.content[0] as { content?: unknown[] }).content?.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import Markdown preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      data-testid="import-dialog"
    >
      <div className="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900">
        {/* Header */}
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Import Markdown — Preview
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Review the parsed content below. Confirming will replace the editor&apos;s
            current content.
          </p>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {parseError && (
            <p
              role="alert"
              className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
              data-testid="dialog-parse-error"
            >
              {parseError}
            </p>
          )}

          {isEmpty && !parseError && (
            <p
              className="text-sm text-zinc-500 italic"
              data-testid="dialog-empty-state"
            >
              The file appears to be empty. No content will be imported.
            </p>
          )}

          {previewContent && !isEmpty && (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              data-testid="dialog-preview"
            >
              {previewContent}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            data-testid="dialog-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasContent || !!parseError || isEmpty}
            onClick={() => parsedDoc && onConfirm(parsedDoc)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            data-testid="dialog-confirm"
          >
            Replace content
          </button>
        </div>
      </div>
    </div>
  );
}
