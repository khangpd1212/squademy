"use client";

import { useImperativeHandle, type Ref } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./editor-styles.css";
import { EditorToolbar } from "./editor-toolbar";
import { AliveText } from "./extensions/alive-text";
import { useState } from "react";
import { parseMarkdownToTiptap, tiptapDocToHtml } from "./markdown-import";

type LessonEditorProps = {
  content: Record<string, unknown> | null;
  contentMarkdown?: string;
  lessonTitle?: string;
  editable?: boolean;
  onImportAction?: (content: Record<string, unknown>, markdown?: string) => void;
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

  const editor = useEditor({
    immediatelyRender: false,
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
      Placeholder.configure({ placeholder: "Start writing your lesson..." }),
      AliveText,
      Markdown.configure({
        markedOptions: { gfm: true, breaks: false },
      }),
    ],
    content: content ?? null,
    contentType: "markdown",
    editable: editable && !isViewMode,
  });

  useImperativeHandle<Editor | null, Editor | null>(ref, () => editor, [
    editor,
  ]);

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
    <div className="flex flex-col relative">
      {editor && (
        <EditorToolbar
          editor={editor}
          onMarkdownSelected={editable && !isViewMode ? handleMarkdownSelected : undefined}
          contentMarkdown={contentMarkdown}
          lessonTitle={lessonTitle}
          enableImport={editable && !isViewMode}
          isViewMode={isViewMode}
          onToggleViewMode={handleToggleViewMode}
        />
      )}

      {isViewMode ? (
        <div className="editor-content view-mode flex-1 p-4">
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownToView}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <EditorContent
          editor={editor}
          className="editor-content flex-1"
        />
      )}
    </div>
  );
}
