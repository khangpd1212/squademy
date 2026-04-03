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
import "./editor-styles.css";
import { EditorToolbar } from "./editor-toolbar";
import { AliveText } from "./extensions/alive-text";
import { MarkdownImportDialog } from "./markdown-import-dialog";
import { parseMarkdownToTiptap } from "./markdown-import";
import { useState } from "react";

type LessonEditorProps = {
  content: Record<string, unknown> | null;
  contentMarkdown?: string;
  lessonTitle?: string;
  editable?: boolean;
  onImportAction?: (content: Record<string, unknown>) => void;
  ref?: Ref<Editor | null>;
};

export function LessonEditor({ 
  content, 
  contentMarkdown, 
  lessonTitle,
  editable = true, 
  onImportAction, 
  ref 
}: LessonEditorProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [parsedDoc, setParsedDoc] = useState<ReturnType<typeof parseMarkdownToTiptap> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

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
    ],
    content: content ?? null,
    editable,
  });

  useImperativeHandle<Editor | null, Editor | null>(ref, () => editor, [editor]);

  const handleMarkdownSelected = (text: string) => {
    try {
      const doc = parseMarkdownToTiptap(text);
      setParsedDoc(doc);
      setParseError(null);
      setShowImportDialog(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse markdown.");
      setParsedDoc(null);
      setShowImportDialog(true);
    }
  };

  const handleImportConfirm = (doc: ReturnType<typeof parseMarkdownToTiptap>) => {
    if (editor) {
      editor.commands.setContent(doc);
      onImportAction?.(editor.getJSON());
      setShowImportDialog(false);
      setParsedDoc(null);
    }
  };

  return (
    <div className="flex flex-col relative">
      {editor && (
        <EditorToolbar
          editor={editor}
          onMarkdownSelected={editable ? handleMarkdownSelected : undefined}
          contentMarkdown={contentMarkdown}
          lessonTitle={lessonTitle}
          enableImport={editable}
        />
      )}
      <EditorContent editor={editor} className="flex-1" />

      {showImportDialog && (
        <MarkdownImportDialog
          parsedDoc={parsedDoc}
          parseError={parseError}
          onCancel={() => setShowImportDialog(false)}
          onConfirm={handleImportConfirm}
        />
      )}
    </div>
  );
}
