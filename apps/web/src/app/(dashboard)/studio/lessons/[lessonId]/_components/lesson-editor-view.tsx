"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLesson,
  useLessonComments,
  useUpdateLesson,
  useSubmitLesson,
  LessonDetail,
} from "@/hooks/api/use-lesson-queries";
import { queryKeys } from "@/lib/api/query-keys";
import { LESSON_STATUS } from "@squademy/shared";
import { LessonEditor } from "@/components/editor/lesson-editor";
import { OutlinePanel } from "@/components/editor/outline-panel";
import { SaveIndicator } from "./save-indicator";
import { ParagraphCommentTrigger } from "@/components/lessons/paragraph-comment-trigger";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "@/components/markdown-renderer";
import "@/components/editor/editor-styles.css";
import { STATUS_STYLES } from "@/lib/status-styles";

type SaveStatus = "idle" | "saving" | "saved" | "error";
const SUBMIT_UI = {
  BUTTON_SUBMIT: "Submit for Review",
  BUTTON_RESUBMIT: "Resubmit for Review",
  BUTTON_LOADING: "Submitting...",
} as const;

const EDITOR_DEBOUNCE_MS = 2000;

type LessonEditorViewProps = {
  lessonId: string;
};

export function LessonEditorView({ lessonId }: LessonEditorViewProps) {
  const { data: lesson, isLoading, isError } = useLesson(lessonId);
  const { data: comments = [] } = useLessonComments(lessonId);
  const updateLesson = useUpdateLesson();
  const submitLesson = useSubmitLesson();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string>("");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const initializedRef = useRef(false);
  const lessonIdRef = useRef(lessonId);
  const updateLessonRef = useRef(updateLesson);

  useEffect(() => {
    lessonIdRef.current = lessonId;
  }, [lessonId]);

  useEffect(() => {
    updateLessonRef.current = updateLesson;
  }, [updateLesson]);

  useEffect(() => {
    if (lesson && !initializedRef.current) {
      initializedRef.current = true;
      const lessonTitle = lesson.title;
      const lessonMarkdown = lesson.contentMarkdown ?? "";
      queueMicrotask(() => {
        setTitle(lessonTitle);
        setRawMarkdown(lessonMarkdown);
        titleRef.current = lessonTitle;
      });
    }
  }, [lesson]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
    };
  }, [queryClient]);

  const triggerSave = useCallback(
    (editor: Editor, markdown?: string) => {
      const markdownToSave = markdown ?? rawMarkdown;
      if (!markdownToSave) return;
      setSaveStatus("saving");
      updateLessonRef.current.mutate(
        {
          lessonId: lessonIdRef.current,
          data: {
            content: editor.getJSON(),
            contentMarkdown: markdownToSave,
            title: titleRef.current,
          },
        },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), EDITOR_DEBOUNCE_MS);
          },
          onError: () => setSaveStatus("error"),
        },
      );
    },
    [rawMarkdown],
  );

  useEffect(() => {
    if (!editorInstance) return;
    const handler = ({ editor: e }: { editor: Editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => triggerSave(e), EDITOR_DEBOUNCE_MS);
    };
    editorInstance.on("update", handler);
    return () => {
      editorInstance.off("update", handler);
    };
  }, [editorInstance, rawMarkdown, triggerSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const editor = editorInstance;
        if (!editor) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        triggerSave(editor);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorInstance, triggerSave]);

  const handleTitleBlur = () => {
    if (!editorInstance || !lesson) return;
    if (titleRef.current === lesson.title) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    triggerSave(editorInstance);
  };

  const handleSetEditor = (editor: Editor | null) => setEditorInstance(editor);

  const handleSubmit = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (editorInstance) {
      triggerSave(editorInstance);
    }
    queryClient.setQueryData(
      queryKeys.lessons.detail(lessonId),
      (old: LessonDetail | undefined) =>
        old ? { ...old, status: LESSON_STATUS.REVIEW } : old,
    );
    submitLesson.mutate(lessonId);
  };

  const isReadOnly =
    lesson?.status === LESSON_STATUS.REVIEW ||
    lesson?.status === LESSON_STATUS.PUBLISHED;

  const canSubmit = lesson?.status === LESSON_STATUS.DRAFT;
  const canResubmit = lesson?.status === LESSON_STATUS.REJECTED;
  const statusStyle = lesson ? STATUS_STYLES[lesson.status] : null;

  const contentRef = useMemo(() => {
    if (!lesson?.contentMarkdown) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(lesson?.contentMarkdown, "text/html");
    const elements = doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre");
    return Array.from(elements).map((el, idx) => {
      el.setAttribute("data-line-ref", `paragraph-${idx}`);
      return {
        lineRef: `paragraph-${idx}`,
        html: el.outerHTML,
      };
    });
  }, [lesson?.contentMarkdown]);

  const getCommentsForLine = (lineRef: string) =>
    comments.filter((c) => c.lineRef === lineRef);

  const renderContent = () => {
    if (isReadOnly && contentRef && contentRef.length > 0) {
      return (
        <div id="lesson-content-container" className="prose prose-sm max-w-none dark:prose-invert">
          {contentRef.map(({ lineRef, html }) => {
            const lineComments = getCommentsForLine(lineRef);
            return (
              <ParagraphCommentTrigger
                key={lineRef}
                lineRef={lineRef}
                lessonId={lessonId}
                comments={lineComments}
              >
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </ParagraphCommentTrigger>
            );
          })}
        </div>
      );
    }

    if (lesson?.contentMarkdown) {
      return (
        <div id="lesson-content-container">
          <MarkdownRenderer content={lesson.contentMarkdown} />
        </div>
      );
    }

    if (lesson?.content) {
      return (
        <pre className="whitespace-pre-wrap">{JSON.stringify(lesson?.content, null, 2)}</pre>
      );
    }

    return <p className="text-muted-foreground">No content available.</p>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          Lesson not found
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          This lesson may have been deleted or you don&apos;t have access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-row">
      {/* Main editor area */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Header: title + save indicator + status/actions */}
        <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            readOnly={isReadOnly}
            placeholder="Untitled Lesson"
            className={cn(
              "flex-1 bg-transparent text-2xl font-bold text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-100 dark:placeholder:text-zinc-700",
              isReadOnly && "cursor-default select-text",
            )}
          />
          <div className="flex items-center gap-2">
            <SaveIndicator status={saveStatus} />
            {statusStyle && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusStyle.className,
                )}>
                {statusStyle.label}
              </span>
            )}
            {canSubmit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitLesson.isPending}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {submitLesson.isPending ? SUBMIT_UI.BUTTON_LOADING : SUBMIT_UI.BUTTON_SUBMIT}
              </button>
            )}
            {canResubmit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitLesson.isPending}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {submitLesson.isPending
                  ? SUBMIT_UI.BUTTON_LOADING
                  : SUBMIT_UI.BUTTON_RESUBMIT}
              </button>
            )}
          </div>
        </div>

        {/* Editor / Content */}
        <div className="flex-1 px-6 py-4">
          {isReadOnly ? (
            renderContent()
          ) : (
            <LessonEditor
              content={lesson.content}
              contentMarkdown={lesson.contentMarkdown ?? undefined}
              lessonTitle={lesson.title}
              editable={!isReadOnly}
              onImportAction={(_content: Record<string, unknown>, markdown?: string) => {
                if (markdown) setRawMarkdown(markdown);
                if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                if (editorInstance) triggerSave(editorInstance, markdown);
              }}
              ref={handleSetEditor}
            />
          )}
        </div>
      </div>

      {/* Outline sidebar — hidden on mobile */}
      <aside className="hidden w-50 shrink-0 border-l border-zinc-200 dark:border-zinc-800 md:block">
        <OutlinePanel editor={editorInstance} />
      </aside>
    </div>
  );
}
