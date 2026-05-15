"use client";

import { useEffect, useRef, useState } from "react";
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
  icon: React.ElementType;
  command: (editor: Editor) => void;
};

const BLOCK_ITEMS: BlockItem[] = [
  {
    id: "paragraph",
    label: "Text",
    icon: Type,
    command: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: "heading1",
    label: "Heading 1",
    icon: Heading1,
    command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    label: "Heading 2",
    icon: Heading2,
    command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    label: "Heading 3",
    icon: Heading3,
    command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bulletList",
    label: "Bullet List",
    icon: List,
    command: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    label: "Numbered List",
    icon: ListOrdered,
    command: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    label: "Quote",
    icon: Quote,
    command: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    label: "Code Block",
    icon: Code2,
    command: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    icon: Minus,
    command: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "table",
    label: "Table",
    icon: Table,
    command: (e) =>
      e
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
];

type EditorBlockPopoverProps = {
  editor: Editor;
  insertPos: number;
  anchorEl: HTMLElement | null;
  onClose: () => void;
};

export function EditorBlockPopover({
  editor,
  insertPos,
  anchorEl,
  onClose,
}: EditorBlockPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const insertBlock = (item: BlockItem) => {
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, { type: "paragraph" })
      .run();

    const newPos = insertPos + 1;

    editor.chain().focus().setTextSelection(newPos).run();

    item.command(editor);
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % BLOCK_ITEMS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + BLOCK_ITEMS.length) % BLOCK_ITEMS.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = BLOCK_ITEMS[selectedIndex];
        if (item) {
          insertBlock(item);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, selectedIndex]);

  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  return (
    <div
      ref={popoverRef}
      className="fixed z-9999 w-56 rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-2) backdrop-blur-xl shadow-(--dash-shadow-lg) overflow-hidden py-1"
      style={{
        left: rect.left,
        top: rect.bottom + 4,
      }}>
      {BLOCK_ITEMS.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => insertBlock(item)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
              index === selectedIndex
                ? "bg-(--dash-glass-active)"
                : "hover:bg-(--dash-glass-hover)",
            )}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--dash-radius) border border-(--dash-border) bg-(--dash-surface-3)">
              <Icon className="h-3.5 w-3.5 text-(--dash-text-muted)" />
            </div>
            <span className="text-sm font-medium text-(--dash-text)">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
