import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-(--dash-radius-lg) bg-(--dash-glass-active)", className)}
      {...props}
    />
  )
}

export { Skeleton }
