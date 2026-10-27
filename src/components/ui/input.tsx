import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3.5 py-2 text-sm shadow-[inset_0_1px_2px_rgb(20_55_50/0.04),0_1px_1px_rgb(20_55_50/0.03)] transition-[color,box-shadow,border-color,background-color] duration-150 outline-none hover:border-primary/45 selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-70 dark:bg-input/20 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)]",
        "focus-visible:border-primary focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:shadow-[0_0_0_1px_var(--primary)]",
        "aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:ring-[3px] aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
