"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSoftDeleteLesson } from "@/hooks/api/use-lesson-queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RemoveContentButtonProps {
  lessonId: string;
  groupId: string;
  lessonTitle: string;
}

export function RemoveLessonButton({
  lessonId,
  groupId,
  lessonTitle,
}: RemoveContentButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const softDeleteMutation = useSoftDeleteLesson();

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await softDeleteMutation.mutateAsync(lessonId);
      router.push(`/group/${groupId}`);
    } catch (error) {
      console.error("Failed to soft delete lesson:", error);
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-600"
        onClick={() => setIsOpen(true)}>
        Remove Content
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove &quot;<span className="font-bold">{lessonTitle}</span>&quot;
            </DialogTitle>
            <DialogDescription>
              Remove this lesson from the group? It will no longer be visible to
              members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600">
              {isDeleting ? "Removing..." : "Remove Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
