import { useState, useRef } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  ImagePlus,
  Table,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkPopover } from "./link-popover";
import { ImageUrlDialog } from "./image-url-dialog";

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
        active && "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />;
}

type EditorToolbarProps = {
  editor: Editor;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const linkBtnRef = useRef<HTMLDivElement>(null);
  const imageBtnRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 px-2 py-1 dark:border-zinc-800">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists + Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Insert: Link */}
      <div ref={linkBtnRef} className="relative">
        <ToolbarButton
          onClick={() => {
            setShowImageDialog(false);
            setShowLinkPopover((v) => !v);
          }}
          active={editor.isActive("link") || showLinkPopover}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>
        {showLinkPopover && (
          <LinkPopover editor={editor} onClose={() => setShowLinkPopover(false)} />
        )}
      </div>

      {/* Insert: Image */}
      <div ref={imageBtnRef} className="relative">
        <ToolbarButton
          onClick={() => {
            setShowLinkPopover(false);
            setShowImageDialog((v) => !v);
          }}
          active={showImageDialog}
          title="Image (URL)"
        >
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        {showImageDialog && (
          <ImageUrlDialog editor={editor} onClose={() => setShowImageDialog(false)} />
        )}
      </div>

      {/* Insert: Table */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insert Table"
      >
        <Table className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Alive Text */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleAliveText().run()}
        active={editor.isActive("alive_text")}
        title="Alive Text Block"
      >
        <EyeOff className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
