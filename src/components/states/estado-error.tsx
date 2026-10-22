import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EstadoErrorProps {
  titulo: string;
  /** Acepta nodos para poder enlazar, p. ej. de vuelta al listado. */
  mensaje: ReactNode;
  /**
   * Botón "Reintentar". En la variante `pagina` se agrupa con `children` en
   * una fila centrada; en `linea` queda alineado a la derecha.
   */
  onReintentar?: () => void;
  /** Acciones propias, p. ej. un enlace para volver al listado. */
  children?: ReactNode;
  /**
   * `linea` va dentro de una página, con icono y fila horizontal. `pagina`
   * ocupa una pantalla de error completa: texto centrado y sin icono, que es
   * como se comportaban las tres implementaciones originales.
   */
  variante?: "linea" | "pagina";
  className?: string;
}

/**
 * Estado único de error. Sustituye las tres implementaciones sueltas que
 * existían por módulo.
 */
export function EstadoError({
  titulo,
  mensaje,
  onReintentar,
  children,
  variante = "linea",
  className,
}: EstadoErrorProps) {
  const hayAcciones = Boolean(children || onReintentar);
  const esPagina = variante === "pagina";

  const contenido = (
    <Card className={cn("border-destructive/40", className)}>
      <CardContent
        className={cn(
          "px-6",
          esPagina
            ? "py-14 text-center"
            : "flex flex-col items-start gap-4 py-10 sm:flex-row sm:items-center",
        )}
      >
        {!esPagina && (
          <div className="bg-destructive/10 text-destructive grid size-11 shrink-0 place-items-center rounded-full">
            <X className="size-5" aria-hidden />
          </div>
        )}

        <div className={cn("min-w-0", !esPagina && "flex-1")}>
          {/* pagina reemplaza a la pagina entera, asi que lleva el h1. linea
              vive dentro de una pagina que ya tiene el suyo, asi que baja a h2
              para no dejar dos h1 en el mismo documento. */}
          {esPagina ? (
            <h1 className="text-foreground text-xl font-semibold">{titulo}</h1>
          ) : (
            <h2 className="text-foreground text-base font-semibold">{titulo}</h2>
          )}
          <p
            className={cn(
              "text-muted-foreground text-sm",
              esPagina ? "mx-auto mt-2 max-w-sm" : "mt-1",
            )}
          >
            {mensaje}
          </p>
        </div>

        {hayAcciones && (
          <div
            className={cn(esPagina && "mt-6 flex justify-center gap-2")}
          >
            {children}
            {onReintentar && (
              <Button
                onClick={onReintentar}
                variant={esPagina ? "default" : "outline"}
                className={cn(!esPagina && "shrink-0")}
              >
                Reintentar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!esPagina) return contenido;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 md:px-8">{contenido}</div>
  );
}
