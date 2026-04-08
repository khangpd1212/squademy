"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLesson, useLessonComments } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import MarkdownRenderer from "@/components/markdown-renderer";
import "@/components/editor/editor-styles.css";

type PageProps = {
  params: Promise<{ groupId: string; lessonId: string }>;
};

export default function GroupLessonDetailPage({ params }: PageProps) {
  const { groupId, lessonId } = use(params);
  const router = useRouter();
  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const { data: comments = [] } = useLessonComments(lessonId);

  const renderContent = () => {
    if (lesson?.contentMarkdown) {
      return (
        <div id="lesson-content-container">
          <MarkdownRenderer
            content={lesson.contentMarkdown}
            comments={comments}
            lessonId={lessonId}
            enableComments
          />
        </div>
      );
    }

    if (lesson?.content) {
      return (
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(lesson?.content, null, 2)}
        </pre>
      );
    }

    return <p className="text-muted-foreground">No content available.</p>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/group/${groupId}/lessons`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          Failed to load lesson. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/group/${groupId}/lessons`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lessons
      </Button>

      <div className="rounded-lg border bg-card p-6">{renderContent()}</div>
    </div>
  );
}
