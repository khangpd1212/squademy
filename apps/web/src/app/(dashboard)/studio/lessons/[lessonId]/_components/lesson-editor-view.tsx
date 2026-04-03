"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { useQueryClient } from "@tanstack/react-query";
import { LESSON_STATUS } from "@squademy/shared";
import { useLesson, useUpdateLesson } from "@/hooks/api/use-lesson-queries";
import { queryKeys } from "@/lib/api/query-keys";
import { LessonEditor } from "@/components/editor/lesson-editor";
import { OutlinePanel } from "@/components/editor/outline-panel";
import { SaveIndicator } from "./save-indicator";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type LessonEditorViewProps = {
  lessonId: string;
};

export function LessonEditorView({ lessonId }: LessonEditorViewProps) {
  const { data: lesson, isLoading, isError } = useLesson(lessonId);
  const updateLesson = useUpdateLesson();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const editorRefCallback = useCallback((editor: Editor | null) => setEditorInstance(editor), []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (lesson && !initializedRef.current) {
      initializedRef.current = true;
      const lessonTitle = lesson.title;
      // Queue microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setTitle(lessonTitle);
        titleRef.current = lessonTitle;
      });
    }
  }, [lesson]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Invalidate myLessons on unmount so list page reflects latest updatedAt
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
    };
  }, [queryClient]);

  const triggerSave = useCallback(
    (editor: Editor) => {
      setSaveStatus("saving");
      updateLesson.mutate(
        {
          lessonId,
          data: {
            content: editor.getJSON(),
            contentMarkdown: editor.getText(),
            title: titleRef.current,
          },
        },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          },
          onError: () => setSaveStatus("error"),
        },
      );
    },
    [lessonId, updateLesson],
  );

  const handleEditorUpdate = useCallback(
    (editor: Editor) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => triggerSave(editor), 2000);
    },
    [triggerSave],
  );

  // Attach update handler directly on the editor to avoid function props crossing the client boundary
  useEffect(() => {
    if (!editorInstance) return;
    const handler = ({ editor: e }: { editor: Editor }) => handleEditorUpdate(e);
    editorInstance.on("update", handler);
    return () => {
      editorInstance.off("update", handler);
    };
  }, [editorInstance, handleEditorUpdate]);

  // Ctrl+S / Cmd+S manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!editorInstance) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        triggerSave(editorInstance);
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

  const isReadOnly =
    lesson?.status === LESSON_STATUS.REVIEW ||
    lesson?.status === LESSON_STATUS.PUBLISHED;

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
        {/* Header: title + save indicator */}
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
            {isReadOnly && (
              <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                {lesson.status}
              </span>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 px-6 py-4">
          <LessonEditor
            content={lesson.content}
            contentMarkdown={lesson.contentMarkdown ?? undefined}
            lessonTitle={lesson.title}
            editable={!isReadOnly}
            onImportAction={(_content: Record<string, unknown>) => {
              if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              if (editorInstance) triggerSave(editorInstance);
            }}
            ref={editorRefCallback}
          />
        </div>
      </div>

      {/* Outline sidebar — hidden on mobile */}
      <aside className="hidden w-[200px] shrink-0 border-l border-zinc-200 dark:border-zinc-800 md:block">
        <OutlinePanel editor={editorInstance} />
      </aside>
    </div>
  );
}
