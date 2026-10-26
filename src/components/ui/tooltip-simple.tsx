import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipSimpleProps {
  /** El elemento que dispara. Debe aceptar ref, como cualquier elemento DOM. */
  children: ReactNode;
  /** Texto o contenido flotante. */
  contenido: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Envoltura del `Tooltip` de shadcn para el caso normal: un elemento y un
 * texto. Es la única forma de hacer tooltips en la app — el `title=` del
 * navegador no se puede estilar, tarda en aparecer, no respeta el tema y no
 * es accesible por teclado.
 *
 * `TooltipProvider` ya envuelve la app entera en `App.tsx`, así que aquí solo
 * se monta el par trigger + contenido.
 *
 * Excepción conocida: los eventos del calendario. FullCalendar monta su propio
 * DOM fuera de React, así que no hay dónde enganchar este componente y ahí
 * sigue usándose `title=` nativo.
 */
export function TooltipSimple({
  children,
  contenido,
  side = "top",
}: TooltipSimpleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{contenido}</TooltipContent>
    </Tooltip>
  );
}
