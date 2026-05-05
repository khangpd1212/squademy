import * as React from "react";
import { ThumbsUp, ThumbsDown, Heart, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonReaction } from "@/hooks/api/use-lesson-queries";

type ParagraphReactionTriggerProps = {
  lineRef: string;
  lessonId: string;
  reactions: LessonReaction[];
  toggleReaction: (params: { lessonId: string; lineRef: string; reactionType: LessonReaction["type"] }) => Promise<unknown>;
  isToggling: boolean;
};

const reactionIcons = {
  thumbs_up: ThumbsUp,
  thumbs_down: ThumbsDown,
  heart: Heart,
  lightbulb: Lightbulb,
};

const reactionLabels = {
  thumbs_up: "thumbs up",
  thumbs_down: "thumbs down",
  heart: "heart",
  lightbulb: "lightbulb",
};

export function ParagraphReactionTrigger({
  lineRef,
  lessonId,
  reactions,
  toggleReaction,
  isToggling,
}: ParagraphReactionTriggerProps) {
  const handleReaction = async (type: LessonReaction["type"]) => {
    if (isToggling) return;
    await toggleReaction({ lessonId, lineRef, reactionType: type });
  };

  const hasReactions = reactions.length > 0;
  const totalCount = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="group/reaction relative">
      <div className="absolute left-0 top-1/2 -translate-x-full mr-1 -translate-y-1/2 opacity-0 group-hover/paragraph:opacity-100 transition-opacity pointer-events-none group-hover/paragraph:pointer-events-auto">
        {hasReactions ? (
          <div className="flex items-center gap-1">
            {reactions.slice(0, 3).map((reaction) => {
              const Icon = reactionIcons[reaction.type];
              return (
           <div
             key={reaction.type}
             className={cn(
               "clay-pill px-2 py-0.5 text-xs font-medium",
               reaction.userReacted && "bg-(--clay-primary)/20 text-(--clay-primary)",
               !reaction.userReacted && "bg-(--clay-surface) text-(--clay-muted-foreground)"
             )}
             title={`${reaction.count} ${reactionLabels[reaction.type]}${reaction.count > 1 ? "s" : ""}`}
           >
                  <Icon className="w-3 h-3" />
                  {reaction.count > 1 && <span className="ml-1 text-(--clay-primary)">{reaction.count}</span>}
                </div>
              );
            })}
            {totalCount > 3 && (
              <span className="text-(--clay-primary) text-xs font-medium">+{totalCount - 3}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {(Object.keys(reactionIcons) as LessonReaction["type"][]).map((type) => {
              const Icon = reactionIcons[type];
              const reaction = reactions.find((r) => r.type === type);
              const isActive = reaction?.userReacted;

              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  disabled={isToggling}
                  className={cn(
                    "inline-flex items-center rounded-full border border-(--clay-border) bg-(--clay-surface) px-2 py-0.5 text-xs font-medium",
                    isActive && "bg-(--clay-primary)/20 text-(--clay-primary)"
                  )}
                  aria-label={`React with ${reactionLabels[type]}`}
                >
                  <Icon className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}