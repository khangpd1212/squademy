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
    <div className="rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-2) backdrop-blur-xl shadow-(--dash-shadow-lg) absolute z-50 mt-1 overflow-hidden p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
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
          className="w-64 rounded-(--dash-radius) border border-(--dash-border) bg-(--dash-surface-1) px-3 py-1.5 text-sm text-(--dash-text) placeholder:text-(--dash-text-muted) outline-none focus:border-(--dash-primary) focus:ring-1 focus:ring-(--dash-primary)"
          autoFocus
        />
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="preview"
            className="max-h-24 max-w-full rounded-(--dash-radius) object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleInsert}
            disabled={!url.trim()}
            className="inline-flex h-8 items-center justify-center rounded-(--dash-radius) bg-(--dash-primary) px-3 text-xs font-medium text-white hover:bg-(--dash-primary-hover) disabled:opacity-50"
          >
            Insert
          </button>
          <button
            onClick={onClose}
            className="inline-flex h-8 items-center justify-center rounded-(--dash-radius) px-3 text-xs font-medium text-(--dash-text-muted) transition-colors hover:bg-(--dash-glass-hover) hover:text-(--dash-text)"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
