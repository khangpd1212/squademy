"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { useMyGroups } from "@/hooks/api/use-group-queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreateGroupForm } from "./create-group-form";

export function GroupsPageClient() {
  const { data: groups = [], isLoading } = useMyGroups();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-sm text-(--dash-text-muted)">
            Manage your learning groups
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-(--dash-radius-lg) bg-(--dash-surface-3)"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-2) px-6 py-16 text-center">
          <Users className="h-10 w-10 text-(--dash-text-muted)" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No groups yet</p>
            <p className="text-sm text-(--dash-text-muted)">
              Create your first group to start learning together.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="group/card flex flex-col gap-3 rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-surface-2) p-4 text-sm transition-colors hover:bg-(--dash-surface-3)"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate font-medium">{group.name}</span>
                <span className="shrink-0 rounded-(--dash-radius) bg-(--dash-glass-active) px-2 py-0.5 text-xs capitalize">
                  {group.role}
                </span>
              </div>
              {group.description && (
                <p className="line-clamp-2 text-(--dash-text-muted)">
                  {group.description}
                </p>
              )}
              <div className="mt-auto flex items-center gap-4 text-xs text-(--dash-text-muted)">
                <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Start a new learning group and invite members to study together.
            </DialogDescription>
          </DialogHeader>
          <CreateGroupForm onSuccess={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
