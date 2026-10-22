import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardPlus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

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
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        {visual ?? (
          <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-full">
            <Icono className="size-6" aria-hidden />
          </div>
        )}

        <div>
          <h2 className="text-foreground font-semibold">{titulo}</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            {descripcion}
          </p>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
