import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-[min(var(--radius-clay),12px)] bg-(--clay-surface-2)", className)}
      {...props}
    />
  )
}

export { Skeleton }
