"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ParagraphCommentTrigger } from "@/components/lessons/paragraph-comment-trigger";
import { useApproveLesson, useLessonComments, useRejectLesson, useReviewLesson } from "@/hooks/api";
import { ArrowLeft, Calendar, Check, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/markdown-renderer";
import "@/components/editor/editor-styles.css";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default function LessonReviewDetailPage({ params }: PageProps) {
  const { lessonId } = use(params);
  const { data: lesson, isLoading, error } = useReviewLesson(lessonId);
  const { data: comments = [] } = useLessonComments(lessonId);
  const approveLesson = useApproveLesson();
  const rejectLesson = useRejectLesson();
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

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

  const handleApprove = async () => {
    try {
      await approveLesson.mutateAsync(lessonId);
      toast.success("Lesson published successfully");
      router.push("/review/lesson");
    } catch {
      toast.error("Failed to approve lesson");
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }
    try {
      await rejectLesson.mutateAsync({ lessonId, feedback });
      toast.success("Changes requested");
      router.push("/review/lesson");
    } catch {
      toast.error("Failed to reject lesson");
    }
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
        <Button variant="ghost" onClick={() => router.push("/review/lesson")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queue
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          Failed to load lesson. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/review/lesson")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Queue
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{lesson?.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {lesson?.author?.displayName || lesson?.author?.fullName || "Unknown"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {lesson?.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString() : ""}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
          >
            <X className="mr-2 h-4 w-4" />
            Request Changes
          </Button>
          <Button
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleApprove}
            disabled={approveLesson.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve & Publish
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {renderContent()}
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback to help the contributor improve their lesson.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              {feedback.length}/500 characters
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLesson.isPending || !feedback.trim()}
            >
              {rejectLesson.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}