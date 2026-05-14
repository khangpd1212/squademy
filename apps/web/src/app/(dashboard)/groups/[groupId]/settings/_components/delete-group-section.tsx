"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDeleteGroup } from "@/hooks/api/use-group-queries";

type DeleteGroupSectionProps = {
  groupId: string;
  groupName: string;
};

export function DeleteGroupSection({
  groupId,
  groupName,
}: DeleteGroupSectionProps) {
  const router = useRouter();
  const deleteGroupMutation = useDeleteGroup(groupId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState("");

  const isNameMatch = confirmInput === groupName;

  function handleOpenChange(open: boolean) {
    if (deleteGroupMutation.isPending) return;
    setDialogOpen(open);
    if (!open) {
      setConfirmInput("");
      setError("");
    }
  }

  async function handleDelete() {
    if (!isNameMatch) return;
    setError("");

    try {
      await deleteGroupMutation.mutateAsync();
      router.push("/dashboard?groupDeleted=1");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete group.";
      setError(message);
    }
  }

  return (
    <>
      <Separator className="my-6" />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Deleting this group is permanent and cannot be undone. All group
          content will be removed for members.
        </p>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={<Button variant="destructive" />}
          >
            Delete Group
          </DialogTrigger>
          <DialogContent showCloseButton={!deleteGroupMutation.isPending}>
            <DialogHeader>
              <DialogTitle>Delete {groupName}?</DialogTitle>
              <DialogDescription>
                Are you sure? All group content will be removed for members.
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="confirm-group-name">
                Type the group name to confirm
              </Label>
              <Input
                id="confirm-group-name"
                placeholder={groupName}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                autoComplete="off"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={deleteGroupMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isNameMatch || deleteGroupMutation.isPending}
              >
                {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
