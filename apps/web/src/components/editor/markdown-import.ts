/**
 * Client-side, dependency-free Markdown → Tiptap ProseMirror JSON parser.
 *
 * Supports two modes:
 * - "markdown" (default): parses markdown syntax (bold, italic, links, etc.)
 * - "literal": treats all text as plain text, preserves markdown syntax as-is
 *
 * Scope (AC 4): headings (#..###), bold, italic, unordered lists, ordered
 * lists, blockquote, links, paragraphs. Unknown syntax → paragraph fallback.
 */

export type ParseMode = "markdown" | "literal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "link"; attrs: { href: string; target: string | null } };

export type TiptapTextNode = {
  type: "text";
  text: string;
  marks?: TextMark[];
};

export type TiptapNode =
  | { type: "paragraph"; content?: TiptapTextNode[] }
  | { type: "heading"; attrs: { level: 1 | 2 | 3 }; content?: TiptapTextNode[] }
  | { type: "blockquote"; content?: TiptapNode[] }
  | { type: "blockquoteCard"; content?: TiptapTextNode[] }
  | { type: "blockquoteTitle"; content?: TiptapTextNode[] }
  | { type: "bulletList"; content?: TiptapNode[] }
  | { type: "orderedList"; attrs: { start: number }; content?: TiptapNode[] }
  | { type: "listItem"; content?: TiptapNode[] };
export type TiptapDoc = {
  type: "doc";
  content: TiptapNode[];
};

// ---------------------------------------------------------------------------
// Literal mode preprocessing
// ---------------------------------------------------------------------------

/**
 * Preprocesses markdown text for "literal" mode import.
 * - Inserts zero-width spaces around ** (bold) to prevent parsing
 * - Converts single newlines to paragraph breaks (double newlines)
 *
 * Note: _ is NOT escaped because we need to detect italic patterns
 * for card-style rendering in blockquotes.
 *
 * This allows uploading markdown files while preserving the syntax characters
 * as visible text in the editor.
 */
export function preprocessLiteralMarkdown(markdown: string): string {
  const ZWSP = "\u200B";

  const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const lines = normalized.split("\n");
  const processedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      processedLines.push("");
      continue;
    }

    let escaped = line;

    escaped = escaped.replace(/\*\*/g, `${ZWSP}**${ZWSP}`);

    processedLines.push(escaped);
  }

  return processedLines.join("\n\n");
}

// ---------------------------------------------------------------------------
// Inline parser (bold, italic, links)
// ---------------------------------------------------------------------------

/**
 * Parses inline markdown marks within a single line of text.
 * Handles **bold**, *italic*, _italic_, [text](url), and combinations.
 *
 * In "literal" mode, returns the text as-is without parsing any marks.
 */
