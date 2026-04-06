"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDeckDialogProps {
  deckId: string;
  deckTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteDeckDialog({
  deckTitle,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteDeckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Deck</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{deckTitle}"? This will also delete all cards in this deck. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Deck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
