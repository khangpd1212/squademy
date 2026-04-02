"use client";

import dynamic from "next/dynamic";

type LessonEditorPageClientProps = {
  lessonId: string;
};

const LessonEditorView = dynamic(
  () =>
    import("./lesson-editor-view").then((m) => m.LessonEditorView),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    ),
  },
);

export default function LessonEditorPageClient({
  lessonId,
}: LessonEditorPageClientProps) {
  return <LessonEditorView lessonId={lessonId} />;
}

