"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLearningPathEdit, useReorderLearningPath, useAddToLearningPath, useRemoveFromLearningPath } from "@/hooks/api/use-roadmap";
import { useGroupMemberRole } from "@/hooks/api/use-member-queries";
import { GROUP_ROLES } from "@squademy/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToLearningPathModal } from "@/components/learning-path/add-to-learning-path-modal";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Plus, Trash2, BookOpen, FileText } from "lucide-react";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default function RoadmapPage({ params }: PageProps) {
  const { groupId } = use(params);
  const router = useRouter();
  const { data: myRole, isLoading: isRoleLoading } = useGroupMemberRole(groupId);
  const { data, isLoading } = useLearningPathEdit(groupId);
  const reorderMutation = useReorderLearningPath(groupId);
  const addMutation = useAddToLearningPath(groupId);
  const removeMutation = useRemoveFromLearningPath(groupId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isEditorOrAdmin = myRole === GROUP_ROLES.ADMIN || myRole === GROUP_ROLES.EDITOR;

  if (isRoleLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!isEditorOrAdmin) {
    router.replace(`/groups/${groupId}`);
    return null;
  }

  if (!data) {
    return <div>Failed to load roadmap</div>;
  }

  const { inPath, availableLessons, availableDecks } = data;

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= inPath.length) return;

    const newOrder = [...inPath];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, moved);

    await reorderMutation.mutateAsync(newOrder.map(item => item.id));
  };

  const handleRemove = async (itemId: string) => {
    await removeMutation.mutateAsync(itemId);
    toast.success("Removed from learning path");
  };

  const handleAdd = async (items: { type: "lesson" | "deck"; id: string }[]) => {
    setIsAdding(true);
    for (const item of items) {
      await addMutation.mutateAsync(
        item.type === "lesson" ? { lessonId: item.id } : { deckId: item.id }
      );
    }
    setIsAdding(false);
    setShowAddModal(false);
    toast.success(`Added ${items.length} item(s) to learning path`);
  };

  const hasAvailableItems = availableLessons.length > 0 || availableDecks.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Learning Path Roadmap</h1>
        {hasAvailableItems && (
          <Button onClick={() => setShowAddModal(true)} className="sq-btn-green">
            <Plus className="mr-2 h-4 w-4" />
            Add to Path
          </Button>
        )}
      </div>

      {inPath.length === 0 ? (
        <Empty
          icon={BookOpen}
          title="No items in the learning path yet"
          action={hasAvailableItems && (
            <Button onClick={() => setShowAddModal(true)}>
              Add your first item
            </Button>
          )}
        />
      ) : (
        <div className="space-y-2">
          {inPath.map((item, index) => {
            const isLesson = !!item.lesson;
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-card"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === inPath.length - 1}
                    onClick={() => handleMove(index, "down")}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  {isLesson ? (
                    <BookOpen className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-secondary-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {isLesson ? item.lesson?.title : item.deck?.title}
                  </p>
                  {isLesson && (
                    <p className="text-sm text-muted-foreground">
                      by {item.lesson!.author.displayName}
                    </p>
                  )}
                </div>

                <Badge variant="secondary">
                  {isLesson ? "Lesson" : "Deck"}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(item.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddToLearningPathModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          availableLessons={availableLessons}
          availableDecks={availableDecks}
          onAdd={handleAdd}
          isPending={isAdding}
        />
      )}
    </div>
  );
}