"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLesson, useLessonComments, useMarkLessonRead, useGroupLearningPath } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
  const markLessonRead = useMarkLessonRead();
  const { data: learningPathItems = [] } = useGroupLearningPath(groupId);

  const currentLessonIndex = learningPathItems.findIndex(item => item.lesson?.id === lessonId);
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < learningPathItems.length - 1 
    ? learningPathItems[currentLessonIndex + 1] 
    : null;

  useEffect(() => {
    if (!lessonId || isLoading) return;

    let hasMarkedRead = false;
    const currentLessonId = lessonId;

    const handleScroll = () => {
      if (hasMarkedRead) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (!markLessonRead.isPending) {
          markLessonRead.mutate(
            { lessonId: currentLessonId },
            {
              onSuccess: () => { hasMarkedRead = true; },
              onError: () => { hasMarkedRead = false; },
            },
          );
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lessonId, isLoading, markLessonRead]);

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

      {nextLesson && nextLesson.lesson && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="text-sm text-muted-foreground mb-2">Continue with the next lesson:</div>
          <Button
            onClick={() => router.push(`/group/${groupId}/lessons/${nextLesson.lesson!.id}`)}
            className="w-full justify-between">
            <span>{nextLesson.lesson!.title}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
