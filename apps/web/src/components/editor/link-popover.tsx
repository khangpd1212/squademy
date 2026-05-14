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
    <div className="rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-2) backdrop-blur-xl shadow-(--dash-shadow-lg) absolute z-50 mt-1 overflow-hidden p-3">
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
          className="w-56 rounded-(--dash-radius) border border-(--dash-border) bg-(--dash-surface-1) px-3 py-1.5 text-sm text-(--dash-text) placeholder:text-(--dash-text-muted) outline-none focus:border-(--dash-primary) focus:ring-1 focus:ring-(--dash-primary)"
          autoFocus
        />
        <button
          onClick={handleApply}
          className="inline-flex h-8 items-center justify-center rounded-(--dash-radius) bg-(--dash-primary) px-2 text-xs font-medium text-white hover:bg-(--dash-primary-hover)"
        >
          Apply
        </button>
        {existingHref && (
          <button
            onClick={handleRemove}
            className="inline-flex h-8 items-center justify-center rounded-(--dash-radius) px-2 text-xs font-medium text-(--dash-danger) transition-colors hover:bg-(--dash-danger)/10"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
