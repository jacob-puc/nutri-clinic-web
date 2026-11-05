import { BarChart3 } from "lucide-react";

import {
  COLOR_ESTADO_CITA,
  ETIQUETA_ESTADO_CITA,
} from "@/features/citas/lib/estados-cita";
import { TooltipSimple } from "@/components/ui/tooltip-simple";
import { cn } from "@/lib/utils";
import type { EstadoCita } from "@/types/api";

interface ResumenEstadosProps {
  resumen: Array<{ valor: EstadoCita; cantidad: number }>;
}

const FORMATO_PORCENTAJE = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 0,
});

/**
 * Distribucion de las citas por estado: una cifra total, una barra
 * proporcional y una leyenda con conteo y porcentaje. La leyenda nombra cada
 * estado, asi que el color nunca es la unica pista.
 */
export function ResumenEstados({ resumen }: ResumenEstadosProps) {
  const total = resumen.reduce((suma, { cantidad }) => suma + cantidad, 0);

  return (
    <section
      className="grid gap-2 border-t border-primary/15 pt-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-4"
    >
      <div className="flex items-center gap-3">
        <span className="bg-primary-soft text-primary-soft-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <BarChart3 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-foreground text-xs font-semibold">Estados de las citas</h2>
        </div>
      </div>

      <div className="min-w-0">
        <div
          className="bg-surface-muted flex h-1.5 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={
            total === 0
              ? "Sin citas"
              : resumen
                  .map(({ valor, cantidad }) => `${ETIQUETA_ESTADO_CITA[valor]}: ${cantidad} (${FORMATO_PORCENTAJE.format(cantidad / total)})`)
                  .join(", ")
          }
        >
          {resumen.map(({ valor, cantidad }) => (
            <TooltipSimple
              key={valor}
              contenido={`${ETIQUETA_ESTADO_CITA[valor]}: ${cantidad} (${FORMATO_PORCENTAJE.format(cantidad / total)})`}
            >
              <span
                className={cn("barra-gpu h-full min-w-1 origin-left transition-opacity hover:opacity-80", COLOR_ESTADO_CITA[valor])}
                style={{ flexGrow: cantidad, flexBasis: 0 }}
              />
            </TooltipSimple>
          ))}
        </div>

        {total === 0 ? (
          <p className="text-muted-foreground mt-2 text-xs">
            Cuando se agenden citas, aquí verás su distribución por estado.
          </p>
        ) : (
          <dl className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5">
            {resumen.map(({ valor, cantidad }) => (
              <div
                key={valor}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                  "bg-card/65",
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-2 shrink-0 rounded-[2px]", COLOR_ESTADO_CITA[valor])}
                />
                <dt className="text-foreground">{ETIQUETA_ESTADO_CITA[valor]}</dt>
                <dd className="text-foreground font-semibold tabular-nums">{cantidad}</dd>
                <dd className="text-muted-foreground-subtle tabular-nums">
                  {FORMATO_PORCENTAJE.format(cantidad / total)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