export function parseInline(text: string, mode: ParseMode = "markdown"): TiptapTextNode[] {
  if (mode === "literal") {
    if (text.length === 0) return [];
    return [{ type: "text", text }];
  }

  const nodes: TiptapTextNode[] = [];

  // Pattern order matters: links first, then bold, then italic
  // Using [\s\S] instead of . to match newlines for multi-line content
  const PATTERN =
    /(\*\*([\s\S]+?)\*\*)|(\*([\s\S]+?)\*)|(_([\s\S]+?)_)|(\[([^\]]+)\]\(([^)]+)\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = PATTERN.exec(text)) !== null) {
    // Literal text before this match
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // **bold**
      nodes.push({ type: "text", text: match[2], marks: [{ type: "bold" }] });
    } else if (match[3]) {
      // *italic*
      nodes.push({ type: "text", text: match[4], marks: [{ type: "italic" }] });
    } else if (match[5]) {
      // _italic_
      nodes.push({ type: "text", text: match[6], marks: [{ type: "italic" }] });
    } else if (match[7]) {
      // [text](url)
      nodes.push({
        type: "text",
        text: match[8],
        marks: [{ type: "link", attrs: { href: match[9], target: "_blank" } }],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining literal text
  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  // If no content was parsed, return an empty text node (empty paragraph)
  if (nodes.length === 0 && text.length === 0) return [];
  if (nodes.length === 0) return [{ type: "text", text }];

  return nodes;
}

// ---------------------------------------------------------------------------
// Block parser
// ---------------------------------------------------------------------------

type ListItem = { ordered: boolean; start?: number; indent: number; text: string };

function isListLine(line: string): ListItem | null {
  const unordered = /^(\s*)[-*+]\s+(.*)$/.exec(line);
  if (unordered) {
    return { ordered: false, indent: unordered[1].length, text: unordered[2] };
  }
  const ordered = /^(\s*)(\d+)\.\s+(.*)$/.exec(line);
  if (ordered) {
    return {
      ordered: true,
      start: parseInt(ordered[2], 10),
      indent: ordered[1].length,
      text: ordered[3],
    };
  }
  return null;
}

function buildListItem(text: string): TiptapNode {
  return {
    type: "listItem",
    content: [{ type: "paragraph", content: parseInline(text) }],
  };
}

/**
 * Convert raw Markdown string to Tiptap ProseMirror JSON (doc node).
 *
 * @param markdown - The raw markdown content
 * @param mode - "markdown" (default): parses markdown syntax
 *               "literal": treats all text as plain text, preserves markdown syntax as-is
 *               In literal mode, each line becomes a separate paragraph.
 *
 * Performance: well under 50 ms for a 50 KB file on typical dev hardware.
 * Graceful fallback: any unrecognised syntax becomes a paragraph node, never throws.
 */
export function parseMarkdownToTiptap(
  markdown: string,
  mode: ParseMode = "markdown",
): TiptapDoc {
  // In literal mode, preprocess to escape markdown syntax characters first
  const processedMarkdown = mode === "literal" ? preprocessLiteralMarkdown(markdown) : markdown;

  const lines = processedMarkdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const content: TiptapNode[] = [];

  // In literal mode, treat everything as plain text - each non-blank line is a paragraph
  if (mode === "literal") {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "") continue;

      // Detect blockquotes in literal mode
      if (/^>\s?/.test(line)) {
        const quoteContent = line.replace(/^>\s?/, "");
        const hasItalic = /_\S/.test(quoteContent);

        if (hasItalic) {
          // Card style for quotes with italic text
          content.push({
            type: "blockquoteCard",
            content: parseInline(quoteContent, "literal"),
          });
        } else {
          // Title style for quotes without italic
          content.push({
            type: "blockquoteTitle",
            content: parseInline(quoteContent, "literal"),
          });
        }
        continue;
      }

      content.push({
        type: "paragraph",
        content: parseInline(trimmed, "literal"),
      });
    }
    if (content.length === 0) {
      content.push({ type: "paragraph" });
    }
    return { type: "doc", content };
  }

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Blank line ──────────────────────────────────────────────────────────
    if (line.trim() === "") {
      i++;
      continue;
    }

    // ── Heading (# ## ###) ──────────────────────────────────────────────────
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
      content.push({
        type: "heading",
        attrs: { level },
        content: parseInline(headingMatch[2].trim()),
      });
      i++;
      continue;
    }

    // ── Blockquote (>) ──────────────────────────────────────────────────────
    if (/^>\s?/.test(line)) {
      // Collect consecutive blockquote lines
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      // Recursively parse inner content
      const innerDoc = parseMarkdownToTiptap(quoteLines.join("\n"));
      content.push({ type: "blockquote", content: innerDoc.content as TiptapNode[] });
      continue;
    }

    // ── List (unordered / ordered) ──────────────────────────────────────────
    const listItem = isListLine(line);
    if (listItem) {
      const isOrdered = listItem.ordered;
      const startNum = listItem.start ?? 1;
      const items: TiptapNode[] = [];

      while (i < lines.length && isListLine(lines[i]) !== null) {
        const li = isListLine(lines[i])!;
        // Only consume items of the same list type at the same indent level (simple approach)
        if (li.ordered !== isOrdered) break;
        items.push(buildListItem(li.text));
        i++;
      }

      if (isOrdered) {
        content.push({ type: "orderedList", attrs: { start: startNum }, content: items });
      } else {
        content.push({ type: "bulletList", content: items });
      }
      continue;
    }

    // ── Paragraph (fallback for all other content) ────────────────────────
    // Collect continuation lines (non-blank, non-block-start)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === "") break;
      if (/^#{1,3}\s/.test(l)) break;
      if (/^>\s?/.test(l)) break;
      if (isListLine(l) !== null) break;
      paraLines.push(l);
      i++;
    }

    content.push({
      type: "paragraph",
      content: parseInline(paraLines.join(" ")),
    });
  }

  // Tiptap requires at least one node in doc
  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}

