import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type TonoSeccion = "primario" | "destructivo";

const TEJA_TONO: Record<TonoSeccion, string> = {
  primario: "bg-primary-soft text-primary-soft-foreground ring-primary/15",
  destructivo:
    "bg-destructive-soft text-destructive-soft-foreground ring-destructive/20",
};

interface SeccionProps {
  titulo: string;
  icono: LucideIcon;
  /** Dato breve junto al titulo: un conteo, una fecha. */
  meta?: ReactNode;
  acciones?: ReactNode;
  tono?: TonoSeccion;
  /** Clases del cuerpo; por defecto lleva el relleno estandar. */
  cuerpoClassName?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Hoja de una seccion del expediente. Sustituye la caja generica con titulo:
 * la cabecera lleva una teja de icono y se separa del cuerpo con una linea
 * discontinua, como el corte de una hoja de formulario clinico.
 */
export function Seccion({
  titulo,
  icono: Icono,
  meta,
  acciones,
  tono = "primario",
  cuerpoClassName,
  className,
  children,
}: SeccionProps) {
  return (
    <section
      className={cn(
        "hoja relative overflow-hidden rounded-xl",
        tono === "destructivo" && "hoja-destructiva",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md ring-1 ring-inset",
              TEJA_TONO[tono],
            )}
          >
            <Icono className="size-4" />
          </span>
          <h2 className="text-foreground text-[15px] font-semibold tracking-tight">
            {titulo}
          </h2>
          {meta && (
            <span className="text-muted-foreground-subtle truncate text-xs tabular-nums">
              {meta}
            </span>
          )}
        </div>
        {acciones}
      </header>

      <div
        aria-hidden
        className="border-border-strong mx-4 border-t border-dashed md:mx-5"
      />

      <div className={cn("px-4 py-4 md:px-5", cuerpoClassName)}>{children}</div>
    </section>
  );
}

/**
 * Campo de ficha: etiqueta arriba y valor apoyado sobre una linea punteada,
 * como el renglon de un formulario impreso.
 */
export function CampoFicha({
  etiqueta,
  className,
  children,
}: {
  etiqueta: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 py-2", className)}>
      <dt className="text-muted-foreground text-xs font-medium">{etiqueta}</dt>
      <dd className="text-foreground border-border-strong mt-1 min-h-7 border-b border-dotted pb-1.5 text-sm break-words">
        {children}
      </dd>
    </div>
  );
}
