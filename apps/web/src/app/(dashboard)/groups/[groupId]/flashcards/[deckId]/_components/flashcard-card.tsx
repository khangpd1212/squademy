"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import DOMpurify from "dompurify";
import { PersonalCard } from "@/types/flashcard";

interface FlashcardCardProps {
  card: PersonalCard;
  onFlip?: () => void;
  isFlipped: boolean;
  onSave?: (updates: Partial<Pick<PersonalCard, "front" | "back" | "ipa" | "tags" | "customNotes">>) => void;
}

export function FlashcardCard({
  card,
  onFlip,
  isFlipped,
  onSave,
}: FlashcardCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    front: card.front || "",
    back: card.back || "",
    ipa: card.ipa || "",
    tags: card.tags?.join(", ") || "",
    customNotes: card.customNotes || "",
  });
  const [error, setError] = useState("");

  const handleTap = useCallback(() => {
    if (!isEditing && !isFlipped) {
      onFlip?.();
    }
  }, [isEditing, isFlipped, onFlip]);

  const handleSave = useCallback(() => {
    if (!editData.front || !editData.front.trim()) {
      setError("Front side is required.");
      return;
    }
    setError("");
    const tagsArray = editData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    onSave?.({
      front: editData.front,
      back: editData.back,
      ipa: editData.ipa || undefined,
      tags: tagsArray,
      customNotes: editData.customNotes,
    });
    setIsEditing(false);
  }, [editData, onSave]);

  const handleCancel = useCallback(() => {
    setEditData({
      front: card.front || "",
      back: card.back || "",
      ipa: card.ipa || "",
      tags: card.tags?.join(", ") || "",
      customNotes: card.customNotes || "",
    });
    setError("");
    setIsEditing(false);
  }, [card]);

  if (isEditing) {
    return (
      <div className="relative w-full max-w-md mx-auto">
        <div className="rounded-xl border bg-card p-6 shadow-lg space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Front</label>
            <textarea
              value={editData.front}
              onChange={(e) => setEditData((d) => ({ ...d, front: e.target.value }))}
              className="w-full p-3 rounded-lg border-2 border-border bg-background resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Back</label>
            <textarea
              value={editData.back}
              onChange={(e) => setEditData((d) => ({ ...d, back: e.target.value }))}
              className="w-full p-3 rounded-lg border-2 border-border bg-background resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">IPA (optional)</label>
            <input
              type="text"
              value={editData.ipa}
              onChange={(e) => setEditData((d) => ({ ...d, ipa: e.target.value }))}
              className="w-full p-3 rounded-lg border-2 border-border bg-background"
              placeholder="/həˈloʊ/"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <input
              type="text"
              value={editData.tags}
              onChange={(e) => setEditData((d) => ({ ...d, tags: e.target.value }))}
              className="w-full p-3 rounded-lg border-2 border-border bg-background"
              placeholder="greeting, common, TOEFL"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Personal Notes</label>
            <textarea
              value={editData.customNotes}
              onChange={(e) =>
                setEditData((d) => ({ ...d, customNotes: e.target.value }))
              }
              className="w-full p-3 rounded-lg border-2 border-border bg-background resize-none"
              rows={2}
              placeholder="Add your own notes..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-lg border-2 border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        className="relative w-full h-100 cursor-pointer preserve-3d"
        onClick={handleTap}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}>
        <div
          className="absolute inset-0 rounded-xl border bg-card p-6 shadow-lg backface-hidden"
          style={{ backfaceVisibility: "hidden" }}>
          <div className="flex h-full flex-col items-center justify-center">
            <div
              className="text-center text-lg font-medium"
              dangerouslySetInnerHTML={{
                __html: DOMpurify.sanitize(card.front || ""),
              }}
            />
            <p className="mt-4 text-sm text-muted-foreground">Tap to reveal</p>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-xl border bg-card p-6 shadow-lg backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}>
          <div className="flex h-full flex-col overflow-auto">
            <div
              className="text-center text-lg font-medium"
              dangerouslySetInnerHTML={{
                __html: DOMpurify.sanitize(card.back || "") || "No answer",
              }}
            />
            {card.ipa && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                [{card.ipa}]
              </p>
            )}

            {card.customNotes && (
              <p className="mt-3 text-center text-sm italic text-muted-foreground">
                📝 {card.customNotes}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {isFlipped && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-muted/80 hover:bg-muted"
          title="Edit card"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>
      )}
    </div>
  );
}