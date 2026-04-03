/**
 * Client-side, dependency-free Markdown → Tiptap ProseMirror JSON parser.
 *
 * Scope (AC 4): headings (#..###), bold, italic, unordered lists, ordered
 * lists, blockquote, links, paragraphs. Unknown syntax → paragraph fallback.
 */

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
  | { type: "bulletList"; content?: TiptapNode[] }
  | { type: "orderedList"; attrs: { start: number }; content?: TiptapNode[] }
  | { type: "listItem"; content?: TiptapNode[] };
export type TiptapDoc = {
  type: "doc";
  content: TiptapNode[];
};

// ---------------------------------------------------------------------------
// Inline parser (bold, italic, links)
// ---------------------------------------------------------------------------

/**
 * Parses inline markdown marks within a single line of text.
 * Handles **bold**, *italic*, _italic_, [text](url), and combinations.
 */
export function parseInline(text: string): TiptapTextNode[] {
  const nodes: TiptapTextNode[] = [];

  // Pattern order matters: links first, then bold, then italic
  const PATTERN =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(_(.+?)_)|(\[([^\]]+)\]\(([^)]+)\))/g;

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
 * Performance: well under 50 ms for a 50 KB file on typical dev hardware.
 * Graceful fallback: any unrecognised syntax becomes a paragraph node, never throws.
 */
export function parseMarkdownToTiptap(markdown: string): TiptapDoc {
  const lines = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const content: TiptapNode[] = [];

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
