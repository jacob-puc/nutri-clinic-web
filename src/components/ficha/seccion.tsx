import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type TonoSeccion = "primario" | "destructivo";

/* Sin teja de color: el icono va suelto y en gris. El color se reserva
   para lo que pide atencion (tono destructivo). */
const ICONO_TONO: Record<TonoSeccion, string> = {
  primario: "text-muted-foreground",
  destructivo: "text-destructive",
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
 * la cabecera lleva un icono discreto y se separa del cuerpo con una linea
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
        <div className="flex min-w-0 items-center gap-2">
          <Icono aria-hidden className={cn("size-[18px] shrink-0", ICONO_TONO[tono])} strokeWidth={1.75} />
          <h2
            className={cn(
              "text-[15px] font-semibold tracking-tight",
              tono === "destructivo" ? "text-destructive" : "text-foreground",
            )}
          >
            {titulo}
          </h2>
          {meta && (
            <span className="text-muted-foreground-subtle truncate text-xs tabular-nums">
              <span aria-hidden className="mr-1.5">·</span>
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
