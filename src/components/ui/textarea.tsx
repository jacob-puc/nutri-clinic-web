import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-lg border border-input bg-card px-3.5 py-3 text-sm shadow-[inset_0_1px_2px_rgb(20_55_50/0.04),0_1px_1px_rgb(20_55_50/0.03)] transition-[color,box-shadow,border-color,background-color] duration-150 outline-none hover:border-primary/45 placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:shadow-[0_0_0_1px_var(--primary)] disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-70 aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:ring-[3px] aria-invalid:ring-destructive/15 dark:bg-input/20 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
