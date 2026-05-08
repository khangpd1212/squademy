import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteLesson } from "@/hooks/api/use-lesson-queries";

type DeleteLessonDialogProps = {
  lessonId: string;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteLessonDialog({
  lessonId,
  lessonTitle,
  open,
  onOpenChange,
}: DeleteLessonDialogProps) {
  const deleteLessonMutation = useDeleteLesson();
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    try {
      await deleteLessonMutation.mutateAsync(lessonId);
      toast.success("Lesson deleted.");
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete lesson.";
      setError(message);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (deleteLessonMutation.isPending) return;
    if (nextOpen) {
      setError("");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!deleteLessonMutation.isPending}>
        <DialogHeader>
          <DialogTitle>Delete this lesson?</DialogTitle>
          <DialogDescription>
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold wrap-break-word">
              {lessonTitle || "this lesson"}
            </span>
            ?
          </p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleteLessonMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLessonMutation.isPending}
          >
            {deleteLessonMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
