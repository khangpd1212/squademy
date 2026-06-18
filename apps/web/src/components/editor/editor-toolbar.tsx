import { useState, useRef, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import { VALIDATION } from "@squademy/shared";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  ImagePlus,
  Table,
  EyeOff,
  Eye,
  Pencil,
  FileDown,
  Download,
  ChevronDown,
  FileText,
  FileType,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkPopover } from "./link-popover";
import { ImageUrlDialog } from "./image-url-dialog";
import { downloadMarkdown } from "@/lib/export/markdown-export";
import { downloadDocx } from "@/lib/export/docx-export";
import { downloadPdf } from "@/lib/export/pdf-export";

type ExportFormat = "Markdown" | "DOCX" | "PDF";

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({
  onClick,
  active,
  title,
  disabled,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-(--dash-radius) text-(--dash-text-muted) transition-colors hover:bg-(--dash-glass-hover) hover:text-(--dash-text)",
        active && "bg-(--dash-glass-active) text-(--dash-text)",
        disabled && "cursor-not-allowed opacity-50",
      )}>
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-(--dash-border)" />;
}

type EditorToolbarProps = {
  editor: Editor;
  onMarkdownSelected?: (text: string) => void;
  contentMarkdown?: string;
  lessonTitle?: string;
  enableImport?: boolean;
  isViewMode?: boolean;
  onToggleViewMode?: () => void;
};

