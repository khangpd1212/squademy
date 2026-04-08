"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReviewComment } from "@/hooks/api/use-lesson-queries";
import { ParagraphCommentTrigger } from "./lessons/paragraph-comment-trigger";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  comments?: ReviewComment[];
  lessonId?: string;
  enableComments?: boolean;
}

export default function MarkdownRenderer({
  content,
  className = "",
  comments = [],
  lessonId,
  enableComments = false,
}: MarkdownRendererProps) {
  if (!enableComments || !lessonId) {
    return (
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  const commentsByLineRef: Record<string, ReviewComment[]> = {};
  comments.forEach((comment) => {
    const lineRef = comment.lineRef;
    if (!commentsByLineRef[lineRef]) {
      commentsByLineRef[lineRef] = [];
    }
    commentsByLineRef[lineRef].push(comment);
  });

  let elementIndex = 0;
  const getLineRef = (): string => {
    const ref = `paragraph-${elementIndex}`;
    elementIndex++;
    return ref;
  };

  const createCommentableComponent = (defaultTag: string) => {
    return function CommentableComponent({
      children,
    }: {
      children?: React.ReactNode;
    }) {
      const lineRef = getLineRef();
      const lineComments = commentsByLineRef[lineRef] || [];
      return (
        <ParagraphCommentTrigger
          lineRef={lineRef}
          lessonId={lessonId}
          comments={lineComments}>
          {React.createElement(defaultTag, null, children)}
        </ParagraphCommentTrigger>
      );
    };
  };

  const components = {
    p: createCommentableComponent("p"),
    h1: createCommentableComponent("h1"),
    h2: createCommentableComponent("h2"),
    h3: createCommentableComponent("h3"),
    h4: createCommentableComponent("h4"),
    h5: createCommentableComponent("h5"),
    h6: createCommentableComponent("h6"),
    li: createCommentableComponent("li"),
    blockquote: createCommentableComponent("blockquote"),
    pre: createCommentableComponent("pre"),
  };

  return (
    <div className={`markdown-content pl-4 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}