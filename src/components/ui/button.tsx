import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-(--ease-out-soft) outline-none active:translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-primary/80 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(16_45_40/0.16),0_4px_10px_-5px_rgb(16_45_40/0.38)] hover:border-primary-hover hover:bg-primary-hover hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_2px_4px_rgb(16_45_40/0.16),0_7px_14px_-7px_rgb(16_45_40/0.48)] active:shadow-none",
        destructive:
          "border border-destructive/80 bg-destructive text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_2px_5px_rgb(80_20_20/0.18)] hover:border-destructive hover:bg-destructive/90 hover:shadow-[0_4px_10px_-5px_rgb(80_20_20/0.42)] active:shadow-none focus-visible:ring-destructive/20 dark:bg-destructive/80 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border-strong bg-card text-foreground shadow-[0_1px_2px_rgb(20_55_50/0.06)] hover:border-primary/45 hover:bg-primary-soft/45 hover:text-primary-soft-foreground hover:shadow-[0_2px_5px_rgb(20_55_50/0.09)] active:bg-primary-soft/70 active:shadow-none dark:border-input dark:bg-input/20 dark:hover:bg-input/40",
        secondary:
          "border border-secondary/70 bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.4)] hover:border-secondary hover:bg-secondary/80 hover:shadow-[0_2px_5px_rgb(20_55_50/0.08)] active:shadow-none",
        ghost:
          "text-foreground/80 hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3.5 text-[0.8125rem] has-[>svg]:px-3",
        lg: "h-11 px-6 text-[0.9375rem] has-[>svg]:px-4",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
