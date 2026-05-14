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
  children?: React.ReactNode;
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
       <div className="absolute left-0 top-1/2 -translate-x-full mr-1 -translate-y-1/2 opacity-0 group-hover/paragraph:opacity-100 transition-opacity">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs",
              hasComments && "bg-(--dash-primary)/10 text-(--dash-primary)",
              !hasComments && "bg-(--dash-glass) text-(--dash-text-muted)",
              "hover:bg-(--dash-primary)/20",
              "border border-(--dash-border-subtle)"
            )}
            aria-label={hasComments ? `${commentCount} comments` : "Add comment"}>
            {hasComments ? (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-(--dash-primary)" />
                <span className="text-(--dash-primary) text-sm font-medium">{commentCount}</span>
              </div>
            ) : (
              <MessageSquarePlus className="w-4 h-4 text-(--dash-primary)" />
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
