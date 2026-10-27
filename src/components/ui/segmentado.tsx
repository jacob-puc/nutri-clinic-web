import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

export interface OpcionSegmentada<T extends string> {
  valor: T
  etiqueta: React.ReactNode
}

interface SegmentadoProps<T extends string> {
  id?: string
  className?: string
  disabled?: boolean
  "aria-label"?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  value: T | undefined
  onChange: (valor: T) => void
  opciones: OpcionSegmentada<T>[]
  /** "fila" ocupa todo el ancho; "chips" deja cada opcion a su medida. */
  variante?: "fila" | "chips"
}

/**
 * Eleccion unica entre pocas opciones visibles a la vez (sexo, duracion). Un
 * Select esconde tres opciones detras de un clic; aqui se comparan de un
 * vistazo. Teclado: flechas para moverse, Espacio para elegir (Radix).
 */
export function Segmentado<T extends string>({
  value,
  onChange,
  opciones,
  variante = "fila",
  className,
  ...props
}: SegmentadoProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value ?? ""}
      /* Radix permite desmarcar con un segundo clic; en una eleccion
         obligatoria eso dejaria el campo vacio, asi que se ignora. */
      onValueChange={(siguiente) => {
        if (siguiente) onChange(siguiente as T)
      }}
      className={cn(
        variante === "fila"
          ? "bg-surface-muted grid auto-cols-fr grid-flow-col gap-1 rounded-lg p-1 shadow-[inset_0_1px_2px_0_oklch(0.21_0.008_190/0.08)]"
          : "flex flex-wrap gap-1.5",
        className,
      )}
      {...props}
    >
      {opciones.map((opcion) => (
        <ToggleGroupPrimitive.Item
          key={opcion.valor}
          value={opcion.valor}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap outline-none",
            "transition-[background-color,color,box-shadow,border-color] duration-150 active:translate-y-px",
            "focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            variante === "fila"
              ? "text-muted-foreground hover:text-foreground h-8 rounded-md px-3 hover:bg-card/55 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-card"
              : "border-border-strong bg-card text-muted-foreground hover:border-input hover:text-foreground h-8 rounded-full border px-3 data-[state=on]:border-primary/50 data-[state=on]:bg-primary-soft data-[state=on]:text-primary-soft-foreground",
          )}
        >
          {opcion.etiqueta}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
