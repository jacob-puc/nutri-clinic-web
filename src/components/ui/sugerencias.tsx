import { cn } from "@/lib/utils"

/**
 * Textos frecuentes como chips de un clic que rellenan un campo libre. Sustituye
 * al `<datalist>` nativo, que no se puede estilar y casi nadie descubre. El
 * borde discontinuo dice "sugerencia", no "opcion elegida".
 */
export function Sugerencias({
  opciones,
  valor,
  onElegir,
  etiqueta = "Sugerencias",
  className,
}: {
  opciones: string[]
  /** Valor actual del campo: el chip que coincide se marca como elegido. */
  valor?: string
  onElegir: (texto: string) => void
  etiqueta?: string
  className?: string
}) {
  return (
    <div role="group" aria-label={etiqueta} className={cn("flex flex-wrap gap-1.5", className)}>
      {opciones.map((opcion) => {
        const elegida = valor?.trim() === opcion
        return (
          <button
            key={opcion}
            type="button"
            aria-pressed={elegida}
            onClick={() => onElegir(opcion)}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors outline-none",
              "focus-visible:ring-ring/50 focus-visible:ring-[3px] active:translate-y-px",
              elegida
                ? "border-primary/50 bg-primary-soft text-primary-soft-foreground font-medium"
                : "border-border-strong text-muted-foreground hover:border-input hover:text-foreground border-dashed",
            )}
          >
            {opcion}
          </button>
        )
      })}
    </div>
  )
}
