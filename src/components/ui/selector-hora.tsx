import * as React from "react"
import { Clock } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const FRANJAS: Array<{ etiqueta: string; hasta: string }> = [
  { etiqueta: "Mañana", hasta: "12:00" },
  { etiqueta: "Tarde", hasta: "19:00" },
  { etiqueta: "Noche", hasta: "24:00" },
]

interface SelectorHoraProps
  extends Omit<React.ComponentProps<typeof SelectTrigger>, "value" | "onChange"> {
  value: string
  onChange: (hora: string) => void
  /** Horas "HH:mm" disponibles, ya ordenadas. */
  horas: string[]
  /** Horas que se muestran apagadas, con el motivo junto a la hora. */
  noDisponibles?: Map<string, string>
  placeholder?: string
}

/**
 * Hora en un desplegable agrupado por franja del dia. Con 48 opciones de
 * 15 minutos, los grupos son lo que permite encontrar "17:30" sin recorrer
 * toda la lista.
 */
export function SelectorHora({
  value,
  onChange,
  horas,
  noDisponibles,
  placeholder = "Hora",
  className,
  ...props
}: SelectorHoraProps) {
  const grupos = FRANJAS.map((franja, i) => {
    const desde = i === 0 ? "00:00" : FRANJAS[i - 1]!.hasta
    return { ...franja, items: horas.filter((h) => h >= desde && h < franja.hasta) }
  }).filter((grupo) => grupo.items.length > 0)

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger
        className={cn("bg-card h-10 w-full tabular-nums", className)}
        {...props}
      >
        <span className="flex items-center gap-2">
          <Clock className="text-primary size-4" aria-hidden />
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {grupos.map((grupo) => (
          <SelectGroup key={grupo.etiqueta}>
            <SelectLabel>{grupo.etiqueta}</SelectLabel>
            {grupo.items.map((hora) => {
              const motivo = noDisponibles?.get(hora)
              return (
                <SelectItem key={hora} value={hora} disabled={Boolean(motivo)} className="tabular-nums">
                  {hora}
                  {motivo && <span className="text-muted-foreground ml-2 text-xs">{motivo}</span>}
                </SelectItem>
              )
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
