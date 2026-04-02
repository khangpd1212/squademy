import { useState } from "react";
import { type Editor } from "@tiptap/react";

type LinkPopoverProps = {
  editor: Editor;
  onClose: () => void;
};

export function LinkPopover({ editor, onClose }: LinkPopoverProps) {
  const existingHref = editor.getAttributes("link").href as string | undefined;
  const [url, setUrl] = useState(existingHref ?? "");

  function handleApply() {
    if (!url.trim()) return;
    editor.chain().focus().setLink({ href: url.trim() }).run();
    onClose();
  }

  function handleRemove() {
    editor.chain().focus().unsetLink().run();
    onClose();
  }

  return (
    <div className="absolute z-50 mt-1 rounded-md border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://..."
          className="w-56 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600"
          autoFocus
        />
        <button
          onClick={handleApply}
          className="rounded bg-zinc-900 px-2 py-1 text-xs text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Apply
        </button>
        {existingHref && (
          <button
            onClick={handleRemove}
            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
