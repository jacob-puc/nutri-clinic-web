import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { CalendarioRango } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { moverPeriodo, resolverPeriodo, type Periodo } from "@/lib/periodo";
import { cn } from "@/lib/utils";
import { calendarioDeClave, claveDeCalendario, hoyCalendario, hoyEnClinica } from "@/lib/zona-horaria";

const actual = (tipo: Periodo["tipo"]): Periodo => ({ tipo, ancla: hoyEnClinica() });

/* Sin flechas de navegacion: lo anterior se alcanza con estos atajos o con el
   calendario, que llega a cualquier fecha pasada. */
const ATAJOS: { etiqueta: string; periodo: () => Periodo }[] = [
  { etiqueta: "Hoy", periodo: () => actual("dia") },
  { etiqueta: "Esta semana", periodo: () => actual("semana") },
  { etiqueta: "Semana pasada", periodo: () => moverPeriodo(actual("semana"), -1) },
  { etiqueta: "Este mes", periodo: () => actual("mes") },
  { etiqueta: "Mes pasado", periodo: () => moverPeriodo(actual("mes"), -1) },
  { etiqueta: "Este año", periodo: () => actual("anio") },
  { etiqueta: "Año pasado", periodo: () => moverPeriodo(actual("anio"), -1) },
];

/**
 * Campo de fecha para consultar un periodo: abre con atajos (hoy, semana, mes,
 * año) y un calendario donde dos clics marcan un rango libre.
 */
export function FiltroPeriodo({
  periodo,
  onChange,
  className,
}: {
  periodo: Periodo;
  onChange: (periodo: Periodo) => void;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  /* Primer clic del rango: la seleccion queda abierta hasta el segundo. */
  const [inicioPendiente, setInicioPendiente] = useState<Date | undefined>();
  const resuelto = resolverPeriodo(periodo);

  const cambiarAbierto = (siguiente: boolean) => {
    setAbierto(siguiente);
    setInicioPendiente(undefined);
  };

  const elegir = (siguiente: Periodo) => {
    onChange(siguiente);
    cambiarAbierto(false);
  };

  const tocarDia = (dia: Date) => {
    if (!inicioPendiente) {
      setInicioPendiente(dia);
      return;
    }
    const [desde, hasta] = [claveDeCalendario(inicioPendiente), claveDeCalendario(dia)].sort() as [string, string];
    elegir({ tipo: "rango", ancla: hoyEnClinica(), desde, hasta });
  };

  return (
    <Popover open={abierto} onOpenChange={cambiarAbierto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Periodo: ${resuelto.etiqueta}`}
          className={cn(
            "border-input bg-card flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 text-left text-sm shadow-xs outline-none sm:w-72",
            "hover:border-ring/60 focus-visible:border-ring focus-visible:ring-ring/50 transition-[color,box-shadow,border-color] duration-150 focus-visible:ring-[3px]",
            "data-[state=open]:border-primary/60 data-[state=open]:ring-primary/15 data-[state=open]:ring-[3px]",
            className,
          )}
        >
          <CalendarDays className="text-primary size-4 shrink-0" aria-hidden />
          <span className="flex-1 truncate first-letter:uppercase">{resuelto.etiqueta}</span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="border-border flex gap-1 overflow-x-auto border-b p-2 sm:w-40 sm:flex-col sm:border-r sm:border-b-0">
            {ATAJOS.map((atajo) => {
              const opcion = atajo.periodo();
              const { inicio, fin } = resolverPeriodo(opcion);
              const activo = periodo.tipo !== "rango" && inicio === resuelto.inicio && fin === resuelto.fin;
              return (
                <button
                  key={atajo.etiqueta}
                  type="button"
                  onClick={() => elegir(opcion)}
                  className={cn(
                    "focus-visible:ring-ring shrink-0 cursor-pointer rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2",
                    activo
                      ? "bg-primary-soft text-primary-soft-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {atajo.etiqueta}
                </button>
              );
            })}
          </div>

          <div>
            <CalendarioRango
              desde={inicioPendiente ?? calendarioDeClave(resuelto.inicio)!}
              hasta={inicioPendiente ? undefined : calendarioDeClave(resuelto.fin)!}
              maximo={hoyCalendario()}
              onTocarDia={tocarDia}
            />
            <p className="text-muted-foreground px-4 pb-3 text-xs">
              {inicioPendiente ? "Ahora elige la fecha final." : "Toca dos fechas para elegir un rango."}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
