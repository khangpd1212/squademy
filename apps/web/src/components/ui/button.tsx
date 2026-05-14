"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-(--dash-radius-lg) border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:shadow-(--dash-shadow-sm) disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-(--dash-primary) text-white hover:bg-(--dash-primary-hover) active:bg-(--dash-primary-active)",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-(--dash-surface-elevated) text-(--dash-text) hover:bg-(--dash-surface-3) aria-expanded:bg-(--dash-surface-elevated) aria-expanded:text-(--dash-text)",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-(--dash-danger)/10 text-destructive hover:bg-(--dash-danger)/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-(--dash-radius) px-2 text-xs in-data-[slot=button-group]:rounded-(--dash-radius-lg) has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-(--dash-radius) px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-(--dash-radius-lg) has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-(--dash-radius) in-data-[slot=button-group]:rounded-(--dash-radius-lg) [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-(--dash-radius) in-data-[slot=button-group]:rounded-(--dash-radius-lg)",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={nativeButton ?? (render ? false : true)}
      render={render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
