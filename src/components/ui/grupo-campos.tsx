import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Bloque de campos relacionados dentro de un formulario: titulo con icono y,
 * debajo, sus campos. Entre grupos va una linea discontinua, la misma que
 * separa las secciones del expediente.
 */
export function GrupoCampos({
  titulo,
  icono: Icono,
  descripcion,
  className,
  children,
}: {
  titulo: string
  icono?: LucideIcon
  descripcion?: string
  className?: string
  children: ReactNode
}) {
  return (
    <fieldset
      className={cn(
        "border-border-strong min-w-0 space-y-3.5 border-t border-dashed pt-4 first-of-type:border-t-0 first-of-type:pt-0",
        className,
      )}
    >
      <legend className="sr-only">{titulo}</legend>
      <div aria-hidden className="flex items-center gap-2">
        {Icono && (
          <span className="bg-primary-soft text-primary-soft-foreground grid size-6 place-items-center rounded-md">
            <Icono className="size-3.5" />
          </span>
        )}
        <p className="text-foreground text-sm font-semibold">{titulo}</p>
        {descripcion && (
          <p className="text-muted-foreground-subtle truncate text-xs">{descripcion}</p>
        )}
      </div>
      {children}
    </fieldset>
  )
}

/** Error que no pertenece a un campo concreto (conflicto, red, servidor). */
export function AlertaFormulario({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive-soft text-destructive-soft-foreground flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  )
}
