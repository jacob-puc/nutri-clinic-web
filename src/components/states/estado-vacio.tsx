import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardPlus } from "lucide-react";

import { cn } from "@/lib/utils";

interface EstadoVacioProps {
  titulo: string;
  /** Acepta nodos para poder resaltar, p. ej., el término buscado. */
  descripcion: ReactNode;
  /**
   * Icono del círculo decorativo. Se ignora si se pasa `visual`.
   */
  icono?: LucideIcon;
  /**
   * Elemento visual propio en lugar del icono, p. ej. un avatar. Este
   * componente vive en `components/` y no conoce los módulos de negocio, así
   * que el retrato lo pinta quien lo usa.
   */
  visual?: ReactNode;
  /** Acciones, p. ej. el botón para crear el primer registro. */
  children?: ReactNode;
  className?: string;
}

/**
 * Estado único de lista vacía o sin resultados. Sustituye las tres
 * implementaciones sueltas que existían por módulo.
 */
export function EstadoVacio({
  titulo,
  descripcion,
  icono: Icono = ClipboardPlus,
  visual,
  children,
  className,
}: EstadoVacioProps) {
  return (
    /* Hueco por rellenar, no una hoja: borde discontinuo y sin sombra. El
       icono va sobre una hoja pequena con otra asomando detras, como el
       primer registro que falta por archivar. */
    <div
      className={cn(
        "hoja-vacia flex flex-col items-center gap-4 rounded-xl px-6 py-14 text-center",
        className,
      )}
    >
        {visual ?? (
          <div aria-hidden className="relative">
            <span className="hoja absolute inset-0 translate-x-1.5 -translate-y-1 rotate-6 rounded-xl opacity-70" />
            <span className="hoja text-primary relative grid size-14 place-items-center rounded-xl">
              <Icono className="size-6" />
            </span>
          </div>
        )}

        <div>
          <h2 className="text-foreground font-semibold">{titulo}</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            {descripcion}
          </p>
        </div>

        {children}
    </div>
  );
}
