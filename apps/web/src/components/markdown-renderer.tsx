"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReviewComment } from "@/hooks/api/use-lesson-queries";
import { ParagraphCommentTrigger } from "./lessons/paragraph-comment-trigger";
import { AliveTextReveal } from "./lessons/alive-text-reveal";

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
  let aliveBlockIndex = 0;
  const createSpanComponent = () => {
    return function SpanComponent({
      className,
      children,
      ...props
    }: React.HTMLAttributes<HTMLSpanElement> & {
      children?: React.ReactNode;
      "data-block-id"?: string;
    }) {
      if (className?.includes("alive-text")) {
        const blockId =
          ((props as Record<string, unknown>)["data-block-id"] as
            | string
            | undefined) || `alive-${++aliveBlockIndex}`;
        if (!lessonId) {
          return <span className={className}>{children}</span>;
        }
        return (
          <AliveTextReveal blockId={blockId} lessonId={lessonId}>
            {children}
          </AliveTextReveal>
        );
      }
      return (
        <span className={className} {...props}>
          {children}
        </span>
      );
    };
  };

  const shouldEnableFeatures = enableComments && lessonId;

  if (!shouldEnableFeatures) {
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

  const createParagraphComponent = (defaultTag: string) => {
    return function ParagraphComponent({
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
    p: createParagraphComponent("p"),
    h1: createParagraphComponent("h1"),
    h2: createParagraphComponent("h2"),
    h3: createParagraphComponent("h3"),
    h4: createParagraphComponent("h4"),
    h5: createParagraphComponent("h5"),
    h6: createParagraphComponent("h6"),
    li: createParagraphComponent("li"),
    blockquote: createParagraphComponent("blockquote"),
    pre: createParagraphComponent("pre"),
    span: createSpanComponent(),
  };

  return (
    <div className={`markdown-content pl-4 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
