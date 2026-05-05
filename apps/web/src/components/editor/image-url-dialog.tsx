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
    <div className="clay-dialog absolute z-50 mt-1 overflow-hidden p-3">
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
          className="clay-input w-64"
          autoFocus
        />
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="preview"
            className="max-h-24 max-w-full rounded-clay object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleInsert}
            disabled={!url.trim()}
            className="clay-btn clay-btn-primary h-8 px-3 text-xs"
          >
            Insert
          </button>
          <button
            onClick={onClose}
            className="clay-btn clay-btn-ghost h-8 px-3 text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
