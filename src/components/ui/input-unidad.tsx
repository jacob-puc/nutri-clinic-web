import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Input numerico con la unidad pegada a la derecha ("kg", "cm", "%"). La
 * unidad deja de ir en la etiqueta y se lee junto a la cifra, que es donde
 * se mira al capturar.
 */
function InputUnidad({
  unidad,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { unidad: string }) {
  return (
    <div className="relative">
      <Input
        type="number"
        className={cn(
          "bg-card h-10 pr-12 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        )}
        {...props}
      />
      <span
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute inset-y-1 right-1 grid min-w-9 place-items-center rounded-r-[5px] border-l border-border px-2 text-xs font-medium"
      >
        {unidad}
      </span>
    </div>
  )
}

export { InputUnidad }
