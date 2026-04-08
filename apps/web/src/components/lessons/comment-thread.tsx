import * as React from "react";
import { Reply, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateLessonComment,
  useDeleteLessonComment,
  type ReviewComment,
} from "@/hooks/api/use-lesson-queries";
import { useAuth } from "@/hooks/use-auth";
import { VALIDATION } from "@squademy/shared";

type CommentThreadProps = {
  lessonId: string;
  lineRef: string;
  comments: ReviewComment[];
  onClose?: () => void;
};

export function CommentThread({
  lessonId,
  lineRef,
  comments,
  onClose,
}: CommentThreadProps) {
  const [newComment, setNewComment] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();
  const createComment = useCreateLessonComment();
  const deleteComment = useDeleteLessonComment();

  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setError(null);
    try {
      await createComment.mutateAsync({ lessonId, lineRef, body: newComment });
      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    setError(null);
    try {
      await createComment.mutateAsync({
        lessonId,
        lineRef,
        body: replyText,
        parentId,
      });
      setReplyTo(null);
      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    }
  };

  const handleDelete = async (commentId: string) => {
    setError(null);
    try {
      await deleteComment.mutateAsync({ lessonId, commentId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getInitials = (displayName: string | null, fullName: string | null) => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (displayName) return displayName.charAt(0).toUpperCase();
    return "?";
  };

  return (
    <div className="space-y-4">
      {topLevelComments.map((comment) => (
        <div key={comment.id} className="space-y-2">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.avatarUrl ?? undefined} />
              <AvatarFallback>
                {getInitials(comment.author.displayName, comment.author.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.author.displayName ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                {user?.userId && comment.author && (comment as { userId?: string }).userId === user.userId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteComment.isPending}
                    className="text-xs text-destructive hover:underline"
                  >
                    {deleteComment.isPending ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
              <p className="text-sm">{comment.body}</p>
              <button
                onClick={() => setReplyTo(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            </div>
          </div>

          {getReplies(comment.id).map((reply) => (
            <div key={reply.id} className="flex gap-3 ml-11">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reply.author.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(reply.author.displayName, reply.author.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {reply.author.displayName ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(reply.createdAt)}
                    </span>
                  </div>
                  {user?.userId && reply.author && (reply as { userId?: string }).userId === user.userId && (
                    <button
                      onClick={() => handleDelete(reply.id)}
                      disabled={deleteComment.isPending}
                      className="text-xs text-destructive hover:underline"
                    >
                      {deleteComment.isPending ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
                <p className="text-sm">{reply.body}</p>
              </div>
            </div>
          ))}

          {replyTo === comment.id && (
            <div className="ml-11 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-20 text-sm"
                maxLength={VALIDATION.REVIEW_COMMENT_BODY_MAX}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {replyText.length}/{VALIDATION.REVIEW_COMMENT_BODY_MAX}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyText.trim() || createComment.isPending}
                  >
                    {createComment.isPending ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="space-y-2 pt-2">
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        <Textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-20 text-sm"
          maxLength={VALIDATION.REVIEW_COMMENT_BODY_MAX}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/{VALIDATION.REVIEW_COMMENT_BODY_MAX}
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
          >
            {createComment.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded hover:bg-accent transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
