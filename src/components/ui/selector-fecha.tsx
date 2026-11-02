import * as React from "react"
import { CalendarDays, ChevronDown, X } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { AtajoFecha } from "@/components/ui/atajos-fecha"
import { cn } from "@/lib/utils"

const FORMATO_LARGO = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

/* Para columnas estrechas: "12 mar 1990" en vez de la fecha con dia de la
   semana, que se truncaba. */
const FORMATO_CORTO = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

function mismoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface SelectorFechaProps
  extends Omit<React.ComponentProps<"button">, "value" | "onChange"> {
  value: Date | undefined
  onChange: (fecha: Date | undefined) => void
  placeholder?: string
  /** Fechas fuera de [desde, hasta] quedan deshabilitadas. */
  desde?: Date
  hasta?: Date
  startMonth?: Date
  endMonth?: Date
  /** Menus de mes y anio en el titulo: para fechas lejanas (nacimiento). */
  conDesplegables?: boolean
  atajos?: AtajoFecha[]
  /** Muestra la X para vaciar el campo; solo en campos opcionales. */
  limpiable?: boolean
  formato?: "largo" | "corto"
  /** Dato derivado dentro del campo, a la derecha (p. ej. la edad). Va
      dentro y no debajo para que elegir fecha no cambie la altura. */
  detalle?: React.ReactNode
  /** Dias que no se pueden elegir aunque esten en rango. */
  deshabilitar?: (fecha: Date) => boolean
}

/**
 * Campo de fecha: un disparador con aspecto de input que abre el calendario
 * en un popover. Reemplaza al `<input type="date">` nativo, que cambia de
 * aspecto en cada navegador y no respeta el tema.
 *
 * Los atributos que no son suyos (id, aria-invalid, aria-describedby) caen en
 * el boton, asi que funciona dentro de `FormControl` como cualquier input.
 */
export function SelectorFecha({
  value,
  onChange,
  placeholder = "Elige una fecha",
  desde,
  hasta,
  startMonth,
  endMonth,
  conDesplegables,
  atajos,
  limpiable = false,
  formato = "largo",
  detalle,
  deshabilitar,
  className,
  disabled,
  ...props
}: SelectorFechaProps) {
  const [abierto, setAbierto] = React.useState(false)

  const elegir = (fecha: Date | undefined) => {
    onChange(fecha)
    if (fecha) setAbierto(false)
  }

  const fueraDeRango = (fecha: Date) => {
    const inicioDelDia = new Date(fecha)
    inicioDelDia.setHours(0, 0, 0, 0)
    return (
      (desde !== undefined && inicioDelDia < desde) ||
      (hasta !== undefined && inicioDelDia > hasta) ||
      (deshabilitar?.(fecha) ?? false)
    )
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "border-input bg-card flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md border px-3 text-left text-sm shadow-xs outline-none",
              "transition-[color,box-shadow,border-color] duration-150 hover:border-ring/60",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "data-[state=open]:border-primary/60 data-[state=open]:ring-[3px] data-[state=open]:ring-primary/15",
              "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
              "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
              limpiable && value && "pr-9",
              className,
            )}
            {...props}
          >
            <CalendarDays className="text-primary size-4 shrink-0" aria-hidden />
            <span
              className={cn(
                "flex-1 truncate first-letter:uppercase",
                !value && "text-muted-foreground",
              )}
            >
              {value
                ? (formato === "corto" ? FORMATO_CORTO : FORMATO_LARGO).format(value)
                : placeholder}
            </span>
            {value && detalle && (
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {detalle}
              </span>
            )}
            {!(limpiable && value) && (
              <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
            )}
          </button>
        </PopoverTrigger>

        {/* Fuera del boton: un boton dentro de otro no es HTML valido. */}
        {limpiable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Quitar fecha"
            className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md outline-none focus-visible:ring-2"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <PopoverContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {atajos && atajos.length > 0 && (
            <div className="border-border flex gap-1 overflow-x-auto border-b p-2 sm:w-36 sm:flex-col sm:border-r sm:border-b-0">
              {atajos.map((atajo) => {
                const fecha = atajo.fecha()
                const activo = value !== undefined && mismoDia(value, fecha)
                const bloqueado = fueraDeRango(fecha)
                return (
                  <button
                    key={atajo.etiqueta}
                    type="button"
                    disabled={bloqueado}
                    onClick={() => elegir(fecha)}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap transition-colors outline-none",
                      "focus-visible:ring-ring focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40",
                      activo
                        ? "bg-primary-soft text-primary-soft-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {atajo.etiqueta}
                  </button>
                )
              })}
            </div>
          )}

          <Calendar
            className="border-0 bg-transparent"
            selected={value}
            onSelect={elegir}
            desde={desde}
            hasta={hasta}
            startMonth={startMonth}
            endMonth={endMonth}
            conDesplegables={conDesplegables}
            deshabilitar={deshabilitar}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
