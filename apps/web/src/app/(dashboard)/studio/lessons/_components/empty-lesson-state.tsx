import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onNewLesson: () => void;
};

export function EmptyLessonState({ onNewLesson }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <BookOpen className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">No lessons yet</p>
        <p className="text-sm text-muted-foreground">
          You haven&apos;t created any lessons yet. Start contributing!
        </p>
      </div>
      <Button onClick={onNewLesson}>New Lesson</Button>
    </div>
  );
}
