import { useState } from "react";
import { type Editor } from "@tiptap/react";

type ImageUrlDialogProps = {
  editor: Editor;
  onClose: () => void;
};

export function ImageUrlDialog({ editor, onClose }: ImageUrlDialogProps) {
  const [url, setUrl] = useState("");

  function handleInsert() {
    if (!url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
    onClose();
  }

  return (
    <div className="absolute z-50 mt-1 rounded-md border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Image URL
      </p>
      <div className="flex flex-col gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInsert();
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://..."
          className="w-64 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600"
          autoFocus
        />
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="preview"
            className="max-h-24 max-w-full rounded object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleInsert}
            disabled={!url.trim()}
            className="rounded bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Insert
          </button>
          <button
            onClick={onClose}
            className="rounded px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
