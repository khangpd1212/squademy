"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLesson, useLessonComments } from "@/hooks/api";
import { ParagraphCommentTrigger } from "@/components/lessons/paragraph-comment-trigger";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import "@/components/editor/editor-styles.css";

type PageProps = {
  params: Promise<{ groupId: string; lessonId: string }>;
};

export default function GroupLessonDetailPage({ params }: PageProps) {
  const { groupId, lessonId } = use(params);
  const router = useRouter();
  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const { data: comments = [] } = useLessonComments(lessonId);

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
    if (contentRef && contentRef.length > 0) {
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
        <Button variant="ghost" onClick={() => router.push(`/group/${groupId}/lessons`)}>
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
      <Button variant="ghost" onClick={() => router.push(`/group/${groupId}/lessons`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lessons
      </Button>

      <div className="rounded-lg border bg-card p-6">
        {renderContent()}
      </div>
    </div>
  );
}