// ---------------------------------------------------------------------------
// TiptapDoc to HTML converter (for literal mode)
// ---------------------------------------------------------------------------

function textNodeToHtml(node: TiptapTextNode): string {
  let text = node.text ?? "";
  text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (node.marks) {
    for (const mark of node.marks) {
      if (mark.type === "bold") {
        text = `<strong>${text}</strong>`;
      } else if (mark.type === "italic") {
        text = `<em>${text}</em>`;
      } else if (mark.type === "link" && mark.attrs?.href) {
        const href = String(mark.attrs.href).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        text = `<a href="${href}" target="_blank" rel="noreferrer noopener">${text}</a>`;
      }
    }
  }

  return text;
}

function nodeToHtml(node: TiptapNode): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${(node.content ?? []).map(textNodeToHtml).join("")}</p>`;
    case "heading":
      return `<h${node.attrs.level}>${(node.content ?? []).map(textNodeToHtml).join("")}</h${node.attrs.level}>`;
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(nodeToHtml).join("")}</blockquote>`;
    case "blockquoteCard":
      return `<div data-blockquote="card">${(node.content ?? []).map(textNodeToHtml).join("")}</div>`;
    case "blockquoteTitle":
      return `<h2 data-blockquote="title">${(node.content ?? []).map(textNodeToHtml).join("")}</h2>`;
    case "bulletList":
      return `<ul>${(node.content ?? []).map(nodeToHtml).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map(nodeToHtml).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map(nodeToHtml).join("")}</li>`;
    default:
      return "";
  }
}

/**
 * Converts literal markdown syntax to HTML for View mode rendering.
 * Converts **text** to <strong>text</strong> and _text_ to <em>text</em>
 * so Tiptap renders bold and italic correctly.
 */
function convertLiteralToHtml(text: string): string {
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/_(.+?)_/g, "<em>$1</em>");
  return text;
}

/**
 * Converts TiptapDoc to HTML string for use with editor.setContent(html, 'html')
 */
export function tiptapDocToHtml(doc: TiptapDoc): string {
  return doc.content.map(nodeToHtml).join("");
}

/**
 * Converts TiptapDoc to HTML string with literal markdown converted to HTML.
 * Use this for View mode rendering where we want proper styling.
 */
export function tiptapDocToViewHtml(doc: TiptapDoc): string {
  return doc.content.map((node) => nodeToViewHtml(node)).join("");
}

function nodeToViewHtml(node: TiptapNode): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${(node.content ?? []).map(textNodeToViewHtml).join("")}</p>`;
    case "heading":
      return `<h${node.attrs.level}>${(node.content ?? []).map(textNodeToViewHtml).join("")}</h${node.attrs.level}>`;
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(nodeToViewHtml).join("")}</blockquote>`;
    case "blockquoteCard":
      return `<div data-blockquote="card">${(node.content ?? []).map(textNodeToViewHtml).join("")}</div>`;
    case "blockquoteTitle":
      return `<h2 data-blockquote="title">${(node.content ?? []).map(textNodeToViewHtml).join("")}</h2>`;
    case "bulletList":
      return `<ul>${(node.content ?? []).map(nodeToViewHtml).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map(nodeToViewHtml).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map(nodeToViewHtml).join("")}</li>`;
    default:
      return "";
  }
}

function textNodeToViewHtml(node: TiptapTextNode): string {
  let text = node.text ?? "";
  text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  text = convertLiteralToHtml(text);

  if (node.marks) {
    for (const mark of node.marks) {
      if (mark.type === "bold") {
        text = `<strong>${text}</strong>`;
      } else if (mark.type === "italic") {
        text = `<em>${text}</em>`;
      } else if (mark.type === "link" && mark.attrs?.href) {
        const href = String(mark.attrs.href).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        text = `<a href="${href}" target="_blank" rel="noreferrer noopener">${text}</a>`;
      }
    }
  }

  return text;
}
