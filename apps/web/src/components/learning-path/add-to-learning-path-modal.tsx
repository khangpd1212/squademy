"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AvailableItem } from "@/hooks/api/use-roadmap";

interface AddToLearningPathModalProps {
  open: boolean;
  onClose: () => void;
  availableLessons: AvailableItem[];
  availableDecks: AvailableItem[];
  onAdd: (items: { type: "lesson" | "deck"; id: string }[]) => void;
  isPending: boolean;
}

export function AddToLearningPathModal({
  open,
  onClose,
  availableLessons,
  availableDecks,
  onAdd,
  isPending,
}: AddToLearningPathModalProps) {
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggleLesson = (id: string) => {
    setSelectedLessons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDeck = (id: string) => {
    setSelectedDecks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    const items: { type: "lesson" | "deck"; id: string }[] = [];

    selectedLessons.forEach(id => items.push({ type: "lesson", id }));
    selectedDecks.forEach(id => items.push({ type: "deck", id }));

    if (items.length === 0) return;

    onAdd(items);
  };

  const totalSelected = selectedLessons.size + selectedDecks.size;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add to Learning Path</h2>

        {availableLessons.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Lessons</h3>
            <div className="space-y-2">
              {availableLessons.map(lesson => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${
                    selectedLessons.has(lesson.id) ? "border-primary" : ""
                  }`}
                  onClick={() => toggleLesson(lesson.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedLessons.has(lesson.id)}
                    onChange={() => toggleLesson(lesson.id)}
                    className="accent-primary shrink-0"
                  />
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">
                      by {lesson.author?.displayName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableDecks.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Flashcard Decks</h3>
            <div className="space-y-2">
              {availableDecks.map(deck => (
                <div
                  key={deck.id}
                  className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${
                    selectedDecks.has(deck.id) ? "border-primary" : ""
                  }`}
                  onClick={() => toggleDeck(deck.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDecks.has(deck.id)}
                    onChange={() => toggleDeck(deck.id)}
                    className="accent-primary shrink-0"
                  />
                  <p className="font-medium">{deck.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleAddSelected}
            disabled={totalSelected === 0 || isPending}
          >
            {isPending
              ? "Adding..."
              : `Add${totalSelected > 0 ? ` (${totalSelected})` : ""}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
