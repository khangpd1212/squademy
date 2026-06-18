"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FloatingMenu } from "@tiptap/react/menus";
import { type Editor } from "@tiptap/react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Table,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BlockItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  keywords: string[];
  command: (editor: Editor) => void;
};

function filterBlockItems(items: BlockItem[], query: string): BlockItem[] {
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q)),
  );
}

const BLOCK_ITEMS: BlockItem[] = [
  {
    id: "paragraph",
    label: "Text",
    description: "Just start writing with plain text.",
    icon: Type,
    keywords: ["text", "plain", "p"],
    command: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: "heading1",
    label: "Heading 1",
    description: "Big section heading.",
    icon: Heading1,
    keywords: ["h1", "heading1", "heading 1"],
    command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    label: "Heading 2",
    description: "Medium section heading.",
    icon: Heading2,
    keywords: ["h2", "heading2", "heading 2"],
    command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    label: "Heading 3",
    description: "Small section heading.",
    icon: Heading3,
    keywords: ["h3", "heading3", "heading 3"],
    command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bulletList",
    label: "Bullet List",
    description: "Create a simple bullet list.",
    icon: List,
    keywords: ["bullet", "list", "ul", "unordered"],
    command: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    label: "Numbered List",
    description: "Create a list with numbering.",
    icon: ListOrdered,
    keywords: ["numbered", "ordered", "ol", "1."],
    command: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    label: "Quote",
    description: "Capture a quote.",
    icon: Quote,
    keywords: ["quote", "blockquote"],
    command: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    label: "Code Block",
    description: "Capture a code snippet.",
    icon: Code2,
    keywords: ["code", "snippet", "codeblock"],
    command: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Insert a horizontal divider.",
    icon: Minus,
    keywords: ["divider", "hr", "line", "horizontal"],
    command: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "table",
    label: "Table",
    description: "Insert a table (3x3).",
    icon: Table,
    keywords: ["table", "grid"],
    command: (e) =>
      e
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
];

const NESTED_PARENT_TYPES = ["listItem", "tableCell", "blockquote"];

function isCursorInNestedBlock($anchor: typeof import("@tiptap/pm/model").ResolvedPos.prototype): boolean {
  for (let d = 1; d < $anchor.depth; d++) {
    if (NESTED_PARENT_TYPES.includes($anchor.node(d).type.name)) return true;
  }
  return false;
}

function isSlashActive(editor: Editor): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $anchor, empty } = selection;

  if (!empty || !$anchor.parent.isTextblock) return false;
  if (isCursorInNestedBlock($anchor)) return false;

  const text = $anchor.parent.textContent;
  return text.startsWith("/") && !text.slice(1).includes(" ");
}

function getSlashQuery(editor: Editor): string {
  const { state } = editor;
  const { from } = state.selection;
  const textBefore = state.doc.textBetween(0, from);
  const lastLineStart = textBefore.lastIndexOf("\n") + 1;
  const currentLineText = textBefore.slice(lastLineStart);

  if (currentLineText.startsWith("/")) {
    return currentLineText.slice(1);
  }
  return "";
}

function getCurrentLineStart(editor: Editor): number {
  const { $anchor } = editor.state.selection;
  return $anchor.pos - $anchor.parentOffset;
}

type EditorBlockPickerProps = {
  editor: Editor;
};

export function EditorBlockPicker({ editor }: EditorBlockPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [query, selectedIndex]);

  const filteredItems = filterBlockItems(BLOCK_ITEMS, query);

  const close = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const commitItem = useCallback(
    (item: BlockItem) => {
      const { state } = editor;
      const { from } = state.selection;
      const $pos = state.doc.resolve(from);
      const start = $pos.pos - $pos.parentOffset;

      if (item.id.startsWith("heading")) {
        const level = Number(item.id.replace("heading", "")) as 1 | 2 | 3;
        editor
          .chain()
          .focus()
          .deleteRange({ from: start, to: from })
          .toggleHeading({ level })
          .run();
      } else {
        editor.chain().focus().deleteRange({ from: start, to: from }).run();

        item.command(editor);
      }
      close();
    },
    [editor, close],
  );

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const content = getSlashQuery(editor);
      if (content !== undefined) {
        if (content.includes(" ")) {
          close();
        } else {
          setQuery(content);
          setSelectedIndex(0);
        }
      }
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor, close]);

  useEffect(() => {
    if (!editor) return;

    const editorDom = editor.view.dom;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSlashActive(editor)) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (filteredItems[selectedIndexRef.current]) {
          commitItem(filteredItems[selectedIndexRef.current]);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        const lineStart = getCurrentLineStart(editor);
        const { from } = editor.state.selection;
        editor.chain().focus().deleteRange({ from: lineStart, to: from }).run();
        close();
      }
    };

    editorDom.addEventListener("keydown", handleKeyDown);
    return () => editorDom.removeEventListener("keydown", handleKeyDown);
  }, [editor, commitItem, close]);

  return (
    <FloatingMenu
      editor={editor}
      shouldShow={({ view, state }) => {
        if (!view.hasFocus()) return false;

        const { selection } = state;
        const { $anchor, empty } = selection;

        if (!empty || !$anchor.parent.isTextblock) return false;
        if (isCursorInNestedBlock($anchor)) return false;

        const text = $anchor.parent.textContent;
        return text.startsWith("/") && !text.slice(1).includes(" ");
      }}
      options={{
        placement: "bottom-start",
        offset: 4,
      }}>
      <div className="w-64 rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-2) backdrop-blur-xl shadow-(--dash-shadow-lg) overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium text-(--dash-text-muted) border-b border-(--dash-border)">
          {query ? `Filtering: "${query}"` : "Blocks"}
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => commitItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-(--dash-glass-active)"
                    : "hover:bg-(--dash-glass-hover)",
                )}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--dash-radius) border border-(--dash-border) bg-(--dash-surface-3)">
                  <Icon className="h-4 w-4 text-(--dash-text-muted)" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-(--dash-text)">
                    {item.label}
                  </span>
                  <span className="text-xs text-(--dash-text-muted)">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-(--dash-text-muted)">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </FloatingMenu>
  );
}
