import { useEffect, useState, useRef } from "react";
import { type Editor } from "@tiptap/react";

type HeadingItem = {
  level: number;
  text: string;
  pos: number;
};

type OutlinePanelProps = {
  editor: Editor | null;
};

export function OutlinePanel({ editor }: OutlinePanelProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    function extractHeadings() {
      if (!editor) return;
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading" && (node.attrs.level === 1 || node.attrs.level === 2)) {
          items.push({
            level: node.attrs.level as number,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    }

    extractHeadings();

    const handleUpdate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(extractHeadings, 400);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor]);

  if (headings.length === 0) {
    return (
      <div className="px-3 py-4 text-xs text-zinc-400 dark:text-zinc-600">
        No headings yet
      </div>
    );
  }

  function scrollToHeading(pos: number) {
    if (!editor) return;
    editor.commands.setTextSelection(pos);
    const domNode = editor.view.nodeDOM(pos);
    if (domNode instanceof Element) {
      domNode.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav className="px-2 py-3">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
        Outline
      </p>
      <ul className="space-y-0.5">
        {headings.map((h) => (
          <li key={`${h.pos}-${h.level}`}>
            <button
              onClick={() => scrollToHeading(h.pos)}
              className={`block w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                h.level === 1
                  ? "font-semibold text-zinc-700 dark:text-zinc-300"
                  : "pl-4 text-zinc-500 dark:text-zinc-500"
              }`}
              title={h.text}
            >
              {h.text || "(empty heading)"}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
