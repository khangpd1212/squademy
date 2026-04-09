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
          <div className="flex items-center gap-0.5">
            {reactions.slice(0, 3).map((reaction) => {
              const Icon = reactionIcons[reaction.type];
              return (
                <div
                  key={reaction.type}
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium",
                    reaction.userReacted && "bg-primary/20 text-primary"
                  )}
                  title={`${reaction.count} ${reactionLabels[reaction.type]}${reaction.count > 1 ? "s" : ""}`}
                >
                  <Icon className="w-3 h-3" />
                  {reaction.count > 1 && <span className="ml-0.5">{reaction.count}</span>}
                </div>
              );
            })}
            {totalCount > 3 && (
              <span className="text-[10px] text-muted-foreground">+{totalCount - 3}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-0.5 bg-background rounded-md border shadow-sm p-0.5">
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
                    "flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors",
                    isActive && "text-primary bg-primary/10"
                  )}
                  aria-label={`React with ${reactionLabels[type]}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}