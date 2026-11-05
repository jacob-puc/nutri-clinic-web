import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type TonoEstadistica = "primario" | "info" | "exito" | "aviso" | "peligro";

const VARIABLE_TONO: Record<TonoEstadistica, string> = {
  primario: "--color-primary",
  info: "--color-info",
  exito: "--color-success",
  aviso: "--color-warning",
  peligro: "--color-destructive",
};

interface TarjetaEstadisticaProps {
  icono: LucideIcon;
  etiqueta: string;
  /** null mientras carga. */
  valor: ReactNode | null;
  detalle?: ReactNode;
  tono?: TonoEstadistica;
  /** La cifra principal del tablero: fondo oscuro de marca. */
  destacada?: boolean;
  href?: string;
  className?: string;
}

/**
 * Cifra de tablero (resumen, reportes). El icono no va en una teja: es grande,
 * con trazo degradado del color del tono, y asoma recortado en la esquina
 * inferior derecha sobre un halo suave del mismo color.
 */
export function TarjetaEstadistica({
  icono: Icono,
  etiqueta,
  valor,
  detalle,
  tono = "primario",
  destacada = false,
  href,
  className,
}: TarjetaEstadisticaProps) {
  const idDegradado = `degradado-${useId().replace(/:/g, "")}`;
  const color = destacada ? "white" : `var(${VARIABLE_TONO[tono]})`;

  const clases = cn(
    "anim-entrada group relative isolate flex min-h-[7.5rem] flex-col overflow-hidden rounded-[1.25rem] p-5 outline-none",
    destacada
      ? "bg-[linear-gradient(140deg,var(--brand-700),var(--brand-900))] text-white shadow-[0_16px_32px_-18px_var(--brand-900)]"
      : "hoja",
    href && "tarjeta-viva focus-visible:ring-[3px] focus-visible:ring-primary/30",
    className,
  );

  const contenido = (
    <>
      {/* Halo del color del tono desde la esquina del icono. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 100% 100%, color-mix(in oklch, ${color} ${destacada ? 18 : 12}%, transparent), transparent 60%)`,
        }}
      />

      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          {/* En unidades del viewBox (24x24): con objectBoundingBox las lineas rectas no se pintan. */}
          <linearGradient id={idDegradado} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
            <stop offset="0" stopColor={color} stopOpacity={destacada ? 0.4 : 0.5} />
            <stop offset="1" stopColor={color} stopOpacity={0.06} />
          </linearGradient>
        </defs>
      </svg>
      <Icono
        aria-hidden
        stroke={`url(#${idDegradado})`}
        strokeWidth={1.6}
        className="pointer-events-none absolute -right-4 -bottom-5 -z-10 size-24 -rotate-12 transition-transform duration-500 ease-(--ease-out-soft) group-hover:scale-105 group-hover:-rotate-6"
      />

      <span className={cn("text-xs font-medium", destacada ? "text-white/75" : "text-muted-foreground")}>{etiqueta}</span>
      {valor === null ? (
        <Skeleton className={cn("mt-2 h-8 w-20", destacada && "bg-white/20")} />
      ) : (
        <span className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums md:text-3xl">{valor}</span>
      )}
      {detalle && (
        <span className={cn("mt-auto truncate pt-2 text-xs", destacada ? "text-white/70" : "text-muted-foreground")}>
          {detalle}
        </span>
      )}
    </>
  );

  return href ? (
    <Link to={href} className={clases}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}
