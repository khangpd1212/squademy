import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMyGroups } from "@/hooks/api/use-group-queries";
import { useCreateLesson } from "@/hooks/api/use-lesson-queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewLessonDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const { data: groups = [], isLoading: groupsLoading } = useMyGroups();
  const createLesson = useCreateLesson();

  const singleGroup = groups.length === 1 ? groups[0] : null;
  const activeGroupId = singleGroup ? singleGroup.id : selectedGroupId;

  async function handleCreate() {
    if (!activeGroupId) return;
    const lesson = await createLesson.mutateAsync(activeGroupId);
    onOpenChange(false);
    router.push(`/studio/lessons/${lesson.id}`);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedGroupId("");
      createLesson.reset();
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lesson</DialogTitle>
          <DialogDescription>
            {groups.length === 0
              ? "You need to join a group before creating lessons."
              : singleGroup
                ? `Create lesson in "${singleGroup.name}"?`
                : "Select a group to create your lesson in."}
          </DialogDescription>
        </DialogHeader>

        {groups.length === 0 && !groupsLoading && (
          <Link
            href="/"
            className="text-sm text-primary underline underline-offset-4">
            Go to dashboard
          </Link>
        )}

        {groups.length > 1 && (
          <Select
            value={selectedGroupId}
            onValueChange={(value) => setSelectedGroupId(value ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {selectedGroupId
                  ? groups.find((g) => g.id === selectedGroupId)?.name
                  : "Select a group..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        {createLesson.isError && (
          <p className="text-sm text-destructive">
            {createLesson.error instanceof Error
              ? createLesson.error.message
              : "Failed to create lesson."}
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          {groups.length > 0 && (
            <Button
              onClick={handleCreate}
              disabled={!activeGroupId || createLesson.isPending}>
              {createLesson.isPending ? "Creating…" : "Create Lesson"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
