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
    <div className="clay-dialog absolute z-50 mt-1 overflow-hidden p-3">
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
          className="clay-input w-56"
          autoFocus
        />
        <button
          onClick={handleApply}
          className="clay-btn clay-btn-primary h-8 px-2 text-xs"
        >
          Apply
        </button>
        {existingHref && (
          <button
            onClick={handleRemove}
            className="clay-btn clay-btn-ghost h-8 px-2 text-xs text-(clay-error-foreground) hover:bg-(clay-error)/10"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
