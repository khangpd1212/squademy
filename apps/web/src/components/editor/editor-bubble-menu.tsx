"use client";

import { useState, useEffect } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkPopover } from "./link-popover";

type EditorBubbleMenuProps = {
  editor: Editor;
};

function BubbleButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-(--dash-radius) text-(--dash-text-muted) transition-colors hover:bg-(--dash-glass-hover) hover:text-(--dash-text)",
        active && "bg-(--dash-glass-active) text-blue-500",
      )}>
      {children}
    </button>
  );
}

function useEditorActiveState(editor: Editor) {
  const [state, setState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    link: false,
    heading1: false,
    heading2: false,
    heading3: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
  });

  useEffect(() => {
    const update = () => {
      setState({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        code: editor.isActive("code"),
        link: editor.isActive("link"),
        heading1: editor.isActive("heading", { level: 1 }),
        heading2: editor.isActive("heading", { level: 2 }),
        heading3: editor.isActive("heading", { level: 3 }),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        blockquote: editor.isActive("blockquote"),
      });
    };
    editor.on("selectionUpdate", update);
    editor.on("update", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("update", update);
    };
  }, [editor]);

  return state;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const active = useEditorActiveState(editor);

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ from, to }) => {
        if (from === to) return false;
        if (editor.isActive("codeBlock")) return false;
        if (editor.isActive("image")) return false;
        return true;
      }}
      options={{
        placement: "right-end",
        offset: 10,
      }}>
      <div className="grid grid-cols-5 gap-1 justify-items-center w-50 max-h-75 overflow-y-auto content-start rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-3) p-2 backdrop-blur-xl shadow-(--dash-shadow-lg)">
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={active.bold}
          title="Bold">
          <Bold className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={active.italic}
          title="Italic">
          <Italic className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={active.underline}
          title="Underline">
          <Underline className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={active.strike}
          title="Strikethrough">
          <Strikethrough className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={active.code}
          title="Inline Code">
          <Code className="size-4" />
        </BubbleButton>
        <div className="relative">
          <BubbleButton
            onClick={() => setShowLinkPopover((v) => !v)}
            active={active.link || showLinkPopover}
            title="Link">
            <Link className="size-4" />
          </BubbleButton>
          {showLinkPopover && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-999">
              <LinkPopover
                editor={editor}
                onClose={() => setShowLinkPopover(false)}
              />
            </div>
          )}
        </div>

        <BubbleButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={active.heading1}
          title="Heading 1">
          <Heading1 className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={active.heading2}
          title="Heading 2">
          <Heading2 className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={active.heading3}
          title="Heading 3">
          <Heading3 className="size-4" />
        </BubbleButton>

        <BubbleButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={active.bulletList}
          title="Bullet List">
          <List className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={active.orderedList}
          title="Numbered List">
          <ListOrdered className="size-4" />
        </BubbleButton>
        <BubbleButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={active.blockquote}
          title="Quote">
          <Quote className="size-4" />
        </BubbleButton>
      </div>
    </BubbleMenu>
  );
}
