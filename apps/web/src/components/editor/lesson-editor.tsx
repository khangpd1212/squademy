"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useImperativeHandle, useState, type Ref } from "react";
import { EditorBlockPicker } from "./editor-block-picker";

import { type Node } from "@tiptap/pm/model";
import MarkdownRenderer from "../markdown-renderer";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import "./editor-styles.css";
import { EditorToolbar } from "./editor-toolbar";
import { AliveText } from "./extensions/alive-text";
import { createBlockNodeViews } from "./extensions/block-wrapper";
import { parseMarkdownToTiptap, tiptapDocToHtml } from "./markdown-import";

type LessonEditorProps = {
  content: Record<string, unknown> | null;
  contentMarkdown?: string;
  lessonTitle?: string;
  editable?: boolean;
  onImportAction?: (
    content: Record<string, unknown>,
    markdown?: string,
  ) => void;
  ref?: Ref<Editor | null>;
};

export function LessonEditor({
  content,
  contentMarkdown,
  lessonTitle,
  editable = true,
  onImportAction,
  ref,
}: LessonEditorProps) {
  const [isViewMode, setIsViewMode] = useState(false);
  const [importedMarkdown, setImportedMarkdown] = useState<string | null>(null);
  const handleAddBlock = (pos: number, node: Node) => {
    if (!editor) return;
    const insertPos = pos + node.nodeSize;
    editor.chain().focus().insertContentAt(insertPos, { type: "paragraph" }).run();
  };


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
          }
          return "Start writing your lesson...";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: true,
      }),
      AliveText,
      Markdown.configure({
        markedOptions: { gfm: true, breaks: false },
      }),
    ],
    content: content ?? null,
    contentType: "markdown",
    editable: editable && !isViewMode,
    immediatelyRender: true,
  });

  useImperativeHandle<Editor | null, Editor | null>(ref, () => editor, [
    editor,
  ]);

  useEffect(() => {
    if (!editor) return;
    editor.view.setProps({
      nodeViews: createBlockNodeViews({
        onAddBlock: handleAddBlock,
      }),
    });
  }, [editor, handleAddBlock]);


  const handleMarkdownSelected = (text: string) => {
    if (!editor) return;
    const doc = parseMarkdownToTiptap(text, "literal");
    const html = tiptapDocToHtml(doc);
    editor.commands.setContent(html);
    setImportedMarkdown(text);
    onImportAction?.(editor.getJSON(), text);
  };

  const handleToggleViewMode = () => {
    setIsViewMode((prev) => !prev);
  };

  const getMarkdown = () => {
    if (importedMarkdown) return importedMarkdown;
    if (contentMarkdown) return contentMarkdown;
    return editor?.getText() ?? "";
  };

  const markdownToView = getMarkdown();

  return (
    <div className="flex flex-col relative overflow-hidden rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) backdrop-blur-xl h-full">
      {editor && (
        <EditorToolbar
          editor={editor}
          onMarkdownSelected={
            editable && !isViewMode ? handleMarkdownSelected : undefined
          }
          contentMarkdown={contentMarkdown}
          lessonTitle={lessonTitle}
          enableImport={editable && !isViewMode}
          isViewMode={isViewMode}
          onToggleViewMode={handleToggleViewMode}
        />
      )}

      {isViewMode ? (
        <div className="flex-1 bg-(--dash-surface-1) overflow-y-auto">
          <div className="text-slate-300 leading-relaxed text-base p-4 h-0">
            <MarkdownRenderer content={markdownToView} />
          </div>
        </div>
      ) : (
        <div className="relative flex-1">
          <EditorContent
            editor={editor}
            className="h-full bg-(--dash-surface-1) overflow-y-auto markdown-content"
          />
          {editor && (
            <>
              <EditorBubbleMenu editor={editor} />
              <EditorBlockPicker editor={editor} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