export function EditorToolbar({
  editor,
  onMarkdownSelected,
  contentMarkdown,
  lessonTitle,
  enableImport = true,
  isViewMode = false,
  onToggleViewMode,
}: EditorToolbarProps) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkBtnRef = useRef<HTMLDivElement>(null);
  const imageBtnRef = useRef<HTMLDivElement>(null);
  const exportBtnRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportBtnRef.current &&
        !exportBtnRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
      if (
        linkBtnRef.current &&
        !linkBtnRef.current.contains(e.target as Node)
      ) {
        setShowLinkPopover(false);
      }
      if (
        imageBtnRef.current &&
        !imageBtnRef.current.contains(e.target as Node)
      ) {
        setShowImageDialog(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected after error
    e.target.value = "";
    if (!file) return;

    setIsImporting(true);

    const hasValidExtension = file.name.toLowerCase().endsWith(".md");
    const hasValidMime =
      file.type === "text/markdown" ||
      file.type === "text/plain" ||
      file.type === "";
    const isUnderSizeLimit = file.size <= VALIDATION.MAX_MARKDOWN_FILE_SIZE; // 250KB as per AC 1

    if (!hasValidExtension || !hasValidMime) {
      setImportError("Only .md files are supported for import.");
      setIsImporting(false);
      return;
    }

    if (!isUnderSizeLimit) {
      setImportError(
        `File too large. Maximum size is ${VALIDATION.MAX_MARKDOWN_FILE_SIZE / 1024}KB.`,
      );
      setIsImporting(false);
      return;
    }

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!mountedRef.current) return;
      const text = ev.target?.result;
      if (typeof text === "string") {
        onMarkdownSelected?.(text);
      }
      setIsImporting(false);
    };
    reader.onerror = () => {
      if (!mountedRef.current) return;
      setImportError("Failed to read markdown file.");
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleExportMarkdown = () => {
    if (!contentMarkdown) return;
    try {
      downloadMarkdown(contentMarkdown, lessonTitle || "lesson");
    } catch (e) {
      setExportError(
        e instanceof Error ? e.message : "Markdown export failed.",
      );
    }
  };

  const handleExportDocx = async () => {
    try {
      const json = editor.getJSON();
      const jsonString = JSON.stringify(json);
      if (jsonString.length > 500_000) {
        throw new Error(
          "Lesson too large for DOCX export. Try Markdown export instead.",
        );
      }
      await downloadDocx(
        lessonTitle || "Lesson",
        jsonString,
        lessonTitle || "lesson",
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "DOCX export failed.");
    }
  };

  const handleExportPdf = async () => {
    try {
      await downloadPdf(editor.getHTML(), lessonTitle || "lesson");
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF export failed.");
    }
  };

  const handleExportClick = async (
    format: ExportFormat,
    handler: () => void | Promise<void>,
  ) => {
    setIsExporting(true);
    setExportFormat(format);
    setExportError(null);
    setShowExportMenu(false);
    await handler();
    if (mountedRef.current) {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const exportButtonDisabled = isExporting;

  return (
    <div className="flex flex-col rounded-(--dash-radius-lg) bg-(--dash-glass) backdrop-blur-xl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        aria-hidden="true"
        onChange={handleFileChange}
        data-testid="md-file-input"
      />
      <div className="flex flex-wrap items-center gap-0.5 border-b border-(--dash-border) bg-(--dash-surface-2) px-2 py-1">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists + Blockquote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Insert: Link */}
        <div ref={linkBtnRef} className="relative">
          <ToolbarButton
            onClick={() => {
              setShowImageDialog(false);
              setShowLinkPopover((v) => !v);
            }}
            active={editor.isActive("link") || showLinkPopover}
            title="Link">
            <Link className="h-4 w-4" />
          </ToolbarButton>
          {showLinkPopover && (
            <LinkPopover
              editor={editor}
              onClose={() => setShowLinkPopover(false)}
            />
          )}
        </div>

        {/* Insert: Image */}
        <div ref={imageBtnRef} className="relative">
          <ToolbarButton
            onClick={() => {
              setShowLinkPopover(false);
              setShowImageDialog((v) => !v);
            }}
            active={showImageDialog}
            title="Image (URL)">
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
          {showImageDialog && (
            <ImageUrlDialog
              editor={editor}
              onClose={() => setShowImageDialog(false)}
            />
          )}
        </div>

        {/* Insert: Table */}
        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="Insert Table">
          <Table className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alive Text */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleAliveText().run()}
          active={editor.isActive("alive_text")}
          title="Alive Text Block">
          <EyeOff className="h-4 w-4" />
        </ToolbarButton>

        {/* Import Markdown */}
        {enableImport && (
          <>
            <ToolbarDivider />
            
            <ToolbarButton
              onClick={handleImportClick}
              title={isImporting ? "Importing Markdown..." : "Import Markdown"}
              disabled={isImporting}>
              <FileDown className="h-4 w-4" />
            </ToolbarButton>
            {isImporting && (
              <span
                className="ml-2 text-xs text-muted-foreground"
                data-testid="import-loading">
                Importing...
              </span>
            )}
          </>
        )}

        <ToolbarDivider />

        {/* Export dropdown */}
        <div ref={exportBtnRef} className="relative">
          <ToolbarButton
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export"
            disabled={exportButtonDisabled}
            aria-haspopup="true"
            aria-expanded={showExportMenu}>
            <Download className="h-4 w-4" />
            <ChevronDown className="ml-0.5 h-3 w-3" />
          </ToolbarButton>
          {showExportMenu && (
            <div
              role="menu"
              className="rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-2) backdrop-blur-xl absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden py-1 shadow-(--dash-shadow-lg)">
              <button
                type="button"
                role="menuitem"
                disabled={!contentMarkdown}
                onClick={() =>
                  handleExportClick("Markdown", handleExportMarkdown)
                }
                className={cn(
                  "flex h-auto w-full items-center gap-2 rounded-(--dash-radius) px-3 py-1.5 text-sm text-(--dash-text-muted) transition-colors hover:bg-(--dash-glass-hover) hover:text-(--dash-text)",
                  !contentMarkdown && "cursor-not-allowed opacity-50",
                )}>
                <FileText className="h-4 w-4" />
                Markdown
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleExportClick("DOCX", handleExportDocx)}
                className="flex h-auto w-full items-center gap-2 rounded-(--dash-radius) px-3 py-1.5 text-sm text-(--dash-text-muted) transition-colors hover:bg-(--dash-glass-hover) hover:text-(--dash-text)">
                <FileType className="h-4 w-4" />
                DOCX
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleExportClick("PDF", handleExportPdf)}
                className="flex h-auto w-full items-center gap-2 rounded-(--dash-radius) px-3 py-1.5 text-sm text-(--dash-text-muted) transition-colors hover:bg-(--dash-glass-hover) hover:text-(--dash-text)">
                <FileCode className="h-4 w-4" />
                PDF
              </button>
            </div>
          )}
        </div>
        {isExporting && exportFormat && (
          <span
            className="ml-2 text-xs text-muted-foreground"
            data-testid="export-loading">
            Exporting {exportFormat}...
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* View/Edit Toggle */}
          <button
            type="button"
            onClick={onToggleViewMode ?? (() => {})}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-(--dash-radius) px-3 py-1.5 text-sm font-medium transition-colors",
              isViewMode
                ? "bg-(--dash-glass-hover) text-(--dash-text)"
                : "bg-(--dash-primary) text-white",
            )}>
            {isViewMode ? (
              <>
                <Pencil className="h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View
              </>
            )}
          </button>
        </div>
      </div>
      {exportError && (
        <p
          role="alert"
          className="px-3 py-1 text-xs text-(--dash-danger) bg-(--dash-danger)/10"
          data-testid="export-error">
          {exportError}
        </p>
      )}
      {/* Inline validation error */}
      {importError && (
        <p
          role="alert"
          className="px-3 py-1 text-xs text-(--dash-danger) bg-(--dash-danger)/10"
          data-testid="import-error">
          {importError}
        </p>
      )}
    </div>
  );
}
