"use client";

import * as React from "react";
import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewComment } from "@/hooks/api/use-lesson-queries";
import { CommentThread } from "./comment-thread";

type ParagraphCommentTriggerProps = {
  lineRef: string;
  lessonId: string;
  comments: ReviewComment[];
  children: React.ReactNode;
};

export function ParagraphCommentTrigger({
  lineRef,
  lessonId,
  comments,
  children,
}: ParagraphCommentTriggerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const commentCount = comments.length;
  const hasComments = commentCount > 0;

  return (
    <div className="group/paragraph relative">
      <div className="absolute left-0 top-0 -translate-x-full mr-1 opacity-0 group-hover/paragraph:opacity-100 transition-opacity">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors",
            hasComments && "text-primary"
          )}
          aria-label={hasComments ? `${commentCount} comments` : "Add comment"}
        >
          {hasComments ? (
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
                {commentCount}
              </span>
            </div>
          ) : (
            <MessageSquarePlus className="w-4 h-4" />
          )}
        </button>
      </div>

      {children}

      {isOpen && (
        <div className="mt-2 border-t pt-2">
          <CommentThread
            lessonId={lessonId}
            lineRef={lineRef}
            comments={comments}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}