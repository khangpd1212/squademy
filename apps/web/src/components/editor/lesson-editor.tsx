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

type LessonEditorProps = {
  content: Record<string, unknown> | null;
  editable?: boolean;
  ref?: Ref<Editor | null>;
};

export function LessonEditor({ content, editable = true, ref }: LessonEditorProps) {
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

  return (
    <div className="flex flex-col">
      {editable && editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}
